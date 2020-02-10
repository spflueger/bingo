import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";

import { createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";
import rootReducer from "./redux/reducers";
import rootSaga from "./sagas";
import setupSocket from "./redux/middleware/websocketHandler";

import Chance from "chance";

const userid = new Chance().guid();
const username = new Chance().first();

const sagaMiddleware = createSagaMiddleware();

const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

const socket = setupSocket(store.dispatch, userid, username);

sagaMiddleware.run(rootSaga, { socket, userid });

const rootElement = document.getElementById("root");
ReactDOM.render(
  <Provider store={store}>
    <App userid={userid} />
  </Provider>,
  rootElement
);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
