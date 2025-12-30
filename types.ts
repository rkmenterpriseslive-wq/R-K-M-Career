
import React from 'react';
import { PopupConfig } from './contexts/PopupContext';

export enum UserType {
  CANDIDATE = 'CANDIDATE',
  PARTNER = 'PARTNER',
  TEAM = 'TEAM',
  ADMIN = 'ADMIN',
  HR = 'HR',
  TEAMLEAD = 'TEAMLEAD', // New UserType
  STORE_SUPERVISOR = 'STORE_SUPERVISOR',
  NONE = 'NONE', // For unauthenticated state
}

// --- SALARY TYPES ---
export interface SalaryRule {
  designation: string;
  basic: {
    percentage: number;
    of: 'gross';
  };
  hra: {
    percentage: number;
    of: 'basic';
  };
  conveyance: number;
  medical: number;
  statutoryBonus: number;
}

export interface CTCBreakdown {
  monthly: Record<string, number>;
  annual: Record<string, number>;
}


export interface Job {
  id: string;
  title: string;
  company: string;
  partnerName?: string; // NEW: Explicitly link to the partner
  storeName?: string;
  description: string;
  postedDate: string;
  adminId: string;
  experienceLevel: string;
  salaryRange: string;
  numberOfOpenings: number;
  companyLogoSrc?: string;

  // New detailed fields
  jobCategory: string;
  jobCity: string;
  locality: string;
  minQualification: string;
  genderPreference: string;
  jobType: string;
  workLocationType: string;
  workingDays: string;
  jobShift: string;
  interviewAddress: string;
  salaryType: string; // 'Fixed' or 'Fixed + Incentive'
  incentive?: string;
}

// Updated User interface to reflect App User properties
export interface AppUser {
  uid: string;
  email: string | null;
  fullName?: string;
  phone?: string;
  userType: UserType; // Determined by app logic
  profile_complete?: boolean;

  // New profile fields for type safety and job matching
  gender?: string;
  houseNumber?: string;
  locality?: string;
  city?: string;
  state?: string;
  highestQualification?: string;
  totalExperience?: string;
  lastSalary?: string;
  // Professional Information for internal users
  reportingManager?: string; // e.g., name or email of reporting manager
  workingLocations?: string[]; // e.g., ['Delhi', 'Noida']
  assignedPartners?: string[]; // e.g., ['Blinkit', 'Zepto'] - brand names
  profilePictureUrl?: string; // URL of the user's profile picture
  // This allows other fields from firestore profile to exist without TS errors
  [key: string]: any;
}

// New Employee Interface
export interface Employee {
  id: string; // Unique ID, can be from auth or generated
  name: string;
  email: string;
  phone: string;
  role: string; // Job Title/Designation
  vendor: string;
  status: 'Active' | 'Inactive' | 'Onboarding';
  
  // Personal Details
  dateOfJoining: string;
  address: string;

  // Bank Details
  bankName: string;
  accountNumber: string;
  ifscCode: string;

  // Statutory Details
  panNumber: string;
  aadhaarNumber: string;
  pfUan?: string; // Added for payslip

  // Salary
  grossSalary: number;

  // Onboarding fields
  onboardingStatus?: 'Pending Submission' | 'Pending Verification' | 'Onboarding Complete';
  esiCardFileName?: string | null;

  // Added for payslip details
  employeeNo?: string;
  department?: string;
  location?: string;
}

