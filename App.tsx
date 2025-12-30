
import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Header from './components/Header';
import LoginPanel from './components/LoginPanel';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import Modal from './components/Modal';
import RequestDemoModal from './components/RequestDemoModal';
import { UserType, Job, AdminMenuItem, CandidateMenuItem, AppUser, BrandingConfig, CandidatePipelineStats, VendorStats, ComplaintStats, PartnerRequirementStats, HrStats, ProcessMetric, RoleMetric, TeamMemberPerformance, PanelConfig, RequirementBreakdownData, DetailedRequirementBreakdownRow, DemoRequest, Ticket, Resignation, Vendor, PartnerLogo, QuickLink, ContactConfig, SocialMediaConfig, PartnerRequirement, StoreSupervisor, SalaryRule, HireYourselfStats } from './types';
import { onJobsChange, createJob, deleteJob, getUserProfile, createUserProfile, updateSettings, onTeamMembersChange, onCandidatesChange, onComplaintsChange, onRequirementsChange, processTeamPerformanceStats, getSettings, onDemoRequestsChange, onUserResignationChange, createDemoRequest, updateJob, onStoreSupervisorsChange, submitApplication, deletePartnerRequirement } from './services/firestoreService';
import { auth } from './services/firebaseService';
import { usePopup } from './contexts/PopupContext';
import Popup from './components/Popup';
import Footer from './components/Footer';
import ApplyJobModal from './components/ApplyJobModal';
import HireYourselfLayout from './components/hireyourself/HireYourselfLayout';

const JobsPage = lazy(() => import('./components/JobsPage'));

interface DashboardStats {
  pipeline: CandidatePipelineStats;
  vendor: VendorStats;
  complaint: ComplaintStats;
  partnerRequirement: PartnerRequirementStats;
  hrStats: HrStats;
  hireYourselfStats: HireYourselfStats;
  process: ProcessMetric[];
  role: RoleMetric[];
  team: TeamMemberPerformance[];
  requirementBreakdown: RequirementBreakdownData;
}

interface AppSettings {
  branding: BrandingConfig;
  logoSrc: string | null;
  vendors: Vendor[];
  jobRoles: string[];
  systemRoles: { name: string; panel: string }[];
  locations: string[];
  stores: { id: string; name: string; location: string }[];
  partnerLogos: PartnerLogo[];
  panelConfig: PanelConfig;
  quickLinks: QuickLink[];
  contactInfo: ContactConfig;
  socialMedia: SocialMediaConfig;
  salaryRules?: SalaryRule[];
}


const initialStats: DashboardStats = {
  pipeline: { active: 0, interview: 0, rejected: 0, quit: 0 },
  vendor: { total: 0, totalJobs: 0, totalHired: 0 },
  complaint: { active: 0, closed: 0 },
  partnerRequirement: { total: 0, pending: 0, approved: 0 },
  hrStats: { totalSelected: 0, totalOfferReleased: 0, totalOnboardingPending: 0, newJoining: { day: 0, week: 0, month: 0 } },
  hireYourselfStats: { totalUsers: 0, jobsPosted: 0, hiredCandidates: 0 },
  process: [],
  role: [],
  team: [],
  requirementBreakdown: { team: [], partner: [], store: [], role: [] },
};

const defaultBranding: BrandingConfig = {
  portalName: 'R.K.M ENTERPRISE',
  hireTalent: {
      title: 'Hire Top Talent',
      description: 'Post your job openings and find the perfect candidates for your business.',
      link: 'https://example.com/hire',
      backgroundImage: null,
  },
  becomePartner: {
      title: 'Become a Partner',
      description: 'Expand your business by collaborating with us and accessing our network.',
      link: 'https://example.com/register',
      backgroundImage: null,
  }
};

const initialSettings: AppSettings = {
  branding: defaultBranding,
  logoSrc: null,
  vendors: [],
  jobRoles: [],
  systemRoles: [],
  locations: [],
  stores: [],
  partnerLogos: [],
  panelConfig: {
      emailNotifications: true,
      maintenanceMode: false,
  },
  quickLinks: [],
  contactInfo: {
    email: 'info@rkm-enterprises.com',
    phone: '+91 9616411654',
    addressLine1: 'Plot No 727 Razapur',
    addressLine2: 'Shastri Nagar',
    city: 'Ghaziabad',
    state: 'UP',
    pincode: '201001',
  },
  socialMedia: {
    facebook: 'https://www.facebook.com/rkmcareer',
    twitter: '',
    linkedin: 'https://www.linkedin.com/company/rkm-career',
    instagram: '',
  },
  salaryRules: [],
};


