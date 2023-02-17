// Make sure that media.peerconnection.enabled is set to true in Firefox about:config


/*
 * We need a homepage, where we have a Create and Join buttons.
 * Depending on the button clicked (by which we know if we are the room's creator or a participant),
 * we can show different streams.
 * The creator should see only the Local Stream and the participants should see only the Remote Stream.
 * That way, whenever the creator pauses the video, the remote stream (that the participant sees) will also pause instantly.
 */




import "./home.css";
import firestoreDb from "./firebase.js";
import video from "../../videos/danza.mp4"
import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom"

// export default function Home() {

//   const [roomId, setRoomId] = useState();

//   const servers = {
//     iceServers: [
//       {
//         urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
//       },
//     ],
//     iceCandidatePoolSize: 10,
//   };

//   // "Values you would want to share between multiple components if using react or vue":
//   // TODO
//   const rtcPeerConnection = new RTCPeerConnection(servers);

//   // Refs
//   const localVideoRef = useRef(null);
//   const webcamButtonRef = useRef(null);
//   const answerButtonRef = useRef(null);
//   const callButtonRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const callInputRef = useRef(null);
//   const hangupButtonRef = useRef(null);

//   // Event handlers
//   // 1. Setup media sources
//   async function onWebcamButtonClick() {
//     console.log("onWebcamButtonClick");
//     // Ask the user for permission to use their video and audio devices
//     // const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//     const localStream = localVideoRef.current.captureStream();
//     const remoteStream = new MediaStream();

//     // Push all tracks (video and audio) from localStream to our peer connection
//     localStream.getTracks().forEach((track) => {
//       rtcPeerConnection.addTrack(track, localStream);
//     });

//     rtcPeerConnection.ontrack = (event) => {
//       event.streams[0].getTracks().forEach((track) => {
//         console.log("Adding the following track to the remote stream: ", track);
//         remoteStream.addTrack(track);
//       });
//     };

//     // Enable the camera stream
//     // webcamVideoRef.current.srcObject = localStream;
//     remoteVideoRef.current.srcObject = remoteStream;

//     webcamButtonRef.current.disabled = true; // TODO: Use States for this
//     callButtonRef.current.disabled = false;
//     answerButtonRef.current.disabled = false;
//   }

//   // 2. Create an offer
//   async function onCallButtonClick() {
//     // Reference Firestore collections for signaling
//     const callDocument = firestoreDb.collection("calls").doc();
//     const offerCandidates = callDocument.collection("offerCandidates");
//     const answerCandidates = callDocument.collection("answerCandidates");

//     // Set the input to the ID needed for peer to peer connection
//     callInputRef.current.value = callDocument.id;
//     setRoomId(callDocument.id);


//     // Save caller's ICE candidates to the db.
//     rtcPeerConnection.onicecandidate = (event) => {
//       event.candidate && offerCandidates.add(event.candidate.toJSON());
//     };


//     // Create the offer
//     const offerDescription = await rtcPeerConnection.createOffer(); // Gather info about MediaStreamTrack objects attached to the WebRTC session
//     await rtcPeerConnection.setLocalDescription(offerDescription); // TODO: Check MDN for examples

//     const offer = {
//       sdp: offerDescription.sdp,
//       type: offerDescription.type,
//     };

//     // Write the offer object to the database
//     await callDocument.set({ offer });

//     // Listen for the changes in call document
//     callDocument.onSnapshot((snapshot) => {
//       const data = snapshot.data();
//       // If we don't have description set for the remote stream AND there is an answer waiting for us to do something with it // TODO: ?. probably checks if answer field isn't null/false/empty...
//       if (!rtcPeerConnection.currentRemoteDescription && data?.answer) {
//         const answerDescription = new RTCSessionDescription(data.answer);
//         rtcPeerConnection.setRemoteDescription(answerDescription);
//       }
//     });

//     // Apart from answer, we need to add ICE candidate to the peer connection
//     answerCandidates.onSnapshot((snapshot) => {
//       snapshot.docChanges().forEach((change) => {
//         if (change.type === "added") {
//           const candidate = new RTCIceCandidate(change.doc.data());
//           rtcPeerConnection.addIceCandidate(candidate);
//         }
//       });
//     });

