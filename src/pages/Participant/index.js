import "./participant.css"

import firestoreDb from "../Creator/firebase.js" // TODO: Move this file elsewhere, outside of Creator page directory
import { useLocation } from "react-router-dom" // TODO: Read docs
import { useEffect, useRef } from "react"

export default function Participant(props) {

  // Variables
  const location = useLocation();

  // UseEffects
  useEffect(() => {
    const answerOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };

    const answerFunction = async () => {
      const localStream = new MediaStream();
      props.rtcPeerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          localStream.addTrack(track);
        });
      }
      localVideoRef.current.srcObject = localStream;

      const roomID = location.state?.roomID;
      const callDocument = firestoreDb.collection("calls").doc(roomID);
      const answerCandidates = callDocument.collection("answerCandidates");
      const offerCandidates = callDocument.collection("offerCandidates");

      props.rtcPeerConnection.onicecandidate = (event) => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
      };

      const callData = (await callDocument.get()).data(); // TODO: Undefined on FIrefox

      const offerDescription = callData.offer;
      await props.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await props.rtcPeerConnection.createAnswer(answerOptions);
      await props.rtcPeerConnection.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await callDocument.update({ answer });

      offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log(change);
          if (change.type === "added") {
            let data = change.doc.data();
            props.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    }

    // Call our async function
    answerFunction();

    return () => {
      // TODO: Cleanup
    }
  }, [location.state?.roomID, props.rtcPeerConnection]);

  // Refs
  const localVideoRef = useRef(null);

  return (
    <div className="participant-page">
      <div className="remote-video">
        <video width="800" height="600" controls muted autoPlay ref={localVideoRef}>
          Your browser doesn't support HTML5 video.
        </video>
        <p>Notice: By default, the video is muted.</p>
      </div>
    </div>
  )
}
