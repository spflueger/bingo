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

user_id_mapping = dict()
user_id_name_mapping = dict()

GameState = Enum('GameState', 'OPEN CLOSED ONGOING FINISHED')

bingo_games = {}


class BingoGame:
    def __init__(self):
        self.game_recently_active = True
        self.players = set()
        self.ready_players = set()
        self.boards = {}
        self.players_turn_index = None
        self.players_turn = None
        self.state = GameState.OPEN
        self.stats = {}
        self.total_played_games = 0

    def new_game(self):
        self.ready_players = set()
        self.boards = {}
        self.players_turn_index = None
        self.players_turn = None
        self.state = GameState.OPEN

    def random_start_player(self):
        self.players_turn_index = randrange(0, len(self.players))
        self.players_turn = list(self.players)[self.players_turn_index]

        return self.players_turn

    def next_player(self):
        self.game_recently_active = True
        self.players_turn_index = (
            self.players_turn_index + 1) % len(self.players)
        self.players_turn = list(self.players)[self.players_turn_index]

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


async def stale_game_gc(sleeptime):
    from time import sleep
    while True:
        await remove_stale_games()
        await asyncio.sleep(sleeptime)


async def remove_stale_games():
    logging.debug("running cleanup")
    mark_for_delete = []
    for k, v in bingo_games.items():
        if not v.game_recently_active:
            mark_for_delete.append(k)
        else:
            v.game_recently_active = False
    logging.debug(mark_for_delete)
    if len(mark_for_delete):
        for x in mark_for_delete:
            del bingo_games[x]

        await send_game_list(connected_users)


async def send_game_stats(game_id):
    for x in bingo_games[game_id].stats.keys():
        if x not in user_id_mapping:
            del bingo_games[game_id].stats[x]
    await notify_users({
        'type': 'UPDATE_GAME_STATS',
        'payload': {
                'game_id': game_id,
                'stats': [
                    {"uid": user_id_mapping[x], "wins": y}
                    for x, y in bingo_games[game_id].stats.items()
                ]
        }
    }, users=bingo_games[game_id].players)


async def start_game(game_id):
    bingo_game = bingo_games[game_id]
    bingo_game.state = GameState.ONGOING
    await send_game_list(connected_users)
    await notify_users(
        [(x,
            {'type': 'UPDATE_GAME_STATUS',
             'payload': {
                 'game_id': game_id,
                 'status': "STARTED",
                 'values': bingo_game.boards[x].tiles
             }}) for x in bingo_game.players]
    )

    await send_next_player_turn(game_id)


async def join_game(websocket, game_id):
    if game_id and bingo_games[game_id].state is GameState.OPEN:
        bingo_games[game_id].stats[websocket] = 0
        bingo_games[game_id].players.add(websocket)
        await notify_users(
            {'type': 'UPDATE_GAME_PLAYER_LIST',
             'payload': [{
                 'id': user_id_mapping[x],
                 'name': user_id_name_mapping[user_id_mapping[x]]
             } for x in bingo_games[game_id].players]
             },
            users=bingo_games[game_id].players)
        await send_game_stats(game_id)


async def leave_game(websocket, payload):
    game_id = payload["game_id"]
    bingo_game = bingo_games[game_id]
    try:
        del bingo_game.stats[websocket]
    except:
        pass
    try:
        bingo_game.players.remove(websocket)
        bingo_game.ready_players.remove(websocket)
    except:
        pass

    if len(bingo_game.players) > 0:
        await send_game_stats(game_id)

    await notify_users(
        {'type': 'UPDATE_GAME_PLAYER_LIST',
         'payload': [{
                 'id': user_id_mapping[x],
                 'name': user_id_name_mapping[user_id_mapping[x]]
         } for x in bingo_game.players]
         },
        users=bingo_game.players)
    await notify_users({
        'type': 'UPDATE_PLAYER_READY',
        'payload': {
                'game_id': game_id,
                'user_id': [user_id_mapping[x] for x in bingo_game.ready_players]
        }
    }, users=bingo_game.players)

    if(bingo_game.players == bingo_game.ready_players):
        await start_game(game_id)

    if len(bingo_game.players) == 0:
        bingo_game.state = GameState.OPEN
    else:
        if len(bingo_game.players) == 1:
            bingo_game.state = GameState.FINISHED
            await handle_new_game(list(bingo_game.players)[0], game_id)
        elif bingo_game.players_turn == websocket:
            await send_next_player_turn(game_id, undo=True)
    await send_game_list(connected_users)


async def send_game_list(websockets):
    await notify_users(
        {'type': 'UPDATE_GAME_LIST',
         'payload': [{"key": x, "status": "OPEN" if y.state == GameState.OPEN else "CLOSED"}
                     for x, y in bingo_games.items()]
         },
        users=websockets)


async def send_player_list(websockets):
    await notify_users(
        {'type': 'UPDATE_PLAYER_LIST',
         'payload': [{
                 'id': user_id_mapping[x],
                 'name': user_id_name_mapping[user_id_mapping[x]]
         } for x in websockets]
         })


