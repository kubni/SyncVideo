import "./creator.css"
import firestoreDb from "./firebase.js"
import { useEffect, useRef, useState } from "react"

export default function Creator({ setVideoUrl, pc }) {

  // Variables
  const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  };

  // States
  const [inputElement, updateInputElement] = useState();
  const [isActive, setIsActive] = useState(false);
  const [localChannel, updateLocalChannel] = useState(pc.createDataChannel("Local data channel"));



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

  // HACK: DataChannels
  useEffect(() => {
    function handleLocalChannelStatusChange(event) {
      if (localChannelCopy) {
        const state = localChannelCopy.readyState;
        state === "open" ? console.log("Local channel is open!") : console.log("Local channel is closed!");
      }
    }

    let localChannelCopy = pc.createDataChannel("Copy of local data channel");
    localChannelCopy.onopen = handleLocalChannelStatusChange;
    localChannelCopy.onclose = handleLocalChannelStatusChange;

    updateLocalChannel(localChannelCopy);
    // TODO: Cleanup
    return () => {

    }
  }, [pc]); // FIXME: Excess rerenders, possibly due to pc in dependency array?

  // Refs
  const videoFileDialogButtonRef = useRef(null);
  const localVideoRef = useRef(null);
  const localVideoSourceRef = useRef(null);
  const generateRoomIdButtonRef = useRef(null);
  const inputIdRef = useRef(null);
  const messageInputRef = useRef(null);

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
    let callDocument = firestoreDb.collection("calls").doc();
    let offerCandidates = callDocument.collection("offerCandidates");
    let answerCandidates = callDocument.collection("answerCandidates");

    // Set the ID
    inputIdRef.current.value = callDocument.id;

    // Save creator's ICE candidates to the db.
    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create the offer
    const offerDescription = await pc.createOffer(offerOptions)
    await pc.setLocalDescription(offerDescription);

    // Write the offer object to the database
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDocument.set({ offer });

    // Listen for the changes in call document
    callDocument.onSnapshot((snapshot) => {
      const data = snapshot.data();
      // If we don't have description set for the remote stream AND there is an answer waiting for us
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // Apart from answer, we need to add ICE candidate to the peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  }

  async function onLeaveRoomButtonClick() {
    pc.close();
    const roomID = inputIdRef.current.value;
    if (roomID) {
      let roomRef = firestoreDb.collection("calls").doc(roomID);
      await roomRef
        .collection("answerCandidates")
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref.delete();
          });
        });
      await roomRef
        .collection("offerCandidates")
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref.delete();
          });
        });
      await roomRef.delete();
    }
    window.location.reload();
  }

  function onSendMessageButtonClick() {
    const message = messageInputRef.current.value;
    localChannel.send(message);
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
        <button className="btn-reset-room" onClick={onLeaveRoomButtonClick}>Reset Room</button>
      </div>
      <input type="text" ref={messageInputRef} />
      <button className="test-button" onClick={onSendMessageButtonClick} >Send a test message</button>

    </div>
  );
}
