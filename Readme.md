# Bingo - Online Multiplayer game

The game communicates via websockets. The server is written in python and the client in react js (create react app).

## The Server

To start the server just install the requirements (in you venv)

```bash
pip install -r requirements.txt
```
and start the server with

```bash
python runserver.py
```
You might have to change the hosting address and port.

## The Client

You need npm. Also install the requirements first with
```bash
npm install
```

Then, to run it locally `npm start` or to serve it from a server build it with`npm run build`.
Don't forget to change the hosting address and port accordingly.


## Plans for new parallel game Noch mal!

- Design some overarching code that allows ppl to select a game from the list and join the lobby of this game (FE as well as BE)
- Game Lobby code from FE and corresponding BE code can be reused from bingo game
- Model
  - Design Board model (2D Array?)
  - Rule checking (Check move is valid)
  - Point calc and win checking (Automatically calc points for a board and check if a player has won)
  - Player move protocol (BE is source of truth, everything has to be consistent there. All ppl make move then have to lock their move and when all players locked moves, it actually counts and next players turn)
- FE
  - Implement board (Tile -> Group of Tiles -> Board)
  - Chat component (exist already)
  - Implement overview component shows all other player board in parallel
- BE
  - Implement Board component
  - Implement Game engine to manage a game for all players
  - Scoreboard can be reused from Bingo game
  - 
