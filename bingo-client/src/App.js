import React, { useState } from "react";

import { connect } from "react-redux";

import GameLobby from "./components/GameLobby";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import BingoBoard from "./components/BingoGame";

function NameForm(props) {
  // Declare a new state variable, which we'll call "count"
  const [name, setName] = useState("");

  return (
    <div className="MainBody">
      <div />
      <div className="MainContent">
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
      </div>
      <div />
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log(this.props);
    if (
      this.props.game_list.filter(game => game.key === this.props.active_game)
        .length > 0
    ) {
      return (
        <div className="MainBody">
          <div />
          <div className="MainContent">
            <BingoBoard userid={this.props.userid} />
          </div>
          <div />
        </div>
      );
    } else {
      return (
        <div className="MainBody">
          <div />
          <div className="MainContent">
            <GameLobby userid={this.props.userid} />
          </div>
          <div />
        </div>
      );
    }
  }
}

const mapStateToProps = state => {
  console.log("main state", state);
  return {
    connected: state.connected,
    active_game: state.gameLobby.active_game,
    game_list: state.gameLobby.game_list
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(App);
