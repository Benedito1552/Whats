// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC0dUhymi72gkug-oo0-xqqBEtgvlIgvY0",
    authDomain: "cursos-6f950.firebaseapp.com",
    projectId: "cursos-6f950",
    storageBucket: "cursos-6f950.firebasestorage.app",
    messagingSenderId: "146131122545",
    appId: "1:146131122545:web:043f8207f457ad5b7f5ed0"
  };
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
