import { takeEvery } from "redux-saga/effects";

const rootSaga = function* rootSaga(params) {
  yield takeEvery("SEND_MOVE", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("CREATE_GAME", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("JOIN_GAME", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("LEAVE_GAME", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("SET_PLAYER_READY", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("NEW_GAME", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("UPDATE_PLAYER_NAME", action => {
    params.socket.send(JSON.stringify(action));
  });
  yield takeEvery("SEND_MESSAGE", action => {
    params.socket.send(JSON.stringify(action));
  });
};

export default rootSaga;
