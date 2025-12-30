
import React, { useState, useEffect } from 'react';
import Button from '../Button';
import Input from '../Input';
import { Vendor, Slab, AttendanceRule } from '../../types';

interface AddVendorViewProps {
    onSave: (vendorData: Omit<Vendor, 'id' | 'status'> | Vendor, slabs: Slab[], attendanceRules: AttendanceRule[]) => void;
    onCancel: () => void;
    availableLocations?: string[];
    availableJobRoles?: string[];
    isSubmitting: boolean;
    initialData?: Vendor | null;
}

const AddVendorView: React.FC<AddVendorViewProps> = ({ 
    onSave, 
    onCancel, 
    availableLocations = [], 
    availableJobRoles = [], 
    isSubmitting,
    initialData
}) => {
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState<Omit<Vendor, 'id' | 'status' | 'commissionSlabs' | 'commissionAttendanceRules' | 'commissionValue'>>({
        brandNames: [],
        partnerName: '',
        address: '',
        email: '',
        phone: '',
        locations: [],
        jobRoles: [],
        commissionType: 'Percentage Based',
        terms: '',
    });

    const [currentBrand, setCurrentBrand] = useState('');
    const [commissionValue, setCommissionValue] = useState('');
    const [slabs, setSlabs] = useState<Slab[]>([]);
    const [attendanceRules, setAttendanceRules] = useState<AttendanceRule[]>([
        { id: Date.now().toString(), role: '', experienceType: '', days: '0', amount: '0' }
    ]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                brandNames: initialData.brandNames || [],
                partnerName: initialData.partnerName || '',
                address: initialData.address || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                locations: initialData.locations || [],
                jobRoles: initialData.jobRoles || [],
                commissionType: initialData.commissionType || 'Percentage Based',
                terms: initialData.terms || '',
            });
            setCommissionValue(initialData.commissionValue || '');
            setSlabs(initialData.commissionSlabs || []);
            setAttendanceRules(initialData.commissionAttendanceRules || []);
        }
    }, [initialData]);


    const handleAddBrand = () => {
        if (currentBrand && !formData.brandNames.includes(currentBrand)) {
            setFormData(prev => ({ ...prev, brandNames: [...prev.brandNames, currentBrand] }));
            setCurrentBrand('');
        }
    };

    const handleRemoveBrand = (brandToRemove: string) => {
        setFormData(prev => ({ ...prev, brandNames: prev.brandNames.filter(b => b !== brandToRemove) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, selectedOptions } = e.target;
        const selectedValues = Array.from(selectedOptions).map((option: HTMLOptionElement) => option.value);
        setFormData(prev => ({ ...prev, [name]: selectedValues }));
    };
    
    const addSlab = () => setSlabs([...slabs, { id: Date.now().toString(), frequency: 'One Time Based', from: '', to: '', amount: '' }]);
    const removeSlab = (id: string) => setSlabs(slabs.filter(s => s.id !== id));
    const updateSlab = (id: string, field: keyof Slab, value: string) => setSlabs(slabs.map(s => s.id === id ? { ...s, [field]: value } : s));
    
    const addAttendanceRule = () => setAttendanceRules([...attendanceRules, { id: Date.now().toString(), role: '', experienceType: '', days: '0', amount: '0' }]);
    const removeAttendanceRule = (id: string) => setAttendanceRules(attendanceRules.filter(r => r.id !== id));
    const updateAttendanceRule = (id: string, field: keyof AttendanceRule, value: string) => setAttendanceRules(attendanceRules.map(r => r.id === id ? { ...r, [field]: value } : r));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.brandNames.length === 0) {
            alert('Please add at least one brand name.');
            return;
        }
        const finalVendorData = {
            ...(isEditMode ? { id: initialData.id, status: initialData.status } : {}),
            ...formData,
            commissionValue: formData.commissionType === 'Percentage Based' ? commissionValue : undefined,
        };
        onSave(finalVendorData as any, slabs, attendanceRules);
    };
    
    const rowInputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back
                </Button>
                <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendor Details</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name(s)</label>
                                <div className="flex gap-2">
                                    <Input id="brandName" name="brandName" placeholder="e.g., Blinkit" value={currentBrand} onChange={e => setCurrentBrand(e.target.value)} wrapperClassName="flex-grow mb-0" />
                                    <Button type="button" variant="secondary" onClick={handleAddBrand}>Add</Button>
                                </div>
                                {formData.brandNames.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.brandNames.map(brand => (
                                            <div key={brand} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                                                {brand}
                                                <button type="button" onClick={() => handleRemoveBrand(brand)} className="text-blue-600 hover:text-blue-800">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Input id="partnerName" name="partnerName" label="Partner Name" placeholder="e.g., John Doe" value={formData.partnerName} onChange={handleChange} required />
                        </div>
                        <Input id="address" name="address" label="Full Address" placeholder="Enter full address" value={formData.address} onChange={handleChange} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input id="email" name="email" label="Email Address (for login)" type="email" placeholder="contact@vendor.com" value={formData.email} onChange={handleChange} required disabled={isEditMode} />
                            <Input id="phone" name="phone" label="Phone Number" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} required />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Operational Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="locations" className="block text-sm font-medium text-gray-700 mb-1">Operational Locations</label>
                            <select id="locations" name="locations" multiple value={formData.locations} onChange={handleMultiSelectChange} className={`${rowInputClass} h-32`}>
                                {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple.</p>
                        </div>
                        <div>
                            <label htmlFor="jobRoles" className="block text-sm font-medium text-gray-700 mb-1">Job Roles Provided</label>
                            <select id="jobRoles" name="jobRoles" multiple value={formData.jobRoles} onChange={handleMultiSelectChange} className={`${rowInputClass} h-32`}>
                                {availableJobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                             <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission Structure</h3>
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center space-x-6">
                            <label className="inline-flex items-center"><input type="radio" name="commissionType" value="Percentage Based" checked={formData.commissionType === 'Percentage Based'} onChange={handleChange} className="form-radio text-blue-600" /><span className="ml-2 text-sm">Percentage Based</span></label>
                            <label className="inline-flex items-center"><input type="radio" name="commissionType" value="Slab Based" checked={formData.commissionType === 'Slab Based'} onChange={handleChange} className="form-radio text-blue-600" /><span className="ml-2 text-sm">Slab Based</span></label>
                            <label className="inline-flex items-center"><input type="radio" name="commissionType" value="Attendance Based" checked={formData.commissionType === 'Attendance Based'} onChange={handleChange} className="form-radio text-blue-600" /><span className="ml-2 text-sm">Attendance Based</span></label>
                        </div>
                        
                        {formData.commissionType === 'Percentage Based' && <Input id="commissionValue" name="commissionValue" label="Percentage (%)" placeholder="e.g., 10" value={commissionValue} onChange={e => setCommissionValue(e.target.value)} />}
                        {formData.commissionType === 'Slab Based' && (
                            <div className="space-y-3">
                                {slabs.map(slab => (
                                    <div key={slab.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-3"><select value={slab.frequency} onChange={e => updateSlab(slab.id, 'frequency', e.target.value)} className={rowInputClass}><option>One Time Based</option><option>Monthly</option></select></div>
                                        <div className="col-span-2"><input type="number" value={slab.from} onChange={e => updateSlab(slab.id, 'from', e.target.value)} className={rowInputClass} placeholder="From" /></div>
                                        <div className="col-span-2"><input type="text" value={slab.to} onChange={e => updateSlab(slab.id, 'to', e.target.value)} className={rowInputClass} placeholder="To" /></div>
                                        <div className="col-span-3"><input type="number" value={slab.amount} onChange={e => updateSlab(slab.id, 'amount', e.target.value)} className={rowInputClass} placeholder="Amount (₹)" /></div>
                                        <div className="col-span-2 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => removeSlab(slab.id)}>Remove</Button></div>
                                    </div>
                                ))}
                                <Button type="button" onClick={addSlab} variant="small-light">+ Add Slab</Button>
                            </div>
                        )}
                        {formData.commissionType === 'Attendance Based' && (
                             <div className="space-y-3 pt-2">
                                {attendanceRules.length > 0 && <div className="grid grid-cols-12 gap-2 px-1 text-xs font-semibold text-gray-500"><div className="col-span-4">Profile/Role</div><div className="col-span-3">Experience Type</div><div className="col-span-2">Attendance (Days)</div><div className="col-span-2">Amount (₹)</div></div>}
                                {attendanceRules.map(rule => (
                                    <div key={rule.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-4"><select value={rule.role} onChange={e => updateAttendanceRule(rule.id, 'role', e.target.value)} className={rowInputClass}><option value="">Select Role</option>{availableJobRoles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                        <div className="col-span-3"><select value={rule.experienceType} onChange={e => updateAttendanceRule(rule.id, 'experienceType', e.target.value)} className={rowInputClass}><option value="">Select Exp. Type</option><option value="Fresher">Fresher</option><option value="Experienced">Experienced</option><option value="Any">Any</option></select></div>
                                        <div className="col-span-2"><input type="number" value={rule.days} onChange={e => updateAttendanceRule(rule.id, 'days', e.target.value)} className={`${rowInputClass} text-center`} /></div>
                                        <div className="col-span-2"><input type="number" value={rule.amount} onChange={e => updateAttendanceRule(rule.id, 'amount', e.target.value)} className={`${rowInputClass} text-right`} /></div>
                                        <div className="col-span-1"><button type="button" onClick={() => removeAttendanceRule(rule.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button></div>
                                    </div>
                                ))}
                                <Button type="button" onClick={addAttendanceRule} variant="small-light">+ Add Profile</Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Terms & Conditions</h3>
                    <textarea id="terms" name="terms" rows={3} value={formData.terms} onChange={handleChange} className={rowInputClass} placeholder="Enter any terms and conditions for this vendor..."></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                        {isEditMode ? 'Save Changes' : 'Add Vendor'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddVendorView;