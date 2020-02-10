import React, { useState } from "react";
import { connect } from "react-redux";

import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import ListGroup from "react-bootstrap/ListGroup";

import PlayerList from "./PlayerList";
import { createGame, joinGame } from "../redux/actions";

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

function GameLobby({
  game_list,
  player_list,
  max_games,
  joinGame,
  createGame,
  userid
}) {
  const [show_newgame_model, setShow] = useState(false);
  console.log("game lobby props: ", game_list);
  return (
    <div className="Lobby">
      <ListGroup>
        {game_list.length === 0
          ? "No games available"
          : game_list.map(x => {
              return (
                <ListGroup.Item key={x.key}>
                  <Container className="GameListEntry">
                    <Row className="GameListRow">
                      <Col xs="6">{x.key}</Col>
                      <Col xs="6">
                        <Button
                          className="GameButton"
                          disabled={false}
                          onClick={() => joinGame(x.key)}
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
      <div className="BelowMainContent">
        <div className="BelowMainContentColumn">
          <PlayerList player_list={player_list} userid={userid} />
          <NewGameModal
            createNewGame={createGame}
            show={show_newgame_model}
            setShow={setShow}
          />
        </div>
        <div className="BelowMainContentColumn">
          <Button
            className="GameButtonPadded"
            disabled={game_list.length === max_games}
            onClick={() => setShow(true)}
          >
            Create New Game
          </Button>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = state => {
  console.log(state);
  return {
    game_list: state.gameLobby.game_list,
    player_list: state.gameLobby.player_list,
    max_games: state.gameLobby.max_games
  };
  //const todos = getTodosByVisibilityFilter(state, visibilityFilter);
};

const mapDispatchToProps = { createGame, joinGame };

export default connect(mapStateToProps, mapDispatchToProps)(GameLobby);
