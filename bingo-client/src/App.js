import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const URL = "ws://bingo.v2202001112572107410.powersrv.de:8080";

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

class BingoBoard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const rows = [];
    for (var row = 0; row < this.props.tiles_per_row; row++) {
      const cols = [];
      for (var col = 0; col < this.props.tiles_per_row; col++) {
        const index = row * this.props.tiles_per_row + col;
        cols.push(
          <div className="BoardCol" key={"rowcol_" + row + "_" + col}>
            <button
              key={"tile_" + index}
              className={(() => {
                if (this.props.used_values[index]) {
                  return "TileUsed";
                } else {
                  return "Tile";
                }
              })()}
              disabled={this.props.disabled || this.props.used_values[index]}
              onClick={() => this.props.submitMove(this.props.id, index)}
            >
              {this.props.values[index]}
            </button>
          </div>
        );
      }
      rows.push(cols);
    }

    return (
      <div className="Board">
        {rows.map((cols, index) => {
          return (
            <div key={"row_" + index} className="BoardRow">
              {cols.map(x => {
                return x;
              })}
            </div>
          );
        })}
      </div>
    );
  }
}

function NameForm(props) {
  // Declare a new state variable, which we'll call "count"
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        props.handleSubmit(name);
      }}
    >
      <label>
        Enter Your Player Name:
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
}

function GameOverModal(props) {
  var body_text = "";
  const other_winners = props.winners.filter(value => value !== props.yourname);
  if (props.winners.includes(props.yourname)) {
    body_text = "You ";
    if (other_winners.length > 0) body_text += " and ";
  }
  if (other_winners.length === 1) {
    body_text += "Player " + other_winners[0];
  } else if (other_winners.length > 1) {
    body_text += "Players " + props.winners;
  }
  if (props.winners.length === 1 && !props.winners.includes(props.yourname)) {
    body_text += " has won!";
  } else {
    body_text += " have won!";
  }
  return (
    <Modal show={props.winners.length > 0} onHide={props.newGame}>
      <Modal.Header closeButton>
        <Modal.Title>Game Over!</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body_text}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.newGame}>
          New Game
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.tiles_per_row = 5;
    this.state = {
      my_name: "",
      game_started: false,
      players_turn: false,
      winners: [],
      player_list: [],
      ready_players: [],
      ready_button_text: "I'm ready!",
      used_values: Array(this.tiles_per_row * this.tiles_per_row).fill(0),
      values: (() => {
        const a = [
          ...Array(this.tiles_per_row * this.tiles_per_row).keys()
        ].map(i => {
          return i + 1;
        });
        shuffle(a);
        return a;
      })()
    };
    this.ws = new WebSocket(URL);
  }

  componentDidMount() {
    this.ws.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log("connected");
    };

    this.ws.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      const message = JSON.parse(evt.data);
      console.log("received data: " + message.command + " " + message.value);
      if (message.command === "submit_move") {
        this.receivedMove(parseInt(message.value));
      } else if (message.command === "turn") {
        this.setState({ players_turn: true });
      } else if (message.command === "player_list") {
        this.setState({ player_list: message.value });
      } else if (message.command === "player_ready") {
        this.setState({
          ready_players: message.value
        });
      } else if (message.command === "game_started") {
        this.setState({ values: message.value, game_started: true });
      } else if (message.command === "game_over") {
        this.setState({ winners: message.value });
      } else if (message.command === "new_game") {
        this.newGame();
      }
    };

    this.ws.onclose = () => {
      console.log("disconnected");
      // automatically try to reconnect on connection loss
      this.setState({
        ws: new WebSocket(URL)
      });
    };
  }

  newGame() {
    this.setState({
      game_started: false,
      players_turn: false,
      winners: [],
      ready_players: [],
      ready_button_text: "I'm ready!",
      used_values: Array(this.tiles_per_row * this.tiles_per_row).fill(0),
      values: (() => {
        const a = [
          ...Array(this.tiles_per_row * this.tiles_per_row).keys()
        ].map(i => {
          return i + 1;
        });
        shuffle(a);
        return a;
      })()
    });
    this.ws.send(JSON.stringify({ command: "new_game", value: "" }));
  }

  // all of the actions with the websocket go here
  submitMove(game_id, index) {
    let new_used_values = [...this.state.used_values]; // create the copy of state array
    new_used_values[index] = 1; //new value
    this.setState({ used_values: new_used_values, players_turn: false });
    const number = this.state.values[index];

    console.log("submitting move " + number);
    this.ws.send(
      JSON.stringify({ command: "submit_move", value: "" + number })
    );
  }

  // all of the actions with the websocket go here
  receivedMove(number) {
    const index = this.state.values.indexOf(number);
    console.log(index);
    if (this.state.used_values[index] === 0) {
      let new_used_values = [...this.state.used_values]; // create the copy of state array
      new_used_values[index] = 1; //new value
      this.setState({ used_values: new_used_values, players_turn: true });
    }
  }

  handleReady() {
    console.log("calling handleReady");
    const name = this.state.my_name;
    if (this.isPlayerReady(name)) {
      // player was ready but wants not ready
      this.setState({
        ready_button_text: "I'm ready!",
        ready_players: [...this.state.ready_players].filter(
          value => value !== name
        )
      });
      this.ws.send(JSON.stringify({ command: "player_ready", value: [] }));
    } else {
      this.setState({
        ready_button_text: "Not ready?",
        ready_players: [...this.state.ready_players, name]
      });
      this.ws.send(
        JSON.stringify({ command: "player_ready", value: this.state.values })
      );
    }
  }

  isPlayerReady(name) {
    const x = this.state.ready_players.filter(value => value === name);
    return x.length > 0;
  }

  handlePlayerName(name) {
    this.setState({ my_name: name, player_list: [name] });
    this.ws.send(JSON.stringify({ command: "set_name", value: name }));
  }

  render() {
    console.log(this.state);
    if (this.state.my_name === "") {
      return <NameForm handleSubmit={this.handlePlayerName.bind(this)} />;
    } else {
      return (
        <Container>
          <Row>
            <Col xs="12" md="8">
              <BingoBoard
                key={"game0"}
                id={"game0"}
                tiles_per_row={this.tiles_per_row}
                used_values={this.state.used_values}
                values={this.state.values}
                disabled={!this.state.players_turn}
                submitMove={this.submitMove.bind(this)}
              />
            </Col>
            <Col sm="auto"></Col>
          </Row>
          <Row>
            <Col xs="6" sm="4" md="3" xl="2">
              <p>Game Status: {this.state.game_started ? "started" : "open"}</p>
              <p>{this.state.players_turn ? "Your turn!" : ""}</p>
              <p>
                Player List:
                {this.state.player_list.map((n, i) => {
                  var label = n;
                  if (this.state.ready_players.includes(n)) {
                    label += " (ready)";
                  }
                  return <li key={"player" + i}>{label}</li>;
                })}
              </p>
            </Col>
            <Col xs="6" sm="4" md="3" xl="2">
              <button
                className="GameButton"
                disabled={this.state.game_started}
                onClick={() => this.handleReady.bind(this)()}
              >
                {this.state.ready_button_text}
              </button>
              <button
                className="GameButton"
                disabled={this.isPlayerReady(this.state.my_name)}
                onClick={() => {
                  this.setState({ values: shuffle(this.state.values) });
                }}
              >
                {"Shuffle Tiles"}
              </button>
            </Col>
          </Row>
          <GameOverModal
            winners={this.state.winners}
            yourname={this.state.my_name}
            newGame={this.newGame.bind(this)}
          />
        </Container>
      );
    }
  }
}

export default App;