// New Shift interface for Clock-in/out
export interface Shift {
  id: string;
  userId: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string
  date: string; // YYYY-MM-DD
  status: 'active' | 'completed';
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HeaderProps {
  userType: UserType;
  onLoginSelect: (type: UserType) => void;
  onLogout: () => void;
  onHireUsClick: () => void;
  logoSrc: string | null;
  onNavigateHome: () => void;
  portalName: string;
}


// FIX: Added JobListProps interface
export interface JobListProps {
  jobs: Job[];
  currentUserType: UserType;
  onDeleteJob?: (id: string) => void;
  onApplyNow?: (job: Job) => void;
  onViewDetails?: (job: Job) => void;
}

// New interfaces for Admin Dashboard data
export interface CandidatePipelineStats {
  active: number;
  interview: number;
  rejected: number;
  quit: number;
}

export interface VendorStats {
  total: number;
  totalJobs: number;
  totalHired: number;
}

export interface ComplaintStats {
  active: number;
  closed: number;
}

// New interface for Partner Requirement stats
export interface PartnerRequirementStats {
  total: number;
  pending: number;
  approved: number;
}

// New interface for HR Updates stats
export interface HrStats {
  totalSelected: number;
  totalOfferReleased: number;
  totalOnboardingPending: number;
  newJoining: {
    day: number;
    week: number;
    month: number;
  };
  // New metrics for HR Dashboard
  attrition?: number;
  selected?: number;
  offerReleased?: number;
  joined?: number;
}


export interface ProcessMetric {
  name: string;
  count: number;
  color: string;
}

export interface RoleMetric {
  name: string;
  count: number;
  color: string;
}

export interface BreakdownDetail {
    [key: string]: number;
}

export interface DetailedRequirementBreakdownRow {
  id: string;
  name: string; // The primary entity name (Team member, Partner, Store, Role)
  location?: string; // Secondary info, e.g., location for a store.

  // Optional detailed breakdowns. Not all views will have all breakdowns.
  locationBreakdown?: BreakdownDetail;
  roleBreakdown?: BreakdownDetail;
  storeBreakdown?: BreakdownDetail;
  partnerBreakdown?: BreakdownDetail;
  teamBreakdown?: BreakdownDetail;
  brandBreakdown?: BreakdownDetail;
  partnerNameBreakdown?: BreakdownDetail;

