
import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Input from '../Input';
import { Vendor, StoreSupervisor } from '../../types';

interface Candidate {
    id: string;
    name: string;
    recruiter: string;
    vendor?: string;
    role?: string;
    location?: string;
    storeLocation?: string;
    interviewDetails?: string;
    interviewDate?: string;
    [key: string]: any;
}

interface TransferCandidateModalProps {
    candidate: Candidate;
    onClose: () => void;
    onSave: (id: string, transferData: Partial<Candidate>) => Promise<void>;
    vendors: Vendor[];
    jobRoles: string[];
    locations: string[];
    stores: { id: string; name: string; location: string; interviewAddress?: string }[];
    supervisors: StoreSupervisor[];
}

const TransferCandidateModal: React.FC<TransferCandidateModalProps> = ({ candidate, onClose, onSave, vendors, jobRoles, locations, stores, supervisors }) => {
    const [formData, setFormData] = useState({
        partnerName: '',
        brandName: '',
        role: '',
        location: '',
        store: '',
        callStatus: 'Transferred',
    });
    const [interviewDetails, setInterviewDetails] = useState('');
    const [interviewDate, setInterviewDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (candidate) {
            // Start with a mostly blank slate for transfer to avoid carrying over ambiguous data.
            // Keep the role as a suggestion for convenience.
            setFormData({
                partnerName: '',
                brandName: '',
                role: candidate.role || '',
                location: '',
                store: '',
                callStatus: 'Transferred',
            });
        }
    }, [candidate]);

    useEffect(() => {
        if (formData.callStatus === 'Interested' && formData.store && formData.location) {
            const selectedStore = stores.find(s => s.name === formData.store && s.location === formData.location);

            if (selectedStore?.interviewAddress) {
                setInterviewDetails(selectedStore.interviewAddress);
            } else {
                const storeIdentifier = `${formData.store} - ${formData.location}`;
                const supervisor = supervisors.find(sup => sup.storeLocation === storeIdentifier);
                if (supervisor) {
                    setInterviewDetails(`Interview with Supervisor: ${supervisor.name}`);
                } else if (!candidate?.interviewDetails) { // Don't clear if there was pre-existing data
                    setInterviewDetails('');
                }
            }
        }
    }, [formData.store, formData.location, formData.callStatus, supervisors, stores, candidate]);


    const partnerNames = useMemo(() => {
        return [...new Set(vendors.map(v => v.partnerName).filter(Boolean))] as string[];
    }, [vendors]);

    const brandNames = useMemo(() => {
        if (!formData.partnerName || formData.partnerName === 'Direct') return [];
        const selectedVendor = vendors.find(v => v.partnerName === formData.partnerName);
        return selectedVendor?.brandNames || [];
    }, [formData.partnerName, vendors]);

    const filteredStores = useMemo(() => {
        if (!formData.location) return [];
        return stores.filter(s => s.location === formData.location);
    }, [formData.location, stores]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'partnerName') newState.brandName = '';
            if (name === 'location') newState.store = '';
            return newState;
        });
    };

    const handleSubmit = async () => {
        if (!formData.partnerName || (formData.partnerName !== 'Direct' && !formData.brandName) || !formData.role || !formData.location || !formData.store) {
            alert('Please select all required fields for the transfer.');
            return;
        }
        setIsLoading(true);
        const transferData: Partial<Candidate> = {
            vendor: formData.partnerName === 'Direct' ? 'Direct' : formData.brandName,
            partnerName: formData.partnerName !== 'Direct' ? formData.partnerName : undefined, // Explicitly save partnerName
            role: formData.role,
            location: formData.location,
            storeLocation: formData.store,
            callStatus: formData.callStatus,
            appliedDate: new Date().toISOString(), // Update applied date for the new role
        };

        if (formData.callStatus === 'Interested') {
            if (!interviewDate) {
                alert('Please provide an interview date and time.');
                setIsLoading(false);
                return;
            }
            transferData.stage = 'Interview';
            transferData.interviewDetails = interviewDetails;
            transferData.interviewDate = new Date(interviewDate).toISOString();
        } else {
            transferData.stage = 'Sourced'; // Reset to Sourced if not going for an interview
            transferData.interviewDetails = undefined; // Clear interview details
            transferData.interviewDate = undefined;
        }
        
        await onSave(candidate.id, transferData);
        setIsLoading(false);
    };

    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <Modal isOpen={true} onClose={onClose} title={`Transfer Candidate: ${candidate.name}`} maxWidth="max-w-3xl">
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Re-assign this candidate to a new vendor, role, and location. You can also schedule an interview immediately.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                        <label htmlFor="partnerName" className={labelStyles}>New Partner *</label>
                        <select id="partnerName" name="partnerName" value={formData.partnerName} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a partner</option>
                            {partnerNames.map(name => <option key={name} value={name}>{name}</option>)}
                            <option value="Direct">Direct</option>
                        </select>
                    </div>
                    {formData.partnerName !== 'Direct' && (
                        <div>
                            <label htmlFor="brandName" className={labelStyles}>New Brand *</label>
                            <select id="brandName" name="brandName" value={formData.brandName} onChange={handleChange} className={selectStyles} required disabled={brandNames.length === 0}>
                                <option value="">{brandNames.length > 0 ? 'Select a brand' : 'Select a partner first'}</option>
                                {brandNames.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                    )}
                     <div>
                        <label htmlFor="role" className={labelStyles}>New Role *</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a role</option>
                            {jobRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="location" className={labelStyles}>New Location *</label>
                        <select id="location" name="location" value={formData.location} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a location</option>
                            {locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="store" className={labelStyles}>New Store *</label>
                        <select id="store" name="store" value={formData.store} onChange={handleChange} disabled={!formData.location || filteredStores.length === 0} className={`${selectStyles} disabled:bg-gray-100`} required>
                            <option value="">{!formData.location ? "Select location first" : "Select a store"}</option>
                            {filteredStores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="callStatus" className={labelStyles}>New Call Status *</label>
                        <select id="callStatus" name="callStatus" value={formData.callStatus} onChange={handleChange} className={selectStyles} required>
                            <option>Transferred</option>
                            <option>Interested</option>
                            <option>Callback</option>
                            <option>Not Interested</option>
                        </select>
                    </div>
                </div>

                {formData.callStatus === 'Interested' && (
                    <div className="space-y-4 pt-4 border-t">
                         <Input id="interviewDetails" name="interviewDetails" label="Interview Details" placeholder="e.g., Location, Round, Contact Person" value={interviewDetails} onChange={(e) => setInterviewDetails(e.target.value)} required wrapperClassName="mb-0"/>
                         <Input id="interviewDate" name="interviewDate" label="Interview Date & Time" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} required wrapperClassName="mb-0"/>
                    </div>
                )}


                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="button" variant="primary" onClick={handleSubmit} loading={isLoading}>
                        Transfer Candidate
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TransferCandidateModal;
