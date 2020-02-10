import { combineReducers } from "redux";
import gameLobby from "./gameLobby";
import bingoGame from "./bingoGame";

export default combineReducers({ gameLobby, bingoGame });
