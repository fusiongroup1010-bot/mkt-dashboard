import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// MKT Dashboard - Firebase config (independent instance)
const firebaseConfig = {
    apiKey: "AIzaSyBlzsTxgycUTpGc49Sd0_dD1TndDv0f6yA",
    authDomain: "formula-app-513ee.firebaseapp.com",
    projectId: "formula-app-513ee",
    storageBucket: "formula-app-513ee.firebasestorage.app",
    messagingSenderId: "516673711872",
    appId: "1:516673711872:web:fb435b0f63ad80b76e4de5",
    measurementId: "G-RW71LVQ8SY"
};

const app = initializeApp(firebaseConfig, "mkt-dashboard");
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
