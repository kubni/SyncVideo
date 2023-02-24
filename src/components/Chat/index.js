import "./chat.css"

import { useRef } from "react"

export default function Chat({ dataChannel, onlineUsersInfo }) {

  // Refs
  const messageInputRef = useRef(null);
  const onlineUsersRef = useRef(null);
  // JSX Handlers
  function onSendMessageButtonClick() {
    const message = messageInputRef.current.value;

    // dataChannel can be either localChannel or remoteChannel, depending on who we are
    dataChannel.send(message);
  }
  return (
    <div className="chat">
      <div className="online-users-section">
        <p>Online users ({onlineUsersInfo.count}): </p>
        <ul className="online-users-list" ref={onlineUsersRef}>
          {onlineUsersInfo.onlineUsers.map((user, i) => {
            console.log(user);
            return <li key={i}>{user.username}</li>
          })}
        </ul>
      </div>
      <div className="chat-main">
        {/* TODO: Use a scrollable "widget" for message-history */}
        <div className="message-history">
          <p>[13:00h] User A: Hello world!</p>
          <hr />
          <p>[13:05h] User B: Goodbye cruel world!</p>
        </div>
        <input type="text" ref={messageInputRef} />
        <button className="test-button" onClick={onSendMessageButtonClick} >Send a test message</button>
      </div>
    </div>
  )
}