  // Core metrics
  totalOpenings: number;
  pending: number;
  approved: number;
}

export interface RequirementBreakdownData {
  team: DetailedRequirementBreakdownRow[];
  partner: DetailedRequirementBreakdownRow[];
  store: DetailedRequirementBreakdownRow[];
  role: DetailedRequirementBreakdownRow[];
}

export interface TeamMemberPerformance {
  id: string;
  teamMember: string;
  role: string;
  isDownline: boolean; // True if the member reports to someone else in the list
  total: number;
  selected: number;
  pending: number;
  rejected: number;
  quit: number;
  successRate: number; // Stored as a percentage (e.g., 75 for 75%)
  // Added fields from AppUser to TeamMemberPerformance for more detailed info
  fullName?: string;
  email?: string;
  phone?: string;
  userType?: UserType;
  reportingManager?: string;
  salary?: string;
  workingLocations?: string[];
  assignedPartners?: string[];
  level?: number;
}

// Admin menu items for navigation
export enum AdminMenuItem {
  Dashboard = 'Dashboard',
  DailyLineups = 'Daily Lineups',
  SelectionDashboard = 'Selection Dashboard',
  SelectedCandidates = 'Selected Candidates',
  AllCandidates = 'All Candidates',
  Attendance = 'Attendance',
  Complaints = 'Complaints',
  WarningLetters = 'Warning Letters',
  Reports = 'Reports',
  ManageJobBoard = 'Manage Job Board',
  VendorDirectory = 'Vendor Directory',
  DemoRequests = 'Demo Requests',
  Revenue = 'Revenue',
  Settings = 'Settings',
  // New HR items
  ManagePayroll = 'Manage Payroll',
  GenerateOfferLetter = 'Generate Offer Letter',
  CTCGenerate = 'CTC Generate',
  Payslips = 'Payslips',
  EmployeeManagement = 'Employee Management',
  MyProfile = 'My Profile',
  // New Partner items
  PartnerTrackApplicants = 'Track Applicants',
  PartnerPostJob = 'Post Job / Requirement',
  PartnerInterviewLineups = 'Interview Lineups',
  PartnerActiveCandidates = 'Partner Active Candidates',
  ManageSupervisors = 'Manage Supervisors',
  PartnerInvoices = 'Partner Invoices',
  PartnerHelpCenter = 'Partner Help Center',
  PartnerSalaryUpdates = 'Partner Salary Updates',
  PartnerRequirementsDetail = 'Partner Requirements Breakdown',
  // New Supervisor Items
  SupervisorDashboard = 'Supervisor Dashboard',
  StoreAttendance = 'Store Attendance',
  StoreEmployees = 'Store Employees',
  MyAttendance = 'My Attendance', // New item for Supervisor's own attendance
}

// New enum for Candidate panel
export enum CandidateMenuItem {
  ApplyJobs = 'Apply Jobs',
  MyDocuments = 'My Documents',
  MyProfile = 'My Profile',
  CVGenerator = 'CV Generator',
  MyPayslips = 'My Payslips',
  MyAttendance = 'My Attendance',
  MyInterviews = 'My Interviews',
  CompanyDocuments = 'Company Documents',
  Resign = 'Resign',
  HelpCenter = 'Help Center',
}

// New PartnerCandidate interface
export interface PartnerCandidate {
  id: string;
  name: string;
  client: string;
  role: string;
  submittedDate: string;
  status: 'Sourced' | 'Screening' | 'Interview' | 'Offer Sent' | 'Selected' | 'Rejected';
}

// New types for Partner Update Status page
export type PartnerUpdateStatus =
  | 'Pending'
  | 'Contacted - Interested'
  | 'Contacted - Not Interested'
  | 'Interview Scheduled'
  | 'Interview Attended'
  | 'Offer Accepted'
  | 'Offer Rejected'
  | 'Joined'
  | 'Absconded';

export interface PartnerUpdatableCandidate {
  id: string;
  name: string;
  client: string;
  role: string;
  phone: string;
  partnerName?: string; // NEW: Explicitly link to the partner
  // FIX: Added missing 'storeName' property.
  storeName: string;
  status: PartnerUpdateStatus;
  lastUpdated: string; // ISO string date
  remarks?: string;
  vendor?: string;
}

// New PartnerRequirement interface
export interface PartnerRequirement {
  id: string;
  title: string;
  brand: string; // Name of the client/brand the partner is hiring for
  partnerName?: string; // NEW: Explicitly link to the partner
  location: string;
  storeName?: string;
  openings: number;
  salaryRange: string;
  experienceLevel: string;
  postedDate: string;
  description: string;
  jobType: string;
  workingDays: string;
  jobShift: string;
  submissionStatus?: 'Pending Review' | 'Approved' | 'Rejected';
  // Fields from JobPostingForm
  minQualification: string;
  genderPreference: string;
  workLocationType: string;
  salaryType: string; // 'Fixed' or 'Fixed + Incentive'
  incentive?: string;
  companyLogoSrc?: string;
}

// New PartnerInvoice interface
export interface PartnerInvoice {
  id: string;
  clientName: string;
  billedDate: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subTotal: number;
  tax: number;
  total: number;
}

// New PartnerSalaryUpdate interface
export interface PartnerSalaryUpdate {
  id: string;
  candidateName: string;
  client: string;
  role: string;
  joiningDate: string;
  annualCTC: number;
  monthlyNetSalary: number;
  status: 'Pending' | 'Confirmed' | 'Discrepancy Reported';
}

// New StoreSupervisor interface
export interface StoreSupervisor {
  id: string; // Ensure ID is part of the interface for Firestore operations
  name: string;
  email: string;
  phone: string;
  storeLocation: string;
  status: 'Active' | 'Inactive';
  partnerId?: string; // New: To link supervisors to a partner
}

// New WarningLetter Interface
export interface WarningLetter {
  ticketNo: string;
  employeeName: string;
  reason: string;
  description: string;
  issueDate: string;
  issuedBy: string;
  status: 'Active' | 'Resolved';
}

// New FamilyMember interface for My Documents page
export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  dob: string; // YYYY-MM-DD
  // New fields for document uploads
  aadharFileName: string | null;
  photoFileName: string | null;
}

