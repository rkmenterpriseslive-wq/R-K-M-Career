











import React, { useState, useEffect, useMemo, useRef, lazy, Suspense, FC, useCallback } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, AuthCredential } from 'firebase/auth'; // Import for password change
import { auth, createSecondaryUser } from '../../services/firebaseService';
import { getUserProfile, getAllTeamMembers, createCandidate, getCandidates, updateCandidate, updateUserProfile, updatePartnerRequirement, deletePartnerRequirement, createComplaint } from '../../services/firestoreService';
import { generateJobDescription } from '../../services/geminiService';
import {
  AdminMenuItem,
  AdminDashboardContentProps,
  UserType,
  ProcessMetric,
  RoleMetric,
  TeamMemberPerformance,
  Job,
  BrandingConfig,
  AppUser,
  WarningLetter,
  Ticket,
  DemoRequest,
  Vendor,
  Slab,
  AttendanceRule,
  HrStats,
  PartnerRequirement,
  StoreSupervisor,
  HireYourselfStats
} from '../../types';
import JobPostingForm from '../JobPostingForm';
import LogoUploader from '../LogoUploader';
import JobList from '../JobList';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import StatCard from './StatCard';
import TeamPerformanceTable from './TeamPerformanceTable';
import AddTeamMemberModal from './AddTeamMemberModal';
import MyAccountProfileView from './MyAccountProfileView'; // Import the new component
import AddLineupForm from './AddLineupForm';

// Dynamically import view components for code splitting (moved to top level)
const ManagePayrollView = lazy(() => import('./ManagePayrollView'));
const CTCGeneratorView = lazy(() => import('./CTCGeneratorView'));
const GenerateOfferLetterView = lazy(() => import('./GenerateOfferLetterView'));
const PayslipsView = lazy(() => import('./PayslipsView'));
const EmployeeManagementView = lazy(() => import('./EmployeeManagementView'));
const PartnerActiveCandidatesView = lazy(() => import('./PartnerActiveCandidatesView'));
const PartnerUpdateStatusView = lazy(() => import('./PartnerUpdateStatusView'));
const PartnerRequirementsView = lazy(() => import('./PartnerRequirementsView'));
const PartnerInvoicesView = lazy(() => import('./PartnerInvoicesView'));
const PartnerSalaryUpdatesView = lazy(() => import('./PartnerSalaryUpdatesView'));
const PartnerManageSupervisorsView = lazy(() => import('./PartnerManageSupervisorsView'));
const SupervisorDashboardView = lazy(() => import('../supervisor/SupervisorDashboardView'));
const StoreAttendanceView = lazy(() => import('../supervisor/StoreAttendanceView'));
const StoreEmployeesView = lazy(() => import('../supervisor/StoreEmployeesView'));
const HRDashboardView = lazy(() => import('../hr/HRDashboardView'));
const PartnerDashboardView = lazy(() => import('../partner/PartnerDashboardView'));
const SelectionDashboardView = lazy(() => import('./SelectionDashboardView'));
const SelectedCandidatesView = lazy(() => import('./SelectedCandidatesView'));
const AllCandidatesView = lazy(() => import('./AllCandidatesView'));
const AttendanceView = lazy(() => import('./AttendanceView'));
const ComplaintsView = lazy(() => import('./ComplaintsView'));
const SettingsView = lazy(() => import('./SettingsView'));
const WarningLettersView = lazy(() => import('./WarningLettersView'));
const ReportsView = lazy(() => import('./ReportsView'));
const VendorDirectoryView = lazy(() => import('./VendorDirectoryView').then(module => ({ default: module.VendorDirectoryView })));
const DemoRequestsView = lazy(() => import('./DemoRequestsView'));
const RevenueView = lazy(() => import('./RevenueView'));
const MyAttendanceView = lazy(() => import('../candidate/MyAttendanceView'));
const JobBoardListView = lazy(() => import('./JobBoardListView'));
const RequirementsBreakdownView = lazy(() => import('./RequirementsBreakdownView'));
const AddVendorView = lazy(() => import('./AddVendorView'));
const AddJobView = lazy(() => import('./AddJobView'));


declare const html2pdf: any;

// FIX: Define the missing HRUpdatesCard component.
// A simple card to display HR-related statistics.
const HRUpdatesCard: FC<{ stats: HrStats }> = ({ stats }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">HR Updates</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSelected}</p>
                <p className="text-sm text-gray-500">Total Selected</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalOfferReleased}</p>
                <p className="text-sm text-gray-500">Offer Released</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalOnboardingPending}</p>
                <p className="text-sm text-gray-500">Onboarding Pending</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-green-600">{stats.newJoining.month}</p>
                <p className="text-sm text-gray-500">New Joinings (Month)</p>
            </div>
        </div>
    </div>
);

// --- Edit Requirement Form Component ---
interface EditRequirementFormProps {
    onSave: (data: Partial<Omit<PartnerRequirement, 'id' | 'postedDate'>>) => void;
    onClose: () => void;
    requirement: PartnerRequirement;
    availableJobRoles?: string[];
    availableLocations?: string[];
    availableStores?: { id: string; name: string; location: string; interviewAddress?: string }[];
    isLoading: boolean;
    partnerBrands: string[];
}

