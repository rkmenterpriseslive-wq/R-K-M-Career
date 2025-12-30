
import React, { useState, useEffect } from 'react';
import Button from '../Button';
import Input from '../Input';
import { updateUserProfile, getUserProfile } from '../../services/firestoreService'; // Corrected import
import { AppUser } from '../../types';
import { usePopup } from '../../contexts/PopupContext';

interface MyProfileViewProps {
    onProfileComplete?: () => void;
    currentUser: AppUser | null;
}

const MyProfileView: React.FC<MyProfileViewProps> = ({ onProfileComplete, currentUser }) => {
    const [profile, setProfile] = useState({
        // Personal
        fullName: '',
        email: '',
        phone: '',
        gender: '',
        city: '',
        state: '',
        // Professional
        currentRole: '',
        company: '',
        lastSalary: '',
        experienceYears: '0',
        experienceMonths: '0',
        skills: '',
        // Educational
        highestQualification: '',
        university: '',
        graduationYear: '',
    });
    const [loading, setLoading] = useState(false);
    const { showPopup } = usePopup();

    useEffect(() => {
        const fetchAndSetProfile = async () => {
            if (currentUser?.uid) {
                const fetchedProfile = await getUserProfile(currentUser.uid);
                if (fetchedProfile) {
                    const exp = fetchedProfile.totalExperience || '';
                    const yearsMatch = exp.match(/(\d+)\s*Years/);
                    const monthsMatch = exp.match(/(\d+)\s*Months/);

                    setProfile(prev => ({
                        ...prev,
                        fullName: fetchedProfile.fullName || '',
                        email: fetchedProfile.email || '',
                        phone: fetchedProfile.phone || '',
                        gender: fetchedProfile.gender || '',
                        city: fetchedProfile.city || '',
                        state: fetchedProfile.state || '',
                        currentRole: fetchedProfile.currentRole || '',
                        company: fetchedProfile.company || '',
                        lastSalary: fetchedProfile.lastSalary || '',
                        skills: fetchedProfile.skills || '',
                        highestQualification: fetchedProfile.highestQualification || '',
                        university: fetchedProfile.university || '',
                        graduationYear: fetchedProfile.graduationYear || '',
                        experienceYears: yearsMatch ? yearsMatch[1] : '0',
                        experienceMonths: monthsMatch ? monthsMatch[1] : '0',
                    }));
                }
            }
        };
        fetchAndSetProfile();
    }, [currentUser]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        try {
            const isFirstTimeCompletion = !currentUser.profile_complete;

            // Destructure to remove form-specific fields before saving
            const { experienceYears, experienceMonths, ...restOfProfile } = profile;

            const profileData = {
                ...restOfProfile,
                totalExperience: `${experienceYears} Years ${experienceMonths} Months`,
                profile_complete: true,
            };

            await updateUserProfile(currentUser.uid, profileData);
            showPopup({ type: 'success', title: 'Success!', message: 'Your profile has been saved successfully.' });
            
            if (isFirstTimeCompletion && onProfileComplete) {
                onProfileComplete();
            }

        } catch(error) {
            showPopup({ type: 'error', title: 'Save Failed', message: 'Failed to save profile. Please try again.' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    const isProfileComplete = currentUser?.profile_complete ?? false;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const yearOptions = Array.from({ length: 31 }, (_, i) => i);
    const monthOptions = Array.from({ length: 12 }, (_, i) => i);

    const qualifications = [
        '10th Pass',
        '12th Pass',
        'Diploma',
        'Graduate',
        'Post Graduate',
        'Ph.D.',
        'Other'
    ];

    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">
                {isProfileComplete ? 'My Profile' : 'Complete Your Profile'}
            </h2>
            <p className="text-gray-600">
                {isProfileComplete 
                    ? 'Keep your profile updated to get the best job recommendations.'
                    : 'Please fill in your details below to get started and unlock job applications.'
                }
            </p>

            <form onSubmit={handleSave} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">
                {/* Personal Details */}
                <fieldset>
                    <legend className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">Personal Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="fullName" name="fullName" label="Full Name" value={profile.fullName} onChange={handleChange} required />
                        <Input id="email" name="email" label="Email Address" type="email" value={profile.email} onChange={handleChange} disabled />
                        <Input id="phone" name="phone" label="Phone Number" type="tel" value={profile.phone} onChange={handleChange} required />
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select id="gender" name="gender" value={profile.gender} onChange={handleChange} className={selectStyles} required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <Input id="city" name="city" label="City" value={profile.city} onChange={handleChange} required />
                        <Input id="state" name="state" label="State" value={profile.state} onChange={handleChange} required />
                    </div>
                </fieldset>

                {/* Professional Details */}
                <fieldset>
                    <legend className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">Professional Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="currentRole" name="currentRole" label="Current/Last Role" value={profile.currentRole} onChange={handleChange} />
                        <Input id="company" name="company" label="Current/Last Company" value={profile.company} onChange={handleChange} />
                        
                        <Input id="lastSalary" name="lastSalary" label="Last Salary (Monthly In-hand)" type="text" placeholder="e.g., 25000" value={profile.lastSalary} onChange={handleChange} />

                        <div>
                            <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-1">Total Experience</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <select id="experienceYears" name="experienceYears" value={profile.experienceYears} onChange={handleChange} className={selectStyles}>
                                        {yearOptions.map(year => <option key={year} value={year}>{year} Years</option>)}
                                    </select>
                                </div>
                                <div>
                                    <select id="experienceMonths" name="experienceMonths" value={profile.experienceMonths} onChange={handleChange} className={selectStyles}>
                                        {monthOptions.map(month => <option key={month} value={month}>{month} Months</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                            <Input id="skills" name="skills" label="Key Skills (comma-separated)" value={profile.skills} onChange={handleChange} required />
                        </div>
                    </div>
                </fieldset>

                {/* Educational Details */}
                <fieldset>
                    <legend className="text-lg font-semibold text-gray-800 pb-2 border-b mb-4">Educational Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="highestQualification" className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
                            <select id="highestQualification" name="highestQualification" value={profile.highestQualification} onChange={handleChange} className={selectStyles} required>
                                <option value="" disabled>Select Qualification</option>
                                {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        </div>
                        <Input id="university" name="university" label="University / College" value={profile.university} onChange={handleChange} required />
                        <Input id="graduationYear" name="graduationYear" label="Year of Graduation" value={profile.graduationYear} onChange={handleChange} required />
                    </div>
                </fieldset>
                
                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" loading={loading}>
                         {isProfileComplete ? 'Save Changes' : 'Save and Continue'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default MyProfileView;
