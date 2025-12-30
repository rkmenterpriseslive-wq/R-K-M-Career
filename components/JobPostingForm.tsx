
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Job, Vendor, UserType, AppUser } from '../types';
import Input from './Input';
import Button from './Button';
import { generateJobDescription } from '../services/geminiService';

interface JobPostingFormProps {
  onSaveJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => Promise<void>;
  onClose?: () => void;
  availableVendors?: Vendor[];
  availableStores?: { id: string; name: string; location: string; interviewAddress?: string }[];
  initialData?: Job | null;
  currentUser?: AppUser | null;
}

const JobPostingForm: React.FC<JobPostingFormProps> = ({ onSaveJob, onClose, availableVendors = [], availableStores = [], initialData = null, currentUser }) => {
  // Existing state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [salaryRange, setSalaryRange] = useState('');
  const [numberOfOpenings, setNumberOfOpenings] = useState(1);
  const [companyLogoSrc, setCompanyLogoSrc] = useState('');
  const [description, setDescription] = useState('');
  
  // Updated state for Job Source, Brand and other fields
  const [selectedPartner, setSelectedPartner] = useState('Direct');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [jobCity, setJobCity] = useState('');
  const [localities, setLocalities] = useState<string[]>([]);
  const [minQualification, setMinQualification] = useState('12th Pass');
  const [genderPreference, setGenderPreference] = useState('Any');
  const [jobType, setJobType] = useState('Full-time');
  const [workLocationType, setWorkLocationType] = useState('In-office');
  const [workingDays, setWorkingDays] = useState('6 days');
  const [jobShift, setJobShift] = useState('Day Shift');
  const [interviewAddress, setInterviewAddress] = useState('');
  const [salaryType, setSalaryType] = useState('Fixed');
  const [incentive, setIncentive] = useState('');
  
  // State for multiple roles and openings
  const [roleOpenings, setRoleOpenings] = useState<Record<string, number>>({});

  // UI state
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const isTeamUser = currentUser?.userType === UserType.TEAM;

  useEffect(() => {
    if (initialData) {
        setIsEditMode(true);
        setTitle(initialData.title);
        setCompany(initialData.company);
        setExperienceLevel(initialData.experienceLevel);
        setSalaryRange(initialData.salaryRange);
        setNumberOfOpenings(initialData.numberOfOpenings);
        setCompanyLogoSrc(initialData.companyLogoSrc || '');
        setDescription(initialData.description);
        setJobCity(initialData.jobCity);
        setLocalities(initialData.locality ? initialData.locality.split(',').map(l => l.trim()) : []);
        setMinQualification(initialData.minQualification);
        setGenderPreference(initialData.genderPreference);
        setJobType(initialData.jobType);
        setWorkLocationType(initialData.workLocationType);
        setWorkingDays(initialData.workingDays);
        setJobShift(initialData.jobShift);
        setInterviewAddress(initialData.interviewAddress);
        setSalaryType(initialData.salaryType);
        setIncentive(initialData.incentive || '');

        // Handle vendor-specific fields
        if (initialData.jobCategory !== 'Direct' && !isTeamUser) {
            const brandName = initialData.jobCategory;
            // Use the new partnerName field if available for accuracy
            if(initialData.partnerName) {
                setSelectedPartner(initialData.partnerName);
                setSelectedBrand(brandName);
            } else { // Fallback for older data
                const vendor = availableVendors.find(v => v.brandNames && v.brandNames.includes(brandName));
                if (vendor && vendor.partnerName) {
                    setSelectedPartner(vendor.partnerName);
                    setSelectedBrand(brandName);
                } else {
                    setSelectedPartner('Direct');
                }
            }
        } else {
            setSelectedPartner('Direct');
        }
    } else if (isTeamUser && currentUser?.fullName) {
      setCompany(currentUser.fullName);
      setSelectedPartner('Direct');
    }
  }, [initialData, availableVendors, isTeamUser, currentUser]);
  
  // Prepare partner names for dropdown
  const partnerNames = useMemo(() => {
    return [...new Set(availableVendors.map(v => v.partnerName).filter(Boolean))] as string[];
  }, [availableVendors]);

  // Filter relevant stores based on selected city
  const relevantStores = useMemo(() => {
      if (!jobCity) return [];
      return availableStores.filter(store => store.location.trim().toLowerCase() === jobCity.trim().toLowerCase());
  }, [jobCity, availableStores]);
  
  const handlePartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPartner = e.target.value;
    setSelectedPartner(newPartner);
    setCompany('');
    setSelectedBrand('');
    setTitle('');
    setJobCity('');
    setLocalities([]);

    const vendor = availableVendors.find(v => v.partnerName === newPartner);
    if (newPartner !== 'Direct' && vendor) {
        const initialOpenings = (vendor.jobRoles || []).reduce((acc, role) => {
            acc[role] = 0;
            return acc;
        }, {} as Record<string, number>);
        setRoleOpenings(initialOpenings);
        setNumberOfOpenings(0);
    } else {
        setRoleOpenings({});
        setNumberOfOpenings(1);
    }
  };
  
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brand = e.target.value;
    setSelectedBrand(brand);
    setCompany(brand);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newCity = e.target.value;
    setJobCity(newCity);
    setLocalities([]);
  };

  const handleRoleOpeningChange = (role: string, value: string) => {
    const count = parseInt(value, 10) || 0;
    const newRoleOpenings = {
        ...roleOpenings,
        [role]: count < 0 ? 0 : count,
    };
    setRoleOpenings(newRoleOpenings);
  };

  useEffect(() => {
    if (selectedPartner !== 'Direct' && !isEditMode) {
      // FIX: The original logic for calculating total openings was causing type errors.
      // Corrected by using a robust reduce function with explicit types to prevent inference issues.
      const totalOpenings = Object.values(roleOpenings).reduce(
        (sum: number, count: number) => sum + (count || 0),
        0
      );
      setNumberOfOpenings(totalOpenings);
    }
  }, [roleOpenings, selectedPartner, isEditMode]);

  useEffect(() => {
    // Auto-fill interview address when a single store is selected
    if (localities.length === 1) {
        const selectedStoreName = localities[0];
        // Find the store that matches the name AND the currently selected city for accuracy
        const selectedStore = availableStores.find(store => 
            store.name === selectedStoreName && 
            store.location.trim().toLowerCase() === jobCity.trim().toLowerCase()
        );

        if (selectedStore && selectedStore.interviewAddress) {
            setInterviewAddress(selectedStore.interviewAddress);
        }
    }
    // If multiple stores are selected, we don't auto-fill, allowing manual entry.
    // We also don't clear it, to preserve any manual entry.
  }, [localities, availableStores, jobCity]);


  const handleGenerateDescription = useCallback(async () => {
    const isVendorJob = !isTeamUser && selectedPartner !== 'Direct';
    const finalTitle = isVendorJob
      ? (isEditMode ? initialData?.title : Object.keys(roleOpenings).filter(role => roleOpenings[role] > 0).join(', '))
      : title;

    if (!finalTitle) {
      setGeminiError('Please enter a job title or select roles to generate a description.');
      return;
    }
    setIsLoadingGemini(true);
    setGeminiError('');
    try {
      const keywords = `${finalTitle}, ${company}, ${jobCity}, ${localities.join(', ')}, ${experienceLevel}`;
      const generatedDesc = await generateJobDescription(keywords);
      setDescription(generatedDesc);
    } catch (error) {
      console.error('Error generating description:', error);
      setGeminiError('Failed to generate description. Please try again or write it manually.');
    } finally {
      setIsLoadingGemini(false);
    }
  }, [title, roleOpenings, selectedPartner, company, jobCity, localities, experienceLevel, isEditMode, initialData, isTeamUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isVendorJob = !isTeamUser && selectedPartner !== 'Direct';
    const finalTitle = isVendorJob ? (isEditMode ? initialData!.title : Object.entries(roleOpenings).filter(([, count]) => Number(count) > 0).map(([role]) => role).join(', ')) : title;

    if (!finalTitle || !company || !jobCity || localities.length === 0 || !experienceLevel || !salaryRange || !description || numberOfOpenings <= 0 || !interviewAddress) {
      alert('Please fill in all required fields, and ensure at least one role has openings.');
      return;
    }

    if (isVendorJob && !selectedBrand) {
        alert('Please select a Brand Name for the chosen partner.');
        return;
    }
    
    setIsSubmitting(true);
    const jobData: Omit<Job, 'id' | 'postedDate' | 'adminId'> = {
      title: finalTitle, 
      company, 
      experienceLevel, 
      salaryRange, 
      numberOfOpenings, 
      description,
      partnerName: isVendorJob ? selectedPartner : undefined, // NEW: Save the selected partner name
      jobCategory: isVendorJob ? selectedBrand : 'Direct',
      jobCity, 
      locality: localities.join(', '), 
      minQualification, 
      genderPreference, 
      jobType, 
      workLocationType,
      workingDays, 
      jobShift, 
      interviewAddress, 
      salaryType,
    };

    if (companyLogoSrc) jobData.companyLogoSrc = companyLogoSrc;
    if (salaryType === 'Fixed + Incentive' && incentive) jobData.incentive = incentive;
    
    try {
      await onSaveJob(jobData);
    } catch (error) {
      // Parent should show an error popup. This just resets the loading state if the component doesn't get unmounted on failure.
      setIsSubmitting(false);
    }
  };
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCompanyLogoSrc(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
        setCompanyLogoSrc('');
    }
  };

  const handleLocalitiesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Explicitly type `option` to `HTMLOptionElement` to resolve TypeScript error where it was inferred as `unknown`.
    const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setLocalities(values);
  };

  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";
  const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  const isVendorJob = !isTeamUser && selectedPartner !== 'Direct';
  const currentVendorData = isVendorJob ? availableVendors.find(v => v.partnerName === selectedPartner) : undefined;
  
  const canProceed = isTeamUser ? true : (selectedPartner && (isVendorJob ? selectedBrand : true));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Basics</h3>
            <div className="space-y-4">
                {!isTeamUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="partner" className={labelStyles}>Partner Name *</label>
                            <select id="partner" className={selectStyles} value={selectedPartner} onChange={handlePartnerChange} required disabled={isEditMode && isVendorJob}>
                                <option value="Direct">Direct</option>
                                {partnerNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        {isVendorJob && (
                            <div>
                                <label htmlFor="brandName" className={labelStyles}>Brand Name *</label>
                                <select id="brandName" className={selectStyles} value={selectedBrand} onChange={handleBrandChange} required={isVendorJob} disabled={isEditMode || !selectedPartner}>
                                    <option value="">Select a brand</option>
                                    {(currentVendorData?.brandNames || []).map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {isVendorJob ? (
                    <div>
                        <label className={labelStyles}>Roles & Openings *</label>
                        {isEditMode ? (
                            <div className="p-4 border rounded-md bg-gray-100 text-gray-600 text-sm">
                                <p><strong>Current Roles:</strong> {initialData?.title}</p>
                                <p className="text-xs mt-1">Editing roles for existing vendor jobs is not supported. You can adjust the total number of openings below.</p>
                            </div>
                        ) : (
                            <div className="p-2 border border-gray-300 rounded-md bg-white grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(currentVendorData?.jobRoles || []).map(role => (
                                    <div key={role} className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-200">
                                        <label htmlFor={`role-${role}`} className="text-sm font-medium text-gray-700 mr-2 truncate" title={role}>{role}</label>
                                        <Input
                                            id={`role-${role}`}
                                            type="number"
                                            min="0"
                                            value={roleOpenings[role] || '0'}
                                            onChange={(e) => handleRoleOpeningChange(role, e.target.value)}
                                            className="w-16 py-1 text-center h-7"
                                            wrapperClassName="mb-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="jobTitle" label="Job Title / Role *" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required wrapperClassName="mb-0" />
                        <Input id="company" label="Company *" type="text" value={company} onChange={(e) => setCompany(e.target.value)} required wrapperClassName="mb-0" disabled={isTeamUser} />
                    </div>
                )}
            </div>
        </div>

        <fieldset disabled={!canProceed}>
            <div className={`space-y-6 ${!canProceed ? 'opacity-50' : ''}`}>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Location & Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedPartner === 'Direct' || !currentVendorData ? (
                            <Input id="jobCity" label="Job City *" type="text" value={jobCity} onChange={handleCityChange} required wrapperClassName="mb-0" />
                        ) : (
                            <div>
                            <label htmlFor="jobCity" className={labelStyles}>Job City *</label>
                            <select id="jobCity" name="jobCity" className={selectStyles} value={jobCity} onChange={handleCityChange} required>
                                <option value="">Select a city</option>
                                {(currentVendorData?.locations || []).map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                            </div>
                        )}
                        
                        {(() => {
                            if (isVendorJob && relevantStores.length > 0) {
                                return (
                                    <div>
                                        <label htmlFor="locality" className={labelStyles}>Locality / Store (Ctrl+Click to select multiple) *</label>
                                        <select 
                                            id="locality" 
                                            name="locality" 
                                            className={`${selectStyles} h-24`} 
                                            value={localities} 
                                            onChange={handleLocalitiesChange} 
                                            required 
                                            multiple
                                            disabled={!jobCity}
                                        >
                                            <option value="" disabled>Select Store(s)</option>
                                            {relevantStores.map(store => <option key={store.id} value={store.name}>{store.name}</option>)}
                                        </select>
                                    </div>
                                );
                            }
                            if (!isVendorJob && relevantStores.length > 0) {
                                return (
                                    <div>
                                        <label htmlFor="locality" className={labelStyles}>Locality / Store *</label>
                                        <select 
                                            id="locality" 
                                            name="locality" 
                                            className={selectStyles} 
                                            value={localities[0] || ''} 
                                            onChange={(e) => setLocalities([e.target.value])} 
                                            required 
                                            disabled={!jobCity}
                                        >
                                            <option value="">Select Store</option>
                                            {relevantStores.map(store => <option key={store.id} value={store.name}>{store.name}</option>)}
                                        </select>
                                    </div>
                                );
                            }
                            return (
                                <Input 
                                    id="locality" 
                                    label="Locality / Area *" 
                                    type="text" 
                                    value={localities[0] || ''} 
                                    onChange={(e) => setLocalities([e.target.value])} 
                                    required 
                                    wrapperClassName="mb-0" 
                                />
                            );
                        })()}
                        
                        <div><label htmlFor="minQualification" className={labelStyles}>Min Qualification *</label><select id="minQualification" className={selectStyles} value={minQualification} onChange={(e) => setMinQualification(e.target.value)} required><option>10th Pass</option><option>12th Pass</option><option>Graduate</option><option>Post Graduate</option></select></div>
                        <div><label htmlFor="experienceLevel" className={labelStyles}>Experience Level *</label><select id="experienceLevel" className={selectStyles} value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} required><option>Fresher</option><option>1-3 Years</option><option>3-5 Years</option><option>5+ Years</option></select></div>
                        <div><label htmlFor="genderPreference" className={labelStyles}>Gender Preference *</label><select id="genderPreference" className={selectStyles} value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)} required><option>Any</option><option>Male</option><option>Female</option></select></div>
                        <div><label htmlFor="jobType" className={labelStyles}>Job Type *</label><select id="jobType" className={selectStyles} value={jobType} onChange={(e) => setJobType(e.target.value)} required><option>Full-time</option><option>Part-time</option><option>Contract</option></select></div>
                        <div><label htmlFor="workLocationType" className={labelStyles}>Work Location *</label><select id="workLocationType" className={selectStyles} value={workLocationType} onChange={(e) => setWorkLocationType(e.target.value)} required><option>In-office</option><option>Work from Home</option><option>Hybrid</option><option>Bike Rider</option></select></div>
                        <div><label htmlFor="jobShift" className={labelStyles}>Job Shift *</label><select id="jobShift" className={selectStyles} value={jobShift} onChange={(e) => setJobShift(e.target.value)} required><option>Day Shift</option><option>Night Shift</option><option>Rotational</option><option>Per Hours</option></select></div>
                        <div className="col-span-1"><label htmlFor="workingDays" className={labelStyles}>Working Days *</label><select id="workingDays" className={selectStyles} value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} required><option>5 days</option><option>6 days</option></select></div>
                        <div className="col-span-1"><Input id="numberOfOpenings" label="Total Openings *" type="number" value={numberOfOpenings} onChange={(e) => setNumberOfOpenings(parseInt(e.target.value, 10) || 1)} min="1" required disabled={isVendorJob && !isEditMode} wrapperClassName="mb-0" /></div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Compensation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label htmlFor="salaryType" className={labelStyles}>Salary Type *</label><select id="salaryType" className={selectStyles} value={salaryType} onChange={(e) => setSalaryType(e.target.value)} required><option>Fixed</option><option>Fixed + Incentive</option></select></div>
                        <Input id="salaryRange" label="Fixed Salary *" type="text" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g., ₹ 15k - 18k" required wrapperClassName="mb-0" />
                        {salaryType === 'Fixed + Incentive' && (<Input id="incentive" label="Incentive" type="text" value={incentive} onChange={(e) => setIncentive(e.target.value)} placeholder="e.g., Performance based" wrapperClassName="mb-0" />)}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Description & Address</h3>
                    <div className="space-y-4">
                        <div><label htmlFor="interviewAddress" className={labelStyles}>Interview Address *</label><textarea id="interviewAddress" rows={2} className={`${selectStyles} resize-none`} value={interviewAddress} onChange={(e) => setInterviewAddress(e.target.value)} placeholder="Full address for walk-in interviews" required></textarea></div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="jobDescription" className={labelStyles}>Job Description *</label>
                                <button type="button" onClick={handleGenerateDescription} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={(isVendorJob && !isEditMode ? numberOfOpenings === 0 : !title) || isLoadingGemini}>
                                    {isLoadingGemini ? (<><span className="animate-spin">⏳</span></>) : (<>✨ AI Generate</>)}
                                </button>
                            </div>
                            <textarea id="jobDescription" rows={4} className={selectStyles} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter job description..." required></textarea>
                            {geminiError && <p className="text-red-500 text-xs mt-1">{geminiError}</p>}
                        </div>
                        <div>
                            <label htmlFor="companyLogoSrc" className={labelStyles}>Company Logo (Optional)</label>
                            <div className="flex items-center gap-3">
                                {companyLogoSrc && (<img src={companyLogoSrc} alt="Preview" className="h-10 w-10 rounded object-contain border bg-white"/>)}
                                <input id="companyLogoSrc" type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50 focus:outline-none file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </fieldset>

      <div className="flex justify-end gap-3 pt-4">
          {onClose && (
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isLoadingGemini || !canProceed}>
            {isEditMode ? 'Update Job' : 'Post Job'}
          </Button>
      </div>
    </form>
  );
};

export default JobPostingForm;
