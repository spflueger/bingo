import asyncio
import json
import logging
import websockets
from enum import Enum
from random import randrange

logging.basicConfig(level=logging.INFO)

MAX_TOTAL_GAMES = 3
MAX_TOTAL_PLAYERS = 10

connected_users = set()

user_name_mapping = dict()

GameState = Enum('GameState', 'OPEN CLOSED ONGOING FINISHED')

bingo_games = {}


class BingoGame:
    def __init__(self):
        self.players = set()
        self.ready_players = set()
        self.boards = {}
        self.players_turn_it = None
        self.players_turn = None
        self.state = GameState.OPEN

    def new_game(self):
        self.ready_players = set()
        self.boards = {}
        self.players_turn_it = None
        self.players_turn = None
        self.state = GameState.OPEN

    def random_start_player(self):
        self.players_turn_it = iter(self.players)
        for x in range(randrange(0, len(self.players))):
            self.players_turn = next(self.players_turn_it, None)
        if not self.players_turn:
            self.players_turn_it = iter(self.players)
            self.players_turn = next(self.players_turn_it, None)

        return self.players_turn

    def next_player(self):
        self.players_turn = next(self.players_turn_it, None)
        if not self.players_turn:
            self.players_turn_it = iter(self.players)
            self.players_turn = next(self.players_turn_it, None)

        return self.players_turn


class BingoBoard:
    def __init__(self, tiles):
        self.size = 5
        self.needed_completed_lines = 5
        self.tiles = tiles
        self.rows = {x: [] for x in range(0, self.size)}
        self.cols = {x: [] for x in range(0, self.size)}
        self.diagonals = {"+": [], "-": []}

    def pick_tile(self, tile):
        index = self.tiles.index(tile)
        row = int(index/self.size)
        col = int(index % self.size)
        self.rows[row].append(tile)
        self.cols[col].append(tile)
        if row == col:
            self.diagonals["-"].append(tile)
        if self.size - 1 - col == row:
            self.diagonals["+"].append(tile)

    def has_won(self):
        completed_lines = 0
        from functools import reduce
        completed_lines += reduce(
            (lambda x, y: x+(1 if len(y) == self.size else 0)),
            self.rows.values(), 0)
        completed_lines += reduce(
            (lambda x, y: x+(1 if len(y) == self.size else 0)),
            self.cols.values(), 0)
        completed_lines += reduce(
            (lambda x, y: x+(1 if len(y) == self.size else 0)),
            self.diagonals.values(), 0)
        return completed_lines > 4


def convert_to_message(event):
    return json.dumps(event)


async def notify_users(events, users=connected_users):
    if(isinstance(events, dict)):
        if users:  # asyncio.wait doesn't accept an empty list
            message = convert_to_message(events)
            await asyncio.wait([x.send(message) for x in users])
    else:
        await asyncio.wait([x.send(convert_to_message(y)) for (x, y) in events])


def remove_stale_games():
    # put in a counter var into games which is set to used on every players move
    # call this function on every 10 min which deletes games where the counter is still zero
    # or sets it to zero otherwise
    pass


async def join_game(websocket, game_id, value):
    if game_id and bingo_games[game_id].state is GameState.OPEN:
        bingo_games[game_id].players.add(websocket)
        await notify_users(
            {'game_id': game_id,
             'command': 'player_list',
             'value': [user_name_mapping[x] for x in bingo_games[game_id].players]
             },
            users=bingo_games[game_id].players)


async def leave_game(websocket, game_id, value):
    bingo_game = bingo_games[game_id]
    try:
        bingo_game.players.remove(websocket)
        bingo_game.ready_players.remove(websocket)
    except:
        pass

    await notify_users(
        {'game_id': game_id,
         'command': 'player_list',
         'value': [user_name_mapping[x] for x in bingo_game.players]
         })

    if len(bingo_game.players) == 0 and bingo_game.state == GameState.ONGOING:
        bingo_game.state = GameState.OPEN

    await send_game_list(websocket)


async def send_game_list(websocket):
    await notify_users(
        {'game_id': {x: False if y.state == GameState.OPEN else True
                     for x, y in bingo_games.items()},
         'command': 'game_list',
         },
        users=[websocket])


