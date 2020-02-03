import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import ListGroup from "react-bootstrap/ListGroup";

import { BingoBoard, PlayerList } from "./BingoGame";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const URL = "ws://bingo.v2202001112572107410.powersrv.de:8080";
//const URL = "ws://localhost:8080";

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

function NewGameModal(props) {
  const [new_game_name, setName] = useState("");

  return (
    <Modal show={props.show} onHide={() => props.setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Game</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InputGroup className="mb-3">
          <FormControl
            value={new_game_name}
            onChange={e => setName(e.target.value)}
            placeholder="Game Name"
            aria-label="Game Name"
            aria-describedby="basic-addon2"
          />
          <InputGroup.Append>
            <Button
              variant="outline-secondary"
              onClick={() => {
                props.setShow(false);
                props.createNewGame(new_game_name);
              }}
            >
              Create Game
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Modal.Body>
    </Modal>
  );
}

function GameLobby(props) {
  const [show_newgame_model, setShow] = useState(false);
  console.log(props);
  return (
    <div className="Lobby">
      <ListGroup>
        {Object.keys(props.games).length === 0
          ? "No games available"
          : Object.keys(props.games).map(x => {
              return (
                <ListGroup.Item key={x}>
                  <Container className="GameListEntry">
                    <Row className="GameListRow">
                      <Col xs="6">{x}</Col>
                      <Col xs="6">
                        <Button
                          className="GameButton"
                          disabled={props.games[x]}
                          onClick={() => props.joinGame(x)}
                        >
                          Join Game
                        </Button>
                      </Col>
                    </Row>
                  </Container>
                </ListGroup.Item>
              );
            })}
      </ListGroup>
      <Button
        disabled={props.games.length === props.max_games}
        onClick={() => setShow(true)}
      >
        Create New Game
      </Button>
      <PlayerList player_list={props.player_list} />
      <NewGameModal
        createNewGame={name => {
          props.createNewGame(name);
        }}
        show={show_newgame_model}
        setShow={setShow}
      />
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.refresh = false;
    this.tiles_per_row = 5;
    this.state = {
      player_name: "",
      connected: false,
      game_list: {},
      game_status: {},
      active_game: "",
      max_games: 3
    };
    this.ws = new WebSocket(URL);
  }

  componentDidMount() {
    this.ws.onopen = () => {
      this.setState({ connected: true });
    };

    this.ws.onmessage = evt => {
      const message = JSON.parse(evt.data);
      console.log(
        "received data: command:" +
          message.command +
          ", game_id:" +
          message.game_id +
          ", value:" +
          message.value
      );

      if (message.command === "player_list") {
        if (message.game_id === undefined)
          this.setState({ player_list: message.value });
      } else if (message.command === "game_list") {
        this.setState({
          game_status: message.game_id
        });
      } else if (message.command === "create_game") {
        let new_game_status = { ...this.state.game_status };
        new_game_status[message.game_id] = false;
        this.setState({
          game_status: new_game_status
        });
      } else if (message.command === "game_closed") {
        // remove the game here
      }
    };

    this.ws.onclose = () => {
      // automatically try to reconnect on connection loss
      this.setState({
        ws: new WebSocket(URL),
        connected: false
      });
    };
  }

  createNewGame(new_game_name) {
    this.ws.send(
      JSON.stringify({
        game_id: new_game_name,
        command: "create_game",
        value: ""
      })
    );
  }

  joinGame(game_name) {
    this.ws.send(
      JSON.stringify({ game_id: game_name, command: "join_game", value: null })
    );

    let new_game_list = { ...this.state.game_list };
    new_game_list[game_name] = (
      <BingoBoard
        key={game_name}
        id={game_name}
        yourname={this.state.player_name}
        websocket={this.ws}
        tiles_per_row={this.tiles_per_row}
        leaveGame={this.leaveGame.bind(this)}
        refreshHook={this.refreshHook.bind(this)}
      />
    );
    this.setState({
      active_game: game_name,
      game_list: new_game_list
    });
  }

  leaveGame() {
    this.ws.send(
      JSON.stringify({
        game_id: this.state.active_game,
        command: "leave_game",
        value: null
      })
    );

    this.setState({
      active_game: ""
    });
  }

  handlePlayerName(name) {
    this.setState({ player_name: name, player_list: [name] });
    this.ws.send(
      JSON.stringify({ game_id: null, command: "register", value: name })
    );
  }

  refreshHook() {
    this.refresh = true;
  }

  refreshLists() {
    this.refresh = false;
    this.ws.send(
      JSON.stringify({ game_id: null, command: "refresh_lists", value: "" })
    );
  }

  render() {
    console.log(this.state);
    if (this.refresh) {
      this.refreshLists();
    }
    if (this.state.player_name === "") {
      return <NameForm handleSubmit={this.handlePlayerName.bind(this)} />;
    } else if (this.state.active_game in this.state.game_list) {
      return (
        <Container className="MainContent">
          {this.state.game_list[this.state.active_game]}
        </Container>
      );
    } else {
      return (
        <Container className="MainContent">
          <GameLobby
            games={this.state.game_status}
            player_list={this.state.player_list}
            max_games={this.state.max_games}
            createNewGame={this.createNewGame.bind(this)}
            joinGame={this.joinGame.bind(this)}
          />
        </Container>
      );
    }
  }
}

export default App;
