import React from "react";

import { connect } from "react-redux";

import GameLobby from "./components/GameLobby";
import BingoBoard from "./components/BingoGame";
import ChatWindow from "./components/Chat";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

const App = props => {
  if (
    props.game_list.filter(game => game.key === props.active_game).length > 0
  ) {
    return (
      <div class="container MainBody">
        <div class="row">
          <BingoBoard userid={props.userid} />
          <ChatWindow userid={props.userid} />
        </div>
      </div>
    );
  } else {
    return (
      <div class="container MainBody">
        <div class="row">
          <GameLobby userid={props.userid} />
          <ChatWindow userid={props.userid} />
        </div>
      </div>
    );
  }
};

const mapStateToProps = state => {
  //console.log("main state", state);
  return {
    connected: state.connected,
    active_game: state.gameLobby.active_game,
    game_list: state.gameLobby.game_list
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(App);
