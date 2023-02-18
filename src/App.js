import Home from "./pages/Home";
import Creator from "./pages/Creator";
import Participant from "./pages/Participant";

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState } from "react"

export default function App() {

  // Variables
  const servers = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // States
  const [rtcPeerConnection, setRtcPeerConnection] = useState(new RTCPeerConnection(servers));
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
              rtcPeerConnection={rtcPeerConnection}
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
              rtcPeerConnection={rtcPeerConnection}
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
