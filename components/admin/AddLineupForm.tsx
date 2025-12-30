




import React, { useState, useMemo, useEffect } from 'react';
import Button from '../Button';
import Input from '../Input';
import { Vendor, StoreSupervisor, AppUser } from '../../types';
import { createCandidate, updateCandidate } from '../../services/firestoreService';
import { auth } from '../../services/firebaseService';

interface Candidate {
    id: string;
    name: string;
    email: string;
    role: string;
    vendor: string;
    storeLocation: string;
    status: string;
    recruiter: string;
    appliedDate: string;
    quitDate?: string;
    phone?: string;
    contact?: string;
    location?: string;
    callStatus?: string;
    [key: string]: any;
}

interface AddLineupFormProps {
    onClose: () => void;
    onSave: () => void;
    vendors: Vendor[];
    jobRoles: string[];
    locations: string[];
    stores: { id: string; name: string; location: string; interviewAddress?: string }[];
    supervisors: StoreSupervisor[];
    initialData?: Candidate | null;
    currentUser: AppUser | null;
}

const AddLineupForm: React.FC<AddLineupFormProps> = ({ onClose, onSave, vendors, jobRoles, locations, stores, supervisors, initialData = null, currentUser }) => {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        partnerName: '',
        brandName: '',
        role: '',
        location: '',
        store: '',
        status: 'Applied',
    });
    const [interviewDetails, setInterviewDetails] = useState('');
    const [interviewDate, setInterviewDate] = useState('');

    useEffect(() => {
        if (initialData) {
            const currentCallStatus = initialData.callStatus || 'Callback';

            // Trust the record. Do not perform a dynamic lookup which can be ambiguous.
            const partnerName = initialData.partnerName || '';
            const brandName = initialData.vendor || '';
            
            setFormData({
                name: initialData.name || '',
                mobile: initialData.phone || initialData.contact || '',
                role: initialData.role || '',
                location: initialData.location || '',
                store: initialData.storeLocation || '',
                status: currentCallStatus === 'Applied' ? 'Callback' : currentCallStatus,
                partnerName: partnerName,
                brandName: brandName,
            });

            setInterviewDetails(initialData.interviewDetails || '');
            if (initialData.interviewDate) {
                const date = new Date(initialData.interviewDate);
                if (!isNaN(date.getTime())) {
                    const tzoffset = date.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
                    setInterviewDate(localISOTime);
                }
            }
        } else {
            // Reset form if initialData becomes null (e.g., modal is reused)
            setFormData({
                name: '', mobile: '', partnerName: '', brandName: '',
                role: '', location: '', store: '', status: 'Applied',
            });
            setInterviewDetails('');
            setInterviewDate('');
        }
    }, [initialData, vendors]);
  
    const filteredStores = useMemo(() => {
        if (!formData.location) return [];
        return stores.filter(s => s.location === formData.location);
    }, [formData.location, stores]);

    const partnerNames = useMemo(() => {
        return [...new Set(vendors.map(v => v.partnerName).filter(Boolean))] as string[];
    }, [vendors]);

    const brandNames = useMemo(() => {
        if (!formData.partnerName || formData.partnerName === 'Direct') return [];
        const selectedVendor = vendors.find(v => v.partnerName === formData.partnerName);
        return selectedVendor?.brandNames || [];
    }, [formData.partnerName, vendors]);

    const selectedSupervisor = useMemo(() => {
        if (formData.store && formData.location) {
            const storeIdentifier = `${formData.store} - ${formData.location}`;
            return supervisors.find(sup => sup.storeLocation === storeIdentifier);
        }
        return null;
    }, [formData.store, formData.location, supervisors]);

    useEffect(() => {
        if (formData.status === 'Interested' && formData.store && formData.location) {
            const selectedStore = stores.find(s => s.name === formData.store && s.location === formData.location);

            if (selectedStore?.interviewAddress) {
                setInterviewDetails(selectedStore.interviewAddress);
            } else if (selectedSupervisor) {
                setInterviewDetails(`Interview with Supervisor: ${selectedSupervisor.name}`);
            } else if (!initialData?.interviewDetails) {
                setInterviewDetails('');
            }
        }
    }, [formData.store, formData.location, formData.status, selectedSupervisor, stores, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'partnerName') {
                newState.brandName = '';
            }
            if (name === 'location') {
                newState.store = '';
            }
            return newState;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const vendorValue = formData.partnerName === 'Direct' ? 'Direct' : formData.brandName;
            if (formData.partnerName !== 'Direct' && !vendorValue) {
                alert('Please select a Brand Name for the chosen partner.');
                return;
            }
    
            const partnerEmail = vendors.find(v => v.partnerName === formData.partnerName)?.email || null;
            
            if (initialData && initialData.id) {
                // UPDATE logic for "Call Again"
                const updateData: any = {
                    name: formData.name,
                    phone: formData.mobile,
                    vendor: vendorValue,
                    partnerName: formData.partnerName !== 'Direct' ? formData.partnerName : undefined,
                    partnerEmail: partnerEmail, // NEW: Add partner's email
                    supervisorEmail: selectedSupervisor?.email || null, // NEW: Add supervisor's email
                    role: formData.role,
                    storeLocation: formData.store,
                    location: formData.location,
                    callStatus: formData.status,
                    stage: initialData.stage,
                };
    
                if (formData.status === 'Interested') {
                    if (!interviewDate) {
                        alert('Please provide an interview date and time.');
                        return;
                    }
                    updateData.interviewDetails = interviewDetails;
                    updateData.interviewDate = new Date(interviewDate).toISOString();
                    updateData.stage = 'Sourced';
                } else if (initialData.stage === 'Interview' && formData.status !== 'Interested') {
                    updateData.stage = 'Sourced';
                    updateData.interviewDetails = null;
                    updateData.interviewDate = null;
                }
                
                await updateCandidate(initialData.id, updateData);
                alert('Candidate updated successfully!');
    
            } else {
                // CREATE logic for new lineup
                const generatedEmail = `${formData.mobile.replace(/\D/g, '')}@rkmcareer.local`;
                const createData: any = {
                    name: formData.name,
                    phone: formData.mobile,
                    email: generatedEmail,
                    vendor: vendorValue,
                    partnerName: formData.partnerName !== 'Direct' ? formData.partnerName : undefined,
                    partnerEmail: partnerEmail, // NEW: Add partner's email
                    supervisorEmail: selectedSupervisor?.email || null, // NEW: Add supervisor's email
                    role: formData.role,
                    storeLocation: formData.store,
                    location: formData.location,
                    status: 'Active',
                    stage: 'Sourced',
                    callStatus: formData.status,
                    recruiter: currentUser?.fullName || 'Unknown',
                    appliedDate: new Date().toISOString(),
                };
    
                if (formData.status === 'Interested') {
                    if (!interviewDate) {
                        alert('Please provide an interview date and time.');
                        return;
                    }
                    createData.interviewDetails = interviewDetails;
                    createData.interviewDate = new Date(interviewDate).toISOString();
                    createData.stage = 'Interview';
                }
    
                const result = await createCandidate(createData);
                if (result?.updated) {
                    alert('Existing candidate updated with new lineup details!');
                } else {
                    alert('New lineup added successfully! Candidate can log in with their mobile number and the password "password".');
                }
            }
            
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Failed to process lineup:", error);
            alert(`Failed to process lineup: ${error.message}`);
        }
    };

    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Input id="lineup-name" name="name" label="Candidate Name *" placeholder="e.g. John Doe" value={formData.name} onChange={handleChange} required wrapperClassName="mb-0"/>
                <Input id="lineup-mobile" name="mobile" label="Mobile Number *" placeholder="+91 98765 43210" value={formData.mobile} onChange={handleChange} required wrapperClassName="mb-0"/>
                <div>
                    <label htmlFor="partnerName" className={labelStyles}>Partner *</label>
                    <select id="partnerName" name="partnerName" value={formData.partnerName} onChange={handleChange} className={selectStyles} required>
                        <option value="">Select a partner</option>
                        {partnerNames.map(name => <option key={name} value={name}>{name}</option>)}
                        <option value="Direct">Direct</option>
                    </select>
                </div>
                <div>
                    {formData.partnerName && formData.partnerName !== 'Direct' && (
                        <>
                        <label htmlFor="brandName" className={labelStyles}>Brand Name *</label>
                        <select id="brandName" name="brandName" value={formData.brandName} onChange={handleChange} className={selectStyles} required disabled={brandNames.length === 0}>
                            <option value="">{brandNames.length > 0 ? 'Select a brand' : 'No brands for this partner'}</option>
                            {brandNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        </>
                    )}
                </div>
                <div>
                    <label htmlFor="role" className={labelStyles}>Role *</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} className={selectStyles} required>
                        <option value="">Select a role</option>
                        {jobRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="location" className={labelStyles}>Location *</label>
                    <select id="location" name="location" value={formData.location} onChange={handleChange} className={selectStyles} required>
                        <option value="">Select a location</option>
                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="store" className={labelStyles}>Store Name *</label>
                    <select id="store" name="store" value={formData.store} onChange={handleChange} disabled={!formData.location || filteredStores.length === 0} className={`${selectStyles} disabled:bg-gray-100 disabled:text-gray-400`} required>
                        <option value="">{!formData.location ? "Select a location first" : (filteredStores.length > 0 ? "Select a store" : "No stores in location")}</option>
                        {filteredStores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div className="">
                    <label htmlFor="status" className={labelStyles}>Call Status *</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className={selectStyles} required>
                        <option>Applied</option>
                        <option>Interested</option>
                        <option>No Answer</option>
                        <option>Not Interested</option>
                        <option>Callback</option>
                        <option>Already Call</option>
                    </select>
                </div>
                {formData.status === 'Interested' && (
                    <>
                    <div className="md:col-span-2">
                        <Input id="interviewDetails" name="interviewDetails" label="Interview Details" placeholder="e.g., Location, Round, Contact Person" value={interviewDetails} onChange={(e) => setInterviewDetails(e.target.value)} required wrapperClassName="mb-0"/>
                    </div>
                    <div className="md:col-span-2">
                        <Input id="interviewDate" name="interviewDate" label="Interview Date & Time" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} required wrapperClassName="mb-0"/>
                    </div>
                    </>
                )}
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary">Save</Button>
            </div>
        </form>
    );
};

export default AddLineupForm;
