
import React, { useState } from 'react';
import Input from '../Input';
import Button from '../Button';
import { Vendor } from '../../types';

interface AddTeamMemberModalProps {
    onClose: () => void;
    onSave: (memberData: any) => Promise<void>;
    availableLocations: string[];
    availableVendors: Vendor[];
    availableManagers: string[];
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ onClose, onSave, availableLocations, availableVendors, availableManagers }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        salary: '0',
        role: '',
        reportingManager: '',
        workingLocations: [],
        vendors: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    const uniquePartnerNames = [...new Set((availableVendors || []).map(vendor => vendor.partnerName).filter(Boolean))] as string[];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, options } = e.target;
        const value: string[] = [];
        for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        setFormData(prev => ({ ...prev, [name]: value as any[] }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.role) {
            alert("Please fill all required fields: Name, Email, and Role.");
            return;
        }
        setIsLoading(true);
        try {
            await onSave(formData);
            // Parent component will handle closing the modal on success
        } catch (error) {
            // If onSave throws an error, stop the loading state.
            // The parent component is expected to show an error popup.
            setIsLoading(false);
        }
    };
    
    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white";

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Input id="name" name="name" label="Name" value={formData.name} onChange={handleChange} wrapperClassName="mb-0" required />
                <Input id="email" name="email" label="Email" type="email" value={formData.email} onChange={handleChange} wrapperClassName="mb-0" required />
                <Input id="mobile" name="mobile" label="Mobile Number" type="tel" value={formData.mobile} onChange={handleChange} wrapperClassName="mb-0" />
                <Input id="salary" name="salary" label="Salary" type="number" value={formData.salary} onChange={handleChange} wrapperClassName="mb-0" />
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} className={selectStyles} required>
                        <option value="">Select Role</option>
                        <option>Senior HR</option>
                        <option>SR. Filed Recruiter</option>
                        <option>Tele Caller</option>
                        <option>Filed Recruiter</option>
                    </select>
                </div>
                 <div className="md:col-span-1">
                    <label htmlFor="reportingManager" className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                    <select id="reportingManager" name="reportingManager" value={formData.reportingManager} onChange={handleChange} className={selectStyles}>
                        <option value="">Select Reporting Manager</option>
                        <option value="Admin">Admin</option>
                        {availableManagers && availableManagers.map((manager) => (
                            <option key={manager} value={manager}>{manager}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="workingLocations" className="block text-sm font-medium text-gray-700 mb-1">Working Locations</label>
                    <select id="workingLocations" name="workingLocations" multiple value={formData.workingLocations} onChange={handleMultiSelectChange} className={`${selectStyles} h-24`}>
                        {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="vendors" className="block text-sm font-medium text-gray-700 mb-1">Partners</label>
                    <select id="vendors" name="vendors" multiple value={formData.vendors} onChange={handleMultiSelectChange} className={`${selectStyles} h-24`}>
                        {uniquePartnerNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading} className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700">Cancel</Button>
                <Button type="button" variant="primary" onClick={handleSubmit} loading={isLoading} className="bg-indigo-600 hover:bg-indigo-700">Save Member</Button>
            </div>
        </div>
    );
};

export default AddTeamMemberModal;
