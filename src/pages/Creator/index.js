import "./creator.css"
import firestoreDb from "./firebase.js"
import { useEffect, useRef } from "react"

export default function Creator(props) {

  // Variables
  let inputElement = null;
  const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  };

  // UseEffects
  useEffect(() => {
    inputElement = document.createElement("input"); // TODO: Check this warning
    inputElement.type = "file";

    // Add an event listener for onchange event so we can read the contents of the file
    inputElement.onchange = (event) => {
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
        props.setVideoUrl(url);
      }
    }
  }, []);

  // Refs
  const videoFileDialogButtonRef = useRef(null);
  const localVideoRef = useRef(null);
  const localVideoSourceRef = useRef(null);
  const generateRoomIdButtonRef = useRef(null);
  const inputIdRef = useRef(null);

  // Handlers
  function onVideoFileDialogButtonClick() {
    inputElement.click();
  }

  // Handlers
  async function onGenerateRoomIdButtonClick() {
    const localStream = localVideoRef.current.captureStream();

    // Push all tracks(video and audio) from localStream to our peer connection
    localStream.getTracks().forEach((track) => {
      props.rtcPeerConnection.addTrack(track, localStream);
    });

    // Reference Firestore collections for signaling
    let callDocument = firestoreDb.collection("calls").doc();
    let offerCandidates = callDocument.collection("offerCandidates");
    let answerCandidates = callDocument.collection("answerCandidates");

    // Set the ID
    inputIdRef.current.value = callDocument.id;

    // Save creator's ICE candidates to the db.
    props.rtcPeerConnection.onicecandidate = (event) => {
      /* If the call document is still being created, we wait for 1s for
       * Firebase to finish its creation so we can add offerCandidates to it.
       * By doing this, we avoid the race condition.
       * TODO: Possibly unneeded
       */
      if (!callDocument) {
        setTimeout(() => {
          event.candidate && offerCandidates.add(event.candidate.toJSON());
        }, 1000);
      }
      else {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
      }
    };

    // Create the offer
    const offerDescription = await props.rtcPeerConnection.createOffer(offerOptions);
    await props.rtcPeerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Write the offer object to the database
    await callDocument.set({ offer });

    // Listen for the changes in call document
    callDocument.onSnapshot((snapshot) => {
      const data = snapshot.data();
      // If we don't have description set for the remote stream AND there is an answer waiting for us
      if (!props.rtcPeerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        props.rtcPeerConnection.setRemoteDescription(answerDescription);
      }
    });

    // Apart from answer, we need to add ICE candidate to the peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          props.rtcPeerConnection.addIceCandidate(candidate);
        }
      });
    });
  }

  // JSX
  return (
    <div className="creator-page">
      <div className="div-video-file-dialog">
        <p>1. Select a video (from your PC) that you would like to play: </p>
        <button className="btn-video-file-dialog" onClick={onVideoFileDialogButtonClick} ref={videoFileDialogButtonRef}>Select a video...</button>
      </div>
      <div className="div-video">
        <video width="800" height="600" controls ref={localVideoRef}>
          <source src="" ref={localVideoSourceRef}></source>
          Your browser does not support HTML5 video.
        </video>
      </div>
      <div className="div-room-commands">
        <p style={{ marginTop: "2rem" }}>2. Generate a Room ID:</p>
        <div className="div-generate-room-id">
          <button onClick={onGenerateRoomIdButtonClick} ref={generateRoomIdButtonRef}>Generate Room ID</button>
          <input type="text" readOnly ref={inputIdRef} />
        </div>
        <p>3. Send it to a friend and enjoy</p>
      </div>
    </div>
  );
}
