#!/usr/bin/env python

import asyncio
import logging
import websockets
# import ssl
# import pathlib
import socket

from server.server import handler, stale_game_gc

logging.basicConfig(level=logging.INFO)

# ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# bingo_pem = pathlib.Path(__file__).with_name("bingo.pem")
# ssl_context.load_cert_chain(bingo_pem)

# start_server = websockets.serve(
#     handler, "bingo.v2202001112572107410.powersrv.de", 8080, ssl=ssl_context
# )

# start_server = websockets.serve(
#     handler, "bingo.v2202001112572107410.powersrv.de", 8080
# )
ip_address = socket.gethostbyname(socket.gethostname())
start_server = websockets.serve(
    handler, ip_address, 8080,
    ping_interval=20, ping_timeout=20, close_timeout=20
)


asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().create_task(stale_game_gc(600))
asyncio.get_event_loop().run_forever()
