import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyDhknwOQi9n5UMfry8xXesTnoRWhs04yOQ",

  authDomain: "skyswift-b4f4a.firebaseapp.com",

  projectId: "skyswift-b4f4a",

  storageBucket: "skyswift-b4f4a.firebasestorage.app",

  messagingSenderId: "393726164124",

  appId: "1:393726164124:web:9575f8d7f765bf28024159",

  measurementId: "G-4R10K8PTC2"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };