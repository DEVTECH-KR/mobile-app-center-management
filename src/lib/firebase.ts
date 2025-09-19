
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-5850099320-b46d2",
  "appId": "1:539253016026:web:9d377e7e3275b8e2e12ce3",
  "apiKey": "AIzaSyDJ0I0Z3biGynPucankJ1lW-oLGbfvcCpw",
  "authDomain": "studio-5850099320-b46d2.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "539253016026"
};


// Initialize Firebase for SSR
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
