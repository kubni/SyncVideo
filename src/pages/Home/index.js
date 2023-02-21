// IMPORTANT: Make sure that media.peerconnection.enabled is set to true in Firefox about:config

import "./home.css";
import { useState } from "react";

import { Link } from "react-router-dom"

export default function Home() {

  // States
  const [roomID, setRoomID] = useState("");

  return (
    <>
      <div className="bubbles">
        <div className="create-bubble">
          <Link to="/creator" className="btn-create-room">Create a room</Link>
        </div>
        <div className="join-bubble">
          <div className="div-input-roomID">
            <p>Room ID:</p>
            <input
              type="text"
              value={roomID}
              onChange={(event) => setRoomID(event.target.value)}
            />
            <Link to="/participant" state={{ roomID: roomID }} className="btn-join-room">Join room</Link>
          </div>
        </div>
      </div>
    </>
  );
}
