import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const URL = "ws://localhost:8080/ws/";

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
    this.tiles_per_row = 5;
    this.state = {
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
  }

  setMove(i) {
    let new_used_values = [...this.state.used_values]; // create the copy of state array
    new_used_values[i] = 1; //new value
    this.setState({ used_values: new_used_values });
    this.props.submitMove(this.props.id, i);
  }

  render() {
    const rows = [];
    for (var row = 0; row < this.tiles_per_row; row++) {
      const cols = [];
      for (var col = 0; col < this.tiles_per_row; col++) {
        const index = row * this.tiles_per_row + col;
        cols.push(
          <Col xs>
            <button
              key={index}
              className={(() => {
                if (this.state.used_values[index]) {
                  return "TileUsed";
                } else {
                  return "Tile";
                }
              })()}
              disabled={this.props.disabled || this.state.used_values[index]}
              onClick={() => this.setMove(index)}
            >
              {this.state.values[index]}
            </button>
          </Col>
        );
      }
      rows.push(cols);
    }

    return (
      <div className="Board">
        <Container>
          {rows.map(cols => {
            return (
              <Row noGutters className="justify-content-md-center">
                {cols.map(x => {
                  return x;
                })}
              </Row>
            );
          })}
        </Container>
      </div>
    );
  }
}

class App extends React.Component {
  state = {
    my_name: "PlayerName",
    players_turn: true,
    player_list: []
  };

  ws = new WebSocket(URL);

  componentDidMount() {
    this.ws.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log("connected");
    };

    this.ws.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      const message = JSON.parse(evt.data);
      console.log("received message: " + message);
    };

    this.ws.onclose = () => {
      console.log("disconnected");
      // automatically try to reconnect on connection loss
      this.setState({
        ws: new WebSocket(URL)
      });
    };
  }

  // all of the actions with the websocket go here
  submitMove(game_id, number) {
    console.log("submitting move " + number + " for game " + game_id);
    const message = { command: "submit_move", move: number };
    this.ws.send(JSON.stringify(message));
    this.setState({ players_turn: false });
  }

  render() {
    return (
      <BingoBoard
        key={"game0"}
        id={"game0"}
        disabled={!this.state.players_turn}
        submitMove={this.submitMove.bind(this)}
      />
    );
  }
}

export default App;
