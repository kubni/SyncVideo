import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const firebaseConfig = {
  // YOUR FIREBASE API CONFIG GOES HERE
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export default db;
