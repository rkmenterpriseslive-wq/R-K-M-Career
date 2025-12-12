
import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Header from './components/Header';
import LoginPanel from './components/LoginPanel';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import Modal from './components/Modal';
import RequestDemoModal from './components/RequestDemoModal';
import { UserType, Job, AdminMenuItem, CandidateMenuItem, AppUser, BrandingConfig, CandidatePipelineStats, VendorStats, ComplaintStats, PartnerRequirementStats, HrStats, ProcessMetric, RoleMetric, TeamMemberPerformance, PanelConfig, RequirementBreakdownData, DetailedRequirementBreakdownRow } from './types';
import { getJobs, createJob, deleteJob, getUserProfile, createUserProfile, getSettings, updateSettings, onTeamMembersChange, onCandidatesChange, onComplaintsChange, onRequirementsChange, processTeamPerformanceStats } from './services/supabaseService';
import { auth } from './services/firebaseService';

interface DashboardStats {
  pipeline: CandidatePipelineStats;
  vendor: VendorStats;
  complaint: ComplaintStats;
  partnerRequirement: PartnerRequirementStats;
  hrStats: HrStats;
  process: ProcessMetric[];
  role: RoleMetric[];
  team: TeamMemberPerformance[];
  requirementBreakdown: RequirementBreakdownData;
}

interface AppSettings {
  branding: BrandingConfig;
  logoSrc: string | null;
  vendors: any[];
  jobRoles: string[];
  systemRoles: { name: string; panel: string }[];
  locations: string[];
  stores: { id: string; name: string; location: string }[];
  panelConfig: PanelConfig;
}


const initialStats: DashboardStats = {
  pipeline: { active: 0, interview: 0, rejected: 0, quit: 0 },
  vendor: { total: 0 },
  complaint: { active: 0, closed: 0 },
  partnerRequirement: { total: 0, pending: 0, approved: 0 },
  hrStats: { totalSelected: 0, totalOfferReleased: 0, totalOnboardingPending: 0, newJoining: { day: 0, week: 0, month: 0 } },
  process: [],
  role: [],
  team: [],
  requirementBreakdown: { team: [], partner: [], store: [], role: [] },
};

const defaultLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

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
  logoSrc: defaultLogo,
  vendors: [],
  jobRoles: [],
  systemRoles: [],
  locations: [],
  stores: [],
  panelConfig: {
      emailNotifications: true,
      maintenanceMode: false,
  },
};


