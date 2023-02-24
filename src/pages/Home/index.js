// IMPORTANT: Make sure that media.peerconnection.enabled is set to true in Firefox about:config

import "./home.css";
import { useState } from "react";

import { Link } from "react-router-dom"

export default function Home() {

  // States
  const [hostUsername, setHostUsername] = useState("");
  const [participantUsername, setParticipantUsername] = useState("");
  const [roomID, setRoomID] = useState("");

  return (
    <>
      <div className="bubbles">
        <div className="create-bubble">
          <p style={{ color: "white" }}>Username:</p> {/* TODO: Component? */}
          <input
            type="text"
            value={hostUsername}
            onChange={(event) => setHostUsername(event.target.value)}
          />
          <Link to="/creator" state={{ hostUsername: hostUsername }} className="btn-create-room">Create a room</Link>
        </div>
        <div className="join-bubble">
          <p style={{ color: "white" }}>Username:</p>
          <input
            type="text"
            value={participantUsername}
            onChange={(event) => setParticipantUsername(event.target.value)}
          />
          <div className="div-input-roomID">
            <p style={{ color: "white" }}>Room ID:</p>
            <input
              type="text"
              value={roomID}
              onChange={(event) => setRoomID(event.target.value)}
            />
          </div>
          <Link to="/participant" state={{ roomID: roomID, participantUsername: participantUsername }} className="btn-join-room">Join room</Link>
        </div>
      </div>
    </>
  );
}
