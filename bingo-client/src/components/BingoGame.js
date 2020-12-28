import React from "react";
import { connect } from "react-redux";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import PlayerList from "./PlayerList";

import {
  leaveGame,
  newGame,
  updatePlayerTurn,
  setPlayerReady,
  sendMove,
  shuffleTiles,
  toggleGameOverModal,
  toggleGameRulesModal
} from "../redux/actions";

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
export function shuffle(a) {
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
  return (
    <Modal show={props.show} onHide={() => props.toggleGameRules()}>
      <Modal.Header closeButton>
        <Modal.Title>Game Rules</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Players take turns selecting numbers. Every number selected by one
          player is also automatically selected by every other player. Hence all
          players always have the same set of chosen numbers. The first player
          with five complete rows, columns or diagonals wins. Good luck!
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.toggleGameRules()}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function GameOverModal(props) {
  var body_text = "";
  let other_winners = props.players
    .filter(
      ({ id, name }) => id !== props.your_uid && props.winners.includes(id)
    )
    .map(({ id, name }) => {
      return name;
    });

  if (props.winners.includes(props.your_uid)) {
    body_text = "You ";
    if (other_winners.length > 0) body_text += " and ";
  }
  if (other_winners.length === 1) {
    body_text += "Player " + other_winners[0];
  } else if (other_winners.length > 1) {
    body_text += "Players " + other_winners;
  }
  if (props.winners.length === 1 && !props.winners.includes(props.your_uid)) {
    body_text += " has won!";
  } else {
    body_text += " have won!";
  }
  return (
    <Modal show={props.show} onHide={() => props.toggleShow()}>
      <Modal.Header closeButton>
        <Modal.Title>Game Over!</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body_text}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.toggleShow()}>
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function isPlayerReady(ready_players, player_id) {
  return ready_players.filter(value => value === player_id).length > 0;
}

function gameOpen(status) {
  return status === "OPEN";
}

function playersTurn(props) {
  return props.players_turn === props.userid;
}

const BingoBoard = props => {
  let rows = [];
  let ready_button_text = "I'm ready!";
  for (var row = 0; row < props.tiles_per_row; row++) {
    let cols = [];
    for (var col = 0; col < props.tiles_per_row; col++) {
      const index = row * props.tiles_per_row + col;
      cols.push(
        <div className="BoardCol" key={"rowcol_" + row + "_" + col}>
          <button
            key={"tile_" + index}
            className={(() => {
              if (props.used_values[index]) {
                return "TileUsed";
              } else {
                return "Tile";
              }
            })()}
            disabled={!playersTurn(props) || props.used_values[index]}
            onClick={() =>
              props.sendMove({
                game_id: props.game_id,
                tile: props.values[index]
              })
            }
          >
            {props.values[index]}
          </button>
        </div>
      );
    }
    rows.push(cols);
  }

  if (isPlayerReady(props.ready_players, props.userid)) {
    ready_button_text = "?Not ready";
  } else {
    ready_button_text = "!I'm ready";
  }

  return (
    <div className="col col-md-6">
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

      <div className="BelowMainContent">
        <div className="BelowMainContentColumnLeft">
          <p>Game Status: {props.game_status} </p>
          <div className="TurnContainer">
          <p>
            <font color="red">{playersTurn(props) ? "Your turn!" : "\n"}</font>
          </p>
          </div>
          <PlayerList
            player_list={props.player_list}
            userid={props.userid}
            players_turn={props.players_turn}
            ready_players={props.ready_players}
            winners={props.winners}
          />
        </div>
        <div className="BelowMainContentColumnRight">
          <Button
            className="GameButtonPadded"
            disabled={
              !gameOpen(props.game_status) || props.player_list.length < 2
            }
            onClick={() =>
              props.setPlayerReady({
                game_id: props.game_id,
                user_id: props.userid,
                tiles: !isPlayerReady(props.ready_players, props.userid)
                  ? props.values
                  : []
              })
            }
          >
            {ready_button_text}
          </Button>
          <Button
            className="GameButtonPadded"
            disabled={isPlayerReady(props.ready_players, props.userid)}
            onClick={() => props.shuffleTiles()}
          >
            {"Shuffle Tiles"}
          </Button>
          <Button
            className="GameButtonPadded"
            disabled={props.game_status !== "FINISHED"}
            onClick={() => props.newGame(props.game_id)}
          >
            {"New Game"}
          </Button>
          <Button
            className="GameButtonPadded"
            onClick={() => props.toggleGameRulesModal()}
          >
            {"Game Rules"}
          </Button>
          <Button
            className="GameButtonPadded"
            onClick={() =>
              props.leaveGame({
                game_id: props.game_id
              })
            }
          >
            {"Leave Game"}
          </Button>
        </div>
      </div>
      <div className="MainContent">
        <h5>Scoreboard:</h5>
        <Table striped hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {props.stats
              .slice()
              .sort((x1, x2) => x2.wins - x1.wins)
              .map(({ uid, wins }) => {
                return (
                  <tr key={uid}>
                    <td>
                      {props.player_list.find(x => {
                        return uid === x.id;
                      })
                        ? props.player_list.find(x => {
                            return uid === x.id;
                          }).name
                        : uid}
                    </td>
                    <td>{wins}</td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </div>
      <GameRulesModal
        show={props.show_game_rules_modal}
        toggleGameRules={props.toggleGameRulesModal}
      />
      <GameOverModal
        show={props.show_game_over_modal}
        winners={props.winners}
        players={props.player_list}
        your_uid={props.userid}
        toggleShow={props.toggleGameOverModal}
      />
    </div>
  );
};

const mapStateToProps = state => {
  return {
    game_id: state.gameLobby.active_game,
    game_status: state.bingoGame.game_status,
    show_game_over_modal: state.bingoGame.show_game_over_modal,
    show_game_rules_modal: state.bingoGame.show_game_rules_modal,
    tiles_per_row: state.bingoGame.tiles_per_row,
    players_turn: state.bingoGame.players_turn,
    winners: state.bingoGame.winners,
    player_list: state.bingoGame.player_list,
    ready_players: state.bingoGame.ready_players,
    used_values: state.bingoGame.used_values,
    values: state.bingoGame.values,
    chat_messages: state.bingoGame.chat_messages,
    stats: state.bingoGame.stats
  };
};

const mapDispatchToProps = {
  leaveGame,
  newGame,
  toggleGameOverModal,
  toggleGameRulesModal,
  setPlayerReady,
  updatePlayerTurn,
  sendMove,
  shuffleTiles
};

export default connect(mapStateToProps, mapDispatchToProps)(BingoBoard);