// New Interview Interface
export interface Interview {
  id: string;
  jobTitle: string;
  company: string;
  storeName?: string;
  round: string;
  date: string; // ISO string for date
  time: string; // e.g., "11:00 AM"
  type: 'Online' | 'Store Location';
  locationOrLink: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  supervisorName?: string;
}

// New interface for company-issued documents
export interface CompanyDocument {
  id: string;
  name: string;
  type: 'Offer Letter' | 'Warning Letter' | 'Relieving Letter' | 'Experience Letter' | 'Other';
  issueDate: string; // ISO string
  description?: string;
}

// New interface for Demo Requests
export interface DemoRequest {
    id: string;
    companyName: string;
    email: string;
    mobileNo: string;
    teamHead: string;
    teamSize: string;
    requestDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}


// Branding Configuration Interfaces
export interface BannerConfig {
  title: string;
  description: string;
  link: string;
  backgroundImage?: string | null;
}

export interface BrandingConfig {
  portalName: string;
  hireTalent: BannerConfig;
  becomePartner: BannerConfig;
}

// New PartnerLogo Interface
export interface PartnerLogo {
  id: string;
  name: string;
  logoSrc: string;
}

// Panel Configuration Interface
export interface PanelConfig {
    emailNotifications: boolean;
    maintenanceMode: boolean;
}

// NEW: Quick Links
export interface QuickLink {
    id: string;
    label: string;
    url: string;
}

// NEW: Contact Info
export interface ContactConfig {
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
}

// NEW: Social Media Links
export interface SocialMediaConfig {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    // Add other social media platforms as needed
}

export interface HomePageProps {
  partners: PartnerLogo[];
  currentUserType: UserType; // Added for banner logic
  onLoginSelect: (type: UserType) => void; // Added for banner login prompt
  onNavigateToAdminJobBoard: () => void; // Added for banner navigation
  branding: BrandingConfig; // Added branding config
  initError?: string | null; // Added for initialization errors
  onNavigateToJobs: () => void;
}

export interface HireYourselfStats {
  totalUsers: number;
  jobsPosted: number;
  hiredCandidates: number;
}

