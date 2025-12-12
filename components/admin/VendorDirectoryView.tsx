
import React, { useState } from 'react';
import Button from '../Button';
import Input from '../Input';
import Modal from '../Modal';
import { createSecondaryUser } from '../../services/firebaseService';
import { UserType } from '../../types';

export interface Slab {
    id: string;
    frequency: string;
    from: string;
    to: string;
    amount: string;
}

export interface AttendanceRule {
    id: string;
    frequency: string;
    role: string;
    days: string;
    amount: string;
}

export interface Vendor {
    id: string;
    name: string;
    partnerName?: string; // Added Partner Name
    address: string;
    email: string;
    phone: string;
    locations: string[];
    jobRoles: string[];
    commissionType: 'Percentage Based' | 'Slab Based' | 'Attendance Based';
    commissionValue?: string;
    commissionSlabs?: Slab[];
    commissionAttendanceRules?: AttendanceRule[];
    terms?: string;
    status: 'Active' | 'Inactive';
    contactPerson?: string; // Legacy support
}

interface VendorDirectoryViewProps {
    vendors: Vendor[];
    onUpdateSettings: (settings: { vendors: Vendor[] }) => void;
    availableLocations?: string[];
    availableJobRoles?: string[];
}

const VendorDirectoryView: React.FC<VendorDirectoryViewProps> = ({ 
    vendors, 
    onUpdateSettings,
    availableLocations = ['Delhi', 'Mumbai', 'Bangalore', 'Noida', 'Gurgaon'],
    availableJobRoles = ['Picker', 'Packer', 'Delivery Associate', 'Sales Executive']
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        partnerName: '', // Added to state
        address: '',
        email: '',
        phone: '',
        locations: [] as string[],
        jobRoles: [] as string[],
        commissionType: 'Percentage Based' as const,
        commissionValue: '',
        terms: '',
    });

    // States for complex commission structures
    const [slabs, setSlabs] = useState<Slab[]>([]);
    const [attendanceRules, setAttendanceRules] = useState<AttendanceRule[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, options } = e.target;
        const selectedValues: string[] = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        setFormData(prev => ({ ...prev, [name]: selectedValues }));
    };

    // --- Slab Handlers ---
    const addSlab = () => {
        setSlabs([...slabs, { id: Date.now().toString(), frequency: 'One Time Based', from: '', to: '', amount: '' }]);
    };

    const removeSlab = (id: string) => {
        setSlabs(slabs.filter(s => s.id !== id));
    };

    const updateSlab = (id: string, field: keyof Slab, value: string) => {
        setSlabs(slabs.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    // --- Attendance Rule Handlers ---
    const addAttendanceRule = () => {
        setAttendanceRules([...attendanceRules, { id: Date.now().toString(), frequency: 'One Time Based', role: '', days: '', amount: '' }]);
    };

    const removeAttendanceRule = (id: string) => {
        setAttendanceRules(attendanceRules.filter(r => r.id !== id));
    };

    const updateAttendanceRule = (id: string, field: keyof AttendanceRule, value: string) => {
        setAttendanceRules(attendanceRules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const createPartnerAccount = async (email: string, name: string, phone: string) => {
        try {
            await createSecondaryUser(email, "password", {
                email,
                userType: UserType.PARTNER,
                fullName: name,
                phone: phone,
            });
            console.log("Partner account created successfully.");
            return true;
        } catch (error: any) {
            alert(`Failed to create partner login: ${error.message}`);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Create the Partner Login Account
            // Use Partner Name if available, otherwise fallback to Vendor Name
            const accountName = formData.partnerName || formData.name;
            const authSuccess = await createPartnerAccount(formData.email, accountName, formData.phone);
            
            if (!authSuccess) {
                setIsSubmitting(false);
                return;
            }

            // 2. Create the Vendor Entry
            // Construct base vendor object
            const newVendorBase = {
                id: `VEN-${Date.now()}`,
                name: formData.name,
                partnerName: formData.partnerName,
                address: formData.address,
                email: formData.email,
                phone: formData.phone,
                locations: formData.locations,
                jobRoles: formData.jobRoles,
                commissionType: formData.commissionType,
                terms: formData.terms || "",
                contactPerson: formData.partnerName || 'N/A', 
                status: 'Active' as const,
            };

            // Conditionally add commission fields to avoid 'undefined' values which Firebase rejects
            let commissionData: Partial<Vendor> = {};
            if (formData.commissionType === 'Percentage Based') {
                commissionData = { commissionValue: formData.commissionValue || "" };
            } else if (formData.commissionType === 'Slab Based') {
                commissionData = { commissionSlabs: slabs || [] };
            } else if (formData.commissionType === 'Attendance Based') {
                commissionData = { commissionAttendanceRules: attendanceRules || [] };
            }

            const newVendor: Vendor = {
                ...newVendorBase,
                ...commissionData
            } as Vendor;
            
            const currentVendors = Array.isArray(vendors) ? vendors : [];
            onUpdateSettings({ vendors: [...currentVendors, newVendor] });
            
            setIsModalOpen(false);
            resetForm();
            alert(`Vendor "${formData.name}" added successfully. Partner login created for "${accountName}" with password "password".`);
        } catch (error: any) {
            console.error("Error adding vendor:", error);
            alert("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            partnerName: '',
            address: '',
            email: '',
            phone: '',
            locations: [],
            jobRoles: [],
            commissionType: 'Percentage Based',
            commissionValue: '',
            terms: '',
        });
        setSlabs([]);
        setAttendanceRules([]);
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this vendor?")) {
             const currentVendors = Array.isArray(vendors) ? vendors : [];
             onUpdateSettings({ vendors: currentVendors.filter(v => v.id !== id) });
        }
    };

    // Helper for input styles in dynamic rows
    const rowInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Vendor Directory</h2>
                <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Vendor
                </Button>
            </div>

            {(!vendors || vendors.length === 0) ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center shadow-sm min-h-[400px]">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No vendors found</h3>
                    <p className="text-gray-500">Get started by adding a new vendor to the directory.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Brand Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                                            <div className="text-xs text-gray-500">{vendor.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">{vendor.partnerName || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{vendor.phone}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]" title={vendor.address}>{vendor.address || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {vendor.locations ? vendor.locations.join(', ') : (typeof vendor.location === 'string' ? vendor.location : '')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleDelete(vendor.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Vendor" maxWidth="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input id="name" name="name" label="Brand Name" placeholder="e.g., Blinkit" value={formData.name} onChange={handleChange} required wrapperClassName="mb-0" />
                        <Input id="partnerName" name="partnerName" label="Partner Name" placeholder="e.g., John Doe" value={formData.partnerName} onChange={handleChange} required wrapperClassName="mb-0" />
                    </div>
                    
                    <Input id="address" name="address" label="Full Address" placeholder="Enter full address" value={formData.address} onChange={handleChange} required wrapperClassName="mb-0" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input id="email" name="email" label="Email Address" type="email" placeholder="contact@vendor.com" value={formData.email} onChange={handleChange} required wrapperClassName="mb-0" />
                        <Input id="phone" name="phone" label="Phone Number" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} required wrapperClassName="mb-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="locations" className="block text-sm font-medium text-gray-700 mb-1">Operational Locations</label>
                            <select 
                                id="locations" 
                                name="locations" 
                                multiple 
                                value={formData.locations} 
                                onChange={handleMultiSelectChange} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
                            >
                                {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple.</p>
                        </div>
                        <div>
                            <label htmlFor="jobRoles" className="block text-sm font-medium text-gray-700 mb-1">Job Roles</label>
                            <select 
                                id="jobRoles" 
                                name="jobRoles" 
                                multiple 
                                value={formData.jobRoles} 
                                onChange={handleMultiSelectChange} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
                            >
                                {availableJobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple.</p>
                        </div>
                    </div>

                    <div className="border rounded-md p-4 relative mt-6">
                        <div className="absolute -top-3 left-3 bg-white px-1 text-sm font-medium text-gray-700">Commission Structure</div>
                        <div className="space-y-4 pt-1">
                            <div className="flex items-center space-x-6">
                                <label className="text-sm font-medium text-gray-700">Structure Type</label>
                                <label className="inline-flex items-center">
                                    <input type="radio" name="commissionType" value="Percentage Based" checked={formData.commissionType === 'Percentage Based'} onChange={handleChange as any} className="form-radio text-blue-600" />
                                    <span className="ml-2 text-sm text-gray-700">Percentage Based</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input type="radio" name="commissionType" value="Slab Based" checked={formData.commissionType === 'Slab Based'} onChange={handleChange as any} className="form-radio text-blue-600" />
                                    <span className="ml-2 text-sm text-gray-700">Slab Based</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input type="radio" name="commissionType" value="Attendance Based" checked={formData.commissionType === 'Attendance Based'} onChange={handleChange as any} className="form-radio text-blue-600" />
                                    <span className="ml-2 text-sm text-gray-700">Attendance Based</span>
                                </label>
                            </div>
                            
                            {formData.commissionType === 'Percentage Based' && (
                                <Input 
                                    id="commissionValue" 
                                    name="commissionValue" 
                                    label="Percentage (%)" 
                                    placeholder="e.g., 10" 
                                    value={formData.commissionValue} 
                                    onChange={handleChange} 
                                    wrapperClassName="mb-0" 
                                />
                            )}

                            {formData.commissionType === 'Slab Based' && (
                                <div className="space-y-3">
                                    {slabs.map((slab) => (
                                        <div key={slab.id} className="flex gap-2 items-center">
                                            <div className="w-1/4">
                                                <select 
                                                    value={slab.frequency} 
                                                    onChange={(e) => updateSlab(slab.id, 'frequency', e.target.value)}
                                                    className={rowInputClass}
                                                >
                                                    <option>One Time Based</option>
                                                    <option>Monthly</option>
                                                </select>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={slab.from} 
                                                onChange={(e) => updateSlab(slab.id, 'from', e.target.value)}
                                                className={rowInputClass} 
                                                placeholder="1"
                                            />
                                            <span className="text-gray-500 font-medium">To</span>
                                            <input 
                                                type="text" 
                                                value={slab.to} 
                                                onChange={(e) => updateSlab(slab.id, 'to', e.target.value)}
                                                className={rowInputClass} 
                                                placeholder="To"
                                            />
                                            <input 
                                                type="number" 
                                                value={slab.amount} 
                                                onChange={(e) => updateSlab(slab.id, 'amount', e.target.value)}
                                                className={rowInputClass} 
                                                placeholder="Amount (₹)"
                                            />
                                            <button type="button" onClick={() => removeSlab(slab.id)} className="text-red-500 hover:text-red-700 p-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addSlab} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        + Add Slab
                                    </button>
                                </div>
                            )}

                            {formData.commissionType === 'Attendance Based' && (
                                <div className="space-y-3">
                                    {attendanceRules.map((rule) => (
                                        <div key={rule.id} className="flex gap-2 items-center">
                                            <div className="w-1/4">
                                                <select 
                                                    value={rule.frequency} 
                                                    onChange={(e) => updateAttendanceRule(rule.id, 'frequency', e.target.value)}
                                                    className={rowInputClass}
                                                >
                                                    <option>One Time Based</option>
                                                    <option>Monthly</option>
                                                </select>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={rule.role} 
                                                onChange={(e) => updateAttendanceRule(rule.id, 'role', e.target.value)}
                                                className={rowInputClass} 
                                                placeholder="Profile/Role"
                                            />
                                            <input 
                                                type="number" 
                                                value={rule.days} 
                                                onChange={(e) => updateAttendanceRule(rule.id, 'days', e.target.value)}
                                                className={rowInputClass} 
                                                placeholder="Attendance (e.g. 1)"
                                            />
                                            <input 
                                                type="number" 
                                                value={rule.amount} 
                                                onChange={(e) => updateAttendanceRule(rule.id, 'amount', e.target.value)}
                                                className={rowInputClass} 
                                                placeholder="Amount (₹)"
                                            />
                                            <button type="button" onClick={() => removeAttendanceRule(rule.id)} className="text-red-500 hover:text-red-700 p-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addAttendanceRule} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        + Add Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                        <textarea 
                            id="terms" 
                            name="terms" 
                            rows={3} 
                            placeholder="Enter any terms and conditions for this vendor..." 
                            value={formData.terms} 
                            onChange={handleChange} 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSubmitting}>Add Vendor</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default VendorDirectoryView;
