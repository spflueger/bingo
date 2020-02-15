import { combineReducers } from "redux";
import gameLobby from "./gameLobby";
import bingoGame from "./bingoGame";
import chatWindow from "./chatWindow";

export default combineReducers({ chatWindow, gameLobby, bingoGame });
