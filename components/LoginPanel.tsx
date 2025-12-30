
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError, signOut, UserCredential } from 'firebase/auth';
import Button from './Button';
import Input from './Input';
import { UserType, LoginPanelProps, AppUser } from '../types';
import { auth } from '../services/firebaseService';
import { createUserProfile, getUserProfile, findUserByPhone } from '../services/firestoreService';
import { usePopup } from '../contexts/PopupContext';

const LoginPanel: React.FC<LoginPanelProps> = ({ userType, onLoginSuccess, onLoginError, initialIsSignUp = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const { showPopup } = usePopup();

  useEffect(() => {
    // Reset state if the initial mode changes (e.g., modal is re-opened for a different purpose)
    setIsSignUp(initialIsSignUp);
    setErrorMessage('');
  }, [initialIsSignUp, userType]);


  const canSignUp = [UserType.CANDIDATE, UserType.PARTNER, UserType.TEAM].includes(userType);
  const isHybridLogin = [UserType.CANDIDATE, UserType.PARTNER, UserType.TEAM].includes(userType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      let userCredential: UserCredential;
      if (isSignUp) {
        if (!fullName || !phoneNumber) {
          throw new Error('Please fill all required fields for sign up.');
        }
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // If the user is the special admin, always create an ADMIN profile
        const finalUserType = user.email === 'rkrohit19kumar@gmail.com' ? UserType.ADMIN : userType;

        await createUserProfile(user.uid, user.email!, finalUserType, fullName, phoneNumber);
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          userType: finalUserType,
        };
        onLoginSuccess(appUser);
      } else { // Sign in
        let loginEmail = email; // 'email' state holds the identifier

        if (isHybridLogin && !email.includes('@')) {
            // It's not an email, assume it's a phone number
            const userProfile = await findUserByPhone(email);
            if (userProfile?.email) {
                loginEmail = userProfile.email;
            } else {
                throw new Error("No account found with this mobile number. Please sign up or log in with your email.");
            }
        }

        // Special "upsert" logic for the admin user to ensure they can always get in.
        if (loginEmail === 'rkrohit19kumar@gmail.com') {
          try {
            // First, try to sign in
            userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
          } catch (signInError: any) {
            // If sign-in fails (e.g., user not found or wrong pass), try to create the user.
            // This makes the admin account creation seamless on first run.
            if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
              try {
                userCredential = await createUserWithEmailAndPassword(auth, loginEmail, password);
                const user = userCredential.user;
                // Create profile for the new admin user with default details
                await createUserProfile(user.uid, user.email!, UserType.ADMIN, 'Rohit Kumar', '0000000000');
              } catch (signUpError: any) {
                // If sign-up fails, it's most likely because the email already exists.
                // This implies the initial sign-in error was due to a wrong password.
                // In this case, we throw the standard "Invalid credentials" error.
                if (signUpError.code === 'auth/email-already-in-use') {
                    throw new Error('Invalid credentials.');
                }
                // For other unexpected sign-up errors, re-throw them for debugging.
                throw signUpError;
              }
            } else {
              // Re-throw other unexpected sign-in errors
              throw signInError;
            }
          }
        } else {
          // Normal sign-in for all other users
          userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
        }

        const user = userCredential.user;
        let profile = await getUserProfile(user.uid);

        // If profile is missing (e.g., failed write after signup), create it on-the-fly for the admin.
        if (!profile && user.email === 'rkrohit19kumar@gmail.com') {
          await createUserProfile(user.uid, user.email, UserType.ADMIN, 'Rohit Kumar', '0000000000');
          profile = await getUserProfile(user.uid); // Re-fetch profile
        }

        if (!profile) {
          await signOut(auth);
          throw new Error("User profile not found. Please contact support.");
        }

        // Determine the effective user type, prioritizing the hardcoded admin email
        const effectiveUserType = user.email === 'rkrohit19kumar@gmail.com' ? UserType.ADMIN : profile.userType;

        // Check if the user is allowed to login via the requested panel (userType)
        // This allows hierarchy mapping (e.g. HR can login via Team Login)
        const isAllowed = 
            effectiveUserType === userType ||
            // Team Panel allows: Admin, HR, Team Lead, Team, and Store Supervisor
            (userType === UserType.TEAM && [UserType.ADMIN, UserType.HR, UserType.TEAMLEAD, UserType.TEAM, UserType.STORE_SUPERVISOR].includes(effectiveUserType)) ||
            // Partner Panel allows: Partner and Store Supervisor users
            (userType === UserType.PARTNER && [UserType.PARTNER, UserType.STORE_SUPERVISOR].includes(effectiveUserType));

        if (!isAllowed) {
          await signOut(auth);
          throw new Error(`This account is a ${effectiveUserType.toLowerCase()}. Please use the correct login panel.`);
        }
        
        const appUser: AppUser = {
          ...profile,
          uid: user.uid,
          email: user.email,
          userType: effectiveUserType,
        };
        onLoginSuccess(appUser);
      }
    } catch (err: any) {
      const authError = err as AuthError;
      let friendlyMessage = err.message || 'Authentication failed.';
      if (authError.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists. Please Sign In.';
      } else if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || err.message === 'Invalid credentials.' || err.message.includes('No account found')) {
        friendlyMessage = err.message.includes('No account found') ? err.message : 'Invalid credentials.';
      }
      showPopup({ type: 'error', title: 'Login Failed', message: friendlyMessage });
      onLoginError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <Input id="name" label="Full Name" type="text" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            <Input id="phone" label="Phone" type="tel" autoComplete="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
          </>
        )}
        <Input 
          id="email" 
          label={!isSignUp && isHybridLogin ? "Email or Mobile Number" : "Email"} 
          type="text"
          autoComplete="username" 
          value={email} onChange={e => setEmail(e.target.value)} 
          required 
        />
        <Input 
          id="password" 
          label="Password"
          type="password" 
          autoComplete={isSignUp ? "new-password" : "current-password"} 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        
        {errorMessage && <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">{errorMessage}</div>}
        <Button type="submit" className="w-full justify-center" loading={loading}>{isSignUp ? 'Create Account' : 'Sign In'}</Button>
      </form>
      {canSignUp && (
        <div className="text-center mt-4">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      )}
    </div>
  );
};
export default LoginPanel;