async def register(websocket, payload):
    uid = payload["id"]
    # send list of games and list of players to the newly joined player
    if uid not in user_id_mapping.values():
        connected_users.add(websocket)
        user_id_mapping[websocket] = uid
        user_id_name_mapping[uid] = payload["name"]
        # newly logged in users get the full game and player lists
        await send_player_list(connected_users)
        await send_game_list([websocket])


async def update_name(websocket, payload):
    uid = user_id_mapping[websocket]
    user_id_name_mapping[uid] = payload
    await send_player_list(connected_users)


async def unregister(websocket):
    if websocket not in connected_users:
        return

    for game_id, bingo_game in bingo_games.items():
        if websocket in bingo_game.players:
            del bingo_game.stats[websocket]
            await send_game_stats(game_id)
            await leave_game(websocket, {"game_id": game_id})
    connected_users.remove(websocket)

    userid = user_id_mapping[websocket]
    del user_id_mapping[websocket]
    del user_id_name_mapping[userid]
    await send_player_list(connected_users)


async def send_next_player_turn(game_id, undo=False):
    bingo_game = bingo_games[game_id]
    next_player = bingo_game.players_turn
    if not next_player:
        next_player = bingo_game.random_start_player()
    else:
        if undo:
            bingo_game.players_turn_index = (
                bingo_game.players_turn_index - 1) % len(bingo_game.players)
        next_player = bingo_game.next_player()
    await notify_users(
        {'type': 'UPDATE_PLAYER_TURN',
         'payload': {'game_id': game_id,
                     'user_id': user_id_mapping[next_player]
                     }
         },
        users=bingo_game.players
    )


async def handle_move(websocket, payload):
    game_id = payload["game_id"]
    tile = payload["tile"]
    bingo_game = bingo_games[game_id]
    if bingo_game.players_turn == websocket:
        for board in bingo_game.boards.values():
            board.pick_tile(int(tile))
        await notify_users({
            'type': 'ADD_MOVE',
            'payload': {
                'game_id': game_id,
                'tile': tile
            }
        })
        winners = [x for x, y in bingo_game.boards.items()
                   if y.has_won()]
        if winners:
            bingo_game.total_played_games += 1
            for x in winners:
                bingo_game.stats[x] += 1
            bingo_game.state = GameState.FINISHED
            await notify_users({
                'type': 'UPDATE_GAME_STATUS',
                'payload': {
                        'game_id': game_id,
                        'status': "FINISHED",
                        'winners': [user_id_mapping[x] for x in winners]
                }
            })
            await send_game_stats(game_id)
        else:
            await send_next_player_turn(game_id)


async def handle_ready_player(websocket, payload):
    game_id = payload["game_id"]
    user_id = payload["user_id"]
    tiles = []
    if("tiles" in payload and len(payload["tiles"]) > 0):
        tiles = payload["tiles"]
    bingo_game = bingo_games[game_id]
    if bingo_game.players != bingo_game.ready_players:
        if tiles:
            # player sets himself ready. If he already is just ignore
            if websocket in bingo_game.boards:
                return
            bingo_game.boards[websocket] = BingoBoard(payload["tiles"])
            bingo_game.ready_players.add(websocket)
        else:
            if websocket not in bingo_game.boards:
                return
            del bingo_game.boards[websocket]
            bingo_game.ready_players.remove(websocket)
        await notify_users({
            'type': 'UPDATE_PLAYER_READY',
            'payload': {
                'game_id': game_id,
                'user_id': [user_id_mapping[x] for x in bingo_game.ready_players]
            }
        })
        if bingo_game.players == bingo_game.ready_players:
            await start_game(game_id)


async def handle_new_game(websocket, game_id):
    bingo_game = bingo_games[game_id]
    if bingo_game.state == GameState.FINISHED:
        bingo_game.new_game()
        await notify_users(
            {'type': 'NEW_GAME',
             'payload': game_id
             },
            users=bingo_game.players)


async def handle_create_game(websocket, game_id):
    if len(bingo_games) <= MAX_TOTAL_GAMES and game_id != "":
        bingo_games[game_id] = BingoGame()
        await send_game_list(connected_users)
    else:
        await send_game_list([websocket])


async def send_message(websocket, payload):
    await notify_users(
        {'type': 'RECEIVE_MESSAGE',
         'payload': payload
         })


input_commands = {
    "REGISTER": register,
    "CREATE_GAME": handle_create_game,
    "JOIN_GAME": join_game,
    "LEAVE_GAME": leave_game,
    "SEND_MOVE": handle_move,
    "SET_PLAYER_READY": handle_ready_player,
    "NEW_GAME": handle_new_game,
    "UPDATE_PLAYER_NAME": update_name,
    "SEND_MESSAGE": send_message,
}


async def handler(websocket, path):
    try:
        # await websocket.send(state_event())
        # cleanup games
        async for message in websocket:
            data = json.loads(message)
            # logging.info("received message")
            # logging.info(data)
            if "type" in data:
                if data["type"] in input_commands:
                    await input_commands[data["type"]](websocket, data["payload"])
                elif data["type"] == "remove_player":
                    break
                else:
                    logging.error("unsupported type: {}", data)
            else:
                logging.error("unsupported event: {}", data)
    finally:
        await unregister(websocket)
