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
      <div className="MainBody">
        <div />
        <div className="MainContent">
          <BingoBoard userid={props.userid} />
          <div className="BelowMainContent">
            <ChatWindow userid={props.userid} />
          </div>
        </div>
        <div />
      </div>
    );
  } else {
    return (
      <div className="MainBody">
        <div />
        <div className="MainContent">
          <GameLobby userid={props.userid} />
          <div className="BelowMainContent">
            <ChatWindow userid={props.userid} />
          </div>
        </div>
        <div />
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
