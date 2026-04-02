import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyALOrJn9Kazsw4drxtZI_z4kguJ3SeASEM",
  authDomain:        "base-87b0b.firebaseapp.com",
  projectId:         "base-87b0b",
  storageBucket:     "base-87b0b.firebasestorage.app",
  messagingSenderId: "338226046059",
  appId:             "1:338226046059:web:a7f2576b22080ec45e3d2e"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

window.db   = db;
window.auth = auth;
console.log("🔥 Firebase + Firestore + Auth listo");