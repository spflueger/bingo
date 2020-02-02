import asyncio
import json
import logging
import websockets
from enum import Enum


logging.basicConfig(level=logging.INFO)

# Possible extensions:
# what are functions that player can do
# - join game -> responses: success, full, closed
# - temporarly go to lobby
# - leave game
# - make move -> reponses: valid, invalid (error)
# - ready -> responses: ?
# - new game ->
# some commands from players have to be broadcast to all players
# in the same room
# some commands are only available at certain conditions
# block and return error message if its not available
# a game is a collection of players
# - we will keep the number of games limited to 5
# - each game will keep track of all player boards to avoid cheating
# - also the player will only accept commands from players which are
#   valid. so only player whos turn it is can make a move etc. But it
#   will also be blocked on the client

# MAX_TOTAL_GAMES = 3
# MAX_TOTAL_PLAYERS = 10

# # lobby is main place, it shows all available games
# lobby = []

connected_users = set()

user_name_mapping = dict()

GameState = Enum('GameState', 'OPEN CLOSED ONGOING FINISHED')


class BingoGame:
    def __init__(self):
        self.gameid = 1
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

    def next_player(self):
        if not self.players_turn:
            self.players_turn_it = iter(self.players)
        self.players_turn = next(self.players_turn_it,
                                 None)
        if not self.players_turn:
            self.players_turn_it = iter(self.players)
            self.players_turn = next(self.players_turn_it,
                                     None)
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
        return completed_lines == 5


def convert_to_message(event):
    return json.dumps(event)


async def notify_users(events, users=connected_users):
    if(isinstance(events, dict)):
        if users:  # asyncio.wait doesn't accept an empty list
            message = convert_to_message(events)
            await asyncio.wait([x.send(message) for x in users])
    else:
        await asyncio.wait([x.send(convert_to_message(y)) for (x, y) in events])


async def register(websocket, name):
    if bingo_game.state is GameState.OPEN:
        connected_users.add(websocket)
        bingo_game.players.add(websocket)
        user_name_mapping[websocket] = name
        await notify_users(
            {'command': 'player_list',
            'value': [user_name_mapping[x] for x in connected_users]
            })


async def unregister(websocket, data=None):
    connected_users.remove(websocket)
    bingo_game.players.remove(websocket)
    try:
        bingo_game.ready_players.remove(websocket)
    except:
        pass
    name = user_name_mapping[websocket]
    del user_name_mapping[websocket]
    await notify_users(
        {'command': 'player_list',
         'value': [user_name_mapping[x] for x in connected_users]
         })


async def handle_move(websocket, tile):
    if bingo_game.players_turn == websocket:
        for board in bingo_game.boards.values():
            board.pick_tile(int(tile))
        await notify_users(
            {'command': 'submit_move',
             'value': tile
             }
        )
        winners = [user_name_mapping[x]
                   for x, y in bingo_game.boards.items() if y.has_won()]
        if winners:
            bingo_game.state = GameState.FINISHED
            await notify_users(
                {'command': 'game_over',
                 'value': winners
                 }
            )
        else:
            await notify_users(
                {'command': 'turn', 'value': ''},
                [bingo_game.next_player()]
            )


async def handle_ready_player(websocket, data):
    if bingo_game.players != bingo_game.ready_players:
        if(len(data) > 0):
            bingo_game.boards[websocket] = BingoBoard(data)
            bingo_game.ready_players.add(websocket)
        else:
            del bingo_game.boards[websocket]
            bingo_game.ready_players.remove(websocket)
        await notify_users(
            {'command': 'player_ready',
             'value': [user_name_mapping[x] for x in bingo_game.ready_players]
             })
        if bingo_game.players == bingo_game.ready_players:
            bingo_game.state = GameState.ONGOING
            await notify_users(
                [(x, {'command': 'game_started',
                      'value': bingo_game.boards[x].tiles
                      }) for x in bingo_game.players])
            bingo_game.players_turn_it = iter(bingo_game.players)
            await notify_users(
                {'command': 'turn', 'value': ''},
                [bingo_game.next_player()]
            )


async def handle_new_game(websocket, data):
    if bingo_game.state == GameState.FINISHED:
        bingo_game.new_game()
        await notify_users(
            {'command': 'new_game',
             'value': ''
             })


bingo_game = BingoGame()

input_commands = {
    "set_name": register,
    "submit_move": handle_move,
    "player_ready": handle_ready_player,
    "new_game": handle_new_game
}


async def handler(websocket, path):
    try:
        # await websocket.send(state_event())
        # cleanup games
        global bingo_game
        if len(bingo_game.players) == 0:
            bingo_game = BingoGame()
        async for message in websocket:
            data = json.loads(message)
            logging.info(data)
            if data["command"] in input_commands:
                await input_commands[data["command"]](websocket,
                                                      data["value"])
            elif data["command"] == "remove_player":
                break
            else:
                logging.error("unsupported event: {}", data)
    finally:
        await unregister(websocket)
