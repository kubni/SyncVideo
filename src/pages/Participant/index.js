/*
 * TODO:
 * 1) Check for excess rerenders
 * 2) Eliminate copies when updating state
 *
 */
import "./participant.css"
import {
  db,
  doc,
  collection,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  insertUserIntoDb,
  getHostFromDb
} from "../Creator/firebase.js"
import Chat from "../../components/Chat"

import { useLocation } from "react-router-dom" // TODO: Read docs
import { useEffect, useRef, useState } from "react"

export default function Participant({ pc }) {

  // Variables
  const location = useLocation();

  // States
  const [remoteChannel, updateRemoteChannel] = useState(pc.createDataChannel("Remote data channel"));
  const [onlineUsersInfo, updateOnlineUsersInfo] = useState({
    onlineUsers: [],
    count: 0
  });

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
      const callDocumentRef = doc(db, "calls", roomID);
      const answerCandidates = collection(callDocumentRef, "answerCandidates");
      const offerCandidates = collection(callDocumentRef, "offerCandidates");

      pc.onicecandidate = (event) => {
        async function addAnswerCandidate(candidate) {
          await addDoc(answerCandidates, candidate);
        }
        event.candidate && addAnswerCandidate(event.candidate.toJSON());
      };

      let callData = null;
      const callDocumentSnap = await getDoc(callDocumentRef);
      if (callDocumentSnap.exists()) {
        callData = callDocumentSnap.data();
      }
      else {
        console.error("Error: No such callDocument exists!");
      }

      const offerDescription = callData.offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.createAnswer(answerOptions);
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await updateDoc(callDocumentRef, { answer });

      const unsubscribeOfferCandidates = onSnapshot(offerCandidates, (snapshot) => {
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
    function handleRemoteChannelStatusChange(event) {
      if (remoteChannel) {
        console.log(`Receive channel's status has changed to ${remoteChannel.readyState}`);
      }
    }

    // FIXME: We enter here 5 times because of rerenders
    function handleDataChannelEvent(event) {
      event.channel.onopen = handleRemoteChannelStatusChange;
      event.channel.onclose = handleRemoteChannelStatusChange;

      console.log("Event.channel: ", event.channel);


      // TODO: Remote actually gets set to the one that arrives with datachanel event, which is in fact the LOCAL CHANNEL. Does this prevent the remote from sending messages to the local?
      updateRemoteChannel(event.channel);
    }
    pc.addEventListener("datachannel", handleDataChannelEvent);

    return () => {
      remoteChannel.removeEventListener("open", handleRemoteChannelStatusChange);
      remoteChannel.removeEventListener("close", handleRemoteChannelStatusChange);
      pc.removeEventListener("datachannel", handleDataChannelEvent);
    }
  }, [pc, remoteChannel]);

  useEffect(() => {
    async function updateUsers() {
      const roomID = location.state?.roomID;
      const currentParticipantUsername = location.state?.participantUsername;
      let onlineUsersCopy = [];
      let onlineUsersCountCopy = 0;

      // First we find the host and add it to the onlineUsers
      const host = await getHostFromDb(roomID);
      onlineUsersCopy.push(host);
      onlineUsersCountCopy++;

      // /* TODO: When 1-to-N is supported in the future,
      //  *       we would have to call getOtherParticipantsFromDb here.
      //  *       and push them into onlineUsers array.*/

      // Now we just add ourselves to the onlineUsers array and to the database.
      const currentParticipant = {
        username: currentParticipantUsername,
        role: "participant"
      }
      onlineUsersCopy.push(currentParticipant);
      onlineUsersCountCopy++;

      await insertUserIntoDb(location.state?.participantUsername, "participant", roomID);

      updateOnlineUsersInfo({
        onlineUsers: onlineUsersCopy,
        count: onlineUsersCountCopy
      });
    }
    updateUsers();

    // TODO: Cleanup
    return () => {

    }
  }, [location.state?.participantUsername, location.state?.roomID]);

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
      <Chat
        dataChannel={remoteChannel}
        onlineUsersInfo={onlineUsersInfo}
      />
    </div>
  )
}
