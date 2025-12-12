
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Job } from '../types';
import Input from './Input';
import Button from './Button';
import { generateJobDescription } from '../services/geminiService';

interface JobPostingFormProps {
  onAddJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => void;
  isModalMode?: boolean;
  onClose?: () => void;
  availableVendors?: any[]; // Vendors from Settings
  availableStores?: { id: string; name: string; location: string }[]; // Stores from Settings
}

// Fallback hardcoded data if needed, or just type definition helper
type VendorData = {
  roles: string[];
  cities: string[];
  localities?: {
    [key: string]: string[];
  };
  partnerName?: string;
};

const JobPostingForm: React.FC<JobPostingFormProps> = ({ onAddJob, isModalMode = false, onClose, availableVendors = [], availableStores = [] }) => {
  // Existing state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  // Removed storeName state
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [salaryRange, setSalaryRange] = useState('');
  const [numberOfOpenings, setNumberOfOpenings] = useState(1);
  const [companyLogoSrc, setCompanyLogoSrc] = useState('');
  const [description, setDescription] = useState('');
  
  // New state for added fields
  const [jobCategory, setJobCategory] = useState('Direct');
  const [jobCity, setJobCity] = useState('');
  const [locality, setLocality] = useState('');
  const [minQualification, setMinQualification] = useState('12th Pass');
  const [genderPreference, setGenderPreference] = useState('Any');
  const [jobType, setJobType] = useState('Full-time');
  const [workLocationType, setWorkLocationType] = useState('In-office');
  const [workingDays, setWorkingDays] = useState('6 days');
  const [jobShift, setJobShift] = useState('Day Shift');
  const [interviewAddress, setInterviewAddress] = useState('');
  const [salaryType, setSalaryType] = useState('Fixed');
  const [incentive, setIncentive] = useState('');
  
  // New state for multiple roles and openings
  const [roleOpenings, setRoleOpenings] = useState<Record<string, number>>({});

  // UI state
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geminiError, setGeminiError] = useState('');

  // Prepare Vendor Data Map for easy access
  const vendorDataMap = useMemo(() => {
      const map: Record<string, VendorData> = {};
      availableVendors.forEach(v => {
          map[v.name] = {
              roles: v.jobRoles || [],
              cities: v.locations || [], 
              // Dynamic vendors don't have locality mapping usually, so we'll handle that
              partnerName: v.partnerName,
          };
      });
      return map;
  }, [availableVendors]);

  // Filter relevant stores based on selected city
  const relevantStores = useMemo(() => {
      if (!jobCity) return [];
      return availableStores.filter(store => store.location.trim().toLowerCase() === jobCity.trim().toLowerCase());
  }, [jobCity, availableStores]);
  
  const handleJobCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setJobCategory(newCategory);
    
    // Auto-populate Company with Partner Name
    if (newCategory !== 'Direct' && vendorDataMap[newCategory]) {
        setCompany(vendorDataMap[newCategory].partnerName || '');
    } else {
        setCompany('');
    }

    // Reset dependent fields when vendor changes
    setTitle('');
    setJobCity('');
    setLocality('');

    if (newCategory !== 'Direct' && vendorDataMap[newCategory]) {
        const initialOpenings = vendorDataMap[newCategory].roles.reduce((acc, role) => {
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

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newCity = e.target.value;
    setJobCity(newCity);
    // When city changes, reset locality
    setLocality('');
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
    if (jobCategory !== 'Direct' && vendorDataMap[jobCategory]) {
        const totalOpenings = Object.values(roleOpenings).reduce((sum: number, currentCount) => sum + Number(currentCount), 0);
        setNumberOfOpenings(totalOpenings);
    }
  }, [roleOpenings, jobCategory, vendorDataMap]);

  const handleGenerateDescription = useCallback(async () => {
    const isVendorJob = jobCategory !== 'Direct' && !!vendorDataMap[jobCategory];
    const finalTitle = isVendorJob
      ? Object.keys(roleOpenings).filter(role => roleOpenings[role] > 0).join(', ')
      : title;

    if (!finalTitle) {
      setGeminiError('Please enter a job title or select roles to generate a description.');
      return;
    }
    setIsLoadingGemini(true);
    setGeminiError('');
    try {
      const keywords = `${finalTitle}, ${company}, ${jobCity}, ${locality}, ${experienceLevel}`;
      const generatedDesc = await generateJobDescription(keywords);
      setDescription(generatedDesc);
    } catch (error) {
      console.error('Error generating description:', error);
      setGeminiError('Failed to generate description. Please try again or write it manually.');
    } finally {
      setIsLoadingGemini(false);
    }
  }, [title, roleOpenings, jobCategory, company, jobCity, locality, experienceLevel, vendorDataMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isVendorJob = jobCategory !== 'Direct' && !!vendorDataMap[jobCategory];
    const finalTitle = isVendorJob
      ? Object.entries(roleOpenings)
          .filter(([, count]) => Number(count) > 0)
          .map(([role]) => role)
          .join(', ')
      : title;

    if (!finalTitle || !company || !jobCity || !locality || !experienceLevel || !salaryRange || !description || numberOfOpenings <= 0 || !interviewAddress) {
      alert('Please fill in all required fields, and ensure at least one role has openings.');
      setIsSubmitting(false);
      return;
    }
    
    onAddJob({ 
      title: finalTitle, 
      company, 
      // storeName removed
      experienceLevel, 
      salaryRange, 
      numberOfOpenings, 
      companyLogoSrc: companyLogoSrc || undefined,
      description,
      // New fields
      jobCategory,
      jobCity,
      locality,
      minQualification,
      genderPreference,
      jobType,
      workLocationType,
      workingDays,
      jobShift,
      interviewAddress,
      salaryType,
      incentive: salaryType === 'Fixed + Incentive' ? incentive : undefined,
    });

    // Clear form
    setTitle('');
    setCompany('');
    setExperienceLevel('Fresher');
    setSalaryRange('');
    setNumberOfOpenings(1);
    setCompanyLogoSrc('');
    setDescription('');
    setJobCategory('Direct');
    setJobCity('');
    setLocality('');
    setMinQualification('12th Pass');
    setGenderPreference('Any');
    setJobType('Full-time');
    setWorkLocationType('In-office');
    setWorkingDays('6 days');
    setJobShift('Day Shift');
    setInterviewAddress('');
    setSalaryType('Fixed');
    setIncentive('');
    setRoleOpenings({});
    setIsSubmitting(false);
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

  const containerClasses = isModalMode ? "flex flex-col h-full max-h-[85vh]" : "bg-white p-6 rounded-lg shadow-md";
  const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs";
  const labelStyles = "block text-xs font-semibold text-gray-700 mb-1";
  const inputWrapperClass = "mb-0";

  const isVendorJob = jobCategory !== 'Direct' && !!vendorDataMap[jobCategory];
  const currentVendorData = vendorDataMap[jobCategory];

  return (
    <div className={containerClasses}>
      {!isModalMode && <h2 className="text-3xl font-bold text-gray-800 mb-6">Post New Job</h2>}
      
      <div className={`flex-1 overflow-y-auto ${isModalMode ? 'pr-2' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Basic Job Info Section */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Job Basics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="jobCategory" className={labelStyles}>Job Category / Vendor</label>
                        <select id="jobCategory" className={selectStyles} value={jobCategory} onChange={handleJobCategoryChange} required>
                        <option>Direct</option>
                        {Object.keys(vendorDataMap).map(vendor => (
                            <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                        </select>
                    </div>

                    {isVendorJob ? (
                        <div className="md:col-span-2">
                            <label className={labelStyles}>Roles & Openings</label>
                            <div className="p-2 border border-gray-300 rounded-md bg-white grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {currentVendorData?.roles.map(role => (
                                    <div key={role} className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-200">
                                        <label htmlFor={`role-${role}`} className="text-xs font-medium text-gray-700 mr-2 truncate" title={role}>{role}</label>
                                        <Input
                                            id={`role-${role}`}
                                            type="number"
                                            min="0"
                                            value={roleOpenings[role] || '0'}
                                            onChange={(e) => handleRoleOpeningChange(role, e.target.value)}
                                            className="w-16 py-1 text-center h-7 text-xs"
                                            wrapperClassName={inputWrapperClass}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Input id="jobTitle" label="Job Title / Role" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                    )}

                    <div className="md:col-span-2">
                       <Input id="company" label="Company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} required wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                    </div>
                </div>
            </div>

            {/* Location & Details Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Job City - Uses vendor locations if available */}
                {jobCategory === 'Direct' || !currentVendorData ? (
                    <Input id="jobCity" label="Job City" type="text" value={jobCity} onChange={handleCityChange} required wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                ) : (
                    <div>
                    <label htmlFor="jobCity" className={labelStyles}>Job City</label>
                    <select id="jobCity" name="jobCity" className={selectStyles} value={jobCity} onChange={handleCityChange} required>
                        <option value="">Select a city</option>
                        {currentVendorData?.cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    </div>
                )}

                {/* Locality - Uses mapping if available (vendor), else text input or store dropdown */}
                {(() => {
                    // Case 1: Vendor has specific localities defined (e.g. static data structure)
                    if (currentVendorData?.localities && currentVendorData.localities[jobCity]) {
                        return (
                            <div>
                                <label htmlFor="locality" className={labelStyles}>Locality / Area</label>
                                <select id="locality" name="locality" className={selectStyles} value={locality} onChange={(e) => setLocality(e.target.value)} required disabled={!jobCity}>
                                    <option value="">{jobCity ? 'Select a locality' : 'Select a city first'}</option>
                                    {currentVendorData.localities[jobCity].map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                        );
                    }
                    
                    // Case 2: Stores are found for this city (from Settings -> Stores)
                    if (relevantStores.length > 0) {
                        return (
                            <div>
                                <label htmlFor="locality" className={labelStyles}>Locality / Store</label>
                                <select id="locality" name="locality" className={selectStyles} value={locality} onChange={(e) => setLocality(e.target.value)} required disabled={!jobCity}>
                                    <option value="">Select Store</option>
                                    {relevantStores.map(store => <option key={store.id} value={store.name}>{store.name}</option>)}
                                </select>
                            </div>
                        );
                    }

                    // Case 3: Default Text Input
                    return (
                        <Input id="locality" label="Locality / Area" type="text" value={locality} onChange={(e) => setLocality(e.target.value)} required wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                    );
                })()}
                
                <div>
                    <label htmlFor="minQualification" className={labelStyles}>Min Qualification</label>
                    <select id="minQualification" className={selectStyles} value={minQualification} onChange={(e) => setMinQualification(e.target.value)} required>
                    <option>10th Pass</option>
                    <option>12th Pass</option>
                    <option>Graduate</option>
                    <option>Post Graduate</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="experienceLevel" className={labelStyles}>Experience Level</label>
                    <select id="experienceLevel" className={selectStyles} value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} required>
                    <option>Fresher</option>
                    <option>1-3 Years</option>
                    <option>3-5 Years</option>
                    <option>5+ Years</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="genderPreference" className={labelStyles}>Gender Preference</label>
                    <select id="genderPreference" className={selectStyles} value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)} required>
                    <option>Any</option>
                    <option>Male</option>
                    <option>Female</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="jobType" className={labelStyles}>Job Type</label>
                    <select id="jobType" className={selectStyles} value={jobType} onChange={(e) => setJobType(e.target.value)} required>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="workLocationType" className={labelStyles}>Work Location</label>
                    <select id="workLocationType" className={selectStyles} value={workLocationType} onChange={(e) => setWorkLocationType(e.target.value)} required>
                    <option>In-office</option>
                    <option>Work from Home</option>
                    <option>Hybrid</option>
                    </select>
                </div>
                
                <div>
                    <label htmlFor="jobShift" className={labelStyles}>Job Shift</label>
                    <select id="jobShift" className={selectStyles} value={jobShift} onChange={(e) => setJobShift(e.target.value)} required>
                    <option>Day Shift</option>
                    <option>Night Shift</option>
                    <option>Rotational</option>
                    </select>
                </div>
                
                <div className="col-span-1">
                    <label htmlFor="workingDays" className={labelStyles}>Working Days</label>
                    <select id="workingDays" className={selectStyles} value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} required>
                    <option>5 days</option>
                    <option>6 days</option>
                    </select>
                </div>

                <div className="col-span-1">
                    <Input id="numberOfOpenings" label="Total Openings" type="number" value={numberOfOpenings} onChange={(e) => setNumberOfOpenings(parseInt(e.target.value, 10) || 1)} min="1" required disabled={isVendorJob} wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                </div>
            </div>

            {/* Compensation Section */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="salaryType" className={labelStyles}>Salary Type</label>
                        <select id="salaryType" className={selectStyles} value={salaryType} onChange={(e) => setSalaryType(e.target.value)} required>
                        <option>Fixed</option>
                        <option>Fixed + Incentive</option>
                        </select>
                    </div>
                    
                    <Input id="salaryRange" label="Fixed Salary" type="text" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g., ₹ 15k - 18k" required wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                    
                    {salaryType === 'Fixed + Incentive' && (
                        <Input id="incentive" label="Incentive" type="text" value={incentive} onChange={(e) => setIncentive(e.target.value)} placeholder="e.g., Performance based" wrapperClassName={inputWrapperClass} className="text-xs py-2" />
                    )}
                </div>
            </div>

            {/* Description & Address */}
            <div className="grid grid-cols-1 gap-3">
                <div>
                    <label htmlFor="interviewAddress" className={labelStyles}>Interview Address</label>
                    <textarea id="interviewAddress" rows={2} className={`${selectStyles} resize-none`} value={interviewAddress} onChange={(e) => setInterviewAddress(e.target.value)} placeholder="Full address for walk-in interviews" required></textarea>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="jobDescription" className={labelStyles}>Job Description</label>
                        <button 
                            type="button" 
                            onClick={handleGenerateDescription} 
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={(isVendorJob ? numberOfOpenings === 0 : !title) || isLoadingGemini}
                        >
                            {isLoadingGemini ? (
                                <><span className="animate-spin">⏳</span></>
                            ) : (
                                <>✨ AI Generate</>
                            )}
                        </button>
                    </div>
                    <textarea id="jobDescription" rows={4} className={selectStyles} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter job description..." required></textarea>
                    {geminiError && <p className="text-red-500 text-xs mt-1">{geminiError}</p>}
                </div>

                <div>
                    <label htmlFor="companyLogoSrc" className={labelStyles}>Company Logo (Optional)</label>
                    <div className="flex items-center gap-3">
                        {companyLogoSrc && (
                            <img src={companyLogoSrc} alt="Preview" className="h-8 w-8 rounded object-contain border bg-white"/>
                        )}
                        <input
                            id="companyLogoSrc"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="block w-full text-xs text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50 focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>
            </div>
        </form>
      </div>

      <div className="pt-4 mt-2 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
          {onClose && (
            <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 text-sm">
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isLoadingGemini} onClick={handleSubmit} className="px-6 py-2 text-sm">
            Post Job
          </Button>
      </div>
    </div>
  );
};

export default JobPostingForm;
