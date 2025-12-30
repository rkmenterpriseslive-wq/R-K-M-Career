
import React, { useState, useMemo, FC, useEffect } from 'react';
import { PartnerRequirement, PartnerRequirementsViewProps, UserType, Vendor } from '../../types';
import Input from '../Input';
import Button from '../Button';
import { createPartnerRequirement, getPartnerRequirements } from '../../services/firestoreService'; // Import Firestore service
import { usePopup } from '../../contexts/PopupContext'; // Import popup context

const MOCK_ASSIGNED_REQUIREMENTS: PartnerRequirement[] = [];

const getStatusClasses = (status: PartnerRequirement['submissionStatus']) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

interface RequirementFormProps {
    onSave: (data: Omit<PartnerRequirement, 'id' | 'postedDate' | 'submissionStatus'>) => void;
    onClose: () => void;
    availableJobRoles?: string[];
    availableLocations?: string[];
    availableStores?: { id: string; name: string; location: string }[];
    isLoading: boolean;
    partnerBrands: string[];
    partnerName: string;
}

const RequirementForm: FC<RequirementFormProps> = ({ onSave, onClose, availableJobRoles = [], availableLocations = [], availableStores = [], isLoading, partnerBrands, partnerName }) => {
    const [formData, setFormData] = useState<Omit<PartnerRequirement, 'id' | 'postedDate' | 'submissionStatus'>>({ 
        partnerName: partnerName,
        title: '',
        brand: '',
        location: '', 
        storeName: '', 
        openings: 1,
        description: '',
        experienceLevel: 'Fresher',
        salaryRange: '',
        jobType: 'Full-time',
        workingDays: '6 days',
        jobShift: 'Day Shift',
        minQualification: '12th Pass',
        genderPreference: 'Any',
        workLocationType: 'In-office',
        salaryType: 'Fixed',
        incentive: ''
    });

    const filteredStores = useMemo(() => {
        if (!formData.location) return [];
        return availableStores.filter(s => s.location === formData.location);
    }, [formData.location, availableStores]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'location') {
                newState.storeName = '';
            }
            return newState;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.brand || !formData.location || formData.openings < 1 || !formData.salaryRange) {
            alert('Please fill all required fields.');
            return;
        }
        
        const dataToSave = {
            ...formData,
            storeName: formData.storeName || undefined,
        };
        onSave(dataToSave);
    };

    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirement Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input id="partnerName" name="partnerName" label="Partner Name" value={formData.partnerName || ''} disabled wrapperClassName="mb-0" />
                    <div>
                        <label htmlFor="brand" className={labelStyles}>Brand *</label>
                        <select id="brand" name="brand" value={formData.brand} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a brand</option>
                            {partnerBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="title" className={labelStyles}>Role / Job Title *</label>
                        <select id="title" name="title" value={formData.title} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a role</option>
                            {availableJobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Location & Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="location" className={labelStyles}>Job Location *</label>
                        <select id="location" name="location" value={formData.location} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a location</option>
                            {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="storeName" className={labelStyles}>Store Name (Optional)</label>
                        <select 
                            id="storeName" 
                            name="storeName" 
                            value={formData.storeName} 
                            onChange={handleChange} 
                            disabled={!formData.location || filteredStores.length === 0}
                            className={`${selectStyles} disabled:bg-gray-100 disabled:text-gray-400`}
                        >
                            <option value="">{ !formData.location ? "Select location first" : "Select a store"}</option>
                            {filteredStores.map(store => <option key={store.id} value={store.name}>{store.name}</option>)}
                        </select>
                    </div>
                    <div><label htmlFor="minQualification" className={labelStyles}>Min Qualification</label><select id="minQualification" name="minQualification" className={selectStyles} value={formData.minQualification} onChange={handleChange} required><option>10th Pass</option><option>12th Pass</option><option>Graduate</option><option>Post Graduate</option></select></div>
                    <div><label htmlFor="experienceLevel" className={labelStyles}>Experience Level</label><select id="experienceLevel" name="experienceLevel" className={selectStyles} value={formData.experienceLevel} onChange={handleChange} required><option>Fresher</option><option>1-3 Years</option><option>3-5 Years</option><option>5+ Years</option></select></div>
                    <div><label htmlFor="genderPreference" className={labelStyles}>Gender Preference</label><select id="genderPreference" name="genderPreference" className={selectStyles} value={formData.genderPreference} onChange={handleChange} required><option>Any</option><option>Male</option><option>Female</option></select></div>
                    <div><label htmlFor="jobType" className={labelStyles}>Job Type</label><select id="jobType" name="jobType" className={selectStyles} value={formData.jobType} onChange={handleChange} required><option>Full-time</option><option>Part-time</option><option>Contract</option></select></div>
                    <div><label htmlFor="workLocationType" className={labelStyles}>Work Location</label><select id="workLocationType" name="workLocationType" className={selectStyles} value={formData.workLocationType} onChange={handleChange} required><option>In-office</option><option>Work from Home</option><option>Hybrid</option><option>Bike Rider</option></select></div>
                    <div><label htmlFor="jobShift" className={labelStyles}>Job Shift</label><select id="jobShift" name="jobShift" className={selectStyles} value={formData.jobShift} onChange={handleChange} required><option>Day Shift</option><option>Night Shift</option><option>Rotational</option><option>Per Hours</option></select></div>
                    <div className="col-span-1"><label htmlFor="workingDays" className={labelStyles}>Working Days</label><select id="workingDays" name="workingDays" className={selectStyles} value={formData.workingDays} onChange={handleChange} required><option>5 days</option><option>6 days</option></select></div>
                    <div className="col-span-1"><Input id="openings" name="openings" label="Total Openings" type="number" value={formData.openings.toString()} onChange={handleChange} min="1" required wrapperClassName="mb-0" /></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label htmlFor="salaryType" className={labelStyles}>Salary Type</label><select id="salaryType" name="salaryType" className={selectStyles} value={formData.salaryType} onChange={handleChange} required><option>Fixed</option><option>Fixed + Incentive</option></select></div>
                    <Input id="salaryRange" name="salaryRange" label="Fixed Salary" type="text" value={formData.salaryRange} onChange={handleChange} placeholder="e.g., ₹ 15k - 18k" required wrapperClassName="mb-0" />
                    {formData.salaryType === 'Fixed + Incentive' && (<Input id="incentive" name="incentive" label="Incentive" type="text" value={formData.incentive} onChange={handleChange} placeholder="e.g., Performance based" wrapperClassName="mb-0" />)}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Description</h3>
                 <div>
                    <label htmlFor="description" className="sr-only">Description / Additional Notes</label>
                    <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className={`${selectStyles} resize-none`} placeholder="Any specific requirements or details for the role."></textarea>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button type="submit" variant="primary" loading={isLoading}>Submit Requirement</Button>
            </div>
        </form>
    );
};

const PartnerRequirementsView: FC<PartnerRequirementsViewProps> = ({ initialStatus, jobRoles = [], locations = [], stores = [], vendors = [], currentUser }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [assignedRequirements] = useState<PartnerRequirement[]>(MOCK_ASSIGNED_REQUIREMENTS);
    const [myRequirements, setMyRequirements] = useState<PartnerRequirement[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>(initialStatus || 'All');
    const [isLoading, setIsLoading] = useState(false);
    const { showPopup } = usePopup();

    const partnerVendorInfo = useMemo(() => {
        if (!currentUser || !vendors || vendors.length === 0) return null;
    
        const assignedPartnersLower = (currentUser.assignedPartners || []).map(p => p.toLowerCase());
        
        if (assignedPartnersLower.length > 0) {
            // 1. Primary Method: Match via assigned partner name.
            const vendorByPartnerName = vendors.find(v => v.partnerName && assignedPartnersLower.includes(v.partnerName.toLowerCase()));
            if (vendorByPartnerName) {
                return vendorByPartnerName;
            }
    
            // 2. Secondary Method: Match via any of the vendor's brand names.
            // This handles cases where user is assigned "Zepto" instead of "Zepto Retail".
            const vendorByBrandName = vendors.find(v => 
                v.brandNames && v.brandNames.some(b => assignedPartnersLower.includes(b.toLowerCase()))
            );
            if (vendorByBrandName) {
                return vendorByBrandName;
            }
        }
    
        // 3. Fallback Method: Match by email.
        const vendorByEmail = vendors.find(v => v.email && v.email.toLowerCase() === currentUser.email?.toLowerCase());
        if (vendorByEmail) {
            return vendorByEmail;
        }
        
        // 4. Final Fallback for PARTNER userType: Create a "virtual" vendor entry if no match was found.
        if (currentUser.userType === UserType.PARTNER) {
            return {
                id: currentUser.uid,
                partnerName: currentUser.fullName || currentUser.email?.split('@')[0],
                email: currentUser.email || '',
                brandNames: [], // No brands found from directory, so this must be empty.
                address: '',
                phone: currentUser.phone || '',
                locations: [],
                jobRoles: [],
                commissionType: 'Percentage Based',
                status: 'Active',
            } as Vendor;
        }
    
        return null;
    }, [currentUser, vendors]);

    const partnerBrands = useMemo(() => partnerVendorInfo?.brandNames || [], [partnerVendorInfo]);
    const partnerJobRoles = useMemo(() => partnerVendorInfo?.jobRoles || [], [partnerVendorInfo]);
    const partnerLocations = useMemo(() => partnerVendorInfo?.locations || [], [partnerVendorInfo]);


    const fetchMyRequirements = async () => {
        if (!currentUser?.uid) {
            setMyRequirements([]);
            return;
        }
        setIsLoading(true);
        try {
            const fetched = await getPartnerRequirements(currentUser.uid);
            setMyRequirements(fetched);
        } catch (error) {
            console.error("Error fetching partner's requirements:", error);
            showPopup({ type: 'error', title: 'Error', message: 'Failed to load your requirements.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequirements();
    }, [currentUser]);

    useEffect(() => {
        if (initialStatus) {
            setFilterStatus(initialStatus);
        }
    }, [initialStatus]);

    const handleSubmitRequirement = async (data: Omit<PartnerRequirement, 'id' | 'postedDate' | 'submissionStatus'>) => {
        if (!currentUser) {
            showPopup({ type: 'error', title: 'Error', message: 'You must be logged in to submit a requirement.' });
            return;
        }
        setIsLoading(true);
        
        try {
            const partnerNameForPayload = partnerVendorInfo?.partnerName || currentUser.fullName || 'N/A';
            const payload = {
                ...data,
                partnerId: currentUser.uid,
                partnerName: partnerNameForPayload,
            };
            await createPartnerRequirement(payload);
            setView('list');
            showPopup({ type: 'success', title: 'Requirement Submitted', message: 'Your new requirement has been submitted for review.' });
            await fetchMyRequirements();
        } catch (error) {
            console.error('Error submitting new requirement:', error);
            showPopup({ type: 'error', title: 'Submission Failed', message: 'There was an error submitting your requirement. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMyRequirements = useMemo(() => {
        if (filterStatus === 'All') return myRequirements;
        return myRequirements.filter(req => req.submissionStatus === filterStatus);
    }, [myRequirements, filterStatus]);

    if (view === 'form') {
        return (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setView('list')} className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back
                    </Button>
                    <h2 className="text-2xl font-bold text-gray-800">Submit New Requirement</h2>
                </div>
                <RequirementForm
                    onSave={handleSubmitRequirement} 
                    onClose={() => setView('list')} 
                    availableJobRoles={partnerJobRoles} 
                    availableLocations={partnerLocations}
                    availableStores={stores}
                    isLoading={isLoading}
                    partnerBrands={partnerBrands}
                    partnerName={partnerVendorInfo?.partnerName || currentUser?.fullName || ''}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Partner Requirements</h2>
                <Button variant="primary" onClick={() => setView('form')}>
                    + Submit New Requirement
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">My Submitted Requirements</h3>
                        <p className="text-sm text-gray-500">Track the status of requirements you've sent to the admin.</p>
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted On</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMyRequirements.length > 0 ? filteredMyRequirements.map(req => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{req.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{req.brand}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{req.location}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{req.storeName || '-'}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-gray-800">{req.openings}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(req.postedDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(req.submissionStatus)}`}>
                                            {req.submissionStatus}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No requirements found matching the filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Open Requirements from RKM</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignedRequirements.map(req => (
                         <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">{req.title}</h4>
                                <p className="text-sm font-medium text-blue-600">{req.brand}</p>
                                <p className="text-sm text-gray-500 mt-1">{req.location}</p>
                                <div className="mt-3 space-y-2 text-sm text-gray-700 border-t pt-3">
                                     <p><strong>Salary:</strong> {req.salaryRange}</p>
                                     <p><strong>Experience:</strong> {req.experienceLevel}</p>
                                     <p><strong>Openings:</strong> {req.openings}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button variant="ghost" size="sm">View Details</Button>
                            </div>
                        </div>
                    ))}
                    {assignedRequirements.length === 0 && <p className="text-gray-500 md:col-span-2">No open requirements assigned from RKM at this time.</p>}
                </div>
            </div>

        </div>
    );
};

export default PartnerRequirementsView;
