
// services/firebaseService.ts
import { initializeApp, deleteApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database"; // Keep for potential RTDB usage or clean up if no longer needed
import { getAuth, createUserWithEmailAndPassword, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, AuthCredential } from 'firebase/auth'; // Added reauthenticateWithCredential, EmailAuthProvider, updatePassword
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Import Firestore functions

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDZDbq6-3ZKdSxrfPnfvMFqpU5CnMLFU1U",
  authDomain: "primehire-1e546.firebaseapp.com",
  databaseURL: "https://primehire-1e546-default-rtdb.firebaseio.com",
  projectId: "primehire-1e546",
  storageBucket: "primehire-1e546.firebasestorage.app",
  messagingSenderId: "906098899384",
  appId: "1:906098899384:web:3c24764fb21d093a25b74d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); // Realtime Database instance
export const auth = getAuth(app); // Auth instance
export const firestoreDb = getFirestore(app); // Firestore instance

// Helper to create a secondary user (for admin actions) without logging out
// This removes duplicate logic from AdminDashboardContent, VendorDirectoryView, and PartnerManageSupervisorsView
export const createSecondaryUser = async (email: string, password: string, profileData: any): Promise<boolean> => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryFirestoreDb = getFirestore(secondaryApp); // Get Firestore for secondary app

    try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCred.user.uid;
        await setDoc(doc(secondaryFirestoreDb, `users`, uid), profileData); // Use Firestore setDoc
        await signOut(secondaryAuth);
        return true;
    } catch (error: any) {
        // Re-throw all errors to be handled by the caller. This allows for specific error handling (e.g., email already in use).
        console.error("Error creating secondary user:", error);
        throw error;
    } finally {
        await deleteApp(secondaryApp);
    }
};

/**
 * Creates a new Firebase Auth user and their corresponding Firestore user profile.
 * Specifically for candidates added via Daily Lineups.
 * Throws errors on failure (e.g., email already in use).
 * @param email The candidate's email.
 * @param password The default password to set.
 * @param profileData The data for the user's profile in the 'users' collection.
 * @returns The UID of the newly created user.
 */
export const createCandidateAuthUser = async (email: string, password: string, profileData: any): Promise<string> => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryFirestoreDb = getFirestore(secondaryApp);

    try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCred.user.uid;
        // Create the user profile in the 'users' collection
        await setDoc(doc(secondaryFirestoreDb, `users`, uid), profileData);
        await signOut(secondaryAuth);
        return uid;
    } catch (error: any) {
        console.error("Error creating candidate auth user:", error);
        // Re-throw to be handled by the calling service
        throw error;
    } finally {
        await deleteApp(secondaryApp);
    }
};

/**
 * Re-authenticates the current user and updates their password.
 * @param currentPassword The user's current password.
 * @param newPassword The new password to set.
 */
export const updateCurrentUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error('No user is currently logged in or user has no email.');
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        // Cast `credential` to `AuthCredential` to satisfy TypeScript, as `reauthenticateWithCredential` expects it.
        await reauthenticateWithCredential(user, credential as AuthCredential);
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Error changing password:", error);
        if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect current password.');
        } else if (error.code === 'auth/requires-recent-login') {
            // This happens if the user hasn't signed in recently
            throw new Error('Please log out and log in again to change your password due to security reasons.');
        }
        throw error;
    }
};
