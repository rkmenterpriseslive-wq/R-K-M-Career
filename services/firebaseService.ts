
// services/firebaseService.ts
import { initializeApp, deleteApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDjT48npeCVMoaX-d4qAiJlGl5P7x-aph0",
  authDomain: "team-tracker-316ac.firebaseapp.com",
  databaseURL: "https://team-tracker-316ac-default-rtdb.firebaseio.com",
  projectId: "team-tracker-316ac",
  storageBucket: "team-tracker-316ac.firebasestorage.app",
  messagingSenderId: "544539621042",
  appId: "1:544539621042:web:75559c376a3aecdbbc3bab",
  measurementId: "G-N0XZS5Y2SV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Helper to create a secondary user (for admin actions) without logging out
// This removes duplicate logic from AdminDashboardContent, VendorDirectoryView, and PartnerManageSupervisorsView
export const createSecondaryUser = async (email: string, password: string, profileData: any): Promise<boolean> => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb = getDatabase(secondaryApp);

    try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCred.user.uid;
        await set(ref(secondaryDb, `users/${uid}`), profileData);
        await signOut(secondaryAuth);
        return true;
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.warn(`User ${email} already exists. Profile update skipped.`);
            return true; // Treat as success to proceed flow
        }
        console.error("Error creating secondary user:", error);
        throw error;
    } finally {
        await deleteApp(secondaryApp);
    }
};
