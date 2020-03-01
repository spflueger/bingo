import {
  ADD_MOVE,
  SEND_MOVE,
  UPDATE_PLAYER_TURN,
  UPDATE_PLAYER_READY,
  UPDATE_GAME_STATUS,
  UPDATE_GAME_PLAYER_LIST,
  NEW_GAME,
  RESET_GAME,
  TOGGLE_GAME_OVER_MODAL,
  TOGGLE_GAME_RULES_MODAL,
  SHUFFLE_TILES,
  UPDATE_GAME_STATS
} from "../actionTypes";
import { shuffle } from "../../components/BingoGame";

const tiles_per_row = 5;

const initialState = {
  game_status: "OPEN",
  show_game_over_modal: false,
  show_game_rules_modal: false,
  players_turn: "",
  winners: [],
  stats: [],
  player_list: [],
  ready_players: [],
  tiles_per_row: tiles_per_row,
  ready_button_text: "I'm ready!",
  used_values: Array(tiles_per_row * tiles_per_row).fill(0),
  values: (() => {
    const a = [...Array(tiles_per_row * tiles_per_row).keys()].map(i => {
      return i + 1;
    });
    shuffle(a);
    return a;
  })()
};

const resetGame = (state, tiles_per_row) => {
  return {
    ...state,
    game_status: "OPEN",
    players_turn: "",
    winners: [],
    ready_players: [],
    show_game_over_modal: false,
    player_list: [...state.player_list],
    used_values: Array(tiles_per_row * tiles_per_row).fill(0),
    values: (() => {
      const a = [...Array(tiles_per_row * tiles_per_row).keys()].map(i => {
        return i + 1;
      });
      shuffle(a);
      return a;
    })()
  };
};

export default function(state = initialState, action) {
  //console.log("action:", action, state);
  switch (action.type) {
    case ADD_MOVE: {
      const number = action.payload.tile;
      const index = state.values.indexOf(number);
      let new_used_values = [...state.used_values];
      new_used_values[index] = 1; //new value
      return {
        ...state,
        used_values: new_used_values
      };
    }
    case SEND_MOVE: {
      const number = action.payload.tile;
      const index = state.values.indexOf(number);
      let new_used_values = [...state.used_values];
      new_used_values[index] = 1; //new value
      return {
        ...state,
        used_values: new_used_values,
        players_turn: ""
      };
    }
    case UPDATE_PLAYER_TURN: {
      return {
        ...state,
        players_turn: action.payload.user_id
      };
    }
    case UPDATE_PLAYER_READY: {
      return {
        ...state,
        ready_players: action.payload.user_id
      };
    }
    case UPDATE_GAME_PLAYER_LIST: {
      return {
        ...state,
        player_list: action.payload
      };
    }
    case TOGGLE_GAME_OVER_MODAL: {
      return {
        ...state,
        show_game_over_modal: !state.show_game_over_modal
      };
    }
    case TOGGLE_GAME_RULES_MODAL: {
      return {
        ...state,
        show_game_rules_modal: !state.show_game_rules_modal
      };
    }
    case UPDATE_GAME_STATUS: {
      if (action.payload.status === "STARTED") {
        return {
          ...state,
          game_status: action.payload.status,
          values: action.payload.values
        };
      }
      if (action.payload.status === "FINISHED") {
        return {
          ...state,
          game_status: action.payload.status,
          show_game_over_modal: true,
          winners: action.payload.winners
        };
      } else {
        return {
          ...state,
          game_status: action.payload.status
        };
      }
    }
    case UPDATE_GAME_STATS: {
      return {
        ...state,
        stats: action.payload.stats
      }
    }

    case RESET_GAME: {
      return resetGame(state, tiles_per_row);
    }

    case NEW_GAME: {
      return resetGame(state, tiles_per_row);
    }

    case SHUFFLE_TILES: {
      return {
        ...state,
        values: (() => {
          const a = [...Array(tiles_per_row * tiles_per_row).keys()].map(i => {
            return i + 1;
          });
          shuffle(a);
          return a;
        })()
      };
    }

    default:
      return state;
  }
}
