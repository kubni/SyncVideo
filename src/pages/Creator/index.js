/*
 * TODO:
 * 1) Disable some buttons after clicking
 */

import "./creator.css"
import Chat from "../../components/Chat"
import {
  db,
  doc,
  collection,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  insertUserIntoDb,
  onSnapshot,
} from "./firebase.js"

import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

export default function Creator({ setVideoUrl, pc }) {

  // Variables
  const location = useLocation(); // TODO: State? Inside of useEffect?
  const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  };

  // States
  const [inputElement, updateInputElement] = useState();
  const [isActive, setIsActive] = useState(false);
  const [localChannel, updateLocalChannel] = useState(pc.createDataChannel("Local data channel"));
  const [onlineUsersInfo, updateOnlineUsersInfo] = useState({
    onlineUsers: [
      {
        username: location.state?.hostUsername,
        role: "host"
      }
    ],
    count: 1
  });

  // UseEffects
  useEffect(() => {
    let inputElementCopy = document.createElement("input");
    inputElementCopy.type = "file";

    // Add an event listener for onchange event so we can read the contents of the file
    inputElementCopy.onchange = (event) => {
      const file = event.target.files[0];
      const fileReader = new FileReader();

      // IMPORTANT: Since readAsDataURL doesn't work well with large files, we use readAsArrayBuffer
      fileReader.readAsArrayBuffer(file);

      // Create the handler for when file reader loads the file
      fileReader.onload = (event) => {
        // Grab the array buffer that FileReader produces:
        let buffer = event.target.result;

        // Convert the buffer to a Blob
        let videoBlob = new Blob([new Uint8Array(buffer)], { type: "video/mp4" });  // TODO: Check this constructor // TODO: What about other extensions?

        // The blob gives us a URL to the video file
        let url = window.URL.createObjectURL(videoBlob); // TODO: Read docs about this

        // Set the source and load the video
        localVideoSourceRef.current.src = url;
        localVideoRef.current.load();

        // Save url so we can pass it to the participant
        // TODO: How come this re-render doesn't "unload" the video
        setVideoUrl(url);
        setIsActive(true);
      }
    }
    updateInputElement(inputElementCopy);
  }, [setVideoUrl]);

  useEffect(() => {
    function handleLocalChannelStatusChange(event) {
      if (localChannelCopy) {
        const state = localChannelCopy.readyState;
        if (state === "open") {
          // This means that the participant connected
          console.log("Local channel is open!")
        }
        else {
          console.log("Local channel is closed!");
        }
      }
    }

    let localChannelCopy = pc.createDataChannel("Copy of local data channel");
    localChannelCopy.onopen = handleLocalChannelStatusChange;
    localChannelCopy.onclose = handleLocalChannelStatusChange;

    updateLocalChannel(localChannelCopy);
    // TODO: Check the cleanup function
    return () => {
      pc.removeEventListener("open", handleLocalChannelStatusChange);
      pc.removeEventListener("close", handleLocalChannelStatusChange);
    }
  }, [pc]);

  // Refs
  const videoFileDialogButtonRef = useRef(null);
  const localVideoRef = useRef(null);
  const localVideoSourceRef = useRef(null);
  const generateRoomIdButtonRef = useRef(null);
  const inputIdRef = useRef(null);

  // JSX Handlers
  function onVideoFileDialogButtonClick() {
    inputElement.click();
  }

  async function onGenerateRoomIdButtonClick() {
    // We need to check if user is using Firefox or not since capturing the stream is different.
    const userAgent = navigator.userAgent;
    let localStream = new MediaStream();
    userAgent.includes("Firefox")
      ? localStream = localVideoRef.current.mozCaptureStream()
      : localStream = localVideoRef.current.captureStream();

    // Push all tracks(video and audio) from localStream to our peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Reference Firestore collections for signaling
    const callDocumentRef = doc(collection(db, "calls"));
    const offerCandidates = collection(callDocumentRef, "offerCandidates");
    const answerCandidates = collection(callDocumentRef, "answerCandidates");

    // Set the ID
    inputIdRef.current.value = callDocumentRef.id;
    const roomID = inputIdRef.current.value;

    // Add the host to the onlineUsers document that is unique to this room
    await insertUserIntoDb(location.state?.hostUsername, "host", roomID);

    // Save creator's ICE candidates to the db.
    pc.onicecandidate = (event) => {
      async function addOfferCandidate(candidate) {
        await addDoc(offerCandidates, candidate);
      }
      event.candidate && addOfferCandidate(event.candidate.toJSON());
    };

    // Create the offer
    const offerDescription = await pc.createOffer(offerOptions)
    await pc.setLocalDescription(offerDescription);

    // Write the offer object to the database
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDocumentRef, { offer });

    // Listen for changes in the call document
    // TODO: Unsubscribe is used for detaching the listener so we should use it somewhere.
    const unsubscribeOfferCandidates = onSnapshot(callDocumentRef, (snapshot) => {
      const data = snapshot.data();
      //If we don't have description set for the remote stream AND there is an answer waiting for us
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // Apart from answer, we need to add ICE candidates to the peer connection.
    const unsubscribeAnswerCandidates = onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

    // Handle new users by listening for changes in participants
    const onlineUsersDocRef = doc(db, "onlineUsers", roomID);
    const participants = collection(onlineUsersDocRef, "participants");

    let onlineUsersCopy = onlineUsersInfo.onlineUsers;
    let onlineUserCountCopy = onlineUsersInfo.count;

    const unsubscribeParticipants = onSnapshot(participants, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // Handle the new participant
          let newParticipant = change.doc.data()
          console.log(`Participant ${newParticipant.username} has joined the room!`);
          console.log(newParticipant);
          onlineUsersCopy.push(newParticipant);
          onlineUserCountCopy++;
        }
      });
      updateOnlineUsersInfo({
        onlineUsers: onlineUsersCopy,
        count: onlineUserCountCopy,
      });
    });
  }

  function onResetRoomButtonClick() {
    pc.close();
    window.location.reload();

    // We don't delete the actual documents in database because its not recommended for the Web version by Firestore devs.
  }

  // JSX
  return (
    <div className="creator-page">
      <div className="div-video-file-dialog">
        <p>1. Select a MP4 video (from your PC) that you would like to play: </p>
        <button className="btn-video-file-dialog" onClick={onVideoFileDialogButtonClick} ref={videoFileDialogButtonRef}>Select a video</button>
      </div>
      <div style={!isActive ? { display: "none" } : { display: "flex" }} className="div-video">
        <video width="800" height="600" controls ref={localVideoRef}>
          <source src="" ref={localVideoSourceRef}></source>
          Your browser does not support HTML5 video.
        </video>
      </div>
      <div className="div-room-commands">
        <p style={{ marginTop: "2rem" }}>2. Generate a Room ID:</p>
        <div className="div-generate-room-id">
          <button className="btn-generate-room-id" onClick={onGenerateRoomIdButtonClick} ref={generateRoomIdButtonRef}>Generate Room ID</button>
          <input type="text" readOnly ref={inputIdRef} />
        </div>
      </div>
      <div className="reset-section">
        <p>Reset everything:</p>
        <button className="btn-reset-room" onClick={onResetRoomButtonClick}>Reset Room</button>
      </div>

      <Chat
        dataChannel={localChannel}
        onlineUsersInfo={onlineUsersInfo}
      />
    </div>
  );
}
