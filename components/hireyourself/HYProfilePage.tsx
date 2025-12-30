
import React from 'react';
import { AppUser, UserType } from '../../types';
import MyAccountProfileView from '../admin/MyAccountProfileView';
import { updateUserProfile } from '../../services/firestoreService';
import { updateCurrentUserPassword } from '../../services/firebaseService';

interface HYProfilePageProps {
    currentUser: AppUser | null;
}

const HYProfilePage: React.FC<HYProfilePageProps> = ({ currentUser }) => {
    // These functions can be defined here, calling services directly,
    // to avoid prop drilling from App.tsx
    const handleUpdateProfile = async (data: Partial<AppUser>) => {
        if (!currentUser?.uid) throw new Error('User not authenticated.');
        await updateUserProfile(currentUser.uid, data);
    };

    const handleChangePassword = async (currentPass: string, newPass: string) => {
        await updateCurrentUserPassword(currentPass, newPass);
    };

    const handleUpdateProfilePicture = async (base64Image: string) => {
        if (!currentUser?.uid) throw new Error('User not authenticated.');
        await updateUserProfile(currentUser.uid, { profilePictureUrl: base64Image });
    };

    return (
        <MyAccountProfileView
            currentUser={currentUser}
            userType={UserType.TEAM} // This is the "Hire Yourself" user type
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onUpdateProfilePicture={handleUpdateProfilePicture}
            vendors={[]} // Not needed for this view
            teamMembers={[]} // Not needed for this view
        />
    );
};

export default HYProfilePage;
