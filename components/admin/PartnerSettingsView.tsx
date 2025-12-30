
import React, { useState } from 'react';
import { PartnerLogo } from '../../types';
import Button from '../Button';
import Input from '../Input';
import { usePopup } from '../../contexts/PopupContext';

interface PartnerSettingsViewProps {
  partnerLogos: PartnerLogo[];
  onUpdateSettings: (update: { partnerLogos: PartnerLogo[] }) => void;
}

const PartnerSettingsView: React.FC<PartnerSettingsViewProps> = ({ partnerLogos, onUpdateSettings }) => {
    const [name, setName] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { showPopup } = usePopup();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showPopup({ type: 'error', title: 'Invalid File', message: 'Please select an image file.' });
                return;
            }
            setLogoFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleAddPartner = () => {
        if (!name.trim() || !logoFile) {
            showPopup({ type: 'error', title: 'Missing Information', message: 'Please provide both a name and a logo.' });
            return;
        }

        setLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(logoFile);
        reader.onloadend = () => {
            const newPartner: PartnerLogo = {
                id: `partner_${Date.now()}`,
                name: name.trim(),
                logoSrc: reader.result as string,
            };
            
            const updatedLogos = [...(partnerLogos || []), newPartner];
            onUpdateSettings({ partnerLogos: updatedLogos });

            // Reset form
            setName('');
            setLogoFile(null);
            setPreview(null);
            setLoading(false);
            showPopup({ type: 'success', title: 'Success', message: 'New partner added.' });
        };
        reader.onerror = () => {
            setLoading(false);
            showPopup({ type: 'error', title: 'Error', message: 'Failed to read file.' });
        };
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this partner logo?')) {
            const updatedLogos = (partnerLogos || []).filter(p => p.id !== id);
            onUpdateSettings({ partnerLogos: updatedLogos });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Partner Logo</h3>
                <div className="space-y-4">
                    <Input id="partnerName" label="Partner Name" value={name} onChange={e => setName(e.target.value)} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Logo</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    </div>
                    {preview && (
                        <div className="p-2 border rounded-md inline-block">
                            <img src={preview} alt="Logo Preview" className="h-20 w-auto object-contain" />
                        </div>
                    )}
                    <Button onClick={handleAddPartner} loading={loading} className="w-full justify-center">Add Partner</Button>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Partners ({partnerLogos?.length || 0})</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(partnerLogos || []).map(partner => (
                        <div key={partner.id} className="relative group p-4 border rounded-lg flex flex-col items-center justify-center bg-gray-50">
                            <img src={partner.logoSrc} alt={partner.name} className="h-16 w-auto object-contain" />
                            <p className="text-xs font-medium text-gray-600 mt-2 truncate w-full text-center">{partner.name}</p>
                            <button onClick={() => handleDelete(partner.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                 </div>
                 {(!partnerLogos || partnerLogos.length === 0) && (
                    <p className="text-center text-gray-500 py-16">No partner logos uploaded yet.</p>
                 )}
            </div>
        </div>
    );
};

export default PartnerSettingsView;
