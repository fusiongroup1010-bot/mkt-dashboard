import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBlzsTxgycUTpGc49Sd0_dD1TndDv0f6yA",
    authDomain: "formula-app-513ee.firebaseapp.com",
    projectId: "formula-app-513ee",
    storageBucket: "formula-app-513ee.firebasestorage.app",
    messagingSenderId: "516673711872",
    appId: "1:516673711872:web:fb435b0f63ad80b76e4de5",
    measurementId: "G-RW71LVQ8SY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
    try {
        console.log("Testing read...");
        const querySnapshot = await getDocs(collection(db, "deadline_items_ceo"));
        console.log("Read success. Found", querySnapshot.docs.length, "documents.");
        
        console.log("Testing write...");
        await setDoc(doc(db, "deadline_items_ceo", "test-doc"), { test: true });
        console.log("Write success.");
    } catch (e) {
        console.error("Firebase Error:");
        console.error(e.message);
    }
}

testFirebase();