//     hangupButtonRef.current.disabled = false;
//   };

//   // 3. Answer the call with the unique ID
//   // TODO: Check: This should actually be the other client (the other peer)
//   async function onAnswerButtonClick() {
//     const callId = callInputRef.current.value;
//     const callDocument = firestoreDb.collection("calls").doc(callId);
//     const answerCandidates = callDocument.collection("answerCandidates");
//     const offerCandidates = callDocument.collection("offerCandidates");

//     rtcPeerConnection.onicecandidate = (event) => {
//       event.candidate && answerCandidates.add(event.candidate.toJSON());
//     };

//     // Fetch
//     const callData = (await callDocument.get()).data();

//     const offerDescription = callData.offer;
//     await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));

//     const answerDescription = await rtcPeerConnection.createAnswer();
//     await rtcPeerConnection.setLocalDescription(answerDescription);

//     const answer = {
//       type: answerDescription.type,
//       sdp: answerDescription.sdp,
//     };

//     await callDocument.update({ answer });

//     offerCandidates.onSnapshot((snapshot) => {
//       snapshot.docChanges().forEach((change) => {
//         console.log(change);
//         if (change.type === "added") {
//           let data = change.doc.data();
//           rtcPeerConnection.addIceCandidate(new RTCIceCandidate(data));
//         }
//       });
//     });
//   }

//   async function onHangupButtonClick() {
//     rtcPeerConnection.close();

//     if (roomId) {
//       // Delete all documents about this session
//       let callDocument = firestoreDb.collection("calls").doc(roomId);
//       await callDocument
//         .collection("answerCandidates")
//         .get()
//         .then((querySnapshot) => {
//           querySnapshot.forEach((doc) => {
//             doc.ref.delete();
//           });
//         });
//       await callDocument
//         .collection("offerCandidates")
//         .get()
//         .then((querySnapshot) => {
//           querySnapshot.forEach((doc) => {
//             doc.ref.delete();
//           });
//         });
//       await callDocument.delete();
//     }

//     window.location.reload();
//   };


//   return (
//     <>
//       {/* <h2>1. Start your Webcam</h2> */}
//       <div className="videos">
//         <span>
//           <h3>Local Stream</h3>
//           {/* <video className="webcamVideo" autoPlay playsInline ref={webcamVideoRef}></video> */}
//           <video width="800" height="600" controls ref={localVideoRef}>
//             <source src={video} type="video/mp4" />
//             Your browser doesn't support video tag
//           </video>
//         </span>
//         <span>
//           <h3>Remote Stream</h3>
//           <video className="remoteVideo" autoPlay playsInline ref={remoteVideoRef}></video>
//         </span>
//       </div>
//       <button className="webcamButton" onClick={onWebcamButtonClick} ref={webcamButtonRef}>Start webcam</button>

//       <h2>2. Create a new Call</h2>
//       <button className="callButton" onClick={onCallButtonClick} ref={callButtonRef}>Create Call (offer)</button> {/* FIXME: If i use disabled attribute here, it won't go into event handler even if its enabled in code */}
//       {/* States? */}
//       <h2>3. Join a Call</h2>
//       <p>Answer the call from a different browser window or device</p>

//       <input className="callInput" ref={callInputRef} />
//       <button className="answerButton" onClick={onAnswerButtonClick} ref={answerButtonRef}>Answer</button>

//       <h2>4. Hangup</h2>

//       <button className="hangupButton" onClick={onHangupButtonClick} ref={hangupButtonRef}>Hangup</button>
//     </>
//   )
// }


export default function Home() {

  return (
    <div className="home-page">
      <div className="bubbles">
        <div className="create-bubble">
          <Link to="/creator" className="btn-create-room">Create room</Link>
        </div>
        <div className="join-bubble">
          <div classname="div-input-roomID">
            <p>Room ID:</p>
            <input type="text" className="input-roomID"></input>
          </div>
          <Link to="/participant" className="btn-join-room">Join room</Link>
        </div>
      </div>
    </div>
  );
}
