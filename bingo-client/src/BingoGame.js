import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

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

function GameRulesModal(props) {
  const [show, setShow] = useState(true);

  return (
    <Modal show={show} onHide={setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Game Rules</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Players take turn picking numbers. The first player with five
          completed rows, columns or diagonals wins.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={setShow(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
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
        <Button variant="secondary" onClick={() => props.newGame()}>
          New Game
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function PlayerList(props) {
  return (
    <div>
      Player List:
      {props.player_list.map((n, i) => {
        var label = n;
        if (props.ready_players && props.ready_players.includes(n)) {
          label += " (ready)";
        }
        return <li key={"player" + i}>{label}</li>;
      })}
    </div>
  );
}

class BingoBoard extends React.Component {
  constructor(props) {
    super(props);
    props.refreshHook();
    this.state = {
      game_started: false,
      players_turn: false,
      winners: [],
      player_list: [],
      ready_players: [],
      ready_button_text: "I'm ready!",
      used_values: Array(
        this.props.tiles_per_row * this.props.tiles_per_row
      ).fill(0),
      values: (() => {
        const a = [
          ...Array(this.props.tiles_per_row * this.props.tiles_per_row).keys()
        ].map(i => {
          return i + 1;
        });
        shuffle(a);
        return a;
      })()
    };
  }

  componentWillUnmount() {
    this.props.websocket.onmessage = evt => {};
  }

  componentDidMount() {
    this.props.websocket.onmessage = evt => {
      const message = JSON.parse(evt.data);
      console.log(
        "received data in Game: command:" +
          message.command +
          ", game_id:" +
          message.game_id +
          ", value:" +
          message.value
      );
      if (message.command === "submit_move") {
        this.receivedMove(parseInt(message.value));
      } else if (message.command === "turn") {
        this.setState({ players_turn: true });
      } else if (message.command === "player_list") {
        if (message.game_id !== undefined && this.props.id === message.game_id)
          this.setState({ player_list: message.value });
      } else if (message.command === "player_ready") {
        if (message.game_id === this.props.id) {
          this.setState({
            ready_players: message.value
          });
        }
      } else if (message.command === "game_started") {
        if (message.game_id === this.props.id)
          this.setState({ values: message.value, game_started: true });
      } else if (message.command === "game_over") {
        this.setState({ winners: message.value });
      } else if (message.command === "new_game") {
        this.newGame();
      } else if (message.command === "create_game") {
        let new_game_list = { ...this.state.game_list };
        new_game_list[message.game_id] = null;
        this.setState({
          game_list: new_game_list
        });
      }
    };
  }

  newGame() {
    this.setState({
      game_started: false,
      players_turn: false,
      winners: [],
      ready_players: [],
      ready_button_text: "I'm ready!",
      used_values: Array(
        this.props.tiles_per_row * this.props.tiles_per_row
      ).fill(0),
      values: (() => {
        const a = [
          ...Array(this.props.tiles_per_row * this.props.tiles_per_row).keys()
        ].map(i => {
          return i + 1;
        });
        shuffle(a);
        return a;
      })()
    });

    this.props.websocket.send(
      JSON.stringify({ game_id: this.props.id, command: "new_game", value: "" })
    );
  }

  submitPlayerReady(values) {
    this.props.websocket.send(
      JSON.stringify({
        game_id: this.props.id,
        command: "player_ready",
        value: values
      })
    );
  }

  submitMove(number) {
    let new_used_values = [...this.state.used_values]; // create the copy of state array
    const index = this.state.values.indexOf(number);
    new_used_values[index] = 1; //new value
    this.setState({ used_values: new_used_values, players_turn: false });
    this.props.websocket.send(
      JSON.stringify({
        game_id: this.props.id,
        command: "submit_move",
        value: "" + number
      })
    );
  }

  receivedMove(number) {
    const index = this.state.values.indexOf(number);
    if (this.state.used_values[index] === 0) {
      let new_used_values = [...this.state.used_values]; // create the copy of state array
      new_used_values[index] = 1; //new value
      this.setState({ used_values: new_used_values });
    }
  }

  handleReady() {
    const name = this.props.yourname;
    if (this.isPlayerReady(name)) {
      // player was ready but wants not ready
      this.setState({
        ready_button_text: "I'm ready!",
        ready_players: [...this.state.ready_players].filter(
          value => value !== name
        )
      });
      this.submitPlayerReady([]);
    } else {
      this.setState({
        ready_button_text: "Not ready?",
        ready_players: [...this.state.ready_players, name]
      });
      this.submitPlayerReady(this.state.values);
    }
  }

  isPlayerReady(name) {
    const x = this.state.ready_players.filter(value => value === name);
    return x.length > 0;
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
                if (this.state.used_values[index]) {
                  return "TileUsed";
                } else {
                  return "Tile";
                }
              })()}
              disabled={
                !this.state.players_turn || this.state.used_values[index]
              }
              onClick={() =>
                this.submitMove.bind(this)(this.state.values[index])
              }
            >
              {this.state.values[index]}
            </button>
          </div>
        );
      }
      rows.push(cols);
    }

    return (
      <Container>
        {" "}
        <Row>
          <Col xs="12" md="8">
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
          </Col>
          <Col sm="auto"></Col>
        </Row>
        <Row>
          <Col xs="6" sm="4" md="3" xl="2">
            <p>Game Status: {this.state.game_started ? "started" : "open"}</p>
            <p>{this.state.players_turn ? "Your turn!" : ""}</p>
            <PlayerList
              player_list={this.state.player_list}
              ready_players={this.state.ready_players}
            />
          </Col>
          <Col xs="6" sm="4" md="3" xl="2">
            <Button
              className="GameButton"
              disabled={
                this.state.game_started || this.state.player_list.length < 2
              }
              onClick={() => this.handleReady.bind(this)()}
            >
              {this.state.ready_button_text}
            </Button>
            <Button
              className="GameButton"
              disabled={this.isPlayerReady(this.props.yourname)}
              onClick={() => {
                this.setState({ values: shuffle(this.state.values) });
              }}
            >
              {"Shuffle Tiles"}
            </Button>
            <Button
              className="GameButton"
              onClick={() => this.props.leaveGame()}
            >
              {"Leave Game"}
            </Button>
          </Col>
        </Row>
        <GameOverModal
          winners={this.state.winners}
          yourname={this.props.yourname}
          newGame={this.newGame.bind(this)}
        />
      </Container>
    );
  }
}

export { BingoBoard, PlayerList };
