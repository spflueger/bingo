import React, { useState } from "react";
import { connect } from "react-redux";

import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";

import { sendMessage } from "../redux/actions";

const ChatWindow = props => {
  const [new_message, setMessage] = useState("");

  let name = props.player_list.filter(x => x.id === props.userid);
  if (name.length > 0) {
    name = name[0]["name"];
  } else {
    name = "";
  }
  const CHAR_LIMIT = 70;

  return (
    <div className="col">
      <h5>Chat:</h5>
      <InputGroup
        className="ChatGroup"
        onKeyPress={target => {
          if (target.charCode === 13) {
            props.sendMessage({
              username: name,
              message: new_message
            });
            setMessage("");
          }
        }}
      >
        <textarea
          className="ChatMessagesArea"
          cols={20}
          rows={10}
          disabled={true}
          value={props.chat_messages
            .map(({ username, message }) => username + ": " + message + "\n")
            .reduce((x, currentValue) => x + currentValue, "")}
        />
        <div className="BelowMainContent">
          <FormControl
            value={new_message}
            onChange={e => {
              let str = e.target.value;
              if (str.length > CHAR_LIMIT) {
                str = str.substring(0, CHAR_LIMIT);
              }
              setMessage(str);
            }}
            placeholder=""
            aria-label=""
            aria-describedby="basic-addon2"
          />
          <InputGroup.Append>
            <Button
              variant="outline-secondary"
              disabled={new_message === ""}
              onClick={() => {
                props.sendMessage({
                  username: name,
                  message: new_message
                });
                setMessage("");
              }}
            >
              Send
            </Button>
          </InputGroup.Append>
        </div>
      </InputGroup>
    </div>
  );
};

const mapStateToProps = state => {
  return {
    chat_messages: state.chatWindow.chat_messages,
    player_list: state.gameLobby.player_list
  };
};

const mapDispatchToProps = { sendMessage };

export default connect(mapStateToProps, mapDispatchToProps)(ChatWindow);
