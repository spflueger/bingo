import {
  JOIN_GAME,
  LEAVE_GAME,
  UPDATE_GAME_LIST,
  UPDATE_PLAYER_LIST,
  UPDATE_PLAYER_NAME
} from "../actionTypes";

const initialState = {
  player_list: [],
  game_list: [],
  active_game: null
};

export default function(state = initialState, action) {
  switch (action.type) {
    case JOIN_GAME: {
      return {
        ...state,
        active_game: action.payload
      };
    }
    case LEAVE_GAME: {
      return {
        ...state,
        active_game: ""
      };
    }
    case UPDATE_GAME_LIST: {
      return {
        ...state,
        game_list: action.payload
      };
    }
    case UPDATE_PLAYER_LIST: {
      return {
        ...state,
        player_list: action.payload
      };
    }
    case UPDATE_PLAYER_NAME: {
      return { ...state, player_name: action.payload };
    }

    default:
      return state;
  }
}
