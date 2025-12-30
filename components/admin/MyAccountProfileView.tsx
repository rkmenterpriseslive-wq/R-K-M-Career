

import React, { useState, useEffect, useMemo } from 'react';
import Button from '../Button';
import Input from '../Input';
import { AppUser, UserType, Vendor, TeamMemberPerformance } from '../../types';
import { usePopup } from '../../contexts/PopupContext';

interface MyAccountProfileViewProps {
    currentUser: AppUser | null;
    userType: UserType;
    onUpdateProfile: (data: Partial<AppUser>) => Promise<void>;
    onChangePassword: (currentPass: string, newPass: string) => Promise<void>;
    onUpdateProfilePicture: (base64Image: string) => Promise<void>;
    vendors: Vendor[];
    teamMembers: TeamMemberPerformance[];
}

const MyAccountProfileView: React.FC<MyAccountProfileViewProps> = ({
    currentUser,
    userType,
    onUpdateProfile,
    onChangePassword,
    onUpdateProfilePicture,
    vendors,
    teamMembers,
}) => {
    const { showPopup } = usePopup();

    const [profileFormData, setProfileFormData] = useState<Partial<AppUser>>({
        fullName: currentUser?.fullName || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
    });
    const [passwordFormData, setPasswordFormData] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [loadingProfileSave, setLoadingProfileSave] = useState(false);
    const [loadingPasswordChange, setLoadingPasswordChange] = useState(false);
    const [loadingPhotoUpload, setLoadingPhotoUpload] = useState(false);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(currentUser?.profilePictureUrl || null);

    useEffect(() => {
        if (currentUser) {
            setProfileFormData({
                fullName: currentUser.fullName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
            });
            setProfilePicturePreview(currentUser.profilePictureUrl || null);
        }
    }, [currentUser]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
    };

    const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingProfileSave(true);
        try {
            await onUpdateProfile(profileFormData);
            showPopup({ type: 'success', title: 'Profile Updated', message: 'Your personal information has been saved successfully.' });
        } catch (error: any) {
            console.error("Error saving profile:", error);
            showPopup({ type: 'error', title: 'Update Failed', message: error.message || 'Failed to update profile.' });
        } finally {
            setLoadingProfileSave(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordFormData.new !== passwordFormData.confirm) {
            showPopup({ type: 'error', title: 'Password Mismatch', message: 'New passwords do not match.' });
            return;
        }
        if (passwordFormData.new.length < 6) {
            showPopup({ type: 'error', title: 'Invalid Password', message: 'New password must be at least 6 characters long.' });
            return;
        }
        setLoadingPasswordChange(true);
        try {
            await onChangePassword(passwordFormData.current, passwordFormData.new);
            showPopup({ type: 'success', title: 'Password Changed', message: 'Your password has been updated successfully.' });
            setPasswordFormData({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error("Error changing password:", error);
            showPopup({ type: 'error', title: 'Password Change Failed', message: error.message || 'Failed to change password.' });
        } finally {
            setLoadingPasswordChange(false);
        }
    };

    const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showPopup({ type: 'error', title: 'Invalid File', message: 'Please upload an image file.' });
                return;
            }
            setProfilePictureFile(file);
            setProfilePicturePreview(URL.createObjectURL(file));
        } else {
            setProfilePictureFile(null);
            setProfilePicturePreview(currentUser?.profilePictureUrl || null);
        }
    };

    const handlePhotoUpload = async () => {
        if (!profilePictureFile) {
            showPopup({ type: 'info', title: 'No File Selected', message: 'Please select a photo to upload.' });
            return;
        }
        setLoadingPhotoUpload(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(profilePictureFile);
            reader.onloadend = async () => {
                await onUpdateProfilePicture(reader.result as string);
                showPopup({ type: 'success', title: 'Photo Updated', message: 'Your profile photo has been updated.' });
                setProfilePictureFile(null);
            };
            reader.onerror = () => {
                throw new Error('Failed to read file.');
            };
        } catch (error: any) {
            console.error("Error uploading photo:", error);
            showPopup({ type: 'error', title: 'Upload Failed', message: error.message || 'Failed to upload photo.' });
        } finally {
            setLoadingPhotoUpload(false);
        }
    };

    const initial = profileFormData.fullName ? profileFormData.fullName.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || 'U');

    const reportingManagerInfo = useMemo(() => {
        if (!currentUser?.reportingManager) return { name: 'N/A', initial: 'N' };
        const manager = teamMembers.find(m => m.id === currentUser.reportingManager || m.fullName === currentUser.reportingManager);
        const name = manager?.fullName || currentUser.reportingManager;
        return {
            name: name,
            initial: name.charAt(0).toUpperCase() || 'M'
        };
    }, [currentUser, teamMembers]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
                {/* Left Column: Avatar & Professional Info */}
                <div className="md:col-span-1 flex flex-col items-center pt-12 px-8 border-b md:border-b-0 md:border-r border-gray-200">
                    <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-6xl font-bold border-4 border-white shadow-md mb-6 overflow-hidden">
                        {profilePicturePreview ? (
                            <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span>{initial}</span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center">{profileFormData.fullName || 'User Name'}</h3>
                    <p className="text-gray-500 capitalize mb-6 text-center">{userType.toLowerCase()}</p>
                    
                    <input type="file" accept="image/*" onChange={handlePhotoFileChange} id="profile-photo-upload" className="hidden" />
                    <label htmlFor="profile-photo-upload" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors text-sm cursor-pointer inline-flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Change Photo
                    </label>
                    {profilePictureFile && (
                         <Button variant="primary" size="sm" onClick={handlePhotoUpload} loading={loadingPhotoUpload} className="mt-2 w-auto">Upload Photo</Button>
                    )}

                    <div className="mt-8 w-full">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Professional Information</h4>
                        <div className="space-y-4 text-sm">
                            {/* Reporting Manager */}
                            <div>
                                <p className="font-medium text-gray-600 mb-1">Reporting Manager</p>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                                        {reportingManagerInfo.initial}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-gray-900 font-semibold">{reportingManagerInfo.name}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Working Locations */}
                            <div>
                                <p className="font-medium text-gray-600 mb-2">Working Locations</p>
                                <div className="flex flex-wrap gap-2">
                                    {currentUser?.workingLocations && currentUser.workingLocations.length > 0 ? (
                                        currentUser.workingLocations.map(loc => (
                                            <span key={loc} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
                                                {loc}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 italic text-xs">N/A</span>
                                    )}
                                </div>
                            </div>
                            {/* Assigned Vendor Processes */}
                            <div>
                                <p className="font-medium text-gray-600 mb-2">Assigned Vendor Processes</p>
                                <div className="flex flex-wrap gap-2">
                                    {currentUser?.assignedPartners && currentUser.assignedPartners.length > 0 ? (
                                        currentUser.assignedPartners.map(partner => (
                                            <span key={partner} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
                                                {partner}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 italic text-xs">N/A</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className="md:col-span-2 p-8 space-y-10">
                    {/* Personal Information */}
                    <form onSubmit={handleProfileSave} className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                        <div className="space-y-4">
                            <Input
                                id="fullName"
                                name="fullName"
                                label="Full Name"
                                value={profileFormData.fullName || ''}
                                onChange={handleProfileChange}
                                required
                                wrapperClassName="mb-0"
                            />
                            <Input
                                id="email"
                                name="email"
                                label="Email Address"
                                type="email"
                                value={profileFormData.email || ''}
                                onChange={handleProfileChange}
                                disabled
                                className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                wrapperClassName="mb-0"
                            />
                            <Input
                                id="phone"
                                name="phone"
                                label="Phone Number"
                                type="tel"
                                value={profileFormData.phone || ''}
                                onChange={handleProfileChange}
                                required
                                wrapperClassName="mb-0"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={loadingProfileSave}>Save Changes</Button>
                        </div>
                    </form>

                    <div className="border-t border-gray-100"></div>

                    {/* Change Password */}
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                        <div className="space-y-4">
                            <Input
                                id="currentPassword"
                                name="current"
                                label="Current Password"
                                type="password"
                                value={passwordFormData.current}
                                onChange={handlePasswordChangeInput}
                                required
                                wrapperClassName="mb-0"
                            />
                            <Input
                                id="newPassword"
                                name="new"
                                label="New Password"
                                type="password"
                                value={passwordFormData.new}
                                onChange={handlePasswordChangeInput}
                                required
                                wrapperClassName="mb-0"
                            />
                            <Input
                                id="confirmPassword"
                                name="confirm"
                                label="Confirm New Password"
                                type="password"
                                value={passwordFormData.confirm}
                                onChange={handlePasswordChangeInput}
                                required
                                wrapperClassName="mb-0"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={loadingPasswordChange}>Change Password</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyAccountProfileView;