const App: React.FC = () => {
  const [currentUserType, setCurrentUserType] = useState<UserType>(() => (localStorage.getItem('userType') as UserType) || UserType.NONE);
  const [settings, setSettings] = useState<AppSettings>(() => {
      try {
          const cached = localStorage.getItem('appSettings');
          // FIX: Deep merge for nested objects to preserve defaults if not in cached.
          const parsedCached = cached ? JSON.parse(cached) : {};
          return {
              ...initialSettings,
              ...parsedCached,
              branding: parsedCached.branding ? { ...defaultBranding, ...parsedCached.branding } : defaultBranding,
              panelConfig: parsedCached.panelConfig ? { ...initialSettings.panelConfig, ...parsedCached.panelConfig } : initialSettings.panelConfig,
              contactInfo: parsedCached.contactInfo ? { ...initialSettings.contactInfo, ...parsedCached.contactInfo } : initialSettings.contactInfo,
              socialMedia: parsedCached.socialMedia ? { ...initialSettings.socialMedia, ...parsedCached.socialMedia } : initialSettings.socialMedia,
              salaryRules: parsedCached.salaryRules || [],
          };
      } catch {
          return initialSettings;
      }
  });

  const [currentAppUser, setCurrentAppUser] = useState<AppUser | null>(null);
  const [showLoginPanelForType, setShowLoginPanelForType] = useState<UserType>(UserType.NONE);
  const [showRequestDemoModal, setShowRequestDemoModal] = useState(false);
  const [jobToApplyAfterLogin, setJobToApplyAfterLogin] = useState<Job | null>(null);
  const [jobToApply, setJobToApply] = useState<Job | null>(null);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [publicJobs, setPublicJobs] = useState<Job[]>([]); // New state for combined jobs and approved requirements
  const [activeAdminMenuItem, setActiveAdminMenuItem] = useState<AdminMenuItem>(AdminMenuItem.Dashboard);
  const [activeCandidateMenuItem, setActiveCandidateMenuItem] = useState<CandidateMenuItem>(CandidateMenuItem.ApplyJobs);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(initialStats);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'jobs'>('home'); // Now only for public pages

  // New state for raw real-time data
  const [rawTeamMembers, setRawTeamMembers] = useState<any[]>([]);
  const [rawCandidates, setRawCandidates] = useState<any[]>([]);
  const [rawComplaints, setRawComplaints] = useState<Ticket[]>([]);
  const [rawRequirements, setRawRequirements] = useState<PartnerRequirement[]>([]);
  const [rawDemoRequests, setRawDemoRequests] = useState<DemoRequest[]>([]);
  const [resignation, setResignation] = useState<Resignation | null>(null);
  const [rawSupervisors, setRawSupervisors] = useState<StoreSupervisor[]>([]);
  
  const { popupConfig, showPopup, hidePopup } = usePopup();

  // Effect to set up user-specific real-time listeners
  useEffect(() => {
    let unsubTeam: (() => void) | undefined;
    let unsubCandidates: (() => void) | undefined;
    let unsubComplaints: (() => void) | undefined;
    let unsubDemoRequests: (() => void) | undefined;
    let unsubResignation: (() => void) | undefined;
    let unsubSupervisors: (() => void) | undefined;

    if (currentAppUser) {
        unsubTeam = onTeamMembersChange(setRawTeamMembers);
        unsubCandidates = onCandidatesChange(setRawCandidates);
        unsubComplaints = onComplaintsChange(setRawComplaints);
        unsubSupervisors = onStoreSupervisorsChange(setRawSupervisors);
        if ([UserType.ADMIN, UserType.HR].includes(currentAppUser.userType)) {
            unsubDemoRequests = onDemoRequestsChange(setRawDemoRequests);
        }
        if (currentAppUser.userType === UserType.CANDIDATE) {
            unsubResignation = onUserResignationChange(currentAppUser.uid, (data) => {
                setResignation(data[0] || null);
            });
        }
    }

    return () => { // Cleanup listeners on unmount or when user logs out
        if (unsubTeam) unsubTeam();
        if (unsubCandidates) unsubCandidates();
        if (unsubComplaints) unsubComplaints();
        if (unsubDemoRequests) unsubDemoRequests();
        if (unsubResignation) unsubResignation();
        if (unsubSupervisors) unsubSupervisors();
    };
  }, [currentAppUser]); // Re-run when currentAppUser changes

  // Effect to process data whenever raw data from listeners changes
  useEffect(() => {
    // Only process if there's an authenticated user, otherwise reset to initial stats
    if (!currentAppUser) {
        setDashboardStats(initialStats);
        return;
    }

    const teamStats = processTeamPerformanceStats(rawTeamMembers, rawCandidates);
    const complaints = rawComplaints;
    
    // Filter candidates based on user role before calculating any stats
    let candidates = rawCandidates;
    if (currentAppUser) {
        const { userType, fullName, email } = currentAppUser;

        if (userType === UserType.PARTNER) {
            // Partners see candidates associated with their brands
            const partnerVendor = settings.vendors.find(v => v.email === email);
            const partnerBrands = new Set(partnerVendor?.brandNames || []);
            candidates = rawCandidates.filter(c => c.vendor && partnerBrands.has(c.vendor));
        } else if (userType === UserType.TEAMLEAD) {
            // Team Leads see their own candidates + candidates of their entire downline
            const startIndex = teamStats.findIndex(member => member.id === currentAppUser.uid);

            if (startIndex !== -1) {
                const selfEntry = teamStats[startIndex];
                const selfLevel = selfEntry.level ?? 0;

                const downline = [selfEntry];
                for (let i = startIndex + 1; i < teamStats.length; i++) {
                    const currentMember = teamStats[i];
                    const currentLevel = currentMember.level ?? -1;

                    if (currentLevel > selfLevel) {
                        downline.push(currentMember);
                    } else {
                        break;
                    }
                }
                
                const visibleRecruiters = new Set(downline.map(m => m.teamMember).filter(Boolean));
                candidates = rawCandidates.filter(c => c.recruiter && visibleRecruiters.has(c.recruiter));
            }
        } else if (userType === UserType.TEAM) {
            // Team members only see their own candidates
            candidates = rawCandidates.filter(c => c.recruiter === fullName);
        }
        // Admin and HR see all candidates, so no extra filtering is needed.
    }

    // Create map of Brand Name -> Partner Name from settings
    const vendorPartnerMap = settings.vendors.reduce((acc: any, v: Vendor) => {
        if (v.brandNames && Array.isArray(v.brandNames)) {
            v.brandNames.forEach(brandName => {
                acc[brandName] = v.partnerName || 'N/A';
            });
        }
        return acc;
    }, {});

    // Merge Partner Requirements with Active Jobs (treated as approved requirements)
    const requirements = [
        ...rawRequirements.map((req: any) => ({
            ...req,
            storeName: req.location, // Assuming partner req uses location as store/area
            location: req.location,
            brand: req.client || 'Unknown',
            partnerName: vendorPartnerMap[req.client] || 'N/A'
        })),
        ...jobs.map(j => ({
            id: j.id,
            title: j.title,
            client: j.company, 
            storeName: j.storeName || j.locality || 'Unknown Store', 
            location: j.jobCity || 'Unknown City', 
            openings: j.numberOfOpenings,
            submissionStatus: 'Approved', 
            postedDate: j.postedDate,
            brand: j.company,
            partnerName: vendorPartnerMap[j.company] || 'N/A'
        }))
    ];

    const pipeline = { active: 0, interview: 0, rejected: 0, quit: 0 };
    const processMap = { Screening: 0, Interview: 0, Selected: 0, Joined: 0 };
    const roleMap: Record<string, number> = {};
    const hrStats: HrStats = {
        totalSelected: 0,
        totalOfferReleased: 0,
        totalOnboardingPending: 0,
        newJoining: { day: 0, week: 0, month: 0 }
    };

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tempDate = new Date(today);
    const startOfWeek = new Date(tempDate.setDate(tempDate.getDate() - tempDate.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    candidates.forEach((c: any) => {
        const status = c.status || 'Active';
        const stage = c.stage || 'Sourced';
        const role = c.role || 'Unknown';

        if (status === 'Rejected') pipeline.rejected++;
        else if (status === 'Quit') pipeline.quit++;
        else {
            if (stage === 'Interview') pipeline.interview++;
            else if (stage !== 'Selected' && stage !== 'Joined') pipeline.active++;
        }

        if (status !== 'Rejected' && status !== 'Quit') {
            if (status === 'Joined' || stage === 'Joined') processMap.Joined++;
            else if (stage === 'Selected') processMap.Selected++;
            else if (stage === 'Interview') processMap.Interview++;
            else processMap.Screening++;
            if (role) roleMap[role] = (roleMap[role] || 0) + 1;
        }

        if (stage === 'Selected' || status === 'Selected' || status === 'Joined') hrStats.totalSelected++;
        if ((status && status.includes('Offer')) || stage === 'Offer Sent') hrStats.totalOfferReleased++;
        if (status === 'Onboarding' || (stage === 'Selected' && status !== 'Joined')) hrStats.totalOnboardingPending++;
        if ((status === 'Joined' || stage === 'Joined') && (c.joiningDate || c.appliedDate)) {
            const dateStr = c.joiningDate || c.appliedDate;
            const joinDate = new Date(dateStr);
            if (joinDate >= startOfToday) hrStats.newJoining.day++;
            if (joinDate >= startOfWeek) hrStats.newJoining.week++;
            if (joinDate >= startOfMonth) hrStats.newJoining.month++;
        }
    });

    // --- Hire Yourself Stats Calculation ---
    const teamUserIds = new Set(rawTeamMembers.filter((m: any) => m.userType === UserType.TEAM).map((m: any) => m.id));
    const totalHireYourselfUsers = teamUserIds.size;
    const teamJobs = jobs.filter(j => j.adminId && teamUserIds.has(j.adminId));
    const totalHireYourselfJobs = teamJobs.length;
    const teamJobLookup = new Set(teamJobs.map(j => `${j.company}||${j.title}`));
    const totalHireYourselfHired = rawCandidates.filter(c => 
        (c.status === 'Joined' || c.stage === 'Joined') && 
        teamJobLookup.has(`${c.vendor}||${c.role}`)
    ).length;
    const hireYourselfStats: HireYourselfStats = {
        totalUsers: totalHireYourselfUsers,
        jobsPosted: totalHireYourselfJobs,
        hiredCandidates: totalHireYourselfHired,
    };


    const processMetrics: ProcessMetric[] = Object.entries(processMap).map(([name, count]) => ({ name, count, color: 'bg-blue-500' }));
    const roleMetrics: RoleMetric[] = Object.entries(roleMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count], i) => ({ name, count, color: ['bg-indigo-500', 'bg-pink-500', 'bg-orange-500'][i % 3] }));

    const complaintStats = complaints.reduce((acc, c: any) => {
        const status = c.status;
        if (['Open', 'In Progress', 'Active'].includes(status)) acc.active++;
        else if (['Resolved', 'Closed'].includes(status)) acc.closed++;
        return acc;
    }, { active: 0, closed: 0 });

    const partnerReqStats = requirements.reduce((acc, req: any) => {
        acc.total++;
        if (req.submissionStatus === 'Pending Review') acc.pending++;
        else if (req.submissionStatus === 'Approved') acc.approved++;
        return acc;
    }, { total: 0, pending: 0, approved: 0 });
    
    const vendorStats: VendorStats = {
        total: settings.vendors.length,
        totalJobs: jobs.length,
        totalHired: processMap.Joined,
    };

    // --- Process All Requirement Breakdowns ---
    const teamMembersForAssignment = teamStats.map(t => t.teamMember).filter(Boolean);
    const requirementsWithTeam = requirements.map((req, index) => ({
        ...req,
        teamMember: teamMembersForAssignment.length > 0 ? teamMembersForAssignment[index % teamMembersForAssignment.length] : 'Unassigned Team',
    }));

    const createBreakdown = (data: any[], keySelector: (item: any) => string, breakdownSelectors: { [key: string]: (item: any) => string }) => {
        const map: { [key: string]: Omit<DetailedRequirementBreakdownRow, 'id' | 'name'> & { [breakdownKey: string]: any } } = {};
        data.forEach((item: any) => {
            const key = keySelector(item);
            // Default location for the row context
            if (!map[key]) map[key] = { totalOpenings: 0, pending: 0, approved: 0, location: item.location || 'N/A' };
            Object.keys(breakdownSelectors).forEach(bKey => {
                if (!map[key][`${bKey}Breakdown`]) map[key][`${bKey}Breakdown`] = {};
            });

            const openings = Number(item.openings) || 0;
            map[key].totalOpenings += openings;
            if (item.submissionStatus === 'Pending Review') map[key].pending += openings;
            else if (item.submissionStatus === 'Approved') map[key].approved += openings;

            Object.entries(breakdownSelectors).forEach(([bKey, selector]) => {
                const bVal = selector(item);
                const breakdownMap = map[key][`${bKey}Breakdown`];
                breakdownMap[bVal] = (breakdownMap[bVal] || 0) + openings;
            });
        });
        return Object.keys(map).map(key => ({ id: key, name: key, ...map[key] }));
    };

    const requirementBreakdownData: RequirementBreakdownData = {
        team: createBreakdown(requirementsWithTeam, item => item.teamMember, { 
            location: i => i.location, 
            role: i => i.title, 
            store: i => i.storeName,
            brand: i => i.brand,
            partnerName: i => i.partnerName
        }),
        partner: createBreakdown(requirements, item => item.client || 'Unassigned', { 
            location: i => i.location, 
            role: i => i.title, 
            store: i => i.storeName,
            partnerName: i => i.partnerName 
        }),
        store: createBreakdown(requirements, item => item.storeName || 'N/A', { 
            role: i => i.title, 
            partner: i => i.client, // legacy mapping for safety
            brand: i => i.brand,
            partnerName: i => i.partnerName
        }),
        role: createBreakdown(requirements, item => item.title || 'N/A', { 
            location: i => i.location, 
            store: i => i.storeName, 
            partner: i => i.client, // legacy mapping for safety
            brand: i => i.brand,
            partnerName: i => i.partnerName
        }),
    };

    setDashboardStats(prev => ({
        ...prev,
        pipeline,
        vendor: vendorStats,
        complaint: complaintStats,
        partnerRequirement: partnerReqStats,
        hrStats,
        hireYourselfStats,
        process: processMetrics,
        role: roleMetrics,
        team: teamStats,
        requirementBreakdown: requirementBreakdownData,
    }));
  }, [rawTeamMembers, rawCandidates, rawComplaints, rawRequirements, jobs, settings.vendors, currentAppUser]);

  const handleInitError = (error: any, collectionName: string) => {
      console.error(`Error fetching ${collectionName}:`, error);
      if (error.code === 'permission-denied' && !initError) {
          setInitError(`Permission denied when fetching '${collectionName}'. This usually means your Firestore security rules are not deployed correctly. For the public homepage to work, both the 'jobs' and 'settings' collections must be publicly readable. Please ensure your firestore.rules file contains 'allow read: if true;' for both collections and deploy your rules by running 'firebase deploy --only firestore:rules' in your terminal.`);
      }
  };

  useEffect(() => {
    // These listeners are for public data, so they should always be active.
    const unsubscribeJobs = onJobsChange(setJobs, (error) => handleInitError(error, 'jobs'));
    const unsubscribeRequirements = onRequirementsChange(setRawRequirements as (reqs: any[]) => void, (error) => handleInitError(error, 'partner_requirements'));
    
    // Cleanup listeners on component unmount
    return () => {
        if (unsubscribeJobs) unsubscribeJobs();
        if (unsubscribeRequirements) unsubscribeRequirements();
    };
  }, []);

  // New effect to set public jobs. Combines direct jobs and approved partner requirements.
  useEffect(() => {
    // Filter partner requirements that are approved
    const approvedRequirementsAsJobs: Job[] = rawRequirements
        .filter(req => req.submissionStatus === 'Approved')
        .map((req): Job => ({
            id: req.id,
            title: req.title,
            company: req.brand,
            partnerName: req.partnerName,
            storeName: req.storeName || '',
            description: req.description,
            postedDate: req.postedDate,
            adminId: '', // Not applicable for requirements
            experienceLevel: req.experienceLevel,
            salaryRange: req.salaryRange,
            numberOfOpenings: req.openings,
            companyLogoSrc: req.companyLogoSrc || '',
            jobCategory: 'Partner', // Mark as a partner job
            jobCity: req.location,
            locality: req.storeName || req.location,
            minQualification: req.minQualification,
            genderPreference: req.genderPreference,
            jobType: req.jobType,
            workLocationType: req.workLocationType,
            workingDays: req.workingDays,
            jobShift: req.jobShift,
            interviewAddress: '', // Not applicable for public view
            salaryType: req.salaryType,
            incentive: req.incentive || '',
        }));
    
    // Combine direct jobs and approved requirements
    const combinedJobs = [...jobs, ...approvedRequirementsAsJobs];
    
    // Sort all public jobs by date
    const sortedJobs = combinedJobs.sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );
    
    setPublicJobs(sortedJobs);
  }, [jobs, rawRequirements]); // Depend on both jobs and requirements


  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        const savedSettings = await getSettings();
        if (savedSettings) {
          const mergedSettings = {
            ...initialSettings, ...savedSettings,
            branding: savedSettings.branding ? { ...defaultBranding, ...savedSettings.branding } : defaultBranding,
            logoSrc: savedSettings.logoSrc || null,
            partnerLogos: savedSettings.partnerLogos || [],
            panelConfig: savedSettings.panelConfig ? { ...initialSettings.panelConfig, ...savedSettings.panelConfig } : initialSettings.panelConfig,
            quickLinks: savedSettings.quickLinks || [],
            contactInfo: savedSettings.contactInfo ? { ...initialSettings.contactInfo, ...savedSettings.contactInfo } : initialSettings.contactInfo,
            socialMedia: savedSettings.socialMedia ? { ...initialSettings.socialMedia, ...savedSettings.socialMedia } : initialSettings.socialMedia,
            salaryRules: savedSettings.salaryRules || [],
          };
          setSettings(mergedSettings);
          localStorage.setItem('appSettings', JSON.stringify(mergedSettings));
        }
      } catch (error: any) { 
        handleInitError(error, 'settings');
      }
    };
    fetchAllSettings();
  }, [initError]);

  const handleUpdateSettings = async (settingsUpdate: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...settingsUpdate };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    await updateSettings(settingsUpdate);
  };
  const handleUpdateBranding = (newBranding: BrandingConfig) => handleUpdateSettings({ branding: newBranding });
  const handleLogoUpload = (newLogo: string) => handleUpdateSettings({ logoSrc: newLogo });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        let profile = await getUserProfile(user.uid);
        if (!profile) {
            // If profile is missing (e.g., first-time admin login via auto-create), create it.
            // For the specific admin email, ensure ADMIN type.
            const userTypeToCreate = user.email === 'rkrohit19kumar@gmail.com' ? UserType.ADMIN : UserType.CANDIDATE;
            await createUserProfile(user.uid, user.email, userTypeToCreate, user.email?.split('@')[0] || 'New User');
            profile = await getUserProfile(user.uid); // Re-fetch profile after creation
        }
        if (profile) {
          // FIX: Spread the entire profile object to ensure all fields (like reportingManager) are loaded.
          const appUser: AppUser = {
            ...profile, // Load all fields from the Firestore profile
            uid: user.uid,
            email: user.email,
            userType: user.email === 'rkrohit19kumar@gmail.com' ? UserType.ADMIN : profile.userType,
          };
          handleLoginSuccess(appUser);
        } else {
          // Fallback if profile still not found after attempt, sign out.
          await signOut(auth);
          setCurrentUserType(UserType.NONE);
          setCurrentAppUser(null);
          localStorage.removeItem('userType');
          setCurrentPage('home'); // Reset to home on logout
        }
      } else if (currentUserType !== UserType.NONE) {
        // If user logs out, clear state
        setCurrentAppUser(null);
        setCurrentUserType(UserType.NONE);
        localStorage.removeItem('userType');
        setCurrentPage('home'); // Reset to home on logout
      }
    });
    return () => unsubscribe();
  }, [currentUserType]);

  const handleLoginSuccess = (user: AppUser) => {
    const type = user.userType;
    setCurrentAppUser(user);
    setCurrentUserType(type);
    localStorage.setItem('userType', type);

    if ([UserType.ADMIN, UserType.HR, UserType.PARTNER, UserType.TEAMLEAD].includes(type)) {
      setActiveAdminMenuItem(AdminMenuItem.Dashboard);
    } else if (type === UserType.TEAM) {
      // For TEAM users, they now get their own layout, so no default admin menu item is needed.
    }
    if (type === UserType.STORE_SUPERVISOR) setActiveAdminMenuItem(AdminMenuItem.SupervisorDashboard);
    
    // Check for job application flow *before* default navigation
    if (jobToApplyAfterLogin && user.userType === UserType.CANDIDATE) {
        if (user.profile_complete) {
            // Profile is complete, open the apply modal immediately
            setJobToApply(jobToApplyAfterLogin);
            setJobToApplyAfterLogin(null);
        } else {
            // Profile is incomplete, guide them to profile page. The jobToApplyAfterLogin is preserved.
            setActiveCandidateMenuItem(CandidateMenuItem.MyProfile);
            showPopup({ type: 'success', title: 'Welcome!', message: 'Please complete your profile to apply for the job.', buttonText: 'Okay' });
        }
    } else {
        // Standard login flow
        if (type === UserType.CANDIDATE && !user.profile_complete) {
            setActiveCandidateMenuItem(CandidateMenuItem.MyProfile);
            showPopup({ type: 'success', title: 'Welcome!', message: 'Please complete your profile to start applying for jobs.', buttonText: 'Okay' });
        } else if (type === UserType.CANDIDATE) {
            setActiveCandidateMenuItem(CandidateMenuItem.ApplyJobs);
        }
    }

    setShowLoginPanelForType(UserType.NONE);
    setCurrentPage('home');
  };

  const handleProfileComplete = async () => {
    if (!currentAppUser) return;
    const profile = await getUserProfile(currentAppUser.uid);
    if(profile) {
        const updatedUser = { ...currentAppUser, ...profile, profile_complete: true };
        setCurrentAppUser(updatedUser);
        
        if (jobToApplyAfterLogin) {
            // Profile is now complete, open the apply modal
            setJobToApply(jobToApplyAfterLogin);
            setJobToApplyAfterLogin(null);
        } else {
            // No pending job application, just navigate to jobs list
            setActiveCandidateMenuItem(CandidateMenuItem.ApplyJobs);
        }
    }
  };

  const handleLoginSelect = useCallback((type: UserType) => { setShowLoginPanelForType(type); setIsRegisteringAdmin(false); }, []);
  const handleLogout = useCallback(async () => { 
    await signOut(auth);
    setCurrentAppUser(null);
    setCurrentUserType(UserType.NONE);
    localStorage.removeItem('userType');
    setActiveAdminMenuItem(AdminMenuItem.Dashboard);
    setActiveCandidateMenuItem(CandidateMenuItem.ApplyJobs);
    setCurrentPage('home'); // Reset to home on logout
  }, []);
  const handleCancelLogin = useCallback(() => { setShowLoginPanelForType(UserType.NONE); setIsRegisteringAdmin(false); }, []);

  const handleAddJob = useCallback(async (newJob: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => {
    if (!currentAppUser || ![UserType.ADMIN, UserType.HR, UserType.TEAM].includes(currentAppUser.userType)) {
      showPopup({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to post jobs.' });
      throw new Error('Permission Denied');
    }
    try {
      await createJob({ ...newJob, adminId: currentAppUser.uid });
      // No need to setJobs optimistically, onJobsChange listener will update state.
      showPopup({ type: 'success', title: 'Success!', message: 'Job posted successfully!' });
    } catch (error) { 
      console.error("Error creating job:", error); 
      showPopup({ type: 'error', title: 'Error', message: 'Failed to post job.' });
      throw error;
    }
  }, [currentAppUser, showPopup]);
  
  const handleUpdateJob = useCallback(async (jobId: string, jobData: Partial<Omit<Job, 'id' | 'postedDate' | 'adminId'>>) => {
    if (!currentAppUser || ![UserType.ADMIN, UserType.HR, UserType.TEAM].includes(currentAppUser.userType)) {
      showPopup({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update jobs.' });
      throw new Error('Permission Denied');
    }
    try {
        await updateJob(jobId, jobData);
        // No need to setJobs optimistically, onJobsChange listener will update state.
        showPopup({ type: 'success', title: 'Success!', message: 'Job updated successfully!' });
    } catch (error) {
        console.error("Error updating job:", error);
        showPopup({ type: 'error', title: 'Error', message: 'Failed to update job.' });
        throw error;
    }
  }, [currentAppUser, showPopup]);

  const handleDeleteRequirement = useCallback(async (id: string) => {
    if (!currentAppUser || ![UserType.ADMIN, UserType.HR].includes(currentAppUser.userType)) {
        showPopup({ type: 'error', title: 'Permission Denied', message: 'Only administrators or HR can delete requirements.' });
        return;
    }

    if (window.confirm("Delete this requirement? This action cannot be undone.")) {
        try {
            await deletePartnerRequirement(id);
            showPopup({ type: 'success', title: 'Deleted!', message: 'Requirement has been deleted.' });
        } catch (error) {
            console.error("Error deleting requirement:", error);
            showPopup({ type: 'error', title: 'Error', message: 'Failed to delete requirement.' });
        }
    }
  }, [currentAppUser, showPopup]);


  const handleDeleteJob = useCallback(async (id: string) => {
    if (!currentAppUser || ![UserType.ADMIN, UserType.HR, UserType.TEAM].includes(currentAppUser.userType)) {
      showPopup({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to delete jobs.' });
      return;
    }
    if (window.confirm("Delete this job?")) {
      try { 
        await deleteJob(id);
        // The onSnapshot listener will automatically update the state.
        showPopup({ type: 'success', title: 'Deleted!', message: 'Job has been deleted.' });
      }
      catch (error) { 
        console.error("Error deleting job:", error); 
        showPopup({ type: 'error', title: 'Error', message: 'Failed to delete job.' });
      }
    }
  }, [currentAppUser, showPopup]);

  const handleApplyNow = useCallback((job: Job) => {
    if (currentAppUser?.userType === UserType.CANDIDATE) {
        if (currentAppUser.profile_complete) {
            setJobToApply(job);
        } else {
            showPopup({ type: 'info', title: 'Profile Incomplete', message: 'Please complete your profile before applying for jobs.', buttonText: 'Go to Profile' });
            setJobToApplyAfterLogin(job);
            setActiveCandidateMenuItem(CandidateMenuItem.MyProfile);
        }
    } else {
      showPopup({ type: 'info', title: 'Login Required', message: 'Please log in as a Candidate to apply for jobs.', buttonText: 'Login' });
      setJobToApplyAfterLogin(job);
      handleLoginSelect(UserType.CANDIDATE);
    }
  }, [currentAppUser, handleLoginSelect, showPopup, setJobToApplyAfterLogin]);

  const handleApplicationSubmit = async (details: { role: string; teamMember: string }) => {
    if (!currentAppUser || !jobToApply) return;

    // Check for existing applications for the same role that are not rejected
    const existingApplications = rawCandidates.filter(c => 
        c.userId === currentAppUser.uid && 
        c.role === details.role
    );
    
    const hasActiveApplication = existingApplications.some(app => app.status !== 'Rejected');

    if (hasActiveApplication) {
        showPopup({
            type: 'error',
            title: 'Application Blocked',
            message: 'You have already applied for this role. You may apply again only if your previous application has been rejected.',
            buttonText: 'Okay'
        });
        setJobToApply(null); // Close the application modal
        return; // Stop the submission process
    }

    const applicationData = {
        userId: currentAppUser.uid,
        name: currentAppUser.fullName,
        phone: currentAppUser.phone,
        email: currentAppUser.email,
        vendor: jobToApply.company,
        partnerName: jobToApply.partnerName, // Explicitly save the partner name
        role: details.role,
        storeLocation: jobToApply.storeName || jobToApply.locality,
        location: jobToApply.jobCity,
        status: 'Active',
        stage: 'Applied', // NEW: Change initial stage for applied candidates to 'Applied'
        callStatus: 'Applied', // This indicates it's a direct application from the portal
        recruiter: details.teamMember, // The selected team member
    };

    try {
        await submitApplication(applicationData);
        showPopup({
            type: 'success',
            title: 'Application Submitted!',
            message: `Your application for "${jobToApply.title}" has been received. You will be notified of the next steps in the "My Interviews" tab.`
        });
        setJobToApply(null);
        setActiveCandidateMenuItem(CandidateMenuItem.MyInterviews);
    } catch (error) {
        console.error("Application submission error:", error);
        showPopup({ type: 'error', title: 'Submission Failed', message: 'There was an error submitting your application. Please try again.' });
    }
  };

  const handleAdminMenuItemClick = useCallback((item: AdminMenuItem) => setActiveAdminMenuItem(item), []);
  const handleCandidateMenuItemClick = useCallback((item: CandidateMenuItem) => setActiveCandidateMenuItem(item), []);
  
  // Public users can navigate to the jobs page directly.
  const handleNavigateToJobs = useCallback(() => setCurrentPage('jobs'), []);
  // Logged-in users navigate to their dashboard, unauthenticated users navigate to the public home.
  const handleNavigateHome = useCallback(() => {
    if (currentUserType !== UserType.NONE) {
      setCurrentPage('home'); // For authenticated users, 'home' means their dashboard when the rendering logic evaluates
                              // that they are logged in.
      setActiveAdminMenuItem(AdminMenuItem.Dashboard); // Reset admin view
      setActiveCandidateMenuItem(CandidateMenuItem.ApplyJobs); // Reset candidate view
    } else {
      setCurrentPage('home'); // For unauthenticated, 'home' is the public homepage
    }
  }, [currentUserType]);

  const hasAdminPanelLayout = [UserType.ADMIN, UserType.HR, UserType.PARTNER, UserType.TEAMLEAD, UserType.STORE_SUPERVISOR].includes(currentUserType);
  const hasCandidatePanelLayout = currentUserType === UserType.CANDIDATE;

  const modalInfo = {
    [UserType.ADMIN]: { title: 'Admin Registration', description: 'Create a new administrator account.' },
    [UserType.TEAM]: { title: 'Team Login', description: 'Log in or sign up to post jobs and manage your team.' },
    [UserType.CANDIDATE]: { title: 'Candidate Login', description: 'Welcome Candidate. Please log in or sign up to access your dashboard.' },
    [UserType.PARTNER]: { title: 'Partner Login', description: 'Welcome Partner. Please log in to access your dashboard.' },
    [UserType.HR]: { title: 'HR Login', description: 'Access the HR dashboard.' },
    [UserType.TEAMLEAD]: { title: 'Team Lead Login', description: 'Access the Team Lead dashboard.' },
    [UserType.STORE_SUPERVISOR]: { title: 'Store Supervisor Login', description: 'Access the store management panel.' },
    [UserType.NONE]: { title: 'Login', description: 'Sign in to your account.' }
  };
  const { title, description } = isRegisteringAdmin ? modalInfo[UserType.ADMIN] : modalInfo[showLoginPanelForType];
  
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* Render the public Header ONLY if not logged in */}
        {currentUserType === UserType.NONE && (
          <Header 
            userType={currentUserType} 
            onLoginSelect={handleLoginSelect} 
            onLogout={handleLogout} 
            onHireUsClick={() => setShowRequestDemoModal(true)} 
            logoSrc={settings.logoSrc}
            onNavigateHome={handleNavigateHome}
            portalName={settings.branding.portalName}
          />
        )}
        <div className="flex-grow flex flex-col">
          {currentUserType === UserType.TEAM ? (
            <HireYourselfLayout
              currentUser={currentAppUser}
              onLogout={handleLogout}
              jobs={jobs}
              rawCandidates={rawCandidates}
              onAddJob={handleAddJob}
              onUpdateJob={handleUpdateJob}
              onDeleteJob={handleDeleteJob}
              vendors={settings.vendors}
              stores={settings.stores}
            />
          ) : hasAdminPanelLayout || hasCandidatePanelLayout ? ( // Other logged-in users
            <Dashboard
              userType={currentUserType} jobs={publicJobs} onAddJob={handleAddJob} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob}
              onDeleteRequirement={handleDeleteRequirement}
              currentLogoSrc={settings.logoSrc} onLogoUpload={handleLogoUpload}
              pipelineStats={dashboardStats.pipeline} vendorStats={dashboardStats.vendor} complaintStats={dashboardStats.complaint}
              partnerRequirementStats={dashboardStats.partnerRequirement}
              hrStats={dashboardStats.hrStats}
              hireYourselfStats={dashboardStats.hireYourselfStats}
              candidatesByProcess={dashboardStats.process} candidatesByRole={dashboardStats.role} teamPerformance={dashboardStats.team}
              requirementBreakdown={dashboardStats.requirementBreakdown}
              activeAdminMenuItem={activeAdminMenuItem} onAdminMenuItemClick={handleAdminMenuItemClick}
              activeCandidateMenuItem={activeCandidateMenuItem} onCandidateMenuItemClick={handleCandidateMenuItemClick}
              onLogout={handleLogout}
              branding={settings.branding} onUpdateBranding={handleUpdateBranding}
              currentUser={currentAppUser}
              onApplyNow={handleApplyNow}
              onProfileComplete={handleProfileComplete}
              vendors={settings.vendors}
              jobRoles={settings.jobRoles}
              systemRoles={settings.systemRoles}
              locations={settings.locations}
              stores={settings.stores}
              partnerLogos={settings.partnerLogos}
              panelConfig={settings.panelConfig}
              onUpdateSettings={handleUpdateSettings}
              showPopup={showPopup}
              demoRequests={rawDemoRequests}
              complaints={rawComplaints}
              candidates={rawCandidates}
              partnerRequirements={rawRequirements}
              resignation={resignation}
              supervisors={rawSupervisors}
              quickLinks={settings.quickLinks}
              contactInfo={settings.contactInfo} 
              socialMedia={settings.socialMedia}
              salaryRules={settings.salaryRules}
            />
          ) : currentPage === 'home' ? ( // Not logged in, on public home
            <HomePage 
              partners={settings.partnerLogos}
              currentUserType={currentUserType} 
              onLoginSelect={handleLoginSelect} 
              onNavigateToAdminJobBoard={() => setActiveAdminMenuItem(AdminMenuItem.ManageJobBoard)}
              branding={settings.branding}
              initError={initError}
              onNavigateToJobs={handleNavigateToJobs} // Public home still navigates to public jobs
            />
          ) : ( // Not logged in, on public jobs page
             <Suspense fallback={<div className="flex-grow flex items-center justify-center p-12">Loading jobs...</div>}>
                <JobsPage 
                  jobs={publicJobs}
                  onApplyNow={handleApplyNow}
                  currentUserType={currentUserType}
                />
             </Suspense>
          )}
        </div>
        <Modal isOpen={showLoginPanelForType !== UserType.NONE} onClose={handleCancelLogin} title={title} description={description}>
          <LoginPanel userType={showLoginPanelForType} onLoginSuccess={handleLoginSuccess} onLoginError={console.error} initialIsSignUp={isRegisteringAdmin} />
        </Modal>
        <RequestDemoModal isOpen={showRequestDemoModal} onClose={() => setShowRequestDemoModal(false)} />
        {/* Render footer only if not within any logged-in panel */}
        {currentUserType === UserType.NONE && <Footer logoSrc={settings.logoSrc} contactInfo={settings.contactInfo} socialMedia={settings.socialMedia} quickLinks={settings.quickLinks} />}
      </div>
      <ApplyJobModal 
        job={jobToApply}
        currentUser={currentAppUser}
        onClose={() => setJobToApply(null)}
        onSubmit={handleApplicationSubmit}
        teamMembers={rawTeamMembers}
      />
      <Popup
        isOpen={popupConfig.isOpen}
        type={popupConfig.type}
        title={popupConfig.title}
        message={popupConfig.message}
        buttonText={popupConfig.buttonText || ''}
        onClose={hidePopup}
      />
    </>
  );
};
export default App;
