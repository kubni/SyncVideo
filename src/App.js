import Home from "./pages/Home";
import Creator from "./pages/Creator";
import Participant from "./pages/Participant";

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState } from "react"

export default function App() {

  // Variables
  const servers = {
    iceServers: [
      // STUN Servers
      {
        // stun:relay.metered.ca:80
        urls: "stun:stun.l.google.com:19302",
      },
      // TURN Servers
      {
        urls: "turn:relay.metered.ca:80",
        username: `${process.env.REACT_APP_TURN_USERNAME}`,
        credential: `${process.env.REACT_APP_TURN_CREDENTIAL}`,
      },
      {
        urls: "turn:relay.metered.ca:443",
        username: `${process.env.REACT_APP_TURN_USERNAME}`,
        credential: `${process.env.REACT_APP_TURN_CREDENTIAL}`,
      },
      {
        urls: "turn:relay.metered.ca:443?transport=tcp",
        username: `${process.env.REACT_APP_TURN_USERNAME}`,
        credential: `${process.env.REACT_APP_TURN_CREDENTIAL}`,
      },
    ],
    // iceCandidatePoolSize: 10,
  };

  // States
  const [pc, setRtcPeerConnection] = useState(new RTCPeerConnection(servers));
  const [videoUrl, setVideoUrl] = useState("");
  const [remoteStream, setRemoteStream] = useState(new MediaStream());

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/creator"
          element={
            <Creator
              pc={pc}
              setRtcPeerConnection={setRtcPeerConnection}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              remoteStream={remoteStream}
              setRemoteStream={setRemoteStream}
            />
          }
        />
        <Route
          path="/participant"
          element={
            <Participant
              pc={pc}
              setRtcPeerConnection={setRtcPeerConnection}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              remoteStream={remoteStream}
              setRemoteStream={setRemoteStream}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
