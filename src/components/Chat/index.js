import "./chat.css"

import { useEffect, useRef, useState } from "react"

export default function Chat({ dataChannel, onlineUsersInfo }) {
  // States
  const [messageHistory, updateMessageHistory] = useState([]);

  // useEffects
  useEffect(() => {
    console.log("UseEffect for messages");
    // Set up onMessage handler for both Creator and Participant
    function handleReceiveMessage(event) {
      console.log("Handle receive message");
      console.log("New message: ", event.data);
      updateMessageHistory([
        ...messageHistory,
        event.data
      ]);
    }
    dataChannel.onmessage = handleReceiveMessage;

    // FIXME: When remote sends a message, somehow dataChannel is still Local Channel
    // so the creator doesn't get the message then
    console.log(dataChannel.onmessage);

    // return () => {
    //   dataChannel.removeEventListener("message", handleReceiveMessage);
    // }
  }, [dataChannel, messageHistory]);


  // Refs
  const messageInputRef = useRef(null);
  const onlineUsersRef = useRef(null);

  // JSX Handlers
  function onSendMessageButtonClick() {
    // dataChannel can be either localChannel or remoteChannel, depending on who we are
    console.log("Sending a message: ", messageInputRef.current.value)

    console.log("Channel that is sending the message: ", dataChannel);
    dataChannel.send(messageInputRef.current.value);
  }

  return (
    <div className="chat">
      <div className="online-users-section">
        <p>Online users ({onlineUsersInfo.count}): </p>
        <ul className="online-users-list" ref={onlineUsersRef}>
          {
            onlineUsersInfo.onlineUsers.map((user, i) => {
              console.log(user);
              return <li key={i}>{user.username}</li>
            })
          }
        </ul>
      </div>
      <div className="chat-main">
        {/* TODO: Use a scrollable "widget" for message-history */}
        <div className="message-history">
          {
            messageHistory.map((message, i) => {
              return <p key={i}>{message}</p>
            })
          }
        </div>
        <input type="text" ref={messageInputRef} />
        <button className="test-button" onClick={onSendMessageButtonClick} >Send a test message</button>
      </div>
    </div>
  )
}
