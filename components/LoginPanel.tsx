
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError, signOut, UserCredential } from 'firebase/auth';
import Button from './Button';
import Input from './Input';
import { UserType, LoginPanelProps, AppUser } from '../types';
import { auth } from '../services/firebaseService';
import { createUserProfile, getUserProfile } from '../services/supabaseService';

const LoginPanel: React.FC<LoginPanelProps> = ({ userType, onLoginSuccess, onLoginError, initialIsSignUp = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);

  useEffect(() => {
    // Reset state if the initial mode changes (e.g., modal is re-opened for a different purpose)
    setIsSignUp(initialIsSignUp);
    setErrorMessage('');
  }, [initialIsSignUp, userType]);


  const isCandidateLogin = userType === UserType.CANDIDATE;

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
        // Special "upsert" logic for the admin user to ensure they can always get in.
        if (email === 'rkrohit19kumar@gmail.com') {
          try {
            // First, try to sign in
            userCredential = await signInWithEmailAndPassword(auth, email, password);
          } catch (signInError: any) {
            // If sign-in fails (e.g., user not found), try to create the user automatically.
            // This makes the admin account creation seamless.
            if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
              try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Create profile for the new admin user with default details
                await createUserProfile(user.uid, user.email!, UserType.ADMIN, 'Rohit Kumar', '0000000000');
              } catch (signUpError: any) {
                // If sign-up also fails, it's likely because the email exists but the password was wrong.
                throw new Error('Invalid email or password.');
              }
            } else {
              // Re-throw other unexpected sign-in errors
              throw signInError;
            }
          }
        } else {
          // Normal sign-in for all other users
          userCredential = await signInWithEmailAndPassword(auth, email, password);
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
            // Partner Panel allows: Partner and Store Supervisor
            (userType === UserType.PARTNER && [UserType.PARTNER, UserType.STORE_SUPERVISOR].includes(effectiveUserType));

        if (!isAllowed) {
          await signOut(auth);
          throw new Error(`This account is a ${effectiveUserType.toLowerCase()}. Please use the correct login panel.`);
        }
        
        const appUser: AppUser = {
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
      } else if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      }
      setErrorMessage(friendlyMessage);
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
        <Input id="email" label="Email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
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
      {isCandidateLogin && (
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
