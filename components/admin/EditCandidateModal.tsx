

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';

interface Candidate {
    id: string;
    [key: string]: any;
}

interface EditCandidateModalProps {
    candidate: Candidate | null;
    onClose: () => void;
    onSave: (id: string, updatedData: Partial<Candidate>) => void;
}

const EditCandidateModal: React.FC<EditCandidateModalProps> = ({ candidate, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Candidate>>({});

    useEffect(() => {
        if (candidate) {
            setFormData(candidate);
        }
    }, [candidate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number = value;
        // Convert datetime-local string to a full ISO string for consistent storage
        if (type === 'datetime-local' && value) {
            finalValue = new Date(value).toISOString();
        }
        setFormData({ ...formData, [name]: finalValue });
    };

    const handleSubmit = () => {
        if (candidate) {
            onSave(candidate.id, formData);
        }
    };
    
    if (!candidate) return null;
    
    const inputStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    
    const formatForDateTimeLocal = (isoString?: string) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '';
            // Adjust for local timezone offset before slicing
            const tzoffset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
            return localISOTime;
        } catch (e) {
            return '';
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Edit Details for ${candidate.name}`} maxWidth="max-w-2xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="edit-name" name="name" label="Name" value={formData.name || ''} onChange={handleChange} wrapperClassName="mb-0" />
                    <Input id="edit-contact" name="contact" label="Contact" value={formData.contact || formData.phone || ''} onChange={handleChange} wrapperClassName="mb-0" />
                    <Input id="edit-role" name="role" label="Role" value={formData.role || ''} onChange={handleChange} wrapperClassName="mb-0" />
                    <Input id="edit-store" name="store" label="Store" value={formData.store || formData.storeLocation || ''} onChange={handleChange} wrapperClassName="mb-0" />
                    <Input id="edit-recruiter" name="recruiter" label="Recruiter" value={formData.recruiter || ''} onChange={handleChange} wrapperClassName="mb-0" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" value={formData.status || ''} onChange={handleChange} className={inputStyles}>
                            <option>Active</option>
                            <option>Rejected</option>
                            <option>Quit</option>
                            <option>Joined</option>
                            <option>Pending</option>
                            <option>Selected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                        <select name="stage" value={formData.stage || ''} onChange={handleChange} className={inputStyles}>
                            <option>Sourced</option>
                            <option>On the way</option>
                            <option>Interview</option>
                            <option>Selected</option>
                        </select>
                    </div>
                </div>

                {formData.stage === 'Interview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t mt-4">
                        <Input 
                            id="interviewDate"
                            name="interviewDate" 
                            label="Interview Date & Time" 
                            type="datetime-local" 
                            value={formatForDateTimeLocal(formData.interviewDate)}
                            onChange={handleChange} 
                            wrapperClassName="mb-0" 
                        />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interview Details/Address</label>
                            <textarea 
                                name="interviewDetails" 
                                value={formData.interviewDetails || ''} 
                                onChange={handleChange} 
                                rows={2}
                                className={inputStyles}
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" variant="primary" onClick={handleSubmit}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};

export default EditCandidateModal;
