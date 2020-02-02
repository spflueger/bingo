#!/usr/bin/env python

import asyncio
import logging
import websockets

from server.server import handler

logging.basicConfig(level=logging.INFO)

start_server = websockets.serve(
    handler, "v2202001112572107410.powersrv.de/bingo", 85678)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
