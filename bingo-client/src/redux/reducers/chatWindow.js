import { RECEIVE_MESSAGE } from "../actionTypes";

const initialState = {
  chat_messages: []
};

export default function(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_MESSAGE: {
      return {
        ...state,
        chat_messages: [...state.chat_messages, action.payload]
      };
    }
    default:
      return state;
  }
}
