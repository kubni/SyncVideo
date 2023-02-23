import "./participant.css"

import firestoreDb from "../Creator/firebase.js" // TODO: Move this file elsewhere, outside of Creator page directory
import { useLocation } from "react-router-dom" // TODO: Read docs
import { useEffect, useRef, useState } from "react"

export default function Participant({ pc }) {

  // Variables
  const location = useLocation();

  // States
  const [remoteChannel, updateRemoteChannel] = useState(pc.createDataChannel("Remote data channel"));

  // UseEffects
  useEffect(() => {
    const answerOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };

    const answerFunction = async () => {
      const localStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          localStream.addTrack(track);
        });
      }
      localVideoRef.current.srcObject = localStream;

      const roomID = location.state?.roomID;
      const callDocument = firestoreDb.collection("calls").doc(roomID);
      const answerCandidates = callDocument.collection("answerCandidates");
      const offerCandidates = callDocument.collection("offerCandidates");

      pc.onicecandidate = (event) => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
      };

      const callData = (await callDocument.get()).data(); // TODO: Undefined on FIrefox

      const offerDescription = callData.offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.createAnswer(answerOptions);
      await pc.setLocalDescription(answerDescription);

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
            pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    }

    // Call our async function
    answerFunction();

    return () => {
      // TODO: Cleanup
    }
  }, [location.state?.roomID, pc]);

  useEffect(() => {
    let remoteChannelCopy = pc.createDataChannel("Copy of remote data channel");

    function handleRemoteChannelStatusChange(event) {
      if (remoteChannelCopy) {
        console.log(`Receive channel's status has changed to ${remoteChannelCopy.readyState}`);
      }
    }

    function handleReceiveMessage(event) {
      console.log("Incoming data: ", event.data);
      remoteChannelMessageRef.current.value = event.data;
    }

    // FIXME: We enter here 5 times because of rerenders
    function handleDataChannelEvent(event) {
      console.log("Data channel received: ", remoteChannelCopy);

      remoteChannelCopy = event.channel;
      remoteChannelCopy.onmessage = handleReceiveMessage;
      remoteChannelCopy.onopen = handleRemoteChannelStatusChange;
      remoteChannelCopy.onclose = handleRemoteChannelStatusChange;

      updateRemoteChannel(remoteChannelCopy);
    }

    pc.addEventListener("datachannel", handleDataChannelEvent);

    return () => {
      pc.removeEventListener("message", handleReceiveMessage); // TODO: handleReceiveMessage or remoteChannel.onmessage as 2nd argument
      pc.removeEventListener("open", handleRemoteChannelStatusChange);
      pc.removeEventListener("close", handleRemoteChannelStatusChange);
      pc.removeEventListener("datachannel", handleDataChannelEvent);
    }
  }, [pc]); // TODO: We can make a pc copy in order to not have it in dep. array

  // Refs
  const localVideoRef = useRef(null);
  const remoteChannelMessageRef = useRef(null);

  return (
    <div className="participant-page">
      <div className="remote-video">
        <video width="800" height="600" controls muted autoPlay ref={localVideoRef}>
          Your browser doesn't support HTML5 video.
        </video>
        <p>Notice: By default, the video is muted.</p>

        <input type="text" readOnly ref={remoteChannelMessageRef} />
      </div>
    </div>
  )
}