async def register(websocket, game_id, name):
    # send list of games and list of players to the newly joined player
    if name not in user_name_mapping.values():
        connected_users.add(websocket)
        user_name_mapping[websocket] = name
        # newly logged in users get the full game and player lists
        await notify_users(
            {'command': 'player_list',
             'value': [user_name_mapping[x] for x in connected_users]
             })
        await send_game_list(websocket)


async def unregister(websocket, data=None):
    if websocket not in connected_users:
        return

    connected_users.remove(websocket)
    for x in bingo_games.values():
        try:
            x.players.remove(websocket)
            x.ready_players.remove(websocket)
        except:
            pass

    name = user_name_mapping[websocket]
    del user_name_mapping[websocket]
    await notify_users(
        {'command': 'player_list',
         'value': [user_name_mapping[x] for x in connected_users]
         })
    await send_game_list(websocket)


async def handle_move(websocket, game_id, tile):
    bingo_game = bingo_games[game_id]
    if bingo_game.players_turn == websocket:
        for board in bingo_game.boards.values():
            board.pick_tile(int(tile))
        await notify_users(
            {'game_id': game_id,
             'command': 'submit_move',
             'value': tile
             }
        )
        winners = [user_name_mapping[x]
                   for x, y in bingo_game.boards.items() if y.has_won()]
        if winners:
            bingo_game.state = GameState.FINISHED
            await notify_users(
                {'game_id': game_id,
                    'command': 'game_over',
                 'value': winners
                 }
            )
        else:
            await notify_users(
                {'game_id': game_id, 'command': 'turn', 'value': ''},
                [bingo_game.next_player()]
            )


async def handle_ready_player(websocket, game_id, data):
    bingo_game = bingo_games[game_id]
    if bingo_game.players != bingo_game.ready_players:
        if(len(data) > 0):
            bingo_game.boards[websocket] = BingoBoard(data)
            bingo_game.ready_players.add(websocket)
        else:
            del bingo_game.boards[websocket]
            bingo_game.ready_players.remove(websocket)
        await notify_users(
            {'game_id': game_id,
             'command': 'player_ready',
             'value': [user_name_mapping[x] for x in bingo_game.ready_players]
             })
        if bingo_game.players == bingo_game.ready_players:
            bingo_game.state = GameState.ONGOING
            await notify_users(
                [(x, {'game_id': game_id, 'command': 'game_started',
                      'value': bingo_game.boards[x].tiles
                      }) for x in bingo_game.players])
            await notify_users(
                {'game_id': game_id, 'command': 'turn', 'value': ''},
                [bingo_game.random_start_player()]
            )


async def handle_new_game(websocket, game_id, data):
    bingo_game = bingo_games[game_id]
    if bingo_game.state == GameState.FINISHED:
        bingo_game.new_game()
        await notify_users(
            {'game_id': game_id,
             'command': 'new_game',
             'value': ''
             })


async def handle_create_game(websocket, game_id, name):
    if len(bingo_games) <= MAX_TOTAL_GAMES:
        bingo_games[game_id] = BingoGame()
        await notify_users(
            {'command': 'create_game',
             'game_id': game_id
             })


async def handle_refresh_lists(websocket, game_id, name):
    logging.info("handling refresh")
    await send_game_list(websocket)
    await notify_users(
        {'command': 'player_list',
         'value': [user_name_mapping[x] for x in connected_users]
         }, users=[websocket])


input_commands = {
    "register": register,
    "join_game": join_game,
    "leave_game": leave_game,
    "submit_move": handle_move,
    "player_ready": handle_ready_player,
    "new_game": handle_new_game,
    "create_game": handle_create_game,
    "refresh_lists": handle_refresh_lists,
}


async def handler(websocket, path):
    try:
        # await websocket.send(state_event())
        # cleanup games
        async for message in websocket:
            data = json.loads(message)
            logging.info(data)
            if data["command"] in input_commands:
                await input_commands[data["command"]](websocket, data["game_id"],
                                                      data["value"])
            elif data["command"] == "remove_player":
                break
            else:
                logging.error("unsupported event: {}", data)
    finally:
        await unregister(websocket)