const App: React.FC = () => {
  const [currentUserType, setCurrentUserType] = useState<UserType>(() => (localStorage.getItem('userType') as UserType) || UserType.NONE);
  const [settings, setSettings] = useState<AppSettings>(() => {
      try {
          const cached = localStorage.getItem('appSettings');
          return cached ? { ...initialSettings, ...JSON.parse(cached) } : initialSettings;
      } catch {
          return initialSettings;
      }
  });

  const [currentAppUser, setCurrentAppUser] = useState<AppUser | null>(null);
  const [showLoginPanelForType, setShowLoginPanelForType] = useState<UserType>(UserType.NONE);
  const [showRequestDemoModal, setShowRequestDemoModal] = useState(false);
  const [jobToApplyAfterLogin, setJobToApplyAfterLogin] = useState<Job | null>(null);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeAdminMenuItem, setActiveAdminMenuItem] = useState<AdminMenuItem>(AdminMenuItem.Dashboard);
  const [activeCandidateMenuItem, setActiveCandidateMenuItem] = useState<CandidateMenuItem>(CandidateMenuItem.ApplyJobs);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(initialStats);

  // New state for raw real-time data
  const [rawTeamMembers, setRawTeamMembers] = useState<any[]>([]);
  const [rawCandidates, setRawCandidates] = useState<any[]>([]);
  const [rawComplaints, setRawComplaints] = useState<any[]>([]);
  const [rawRequirements, setRawRequirements] = useState<any[]>([]);

  // Effect to set up real-time listeners
  useEffect(() => {
    const unsubTeam = onTeamMembersChange(setRawTeamMembers);
    const unsubCandidates = onCandidatesChange(setRawCandidates);
    const unsubComplaints = onComplaintsChange(setRawComplaints);
    const unsubRequirements = onRequirementsChange(setRawRequirements);

    return () => { // Cleanup listeners on unmount
        unsubTeam();
        unsubCandidates();
        unsubComplaints();
        unsubRequirements();
    };
  }, []);

  // Effect to process data whenever raw data from listeners changes
  useEffect(() => {
    const teamStats = processTeamPerformanceStats(rawTeamMembers);
    const candidates = rawCandidates;
    const complaints = rawComplaints;
    
    // Create map of Brand Name -> Partner Name from settings
    const vendorPartnerMap = settings.vendors.reduce((acc: any, v: any) => {
        acc[v.name] = v.partnerName || 'N/A';
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
        complaint: complaintStats,
        partnerRequirement: partnerReqStats,
        hrStats,
        process: processMetrics,
        role: roleMetrics,
        team: teamStats,
        requirementBreakdown: requirementBreakdownData,
    }));
  }, [rawTeamMembers, rawCandidates, rawComplaints, rawRequirements, jobs, settings.vendors]);

  useEffect(() => { setDashboardStats(prev => ({ ...prev, vendor: { total: settings.vendors.length } })); }, [settings.vendors]);

  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        const savedSettings = await getSettings();
        if (savedSettings) {
          const mergedSettings = {
            ...initialSettings, ...savedSettings,
            branding: savedSettings.branding ? { ...defaultBranding, ...savedSettings.branding } : defaultBranding,
            logoSrc: savedSettings.logoSrc || defaultLogo,
            panelConfig: savedSettings.panelConfig || initialSettings.panelConfig,
          };
          setSettings(mergedSettings);
          localStorage.setItem('appSettings', JSON.stringify(mergedSettings));
        }
      } catch (error) { console.error("Failed to load settings:", error); }
    };
    fetchAllSettings();
  }, []);

  const handleUpdateSettings = async (settingsUpdate: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...settingsUpdate };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    await updateSettings(settingsUpdate);
  };
  const handleUpdateBranding = (newBranding: BrandingConfig) => handleUpdateSettings({ branding: newBranding });
  const handleLogoUpload = (newLogo: string) => handleUpdateSettings({ logoSrc: newLogo });

  const fetchJobsData = useCallback(async () => {
    try { setJobs(await getJobs()); } catch (error) { console.error("Failed to fetch jobs:", error); }
  }, []);
  useEffect(() => { fetchJobsData(); }, [fetchJobsData]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        let profile = await getUserProfile(user.uid);
        if (!profile) {
            await createUserProfile(user.uid, user.email || '', user.email === 'rkrohit19kumar@gmail.com' ? UserType.ADMIN : UserType.CANDIDATE, (user.email || '').split('@')[0] || 'New User');
            profile = await getUserProfile(user.uid);
        }
        if (profile) {
          const appUser: AppUser = {
            uid: user.uid, email: user.email,
            userType: user.email === 'rkrohit19kumar@gmail.com' ? UserType.ADMIN : profile.userType,
            profile_complete: profile.profile_complete,
          };
          handleLoginSuccess(appUser);
        } else {
          await signOut(auth);
          setCurrentUserType(UserType.NONE);
          localStorage.removeItem('userType');
        }
      } else if (currentUserType !== UserType.NONE) {
        setCurrentAppUser(null);
        setCurrentUserType(UserType.NONE);
        localStorage.removeItem('userType');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: AppUser) => {
    const type = user.userType;
    setCurrentAppUser(user);
    setCurrentUserType(type);
    localStorage.setItem('userType', type);

    if ([UserType.ADMIN, UserType.HR, UserType.PARTNER, UserType.TEAMLEAD, UserType.TEAM].includes(type)) setActiveAdminMenuItem(AdminMenuItem.Dashboard);
    if (type === UserType.STORE_SUPERVISOR) setActiveAdminMenuItem(AdminMenuItem.SupervisorDashboard);
    if (type === UserType.CANDIDATE && !user.profile_complete) {
        setActiveCandidateMenuItem(CandidateMenuItem.MyProfile);
        alert('Welcome! Please complete your profile to start applying for jobs.');
    } else if (type === UserType.CANDIDATE) {
        setActiveCandidateMenuItem(CandidateMenuItem.ApplyJobs);
    }

    setShowLoginPanelForType(UserType.NONE);
    if (jobToApplyAfterLogin && user.userType === UserType.CANDIDATE && user.profile_complete) {
      setTimeout(() => {
        alert(`Logged in successfully! You have now applied for: ${jobToApplyAfterLogin.title}.`);
        setJobToApplyAfterLogin(null);
      }, 300);
    }
  };

  const handleProfileComplete = async () => {
    if (!currentAppUser) return;
    const profile = await getUserProfile(currentAppUser.uid);
    if(profile) {
        setCurrentAppUser({ ...currentAppUser, ...profile });
        if (jobToApplyAfterLogin) {
            alert(`Profile complete! You have now applied for: ${jobToApplyAfterLogin.title}.`);
            setJobToApplyAfterLogin(null);
        }
        setActiveCandidateMenuItem(CandidateMenuItem.ApplyJobs);
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
  }, []);
  const handleCancelLogin = useCallback(() => { setShowLoginPanelForType(UserType.NONE); setIsRegisteringAdmin(false); }, []);

  const handleAddJob = useCallback(async (newJob: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => {
    if (!currentAppUser || ![UserType.ADMIN, UserType.HR].includes(currentAppUser.userType)) return alert('Only administrators or HR can post jobs.');
    try {
      const createdJob = await createJob({ ...newJob, adminId: currentAppUser.uid });
      if (createdJob) { setJobs(prev => [createdJob, ...prev]); alert('Job posted successfully!'); }
    } catch (error) { console.error("Error creating job:", error); alert('Failed to post job.'); }
  }, [currentAppUser]);

  const handleDeleteJob = useCallback(async (id: string) => {
    if (!currentAppUser || ![UserType.ADMIN, UserType.HR].includes(currentAppUser.userType)) return alert('Only administrators or HR can delete jobs.');
    if (window.confirm("Delete this job?")) {
      try { await deleteJob(id); setJobs(prev => prev.filter(job => job.id !== id)); alert('Job deleted!'); }
      catch (error) { console.error("Error deleting job:", error); alert('Failed to delete job.'); }
    }
  }, [currentAppUser]);

  const handleApplyNow = useCallback((job: Job) => {
    if (currentAppUser?.userType === UserType.CANDIDATE) {
        alert(`You have successfully applied for: ${job.title}.`);
    } else {
      alert('Please log in as an Employee to apply for jobs.');
      setJobToApplyAfterLogin(job);
      handleLoginSelect(UserType.CANDIDATE);
    }
  }, [currentAppUser, handleLoginSelect]);

  const handleAdminMenuItemClick = useCallback((item: AdminMenuItem) => setActiveAdminMenuItem(item), []);
  const handleCandidateMenuItemClick = useCallback((item: CandidateMenuItem) => setActiveCandidateMenuItem(item), []);

  const hasAdminPanelLayout = [UserType.ADMIN, UserType.HR, UserType.PARTNER, UserType.TEAMLEAD, UserType.TEAM, UserType.STORE_SUPERVISOR].includes(currentUserType);
  const hasCandidatePanelLayout = currentUserType === UserType.CANDIDATE;
  
  const modalInfo = {
    [UserType.ADMIN]: { title: 'Admin Registration', description: 'Create a new administrator account.' },
    [UserType.TEAM]: { title: 'Team Login', description: 'Access the team management panel.' },
    [UserType.CANDIDATE]: { title: 'Employee Login', description: 'Access your employee dashboard.' },
    [UserType.PARTNER]: { title: 'Partner Login', description: 'Access the partner dashboard.' },
    [UserType.HR]: { title: 'HR Login', description: 'Access the HR dashboard.' },
    [UserType.TEAMLEAD]: { title: 'Team Lead Login', description: 'Access the Team Lead dashboard.' },
    [UserType.STORE_SUPERVISOR]: { title: 'Store Supervisor Login', description: 'Access the store management panel.' },
    [UserType.NONE]: { title: 'Login', description: 'Sign in to your account.' }
  };
  const { title, description } = isRegisteringAdmin ? modalInfo[UserType.ADMIN] : modalInfo[showLoginPanelForType];
  
  return (
    <div className="min-h-screen flex flex-col">
      {!hasAdminPanelLayout && !hasCandidatePanelLayout && <Header userType={currentUserType} onLoginSelect={handleLoginSelect} onLogout={handleLogout} onHireUsClick={() => setShowRequestDemoModal(true)} logoSrc={settings.logoSrc} />}
      <div className="flex-grow flex flex-col">
        {currentUserType !== UserType.NONE ? (
          <Dashboard
            userType={currentUserType} jobs={jobs} onAddJob={handleAddJob} onDeleteJob={handleDeleteJob}
            currentLogoSrc={settings.logoSrc} onLogoUpload={handleLogoUpload}
            pipelineStats={dashboardStats.pipeline} vendorStats={dashboardStats.vendor} complaintStats={dashboardStats.complaint}
            partnerRequirementStats={dashboardStats.partnerRequirement}
            hrStats={dashboardStats.hrStats}
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
            panelConfig={settings.panelConfig}
            onUpdateSettings={handleUpdateSettings}
          />
        ) : (
          <HomePage 
            jobs={jobs} onApplyNow={handleApplyNow} currentUserType={currentUserType} onLoginSelect={handleLoginSelect} 
            onNavigateToAdminJobBoard={() => setActiveAdminMenuItem(AdminMenuItem.ManageJobBoard)}
            branding={settings.branding} 
          />
        )}
      </div>
      <Modal isOpen={showLoginPanelForType !== UserType.NONE} onClose={handleCancelLogin} title={title} description={description}>
        <LoginPanel userType={showLoginPanelForType} onLoginSuccess={handleLoginSuccess} onLoginError={console.error} initialIsSignUp={isRegisteringAdmin} />
      </Modal>
      <RequestDemoModal isOpen={showRequestDemoModal} onClose={() => setShowRequestDemoModal(false)} />
      {!hasAdminPanelLayout && !hasCandidatePanelLayout && <footer className="bg-gray-800 text-white py-4 text-center text-sm sticky bottom-0 w-full z-40"><p>&copy; {new Date().getFullYear()} R K M Career. All rights reserved.</p></footer>}
    </div>
  );
};
export default App;
