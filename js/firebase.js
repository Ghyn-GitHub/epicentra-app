import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBqrIxev-IawZc9qzpsPF0zAKWZVqVQ9yQ",
    authDomain: "epicentra-app.firebaseapp.com",
    projectId: "epicentra-app",
    storageBucket: "epicentra-app.firebasestorage.app",
    messagingSenderId: "925979164613",
    appId: "1:925979164613:web:b4de5db703de4c52d515ac"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);