const EditRequirementForm: FC<EditRequirementFormProps> = ({ onSave, onClose, requirement, availableJobRoles = [], availableLocations = [], availableStores = [], isLoading, partnerBrands }) => {
    const [formData, setFormData] = useState<Partial<PartnerRequirement>>({});
    const [isLoadingGemini, setIsLoadingGemini] = useState(false);
    const [geminiError, setGeminiError] = useState('');

    useEffect(() => {
        setFormData({
            title: requirement.title,
            brand: requirement.brand,
            partnerName: requirement.partnerName,
            location: requirement.location,
            storeName: requirement.storeName || '',
            openings: requirement.openings,
            description: requirement.description,
            experienceLevel: requirement.experienceLevel,
            salaryRange: requirement.salaryRange,
            jobType: requirement.jobType,
            workingDays: requirement.workingDays,
            jobShift: requirement.jobShift,
            minQualification: requirement.minQualification,
            genderPreference: requirement.genderPreference,
            workLocationType: requirement.workLocationType,
            salaryType: requirement.salaryType,
            incentive: requirement.incentive || '',
            companyLogoSrc: requirement.companyLogoSrc || '',
        });
    }, [requirement]);

    const filteredStores = useMemo(() => {
        if (!formData.location) return [];
        return availableStores.filter(s => s.location === formData.location);
    }, [formData.location, availableStores]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === 'location') {
            newFormData.storeName = '';
        }
        setFormData(newFormData);
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
              setFormData(prev => ({ ...prev, companyLogoSrc: reader.result as string }));
            }
          };
          reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({ ...prev, companyLogoSrc: '' }));
        }
    };
    
    const handleGenerateDescription = useCallback(async () => {
        if (!formData.title) {
          setGeminiError('Please provide a job title to generate a description.');
          return;
        }
        setIsLoadingGemini(true);
        setGeminiError('');
        try {
          const keywords = `${formData.title}, ${formData.brand}, ${formData.location}, ${formData.experienceLevel}`;
          const generatedDesc = await generateJobDescription(keywords);
          setFormData(prev => ({ ...prev, description: generatedDesc }));
        } catch (error) {
          console.error('Error generating description:', error);
          setGeminiError('Failed to generate description. Please try again or write it manually.');
        } finally {
          setIsLoadingGemini(false);
        }
    }, [formData]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-1";
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirement Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        id="partnerName"
                        name="partnerName"
                        label="Partner Name"
                        value={formData.partnerName || ''}
                        wrapperClassName="mb-0"
                        disabled
                    />
                    <div>
                        <label htmlFor="brand" className={labelStyles}>Brand *</label>
                        <select id="brand" name="brand" value={formData.brand || ''} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a brand</option>
                            {partnerBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="title" className={labelStyles}>Role / Job Title *</label>
                        <select id="title" name="title" value={formData.title || ''} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a role</option>
                            {availableJobRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="location" className={labelStyles}>Job Location *</label>
                        <select id="location" name="location" value={formData.location || ''} onChange={handleChange} className={selectStyles} required>
                            <option value="">Select a location</option>
                            {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="storeName" className={labelStyles}>Store Name (Optional)</label>
                        <select 
                            id="storeName" 
                            name="storeName" 
                            value={formData.storeName || ''} 
                            onChange={handleChange} 
                            disabled={!formData.location || filteredStores.length === 0}
                            className={`${selectStyles} disabled:bg-gray-100`}
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
                    <div className="col-span-1"><Input id="openings" name="openings" label="Total Openings" type="number" value={String(formData.openings || 1)} onChange={handleChange} min="1" required wrapperClassName="mb-0" /></div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label htmlFor="salaryType" className={labelStyles}>Salary Type</label><select id="salaryType" name="salaryType" className={selectStyles} value={formData.salaryType} onChange={handleChange} required><option>Fixed</option><option>Fixed + Incentive</option></select></div>
                    <Input id="salaryRange" name="salaryRange" label="Fixed Salary" type="text" value={formData.salaryRange || ''} onChange={handleChange} placeholder="e.g., ₹ 15k - 18k" required wrapperClassName="mb-0" />
                    {formData.salaryType === 'Fixed + Incentive' && (<Input id="incentive" name="incentive" label="Incentive" type="text" value={formData.incentive || ''} onChange={handleChange} placeholder="e.g., Performance based" wrapperClassName="mb-0" />)}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">Description</h3>
                    <button type="button" onClick={handleGenerateDescription} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!formData.title || isLoadingGemini}>
                        {isLoadingGemini ? (<><span className="animate-spin">⏳</span> Processing...</>) : (<>✨ AI Generate</>)}
                    </button>
                </div>
                <textarea id="description" name="description" rows={4} value={formData.description || ''} onChange={handleChange} className={`${selectStyles} resize-none`} placeholder="Any specific requirements or details for the role."></textarea>
                {geminiError && <p className="text-red-500 text-xs mt-1">{geminiError}</p>}
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Logo (Optional)</h3>
                 <div className="flex items-center gap-3">
                    {formData.companyLogoSrc && (<img src={formData.companyLogoSrc} alt="Preview" className="h-10 w-10 rounded object-contain border bg-white"/>)}
                    <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50 focus:outline-none file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
            </div>


            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button type="submit" variant="primary" loading={isLoading}>Save Changes</Button>
            </div>
        </form>
    );
};


// Main AdminDashboardContent Component
const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  pipelineStats,
  vendorStats,
  complaintStats,
  partnerRequirementStats,
  hrStats,
  hireYourselfStats,
  candidatesByProcess,
  candidatesByRole,
  teamPerformance,
  requirementBreakdown,
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onDeleteRequirement,
  currentLogoSrc,
  onLogoUpload,
  activeAdminMenuItem,
  onAdminMenuItemClick,
  userType,
  branding,
  onUpdateBranding,
  currentUser,
  vendors,
  jobRoles,
  locations,
  stores,
  partnerLogos,
  onUpdateSettings,
  showPopup,
  systemRoles,
  panelConfig,
  demoRequests,
  complaints,
  candidates,
  partnerRequirements,
  supervisors,
  // NEW: Destructure new settings from props
  quickLinks,
  contactInfo,
  socialMedia,
  salaryRules,
}) => {
  const [showAddLineupModal, setShowAddLineupModal] = useState(false);
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<PartnerRequirement | null>(null);
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);
  const [candidateForOffer, setCandidateForOffer] = useState<any | null>(null);
  const [showRaiseTicketModal, setShowRaiseTicketModal] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
      category: 'General Inquiry' as Ticket['category'],
      subject: '',
      description: '',
  });


  const isAdmin = userType === UserType.ADMIN;
  const isHR = userType === UserType.HR;
  const isPartner = userType === UserType.PARTNER;
  const isTeamLead = userType === UserType.TEAMLEAD;
  const isTeam = userType === UserType.TEAM;
  const isStoreSupervisor = userType === UserType.STORE_SUPERVISOR;
  
  const teamPerformanceForDashboard = useMemo(() => {
    if (!currentUser) return [];

    if (isAdmin || isHR) {
        // Admin/HR see all team members (excluding other Admins/HRs to avoid showing self in performance table).
        return teamPerformance.filter(member => member.userType !== UserType.ADMIN && member.userType !== UserType.HR);
    }
    if (isTeamLead) {
        // Team Lead sees themselves and their entire downline, leveraging the pre-sorted hierarchical list.
        const startIndex = teamPerformance.findIndex(member => member.id === currentUser.uid);

        if (startIndex === -1) {
            return []; // Team Lead not found in performance list
        }

        const selfEntry = teamPerformance[startIndex];
        const selfLevel = selfEntry.level ?? 0; // The level of the team lead in the hierarchy.

        const downline = [selfEntry];

        // Iterate through the members following the team lead
        for (let i = startIndex + 1; i < teamPerformance.length; i++) {
            const currentMember = teamPerformance[i];
            const currentLevel = currentMember.level ?? -1;

            // If the current member's level is higher, they are in the downline.
            if (currentLevel > selfLevel) {
                downline.push(currentMember);
            } else {
                // If the level is the same or lower, we've exited the downline for this team lead.
                break;
            }
        }
        
        return downline;
    }
    if (isTeam || isStoreSupervisor) {
        // Team Member / Store Supervisor only sees their own entry
        return teamPerformance.filter(member => member.id === currentUser.uid);
    }
    return []; // Should not happen for authenticated users
  }, [teamPerformance, currentUser, isAdmin, isHR, isTeamLead, isTeam, isStoreSupervisor]);

  const userTickets = useMemo(() => {
      if (!currentUser || !complaints) return [];
      return complaints.filter(ticket => ticket.userId === currentUser.uid);
  }, [complaints, currentUser]);
  
  const partnerStats = useMemo(() => {
    const initial = {
        totalOpenings: 0,
        candidatesSubmitted: 0,
        interviewsScheduled: 0,
        offersReleased: 0,
        candidatesJoined: 0,
        fillRate: 0,
        pendingRequirements: 0,
        activeRequirements: 0,
    };

    if (!currentUser || currentUser.userType !== UserType.PARTNER || !vendors || !candidates || !partnerRequirements) {
        return initial;
    }

    const partnerVendor = vendors.find(v => v.email === currentUser.email);
    if (!partnerVendor) return initial;

    const partnerBrands = new Set(partnerVendor.brandNames || []);

    const myRequirements = partnerRequirements.filter(req => partnerBrands.has(req.brand));
    const myCandidates = (candidates || []).filter(c => c.vendor && partnerBrands.has(c.vendor));

    const activeRequirements = myRequirements.filter(r => r.submissionStatus === 'Approved');
    const totalOpenings = activeRequirements.reduce((sum, req) => sum + (Number(req.openings) || 0), 0);
    
    const candidatesSubmitted = myCandidates.length;
    const interviewsScheduled = myCandidates.filter(c => c.stage === 'Interview').length;
    const offersReleased = myCandidates.filter(c => c.status && (c.status.includes('Offer') || c.stage === 'Offer Sent')).length;
    const candidatesJoined = myCandidates.filter(c => c.status === 'Joined').length;
    const fillRate = totalOpenings > 0 ? (candidatesJoined / totalOpenings) * 100 : 0;
    const pendingRequirements = myRequirements.filter(r => r.submissionStatus === 'Pending Review').length;

    return {
        totalOpenings,
        candidatesSubmitted,
        interviewsScheduled,
        offersReleased,
        candidatesJoined,
        fillRate,
        pendingRequirements,
        activeRequirements: activeRequirements.length,
    };
  }, [currentUser, vendors, candidates, partnerRequirements]);


  const handleAddTeamMember = async (memberData: any) => {
    let userTypeEnum: UserType;
    switch (memberData.role) {
        case 'Senior HR': 
            userTypeEnum = UserType.HR; 
            break;
        case 'SR. Filed Recruiter':
        case 'Tele Caller':
        case 'Filed Recruiter':
        default: 
            userTypeEnum = UserType.TEAM; 
            break;
    }

    const profileData = {
        email: memberData.email,
        userType: userTypeEnum,
        fullName: memberData.name,
        phone: memberData.mobile,
        role: memberData.role,
        reportingManager: memberData.reportingManager,
        salary: memberData.salary,
        workingLocations: memberData.workingLocations,
        assignedPartners: memberData.vendors,
        profile_complete: true,
    };

    try {
        const success = await createSecondaryUser(memberData.email, "password", profileData);
        if (success) {
            setShowAddTeamMemberModal(false);
            showPopup({
                type: 'success',
                title: 'Team Member Added',
                message: `An account for ${memberData.name} has been created. The default password is "password". The list will refresh automatically.`
            });
        }
    } catch (error: any) {
        console.error("Error adding team member:", error);
        let message = "An unexpected error occurred while creating the team member.";
        if (error.message?.includes('auth/email-already-in-use')) {
            message = "This email address is already in use by another account.";
        }
        showPopup({ type: 'error', title: 'Creation Failed', message: message });
        throw error; // Re-throw to allow modal to handle loading state
    }
};


  const handleSaveVendor = async (
      vendorData: Omit<Vendor, 'id' | 'status'>, 
      slabs: Slab[], 
      attendanceRules: AttendanceRule[]
  ) => {
      setIsSubmittingVendor(true);
      try {
          const accountName = vendorData.partnerName || (vendorData.brandNames && vendorData.brandNames[0]);
          const authSuccess = await createSecondaryUser(vendorData.email, "password", {
              email: vendorData.email,
              userType: UserType.PARTNER,
              fullName: accountName,
              phone: vendorData.phone,
          });
          
          if (!authSuccess) {
              setIsSubmittingVendor(false);
              return;
          }

          const newVendorBase = {
              id: `VEN-${Date.now()}`,
              brandNames: vendorData.brandNames || [],
              partnerName: vendorData.partnerName || '',
              address: vendorData.address || '',
              email: vendorData.email,
              phone: vendorData.phone,
              locations: vendorData.locations || [],
              jobRoles: vendorData.jobRoles || [],
              commissionType: vendorData.commissionType,
              terms: vendorData.terms || "",
              contactPerson: vendorData.partnerName || 'N/A', 
              status: 'Active' as const,
          };

          let commissionData: Partial<Vendor> = {};
          if (vendorData.commissionType === 'Percentage Based') {
              commissionData.commissionValue = (vendorData as any).commissionValue || "";
          } else if (vendorData.commissionType === 'Slab Based') {
              commissionData.commissionSlabs = slabs || [];
          } else if (vendorData.commissionType === 'Attendance Based') {
              commissionData.commissionAttendanceRules = attendanceRules || [];
          }

          const newVendor: Vendor = { ...newVendorBase, ...commissionData } as Vendor;
          
          const currentVendors = Array.isArray(vendors) ? vendors : [];
          onUpdateSettings({ vendors: [...currentVendors, newVendor] });
          
          setIsAddingVendor(false);
          showPopup({
              type: 'success',
              title: 'Vendor Added',
              message: `Vendor with brands "${vendorData.brandNames.join(', ')}" added. Partner login for "${accountName}" created with password "password".`
          });
      } catch (error: any) {
          console.error("Error adding vendor:", error);
          showPopup({
              type: 'error',
              title: 'Error',
              message: "An unexpected error occurred while adding the vendor."
          });
      } finally {
          setIsSubmittingVendor(false);
      }
  };

  const handleUpdateVendor = async (vendorData: Vendor, slabs: Slab[], attendanceRules: AttendanceRule[]) => {
      setIsSubmittingVendor(true);
      try {
          // Safely reconstruct the vendor object to avoid undefined fields
          const baseData = {
              id: vendorData.id,
              status: vendorData.status,
              brandNames: vendorData.brandNames || [],
              partnerName: vendorData.partnerName || '',
              address: vendorData.address || '',
              email: vendorData.email,
              phone: vendorData.phone,
              locations: vendorData.locations || [],
              jobRoles: vendorData.jobRoles || [],
              commissionType: vendorData.commissionType,
              terms: vendorData.terms || "",
              contactPerson: vendorData.partnerName || 'N/A',
          };
  
          let commissionData: Partial<Vendor> = {};
          if (vendorData.commissionType === 'Percentage Based') {
              commissionData.commissionValue = vendorData.commissionValue || "";
          } else if (vendorData.commissionType === 'Slab Based') {
              commissionData.commissionSlabs = slabs || [];
          } else if (vendorData.commissionType === 'Attendance Based') {
              commissionData.commissionAttendanceRules = attendanceRules || [];
          }
  
          const finalVendor: Vendor = { ...baseData, ...commissionData } as Vendor;
  
          const currentVendors = Array.isArray(vendors) ? vendors : [];
          const updatedVendors = currentVendors.map(v => v.id === finalVendor.id ? finalVendor : v);
          onUpdateSettings({ vendors: updatedVendors });
  
          showPopup({ type: 'success', title: 'Success!', message: 'Vendor details updated successfully.' });
          setEditingVendor(null);
      } catch (error: any) {
          console.error("Error updating vendor:", error);
          showPopup({ type: 'error', title: 'Error', message: 'Failed to update vendor details.' });
      } finally {
          setIsSubmittingVendor(false);
      }
  };

  const handleSaveJobCreation = async (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => {
    await onAddJob(job);
    setIsAddingJob(false);
  };
  
  const handleSaveJobUpdate = async (jobData: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => {
    if (!editingJob) return;
    await onUpdateJob(editingJob.id, jobData);
    setEditingJob(null);
  };

  const handleSaveRequirementUpdate = async (data: Partial<Omit<PartnerRequirement, 'id'>>) => {
    if (!editingRequirement) return;
    setIsSubmittingRequirement(true);
    try {
        await updatePartnerRequirement(editingRequirement.id, data);
        showPopup({ type: 'success', title: 'Updated', message: 'Requirement updated successfully.' });
        setEditingRequirement(null);
    } catch (error) {
        console.error("Error updating requirement:", error);
        showPopup({ type: 'error', title: 'Error', message: 'Failed to update requirement.' });
    } finally {
        setIsSubmittingRequirement(false);
    }
  };


  // --- Profile & Password Management (New handlers) ---
  const handleUpdateProfile = async (data: Partial<AppUser>) => {
    if (!currentUser?.uid) throw new Error('User not authenticated.');
    await updateUserProfile(currentUser.uid, data);
  };

  const handleChangePassword = async (currentPass: string, newPass: string) => {
      const user = auth.currentUser;
      if (!user || !user.email) {
          throw new Error('No user is currently logged in or user has no email.');
      }

      try {
          // Re-authenticate user before changing password
          const credential = EmailAuthProvider.credential(user.email, currentPass);
          await reauthenticateWithCredential(user, credential as AuthCredential);
          await updatePassword(user, newPass);
      } catch (error: any) {
          console.error("Error changing password:", error);
          if (error.code === 'auth/wrong-password') {
              throw new Error('Incorrect current password.');
          } else if (error.code === 'auth/requires-recent-login') {
              throw new Error('Please log out and log in again to change your password due to security reasons.');
          }
          throw error;
      }
  };

  const handleUpdateProfilePicture = async (base64Image: string) => {
      if (!currentUser?.uid) throw new Error('User not authenticated.');
      await updateUserProfile(currentUser.uid, { profilePictureUrl: base64Image });
  };
  
  const handleNewTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewTicketData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) {
          showPopup({ type: 'error', title: 'Error', message: 'You must be logged in to submit a ticket.' });
          return;
      }

      const ticketPayload = {
          userId: currentUser.uid,
          submittedBy: currentUser.fullName || currentUser.email || 'Unknown User',
          userType: currentUser.userType,
          subject: newTicketData.subject,
          category: newTicketData.category,
          description: newTicketData.description,
      };

      try {
          await createComplaint(ticketPayload);
          setShowRaiseTicketModal(false);
          setNewTicketData({ category: 'General Inquiry', subject: '', description: '' });
          showPopup({ type: 'success', title: 'Submitted', message: 'Your ticket has been submitted successfully.' });
          // The real-time listener in App.tsx will update the complaints list
      } catch (error) {
          console.error("Failed to submit ticket:", error);
          showPopup({ type: 'error', title: 'Submission Failed', message: 'There was an error submitting your ticket. Please try again.' });
      }
  };


  // Filtered menu items for the main dashboard content based on user type
  const filterMenuItemsForUser = (menuItem: AdminMenuItem) => {
    switch (userType) {
        case UserType.ADMIN:
        case UserType.TEAMLEAD:
        case UserType.TEAM:
            return [
                AdminMenuItem.Dashboard,
                AdminMenuItem.DailyLineups,
                AdminMenuItem.SelectionDashboard,
                AdminMenuItem.AllCandidates,
                AdminMenuItem.Attendance,
                AdminMenuItem.ManagePayroll, // Moved HR menu items here for now as they are lazy loaded.
                AdminMenuItem.GenerateOfferLetter,
                AdminMenuItem.CTCGenerate,
                AdminMenuItem.Payslips,
                AdminMenuItem.Complaints,
                AdminMenuItem.WarningLetters,
                AdminMenuItem.Reports,
                AdminMenuItem.ManageJobBoard, // Admins only for this main content view
                AdminMenuItem.VendorDirectory,
                AdminMenuItem.DemoRequests,
                AdminMenuItem.Revenue,
                AdminMenuItem.Settings,
                AdminMenuItem.EmployeeManagement, // HR Employee Management
                AdminMenuItem.MyProfile, // Admin, Team Lead, Team can also see My Profile
                AdminMenuItem.SelectedCandidates,
            ].includes(menuItem);
        case UserType.HR:
            return [
                AdminMenuItem.Dashboard,
                AdminMenuItem.SelectedCandidates,
                AdminMenuItem.ManagePayroll,
                AdminMenuItem.GenerateOfferLetter,
                AdminMenuItem.CTCGenerate,
                AdminMenuItem.Payslips,
                AdminMenuItem.EmployeeManagement,
                AdminMenuItem.MyProfile,
                AdminMenuItem.Complaints, // HR also manages complaints
                AdminMenuItem.WarningLetters, // HR also manages warning letters
                AdminMenuItem.VendorDirectory, // HR may need to see vendors
            ].includes(menuItem);
        case UserType.PARTNER:
            return [
                AdminMenuItem.Dashboard,
                AdminMenuItem.PartnerTrackApplicants,
                AdminMenuItem.PartnerActiveCandidates,
                AdminMenuItem.ManageSupervisors,
                AdminMenuItem.PartnerPostJob,
                AdminMenuItem.PartnerInvoices,
                AdminMenuItem.PartnerSalaryUpdates,
                AdminMenuItem.Complaints,
                AdminMenuItem.WarningLetters,
                AdminMenuItem.PartnerHelpCenter,
                AdminMenuItem.MyProfile, // Partner can also see My Profile
            ].includes(menuItem);
        case UserType.STORE_SUPERVISOR:
            return [
                AdminMenuItem.SupervisorDashboard,
                AdminMenuItem.StoreAttendance,
                AdminMenuItem.StoreEmployees,
                AdminMenuItem.MyProfile,
                AdminMenuItem.PartnerTrackApplicants,
                AdminMenuItem.Complaints,
                AdminMenuItem.WarningLetters,
                AdminMenuItem.AllCandidates,
                AdminMenuItem.SelectionDashboard,
            ].includes(menuItem);
        default:
            return false;
    }
  };

  const handleApproveRequirement = async (req: PartnerRequirement) => {
    try {
      // ONLY update the original requirement's status to 'Approved'
      await updatePartnerRequirement(req.id, { submissionStatus: 'Approved' });

      // The public job board will now automatically pick up approved requirements.
      // No need to create a separate job entry.
      showPopup({ type: 'success', title: 'Approved!', message: 'Requirement approved and will now be visible on the public job board.' });
    } catch (error) {
        console.error("Error approving requirement:", error);
        showPopup({ type: 'error', title: 'Error', message: 'Failed to approve requirement.' });
    }
  };

  const handleRejectRequirement = async (reqId: string) => {
    try {
        await updatePartnerRequirement(reqId, { submissionStatus: 'Rejected' });
        showPopup({ type: 'success', title: 'Rejected', message: 'The requirement has been rejected.' });
    } catch (error) {
        console.error("Error rejecting requirement:", error);
        showPopup({ type: 'error', title: 'Error', message: 'Failed to reject requirement.' });
    }
  };

  const handleOfferGenerated = async (candidateId: string) => {
    try {
        await updateCandidate(candidateId, { status: 'Offer Released' });
        showPopup({
            type: 'success',
            title: 'Status Updated',
            message: 'Candidate status marked as "Offer Released".'
        });
        // The real-time listener will handle updating the UI.
    } catch (error) {
        console.error("Error updating candidate status:", error);
        showPopup({
            type: 'error',
            title: 'Update Failed',
            message: 'Could not update the candidate status.'
        });
    }
  };

  const handleGenerateOfferClick = (candidate: any) => {
    setCandidateForOffer(candidate);
    onAdminMenuItemClick(AdminMenuItem.GenerateOfferLetter);
  };


  const renderContent = () => {
    // Admin, Team Lead, Team dashboards have similar top-level structure.
    if (activeAdminMenuItem === AdminMenuItem.Dashboard) {
      if (isHR) {
        return <HRDashboardView onNavigate={onAdminMenuItemClick} />;
      }
      if (isPartner) {
        return <PartnerDashboardView 
                  onNavigate={onAdminMenuItemClick}
                  currentUser={currentUser || null}
                  stats={partnerStats}
                />;
      }
      if (isStoreSupervisor) {
        return <SupervisorDashboardView onNavigate={onAdminMenuItemClick} />;
      }
      // Default for Admin, Team Lead, Team Member
      return (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Candidate Pipeline" 
                metrics={[
                    { label: "Selected", value: hrStats.totalSelected, color: "text-blue-600" },
                    { label: "Interview", value: pipelineStats.interview, color: "text-purple-600" },
                    { label: "Rejected", value: pipelineStats.rejected, color: "text-red-600" },
                    { label: "Quit", value: pipelineStats.quit, color: "text-gray-800" },
                ]}
                isSplitMetrics
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
            />
            <StatCard 
                title="Hiring Overview" 
                metrics={[
                    { label: "Total Vendors", value: vendorStats.total, color: "text-blue-600" },
                    { label: "Job Posts", value: vendorStats.totalJobs, color: "text-purple-600" },
                    { label: "Total Hired", value: vendorStats.totalHired, color: "text-green-600" },
                ]} 
                isSplitMetrics 
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
            />
            <StatCard 
                title="Complaints" 
                metrics={[
                    { label: "Total", value: complaintStats.active + complaintStats.closed, color: "text-gray-900" },
                    { label: "Active", value: complaintStats.active, color: "text-red-600" }, 
                    { label: "Closed", value: complaintStats.closed, color: "text-green-600" }
                ]} 
                isSplitMetrics 
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} 
            />
            <StatCard 
                title="Requirements Update" 
                metrics={[
                    { label: "Total", value: partnerRequirementStats.total, color: "text-gray-900" },
                    { label: "Pending", value: partnerRequirementStats.pending, color: "text-yellow-600" }, 
                    { label: "Approved", value: partnerRequirementStats.approved, color: "text-green-600" }
                ]}
                isSplitMetrics 
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatCard
                title="Hire Yourself Summary"
                metrics={[
                    { label: "Total Users", value: hireYourselfStats.totalUsers, color: "text-cyan-600" },
                    { label: "Jobs Posted", value: hireYourselfStats.jobsPosted, color: "text-teal-600" },
                    { label: "Hired Candidates", value: hireYourselfStats.hiredCandidates, color: "text-emerald-600" },
                ]}
                isSplitMetrics
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            />
              <StatCard 
                  title="Candidates by Process"
                  metrics={candidatesByProcess.map((p, i) => ({ 
                      label: p.name, 
                      value: p.count,
                      color: ["text-blue-600", "text-purple-600", "text-indigo-600", "text-green-600"][i]
                  }))}
                  isSplitMetrics
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              />
              <StatCard
                  title="Candidates by Role"
                  metrics={candidatesByRole.map((r, i) => ({ 
                      label: r.name, 
                      value: r.count,
                      color: ["text-cyan-600", "text-teal-600", "text-amber-600", "text-lime-600", "text-pink-600"][i]
                  }))}
                  isSplitMetrics
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />
          </div>

          <HRUpdatesCard stats={hrStats} />

          <RequirementsBreakdownView data={requirementBreakdown} />
          
          <TeamPerformanceTable data={teamPerformanceForDashboard} />
        </div>
      );
    }
    switch (activeAdminMenuItem) {
      case AdminMenuItem.DailyLineups:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">Daily Lineups</h2>
              <Button variant="primary" onClick={() => setShowAddLineupModal(true)}>+ Add Lineup</Button>
            </div>
            <AllCandidatesView 
                initialStatus="Active" 
                showTitle={false} 
                currentUser={currentUser || null} 
                teamMembers={teamPerformance} 
                vendors={vendors}
                jobRoles={jobRoles}
                locations={locations}
                stores={stores}
                supervisors={supervisors || []}
            />
            <Modal isOpen={showAddLineupModal} onClose={() => setShowAddLineupModal(false)} title="Add New Lineup" maxWidth="max-w-3xl">
                <AddLineupForm 
                    onClose={() => setShowAddLineupModal(false)} 
                    onSave={() => { /* Real-time listener handles refresh */ }}
                    vendors={vendors}
                    jobRoles={jobRoles}
                    locations={locations}
                    stores={stores}
                    supervisors={supervisors || []}
                    currentUser={currentUser || null}
                />
            </Modal>
          </div>
        );
      case AdminMenuItem.SelectionDashboard:
        return <SelectionDashboardView currentUser={currentUser || null} teamMembers={teamPerformance} candidates={candidates || []} />;
      case AdminMenuItem.SelectedCandidates:
        return <SelectedCandidatesView 
                    candidates={candidates || []} 
                    onGenerateOfferClick={handleGenerateOfferClick} 
                    vendors={vendors}
                />;
      case AdminMenuItem.AllCandidates:
        return <AllCandidatesView currentUser={currentUser || null} teamMembers={teamPerformance} vendors={vendors} jobRoles={jobRoles} locations={locations} stores={stores} supervisors={supervisors || []} />;
      case AdminMenuItem.Attendance:
        return <AttendanceView />;
      case AdminMenuItem.Complaints:
        return <ComplaintsView complaints={complaints || []} />;
      case AdminMenuItem.WarningLetters:
        return <WarningLettersView />;
      case AdminMenuItem.Reports:
        return <ReportsView 
                  userType={userType} 
                  currentUser={currentUser || null}
                  candidates={candidates || []}
                  teamPerformance={teamPerformance}
               />;
      case AdminMenuItem.ManageJobBoard: {
            if (isAddingJob || editingJob) {
              return (
                <AddJobView
                  key={editingJob ? editingJob.id : 'add-new'}
                  initialData={editingJob}
                  onSaveJob={editingJob ? handleSaveJobUpdate : handleSaveJobCreation}
                  onCancel={() => { setIsAddingJob(false); setEditingJob(null); }}
                  availableVendors={vendors}
                  availableStores={stores}
                  currentUser={currentUser || null}
                />
              );
            }
            
            return (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-800">Manage Job Board</h2>
                  <Button variant="primary" onClick={() => { setEditingJob(null); setIsAddingJob(true); }}>+ Post New Job</Button>
                </div>
                
                <Suspense fallback={<div>Loading...</div>}>
                    <JobBoardListView
                        jobs={jobs}
                        requirements={partnerRequirements || []}
                        onDeleteJob={onDeleteJob}
                        onDeleteRequirement={onDeleteRequirement}
                        onEditJob={(job) => setEditingJob(job)}
                        onApproveRequirement={handleApproveRequirement}
                        onRejectRequirement={handleRejectRequirement}
                        onEditRequirement={(req) => setEditingRequirement(req)}
                    />
                </Suspense>
              </div>
            );
        }
      case AdminMenuItem.VendorDirectory:
        if (isAddingVendor || editingVendor) {
            return <AddVendorView 
                        initialData={editingVendor}
                        onSave={editingVendor ? handleUpdateVendor as any : handleSaveVendor as any} 
                        onCancel={() => { setIsAddingVendor(false); setEditingVendor(null); }}
                        availableLocations={locations}
                        availableJobRoles={jobRoles}
                        isSubmitting={isSubmittingVendor}
                   />;
        }
        return <VendorDirectoryView 
                    vendors={vendors} 
                    onUpdateSettings={onUpdateSettings} 
                    availableLocations={locations} 
                    availableJobRoles={jobRoles}
                    onAddNewVendorClick={() => setIsAddingVendor(true)}
                    onEditVendorClick={(vendor) => setEditingVendor(vendor)}
               />;
      case AdminMenuItem.DemoRequests:
        return <DemoRequestsView demoRequests={demoRequests || []} />;
      case AdminMenuItem.Revenue:
        return <RevenueView 
                    teamPerformance={teamPerformance} 
                    candidates={candidates || []} 
                    vendors={vendors} 
                />;
      case AdminMenuItem.Settings:
        return <SettingsView 
                    branding={branding} 
                    onUpdateBranding={onUpdateBranding}
                    onUpdateSettings={onUpdateSettings}
                    vendors={vendors}
                    jobRoles={jobRoles}
                    systemRoles={systemRoles}
                    locations={locations}
                    stores={stores}
                    partnerLogos={partnerLogos}
                    panelConfig={panelConfig}
                    currentUser={currentUser || null}
                    currentLogoSrc={currentLogoSrc}
                    onLogoUpload={onLogoUpload}
                    onOpenAddTeamMemberModal={() => setShowAddTeamMemberModal(true)}
                    teamMembers={teamPerformance}
                    // NEW: Pass new settings to SettingsView
                    quickLinks={quickLinks}
                    contactInfo={contactInfo} // Pass contact info
                    socialMedia={socialMedia}
                />;
      // HR Specific Views
      case AdminMenuItem.ManagePayroll:
        return <ManagePayrollView 
                    portalName={branding.portalName} 
                    logoSrc={currentLogoSrc} 
                    contactInfo={contactInfo}
                />;
      case AdminMenuItem.GenerateOfferLetter:
        return <GenerateOfferLetterView 
                    portalName={branding.portalName} // Pass portalName
                    logoSrc={currentLogoSrc} // Pass logoSrc
                    salaryRules={salaryRules || []}
                    candidates={candidates || []}
                    onOfferGenerated={handleOfferGenerated}
                    initialCandidateData={candidateForOffer}
                    vendors={vendors}
                />;
      case AdminMenuItem.CTCGenerate:
        return <CTCGeneratorView salaryRules={salaryRules || []} onUpdateSettings={onUpdateSettings} />;
      case AdminMenuItem.Payslips:
        return <PayslipsView 
                    portalName={branding.portalName} 
                    logoSrc={currentLogoSrc} 
                    contactInfo={contactInfo}
                />;
      case AdminMenuItem.EmployeeManagement:
        return <EmployeeManagementView />;
      case AdminMenuItem.MyProfile: // For HR, Partner, Team, Supervisor
        return (
          <MyAccountProfileView
            currentUser={currentUser || null}
            userType={userType}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onUpdateProfilePicture={handleUpdateProfilePicture}
            vendors={vendors}
            teamMembers={teamPerformance} // Pass full teamPerformance for manager lookup
          />
        );
      // Partner Specific Views
      case AdminMenuItem.PartnerTrackApplicants:
        return <PartnerUpdateStatusView currentUser={currentUser || null} vendors={vendors} candidates={candidates || []} showPopup={showPopup} />;
      case AdminMenuItem.PartnerActiveCandidates:
        return <PartnerActiveCandidatesView currentUser={currentUser || null} vendors={vendors} candidates={candidates || []} />;
      case AdminMenuItem.ManageSupervisors:
        return <PartnerManageSupervisorsView stores={stores} />;
      case AdminMenuItem.PartnerPostJob:
        return <PartnerRequirementsView 
                    jobRoles={jobRoles} 
                    locations={locations} 
                    stores={stores}
                    vendors={vendors}
                    currentUser={currentUser || null}
                />;
      case AdminMenuItem.PartnerInvoices:
        return <PartnerInvoicesView />;
      case AdminMenuItem.PartnerSalaryUpdates:
        return <PartnerSalaryUpdatesView />;
      case AdminMenuItem.PartnerHelpCenter:
          const getStatusClasses = (status: string) => {
              if (status === 'Resolved') return 'bg-green-100 text-green-800';
              if (status === 'Open') return 'bg-red-100 text-red-800';
              return 'bg-yellow-100 text-yellow-800'; // In Progress
          };
          return (
              <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <h2 className="text-3xl font-bold text-gray-800">Partner Help Center</h2>
                      <Button variant="primary" onClick={() => setShowRaiseTicketModal(true)}>+ Create New Ticket</Button>
                  </div>
                  <p className="text-gray-600">
                      Find answers to common questions or raise a support ticket to get assistance from our team.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <StatCard title="Total Tickets" value={userTickets.length.toString()} />
                      <StatCard title="Open" value={userTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length.toString()} valueColor="text-blue-600" />
                      <StatCard title="Resolved" value={userTickets.filter(t => t.status === 'Resolved').length.toString()} valueColor="text-green-600" />
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                  <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                  {userTickets.length > 0 ? userTickets.map(ticket => (
                                      <tr key={ticket.id}>
                                          <td className="px-6 py-4 text-sm font-medium text-blue-600">{ticket.id.substring(0, 8)}...</td>
                                          <td className="px-6 py-4 text-sm text-gray-900">{ticket.subject}</td>
                                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(ticket.submittedDate).toLocaleDateString()}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(ticket.status)}`}>
                                                  {ticket.status}
                                              </span>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="text-center py-10 text-gray-500">No tickets raised yet.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          );
      case AdminMenuItem.PartnerRequirementsDetail:
        return <RequirementsBreakdownView data={requirementBreakdown} />;

      // Supervisor Specific Views
      case AdminMenuItem.SupervisorDashboard:
        return <SupervisorDashboardView onNavigate={onAdminMenuItemClick} />;
      case AdminMenuItem.StoreAttendance:
        return <StoreAttendanceView />;
      case AdminMenuItem.StoreEmployees:
        return <StoreEmployeesView currentUser={currentUser || null} candidates={candidates || []} />;
      case AdminMenuItem.MyAttendance: // For Supervisor's own attendance
        return <MyAttendanceView currentUser={currentUser || null} />;

      default:
        return (
          <div className="p-6 text-center text-gray-600">
            <h2 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h2>
            <p>Please select an option from the sidebar.</p>
          </div>
        );
    }
  };

  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center p-12 text-gray-500">Loading Page...</div>}>
        {renderContent()}
      </Suspense>

      {/* Modals for adding entities (shared across sections) */}
      <Modal isOpen={showAddTeamMemberModal} onClose={() => setShowAddTeamMemberModal(false)} title="Add New Team Member" maxWidth="max-w-3xl">
          <AddTeamMemberModal 
              onClose={() => setShowAddTeamMemberModal(false)}
              onSave={handleAddTeamMember}
              availableLocations={locations}
              availableVendors={vendors}
              availableManagers={teamPerformance.map(m => m.fullName).filter(Boolean) as string[]}
          />
      </Modal>

      {editingRequirement && (
        <Modal isOpen={!!editingRequirement} onClose={() => setEditingRequirement(null)} title="Edit Requirement" maxWidth="max-w-4xl">
            <EditRequirementForm
                requirement={editingRequirement}
                onSave={handleSaveRequirementUpdate}
                onClose={() => setEditingRequirement(null)}
                availableJobRoles={jobRoles}
                availableLocations={locations}
                availableStores={stores}
                isLoading={isSubmittingRequirement}
                partnerBrands={[...new Set(vendors.flatMap(v => v.brandNames || []))]}
            />
        </Modal>
      )}

      <Modal isOpen={showRaiseTicketModal} onClose={() => setShowRaiseTicketModal(false)} title="Create New Ticket">
          <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select id="category" name="category" value={newTicketData.category} onChange={handleNewTicketChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required>
                      <option>General Inquiry</option>
                      <option>Invoice Query</option>
                      <option>Technical Issue</option>
                      <option>Other</option>
                  </select>
              </div>
              <Input id="subject" name="subject" label="Subject" value={newTicketData.subject} onChange={handleNewTicketChange} required />
              <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea id="description" name="description" rows={5} value={newTicketData.description} onChange={handleNewTicketChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="secondary" onClick={() => setShowRaiseTicketModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Submit Ticket</Button>
              </div>
          </form>
      </Modal>
    </>
  );
};

export default AdminDashboardContent;