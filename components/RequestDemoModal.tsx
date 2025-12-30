
import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { createDemoRequest } from '../services/firestoreService';
import { usePopup } from '../contexts/PopupContext';
import { createSecondaryUser } from '../services/firebaseService';
import { UserType } from '../types';

interface RequestDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PersonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;


const RequestDemoModal: React.FC<RequestDemoModalProps> = ({ isOpen, onClose }) => {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [teamHead, setTeamHead] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [loading, setLoading] = useState(false);
    const { showPopup } = usePopup();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (teamSize === 'Hire Yourself') {
                // New signup logic
                await createSecondaryUser(email, "password", {
                    email: email,
                    userType: UserType.TEAM,
                    fullName: companyName,
                    phone: mobileNo,
                    profile_complete: true, // They are considered a company, not a candidate
                });
                showPopup({
                    type: 'success',
                    title: 'Account Created!',
                    message: `Your account has been created. Log in via "Partner / Staff Login" with your email and the default password "password". You can change your password in your profile settings.`
                });
            } else {
                // Existing "Hire Us" logic
                await createDemoRequest({
                    companyName,
                    email,
                    mobileNo,
                    teamHead,
                    teamSize,
                });
                showPopup({ type: 'success', title: 'Request Sent!', message: 'Our team will get in touch with you shortly.' });
            }
            
            onClose();
            // Reset form
            setCompanyName('');
            setEmail('');
            setMobileNo('');
            setTeamHead('');
            setTeamSize('');
        } catch (error: any) {
            console.error("Failed to submit demo request/signup:", error);
            let message = 'There was an error submitting your request. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'An account with this email already exists. Please log in or use a different email.';
            }
            showPopup({ type: 'error', title: 'Submission Failed', message: message });
        } finally {
            setLoading(false);
        }
    };

    const baseInputStyles = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request a Demo">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="companyName"
                    label="Company Name"
                    icon={<PersonIcon />}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                />
                <Input
                    id="emailId"
                    label="Email ID"
                    type="email"
                    icon={<EmailIcon />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    id="mobileNo"
                    label="Mobile NO"
                    type="tel"
                    icon={<PhoneIcon />}
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    required
                />
                 <Input
                    id="teamHead"
                    label="Name of Team Head"
                    icon={<PersonIcon />}
                    value={teamHead}
                    onChange={(e) => setTeamHead(e.target.value)}
                    required={teamSize !== 'Hire Yourself'} // Not required for signup
                    className={teamSize === 'Hire Yourself' ? 'hidden' : ''}
                    wrapperClassName={teamSize === 'Hire Yourself' ? '!m-0 h-0 invisible' : 'mb-4'}
                />
                <div>
                    <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select
                        id="teamSize"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        className={baseInputStyles}
                        required
                    >
                        <option value="" disabled>Select a service</option>
                        <option value="Hire Us">Hire Us</option>
                        <option value="Hire Yourself">Hire Yourself</option>
                    </select>
                </div>

                <p className="text-xs text-gray-500 pt-2">
                    This trial period will remain active for 7 days from the date of activation.
                </p>

                <div className="pt-4">
                    <Button type="submit" className="w-full justify-center" loading={loading}>
                        Submit Request
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default RequestDemoModal;