export interface DashboardProps { // Updated DashboardProps to match App.tsx and AdminLayout
  userType: UserType;
  jobs: Job[];
  onAddJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => Promise<void>;
  onUpdateJob: (jobId: string, jobData: Partial<Omit<Job, 'id' | 'postedDate' | 'adminId'>>) => Promise<void>;
  onDeleteJob: (id: string) => void;
  onDeleteRequirement?: (id: string) => void;
  currentLogoSrc: string | null;
  onLogoUpload: (base64Image: string) => void;
  // New props for admin dashboard data
  pipelineStats: CandidatePipelineStats;
  vendorStats: VendorStats;
  complaintStats: ComplaintStats;
  partnerRequirementStats: PartnerRequirementStats; // Added prop
  hrStats: HrStats; // Added for HR updates
  hireYourselfStats: HireYourselfStats; // Added for Hire Yourself summary
  candidatesByProcess: ProcessMetric[];
  candidatesByRole: RoleMetric[];
  teamPerformance: TeamMemberPerformance[];
  requirementBreakdown: RequirementBreakdownData;
  activeAdminMenuItem: AdminMenuItem; // Pass active menu item to AdminLayout
  onAdminMenuItemClick: (item: AdminMenuItem) => void; // Pass handler to AdminLayout
  onLogout: () => void; // Added onLogout to prop interface
  branding: BrandingConfig; // Added branding config
  onUpdateBranding: (branding: BrandingConfig) => void; // Added branding update handler
  currentUser?: AppUser | null; // Added currentUser prop
  // New props for candidate
  activeCandidateMenuItem: CandidateMenuItem;
  onCandidateMenuItemClick: (item: CandidateMenuItem) => void;
  onApplyNow: (job: Job) => void;
  onProfileComplete?: () => void; // New prop for candidate profile completion
  // Removed: onNavigateToJobs: () => void; // CandidateDashboardContent will now manage its own JobsPage view
  // New settings props
  vendors: Vendor[];
  jobRoles: string[];
  locations: string[];
  stores: { id: string; name: string; location: string; interviewAddress?: string }[];
  partnerLogos: PartnerLogo[];
  onUpdateSettings: (settingsUpdate: Partial<any>) => void;
  showPopup: (config: PopupConfig) => void;
  // Add new prop
  systemRoles?: { name: string; panel: string }[];
  panelConfig?: PanelConfig;
  demoRequests?: DemoRequest[];
  complaints?: Ticket[];
  candidates?: any[]; // For Revenue page optimization
  partnerRequirements?: PartnerRequirement[]; // ADDED
  resignation?: Resignation | null;
  supervisors?: StoreSupervisor[];
  // NEW: Settings for Quick Links, Contact Info, Social Media
  quickLinks: QuickLink[];
  contactInfo: ContactConfig;
  socialMedia: SocialMediaConfig;
  salaryRules?: SalaryRule[];
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  userType: UserType;
  activeAdminMenuItem: AdminMenuItem;
  onAdminMenuItemClick: (item: AdminMenuItem) => void;
  currentLogoSrc: string | null; // Added
  onLogoUpload: (base64Image: string) => void; // Added
  onLogout: () => void; // Added
}


export interface SidebarProps {
  activeItem: AdminMenuItem; // Now controlled by parent
  onItemClick: (item: AdminMenuItem) => void; // New prop for click handler
  userType: UserType; // Added userType to filter menu items
  isOpen?: boolean; // Mobile toggle state
  onClose?: () => void; // Handler to close on mobile select
}

export interface AdminDashboardContentProps {
  pipelineStats: CandidatePipelineStats;
  vendorStats: VendorStats;
  complaintStats: ComplaintStats;
  partnerRequirementStats: PartnerRequirementStats; // Added prop
  hrStats: HrStats; // Added for HR updates
  hireYourselfStats: HireYourselfStats; // Added for Hire Yourself summary
  candidatesByProcess: ProcessMetric[];
  candidatesByRole: RoleMetric[];
  teamPerformance: TeamMemberPerformance[];
  requirementBreakdown: RequirementBreakdownData;
  jobs: Job[];
  onAddJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => Promise<void>;
  onUpdateJob: (jobId: string, jobData: Partial<Omit<Job, 'id' | 'postedDate' | 'adminId'>>) => Promise<void>;
  onDeleteJob: (id: string) => void;
  onDeleteRequirement?: (id: string) => void;
  currentLogoSrc: string | null;
  onLogoUpload: (base64Image: string) => void;
  activeAdminMenuItem: AdminMenuItem; // New prop for conditional rendering
  onAdminMenuItemClick: (item: AdminMenuItem) => void; // Added handler
  userType: UserType; // Added userType for section filtering
  branding: BrandingConfig; // Added branding config
  onUpdateBranding: (branding: BrandingConfig) => void; // Added branding update handler
  currentUser?: AppUser | null; // Added currentUser prop
  // New settings props
  vendors: Vendor[];
  jobRoles: string[];
  locations: string[];
  stores: { id: string; name: string; location: string; interviewAddress?: string }[];
  partnerLogos: PartnerLogo[];
  onUpdateSettings: (settingsUpdate: Partial<any>) => void;
  showPopup: (config: PopupConfig) => void;
  // Add new prop
  systemRoles?: { name: string; panel: string }[];
  panelConfig?: PanelConfig;
  demoRequests?: DemoRequest[];
  complaints?: Ticket[];
  candidates?: any[]; // For Revenue page optimization
  partnerRequirements?: PartnerRequirement[]; // ADDED
  supervisors?: StoreSupervisor[];
  // NEW: Settings for Quick Links, Contact Info, Social Media
  quickLinks: QuickLink[];
  contactInfo: ContactConfig;
  socialMedia: SocialMediaConfig;
  salaryRules?: SalaryRule[];
}

