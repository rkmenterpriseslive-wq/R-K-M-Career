import React, { useState, useEffect } from 'react';
import Input from '../Input';
import Button from '../Button';
import { ContactConfig, SocialMediaConfig } from '../../types';

interface ContactSocialSettingsViewProps {
    contactInfo: ContactConfig;
    socialMedia: SocialMediaConfig;
    onUpdateSettings: (update: { contactInfo?: ContactConfig; socialMedia?: SocialMediaConfig }) => void;
}

const ContactSocialSettingsView: React.FC<ContactSocialSettingsViewProps> = ({
    contactInfo,
    socialMedia,
    onUpdateSettings,
}) => {
    const [currentContactInfo, setCurrentContactInfo] = useState(contactInfo);
    const [currentSocialMedia, setCurrentSocialMedia] = useState(socialMedia);

    useEffect(() => {
        setCurrentContactInfo(contactInfo);
        setCurrentSocialMedia(socialMedia);
    }, [contactInfo, socialMedia]);

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentContactInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentSocialMedia(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = () => {
        onUpdateSettings({
            contactInfo: currentContactInfo,
            socialMedia: currentSocialMedia,
        });
        alert('Contact & Social Media settings saved!');
    };

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800">Contact Us & Social Media</h3>

            {/* Contact Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="contactEmail" name="email" label="Email Address" type="email" value={currentContactInfo.email} onChange={handleContactChange} required />
                    <Input id="contactPhone" name="phone" label="Phone Number" type="tel" value={currentContactInfo.phone} onChange={handleContactChange} required />
                    <div className="md:col-span-2">
                        <Input id="addressLine1" name="addressLine1" label="Address Line 1" value={currentContactInfo.addressLine1} onChange={handleContactChange} required />
                    </div>
                    <div className="md:col-span-2">
                        <Input id="addressLine2" name="addressLine2" label="Address Line 2 (Optional)" value={currentContactInfo.addressLine2 || ''} onChange={handleContactChange} />
                    </div>
                    <Input id="city" name="city" label="City" value={currentContactInfo.city} onChange={handleContactChange} required />
                    <Input id="state" name="state" label="State" value={currentContactInfo.state} onChange={handleContactChange} required />
                    <Input id="pincode" name="pincode" label="Pincode" value={currentContactInfo.pincode} onChange={handleContactChange} required />
                </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Social Media Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="facebookUrl" name="facebook" label="Facebook URL (Optional)" type="url" value={currentSocialMedia.facebook || ''} onChange={handleSocialMediaChange} placeholder="https://facebook.com/yourpage" />
                    <Input id="twitterUrl" name="twitter" label="Twitter URL (Optional)" type="url" value={currentSocialMedia.twitter || ''} onChange={handleSocialMediaChange} placeholder="https://twitter.com/yourhandle" />
                    <Input id="linkedinUrl" name="linkedin" label="LinkedIn URL (Optional)" type="url" value={currentSocialMedia.linkedin || ''} onChange={handleSocialMediaChange} placeholder="https://linkedin.com/company/yourcompany" />
                    <Input id="instagramUrl" name="instagram" label="Instagram URL (Optional)" type="url" value={currentSocialMedia.instagram || ''} onChange={handleSocialMediaChange} placeholder="https://instagram.com/yourhandle" />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSaveChanges} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">Save Changes</Button>
            </div>
        </div>
    );
};

export default ContactSocialSettingsView;