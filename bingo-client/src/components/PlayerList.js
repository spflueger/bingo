import React from "react";

const PlayerList = props => {
  return (
    <div className="FullWidthContent">
      <h5>Player List:</h5>

      {props.player_list.map(({ id, name }) => {
        var label = name;
        if (props.winners && props.winners.length > 0) {
          if (props.winners.includes(id)) {
            label += " (won)";
          }
        } else {
          if (
            props.players_turn === "" &&
            props.ready_players &&
            props.ready_players.includes(id)
          ) {
            label += " (ready)";
          } else if (props.players_turn !== "" && id === props.players_turn) {
            label += " (turn)";
          }
        }
        if (props.userid === id) {
          label = <font color="blue">{label}</font>;
        }
        return <li key={"player" + id}>{label}</li>;
      })}
    </div>
  );
};

export default PlayerList;
