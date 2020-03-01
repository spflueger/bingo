import * as types from "../actionTypes";
import {
  updateGameList,
  addMove,
  updatePlayerReady,
  updatePlayerList,
  updateGamePlayerList,
  updateGameStatus,
  updatePlayerTurn,
  newGame,
  receiveMessage,
  updateGameStats
} from "../actions";

const setupSocket = (dispatch, userid, username) => {
  const socket = new WebSocket(
    //"ws://bingo.v2202001112572107410.powersrv.de:8080"
    "ws://localhost:8080"
  );

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: "REGISTER",
        payload: {
          id: userid,
          name: username
        }
      })
    );
  };
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    //console.log("received message:", data);
    switch (data.type) {
      case types.RECEIVE_MESSAGE:
        dispatch(receiveMessage(data.payload));
        break;
      case types.UPDATE_PLAYER_LIST:
        dispatch(updatePlayerList(data.payload));
        break;
      case types.UPDATE_GAME_PLAYER_LIST:
        dispatch(updateGamePlayerList(data.payload));
        break;
      case types.UPDATE_GAME_LIST:
        dispatch(updateGameList(data.payload));
        break;
      case types.ADD_MOVE:
        dispatch(addMove(data.payload));
        break;
      case types.UPDATE_PLAYER_READY:
        dispatch(updatePlayerReady(data.payload));
        break;
      case types.UPDATE_GAME_STATUS:
        dispatch(updateGameStatus(data.payload));
        break;
      case types.UPDATE_PLAYER_TURN:
        dispatch(updatePlayerTurn(data.payload));
        break;
      case types.NEW_GAME:
        dispatch(newGame(data.payload));
        break;
      case types.UPDATE_GAME_STATS:
        dispatch(updateGameStats(data.payload));
        break;
      default:
        break;
    }
  };

  return socket;
};

export default setupSocket;
