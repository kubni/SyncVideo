import "./creator.css"

import { useEffect, useRef } from "react"


export default function Creator() {

  let inputElement = null;
  // UseEffects
  useEffect(() => {
    inputElement = document.createElement("input"); // TODO: Check this warning
    inputElement.type = "file";

    // Add an event listener for onchange event so we can read the contents of the file
    // TODO: Why does the `change` event even occur?
    // Probably because it was click()-ed
    inputElement.onchange = (event) => {
      const file = event.target.files[0];
      console.log(file);

      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file); // IMPORTANT: Since readAsDataURL doesn't work with large files

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
      }
    }
  }, []);

  // Refs
  const videoFileDialogButtonRef = useRef(null);
  const localVideoRef = useRef(null);
  const localVideoSourceRef = useRef(null);
  // Handlers
  function onVideoFileDialogButtonClick() {
    inputElement.click();
  }


  // JSX
  return (
    <div className="creator-page">
      <p>Hello cruel world</p>
      <div className="div-video-file-dialog">
        <p className="p-video-file-dialog">Select a video (from your PC) that you would like to play: </p>
        <button className="btn-video-file-dialog" onClick={onVideoFileDialogButtonClick} ref={videoFileDialogButtonRef}>Select a video...</button>
      </div>

      <video width="800" height="600" controls ref={localVideoRef}>
        <source src="" ref={localVideoSourceRef}></source>
      </video>
    </div >
  )
}
