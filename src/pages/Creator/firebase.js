// TODO: Upgrade to Firestore Web version 9

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { getDocs } from "firebase/firestore"; // TODO: This is from v9, update others too.
const firebaseConfig = {
  apiKey: `${process.env.REACT_APP_API_KEY}`,
  authDomain: `${process.env.REACT_APP_AUTH_DOMAIN}`,
  projectId: `${process.env.REACT_APP_PROJECT_ID}`,
  storageBucket: `${process.env.REACT_APP_STORAGE_BUCKET}`,
  messagingSenderId: `${process.env.REACT_APP_MESSAGING_SENDER_ID}`,
  appId: `${process.env.REACT_APP_APP_ID}`
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


async function insertUserIntoDb(username, role, roomID) {
  // Inserts an user into document that is unique for each room
  let onlineUsersDocument = db.collection("onlineUsers").doc(roomID);
  let targetCollection = "";

  role === "host" ? targetCollection = "host" : targetCollection = "participants";

  /* TODO: Maybe a custom ID (possibly username acting as the ID?)
    Possible problem with that: If 2 users pick the same username, the first one will be overwritten.
    Possible solution: Check for duplicate names and make the user pick another.*/
  /* FIXME: Currently, identical usernames are allowed since the actual documents are saved under randomly generated unique ids and there are no additional checks. */
  onlineUsersDocument.collection(targetCollection).add({
    username: username,
    role: role
  })
    .then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    })
}

async function getHostFromDb(roomID) {
  // We need a wrapper in order to not mess up the order of promises and the standard return
  const onlineUsersDocument = db.collection("onlineUsers").doc(roomID);
  const hostCollection = onlineUsersDocument.collection("host");

  let host = {
    username: "",
    role: "host"
  }
  const querySnapshot = await getDocs(hostCollection);
  querySnapshot.forEach((doc) => {
    host.username = doc.data().username;
  })

  return host;
}



export {
  db,
  insertUserIntoDb,
  getHostFromDb
}