export interface LoginPanelProps {
  userType: UserType; // The requested user type for login
  onLoginSuccess: (user: AppUser) => void; // Callback on successful login with AppUser
  onLoginError: (message: string) => void; // Callback on login error
  initialIsSignUp?: boolean; // New prop to force signup mode initially
}


// --- CANDIDATE PANEL PROPS ---
export interface CandidateLayoutProps {
  children: React.ReactNode;
  userType: UserType;
  activeCandidateMenuItem: CandidateMenuItem;
  onCandidateMenuItemClick: (item: CandidateMenuItem) => void;
  currentUser: AppUser | null;
  onLogout: () => void; // Added
}


export interface CandidateSidebarProps {
  activeItem: CandidateMenuItem;
  onItemClick: (item: CandidateMenuItem) => void;
  isProfileComplete: boolean;
  isOpen?: boolean; // Mobile toggle state
  onClose?: () => void; // Handler to close on mobile select
}

export interface CandidateDashboardContentProps {
  activeCandidateMenuItem: CandidateMenuItem;
  jobs: Job[];
  onApplyNow: (job: Job) => void;
  onProfileComplete?: () => void;
  currentUser: AppUser | null;
  complaints?: Ticket[];
  resignation?: Resignation | null;
  candidates?: any[];
  supervisors?: StoreSupervisor[];
  // Removed: onNavigateToJobs: () => void; // JobsPage will be rendered internally
  portalName: string;
  logoSrc: string | null;
  contactInfo: ContactConfig;
}

// New Resignation Interface
export interface Resignation {
  id: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  submittedDate: string; // ISO string
  status: 'Pending HR Approval' | 'Approved' | 'Rejected';
  noticePeriodStartDate?: string; // ISO string
  lastWorkingDay?: string; // ISO string
  hrRemarks?: string;
}

// FIX: Added LeaveApplication interface for My Attendance page
export interface LeaveApplication {
  id: string;
  userId: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave';
  startDate: string; // ISO string for date
  endDate: string; // ISO string for date
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedDate: string; // ISO string for date
}

// New Ticket Interface for Help Center
export interface Ticket {
  id: string;
  userId: string;
  submittedBy: string; // Name of the user
  userType: UserType; // Type of user (Candidate, Partner)
  subject: string;
  category: 'Payroll' | 'Attendance' | 'Documents' | 'General Inquiry' | 'Invoice Query' | 'Technical Issue' | 'Other';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  submittedDate: string; // ISO string
  resolvedDate?: string; // ISO string
  hrRemarks?: string;
}

// --- VENDOR TYPES ---
export interface Slab {
    id: string;
    frequency: string;
    from: string;
    to: string;
    amount: string;
}

export interface AttendanceRule {
    id: string;
    role: string;
    experienceType: string;
    days: string;
    amount: string;
}

export interface Vendor {
    id: string;
    brandNames: string[];
    partnerName?: string;
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

export interface PartnerRequirementsViewProps { // NEW interface for PartnerRequirementsView
  initialStatus?: string;
  jobRoles: string[]; // Add jobRoles here
  locations: string[]; // Added locations
  stores: { id: string; name: string; location: string; interviewAddress?: string }[];
  userType?: UserType;
  vendors?: Vendor[]; // NEW
  currentUser?: AppUser | null; // NEW
}

export interface RequirementsBreakdownViewProps { // NEW interface for PartnerRequirementsView
  data: RequirementBreakdownData;
  userType?: UserType;
}
