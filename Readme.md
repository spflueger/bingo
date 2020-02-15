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
