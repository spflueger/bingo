import {
  CREATE_GAME,
  JOIN_GAME,
  LEAVE_GAME,
  UPDATE_GAME_LIST,
  UPDATE_PLAYER_LIST,
  ADD_MOVE,
  SEND_MOVE,
  UPDATE_PLAYER_TURN,
  UPDATE_PLAYER_READY,
  UPDATE_PLAYER_NAME,
  UPDATE_GAME_STATUS,
  NEW_GAME,
  RESET_GAME,
  TOGGLE_GAME_OVER_MODAL,
  TOGGLE_GAME_RULES_MODAL,
  UPDATE_GAME_PLAYER_LIST,
  SHUFFLE_TILES,
  SET_PLAYER_READY,
  SEND_MESSAGE,
  RECEIVE_MESSAGE,
  UPDATE_GAME_STATS
} from "./actionTypes";

export const sendMessage = payload => ({
  type: SEND_MESSAGE,
  payload: payload
});

export const receiveMessage = payload => ({
  type: RECEIVE_MESSAGE,
  payload: payload
});

export const createGame = name => ({
  type: CREATE_GAME,
  payload: name
});

export const joinGame = name => ({
  type: JOIN_GAME,
  payload: name
});

export const leaveGame = name => ({
  type: LEAVE_GAME,
  payload: name
});

export const updateGameList = game_list => ({
  type: UPDATE_GAME_LIST,
  payload: game_list
});

export const updatePlayerList = player_list => ({
  type: UPDATE_PLAYER_LIST,
  payload: player_list
});

export const updateGamePlayerList = player_list => ({
  type: UPDATE_GAME_PLAYER_LIST,
  payload: player_list
});

export const sendMove = move => ({
  type: SEND_MOVE,
  payload: move
});

export const addMove = move => ({
  type: ADD_MOVE,
  payload: move
});

export const updatePlayerTurn = userid => ({
  type: UPDATE_PLAYER_TURN,
  payload: userid
});

export const updatePlayerName = payload => ({
  type: UPDATE_PLAYER_NAME,
  payload: payload
});

export const updatePlayerReady = payload => ({
  type: UPDATE_PLAYER_READY,
  payload: payload
});

export const setPlayerReady = ready_player => ({
  type: SET_PLAYER_READY,
  payload: ready_player
});

export const updateGameStatus = payload => ({
  type: UPDATE_GAME_STATUS,
  payload: payload
});

export const toggleGameOverModal = payload => ({
  type: TOGGLE_GAME_OVER_MODAL,
  payload: payload
});

export const toggleGameRulesModal = payload => ({
  type: TOGGLE_GAME_RULES_MODAL,
  payload: payload
});

export const updateGameStats = payload => ({
  type: UPDATE_GAME_STATS,
  payload: payload
});

export const newGame = game_id => ({
  type: NEW_GAME,
  payload: game_id
});

export const resetGame = game_id => ({
  type: RESET_GAME,
  payload: game_id
});

export const shuffleTiles = new_tiles => ({
  type: SHUFFLE_TILES,
  payload: new_tiles
});
