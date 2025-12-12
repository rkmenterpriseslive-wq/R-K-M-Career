
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth, createSecondaryUser } from '../../services/firebaseService';
import { getUserProfile, getAllTeamMembers, createCandidate, getCandidates, updateCandidate } from '../../services/supabaseService';
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
  Complaint,
  WarningLetter,
  Ticket,
} from '../../types';
import JobPostingForm from '../JobPostingForm';
import LogoUploader from '../LogoUploader';
import JobList from '../JobList';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import ManagePayrollView from './ManagePayrollView';
import CTCGeneratorView from './CTCGeneratorView';
import GenerateOfferLetterView from './GenerateOfferLetterView';
import PayslipsView from './PayslipsView';
import EmployeeManagementView from './EmployeeManagementView';
import PartnerActiveCandidatesView from './PartnerActiveCandidatesView';
import PartnerUpdateStatusView from './PartnerUpdateStatusView';
import PartnerRequirementsView from './PartnerRequirementsView';
import PartnerInvoicesView from './PartnerInvoicesView';
import PartnerSalaryUpdatesView from './PartnerSalaryUpdatesView';
import PartnerManageSupervisorsView from './PartnerManageSupervisorsView';
import StatCard from './StatCard';
import ProgressBarCard from './ProgressBarCard';
import TeamPerformanceTable from './TeamPerformanceTable';
import AddTeamMemberModal from './AddTeamMemberModal';
import SupervisorDashboardView from '../supervisor/SupervisorDashboardView';
import StoreAttendanceView from '../supervisor/StoreAttendanceView';
import StoreEmployeesView from '../supervisor/StoreEmployeesView';
import HRDashboardView from '../hr/HRDashboardView';
import { getHRDashboardStats } from '../../utils/hrService';
import PartnerDashboardView from '../partner/PartnerDashboardView';
import SelectionDashboardView from './SelectionDashboardView';
import AllCandidatesView from './AllCandidatesView';
import AttendanceView from './AttendanceView';
import ComplaintsView from './ComplaintsView';
import SettingsView from './SettingsView';
import WarningLettersView from './WarningLettersView';
import ReportsView from './ReportsView';
import VendorDirectoryView from './VendorDirectoryView';
import DemoRequestsView from './DemoRequestsView';
import RevenueView from './RevenueView';
import MyAttendanceView from '../candidate/MyAttendanceView';
import JobBoardListView from './JobBoardListView';
import RequirementsBreakdownView from './RequirementsBreakdownView';

// Internal Components merged for file size optimization

const AddLineupForm: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    vendor: '',
    role: '',
    location: '',
    store: '',
    status: 'Connected',
    interviewDateTime: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await createCandidate({
            name: formData.name,
            phone: formData.mobile,
            vendor: formData.vendor,
            role: formData.role,
            storeLocation: formData.store,
            location: formData.location,
            status: 'Active', // Default status for new candidate
            stage: 'Sourced', // Default stage for pipeline
            callStatus: formData.status,
            interviewDateTime: formData.interviewDateTime || null,
            recruiter: auth.currentUser?.email?.split('@')[0] || 'Unknown',
            appliedDate: new Date().toISOString()
        });
        alert('Lineup added successfully!');
        onSave(); // Refresh list
        onClose();
    } catch (error) {
        alert('Failed to add lineup.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          id="lineup-name" 
          name="name"
          label="Candidate Name" 
          placeholder="e.g. John Doe"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input 
          id="lineup-mobile" 
          name="mobile"
          label="Mobile Number" 
          placeholder="+91 98765 43210"
          value={formData.mobile}
          onChange={handleChange}
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company / Vendor</label>
          <select 
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select a vendor</option>
            <option value="Vendor A">Vendor A</option>
            <option value="Vendor B">Vendor B</option>
            <option value="Direct">Direct</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select 
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={!formData.vendor}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{formData.vendor ? "Select a role" : "Select a vendor first"}</option>
            <option value="Picker">Picker</option>
            <option value="Packer">Packer</option>
            <option value="Sales Executive">Sales Executive</option>
            <option value="Team Leader">Team Leader</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select 
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={!formData.vendor}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{formData.vendor ? "Select a location" : "Select a vendor first"}</option>
            <option value="Delhi">Delhi</option>
            <option value="Noida">Noida</option>
            <option value="Gurgaon">Gurgaon</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
          <select 
            name="store"
            value={formData.store}
            onChange={handleChange}
            disabled={!formData.location}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{formData.location ? "Select a store" : "Select a location first"}</option>
            <option value="DLF Mall">DLF Mall</option>
            <option value="GIP Mall">GIP Mall</option>
            <option value="Select Citywalk">Select Citywalk</option>
          </select>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
          <select 
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="Connected">Connected</option>
            <option value="Interested">Interested</option>
            <option value="No Answer">No Answer</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Callback">Callback</option>
            <option value="Already Call">Already Call</option>
          </select>
        </div>

        {formData.status === 'Interested' && (
            <Input
                id="lineup-interview-datetime"
                name="interviewDateTime"
                label="Interview Date & Time"
                type="datetime-local"
                value={formData.interviewDateTime}
                onChange={handleChange}
                required
            />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
        <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button 
            type="submit" 
            variant="primary"
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
        >
          Add Lineup
        </Button>
      </div>
    </form>
  );
};

type CallStatus = 'Interested' | 'Connected' | 'No Answer' | 'Not Interested' | 'Callback' | 'Already Call';
interface DailyLineup {
    id: string;
    candidateName: string;
    contact: string;
    vendor: string;
    role: string;
    location: string;
    storeName: string;
    submittedBy: string;
    callStatus: CallStatus;
    interviewDateTime: string | null;
}

const EditLineupForm: React.FC<{
    lineup: DailyLineup;
    onSave: () => void;
    onClose: () => void;
}> = ({ lineup, onSave, onClose }) => {
    const [formData, setFormData] = useState<DailyLineup>(lineup);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateCandidate(lineup.id, {
                callStatus: formData.callStatus,
                interviewDateTime: formData.interviewDateTime
            });
            onSave();
            onClose();
        } catch(e) {
            alert('Failed to update lineup');
        }
    };
    
    const callStatuses: CallStatus[] = ['Connected', 'Interested', 'No Answer', 'Not Interested', 'Callback', 'Already Call'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Displaying some fields as read-only for context */}
            <p><strong>Candidate:</strong> {formData.candidateName}</p>
            <p><strong>Role:</strong> {formData.role} at {formData.vendor}</p>
            <hr/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
                    <select
                        name="callStatus"
                        value={formData.callStatus}
                        onChange={(e) => handleChange(e as any)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        {callStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {formData.callStatus === 'Interested' && (
                    <Input
                        id="lineup-interview-datetime-edit"
                        name="interviewDateTime"
                        label="Interview Date & Time"
                        type="datetime-local"
                        value={formData.interviewDateTime || ''}
                        onChange={handleChange}
                        required
                    />
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
            </div>
        </form>
    );
};


const DailyLineupsView: React.FC<{ userType: UserType }> = ({ userType }) => {
  const [isAddLineupOpen, setIsAddLineupOpen] = useState(false);
  const [editingLineup, setEditingLineup] = useState<DailyLineup | null>(null);
  const [lineups, setLineups] = useState<DailyLineup[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    vendor: '',
    role: '',
    location: '',
    storeName: '',
    submittedBy: '',
    callStatus: '',
  });

  const fetchLineups = async () => {
      const allCandidates = await getCandidates();
      const mappedLineups = allCandidates.map((c: any) => ({
          id: c.id,
          candidateName: c.name,
          contact: c.phone,
          vendor: c.vendor,
          role: c.role,
          location: c.location || '',
          storeName: c.storeLocation || c.store || '',
          submittedBy: c.recruiter || 'Admin',
          callStatus: c.callStatus || 'Connected',
          interviewDateTime: c.interviewDateTime || null
      }));
      setLineups(mappedLineups);
  };

  useEffect(() => {
      fetchLineups();
  }, []);

  const formatInterviewDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const isToday = (dateString: string) => {
      if (!dateString) return false;
      const interviewDate = new Date(dateString);
      const today = new Date();
      return interviewDate.toDateString() === today.toDateString();
  };

  // Filtering Logic for Team Lead
  const isTeamLead = userType === UserType.TEAMLEAD;
  // TODO: Fetch team members dynamically
  const myTeamMembers = ['Rahul', 'Sneha']; 
  
  const baseLineups = isTeamLead 
    ? lineups.filter(l => myTeamMembers.some(member => l.submittedBy.includes(member)))
    : lineups;

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      vendor: '',
      role: '',
      location: '',
      storeName: '',
      submittedBy: '',
      callStatus: '',
    });
  };

  const displayLineups = baseLineups.filter(l => {
    return (
      (filters.search === '' || l.candidateName.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.vendor === '' || l.vendor === filters.vendor) &&
      (filters.role === '' || l.role === filters.role) &&
      (filters.location === '' || l.location === filters.location) &&
      (filters.storeName === '' || l.storeName === filters.storeName) &&
      (filters.submittedBy === '' || l.submittedBy.includes(filters.submittedBy)) &&
      (filters.callStatus === '' || l.callStatus === filters.callStatus)
    );
  }).sort((a, b) => {
      const aIsInterested = a.callStatus === 'Interested' && a.interviewDateTime;
      const bIsInterested = b.callStatus === 'Interested' && b.interviewDateTime;

      if (aIsInterested && !bIsInterested) return -1;
      if (!aIsInterested && bIsInterested) return 1;
      if (aIsInterested && bIsInterested) {
          return new Date(a.interviewDateTime!).getTime() - new Date(b.interviewDateTime!).getTime();
      }
      return 0;
  });

  const uniqueOptions = (key: keyof DailyLineup) => [...new Set(lineups.map(item => item[key]))].filter(Boolean);
  
  const FilterWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );

  const selectClassName = "block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Daily Lineups {isTeamLead && <span className="text-base font-normal text-indigo-600 ml-2">(My Team)</span>}</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => alert('Report downloaded!')}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
          <button 
            onClick={() => setIsAddLineupOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            Add New Lineup
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterWrapper label="Search Candidate">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className={selectClassName.replace('bg-white', '')}
              placeholder="e.g. Amit Verma"
            />
          </FilterWrapper>
          <FilterWrapper label="Vendor / Role">
            <select name="vendor" value={filters.vendor} onChange={handleFilterChange} className={selectClassName}>
              <option value="">All Vendors</option>
              {uniqueOptions('vendor').map(v => <option key={v as string} value={v as string}>{v}</option>)}
            </select>
          </FilterWrapper>
          <FilterWrapper label="Role">
            <select name="role" value={filters.role} onChange={handleFilterChange} className={selectClassName}>
              <option value="">All Roles</option>
              {uniqueOptions('role').map(r => <option key={r as string} value={r as string}>{r}</option>)}
            </select>
          </FilterWrapper>
          <FilterWrapper label="Location">
            <select name="location" value={filters.location} onChange={handleFilterChange} className={selectClassName}>
              <option value="">All Locations</option>
              {uniqueOptions('location').map(l => <option key={l as string} value={l as string}>{l}</option>)}
            </select>
          </FilterWrapper>
          <FilterWrapper label="Store Name">
            <select name="storeName" value={filters.storeName} onChange={handleFilterChange} className={selectClassName}>
              <option value="">All Stores</option>
              {uniqueOptions('storeName').map(s => <option key={s as string} value={s as string}>{s}</option>)}
            </select>
          </FilterWrapper>
          <FilterWrapper label="Submitted By">
            <select name="submittedBy" value={filters.submittedBy} onChange={handleFilterChange} className={selectClassName}>
              <option value="">All</option>
              {uniqueOptions('submittedBy').map(s => <option key={s as string} value={s as string}>{s}</option>)}
            </select>
          </FilterWrapper>
          <FilterWrapper label="Call Status">
            <select name="callStatus" value={filters.callStatus} onChange={handleFilterChange} className={selectClassName}>
              <option value="">All Statuses</option>
              {uniqueOptions('callStatus').map(s => <option key={s as string} value={s as string}>{s}</option>)}
            </select>
          </FilterWrapper>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full h-[42px] bg-white border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Store Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted By</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Call Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Interview Date</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {displayLineups.length > 0 ? displayLineups.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{item.candidateName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.contact}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.vendor}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.role}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.location}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.storeName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.submittedBy}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.callStatus === 'Interested' ? 'bg-green-100 text-green-800' :
                                    item.callStatus === 'Connected' ? 'bg-blue-100 text-blue-800' :
                                    item.callStatus === 'No Answer' ? 'bg-yellow-100 text-yellow-800' :
                                    item.callStatus === 'Already Call' ? 'bg-purple-100 text-purple-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {item.callStatus}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.interviewDateTime ? (
                                    <div>
                                        <span className="text-gray-800 font-medium">{formatInterviewDate(item.interviewDateTime)}</span>
                                        {isToday(item.interviewDateTime) && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 animate-pulse">
                                                Today
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-gray-400">--</span>
                                )}
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingLineup(item)} className="text-gray-400 hover:text-blue-600">Edit</button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">No lineups found for the current filters.</td></tr>
                    )}
                </tbody>
            </table>
         </div>
         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{displayLineups.length > 0 ? 1 : 0}</span> to <span className="font-medium">{displayLineups.length}</span> of <span className="font-medium">{baseLineups.length}</span> results
            </div>
         </div>
      </div>

      <Modal 
        isOpen={isAddLineupOpen} 
        onClose={() => setIsAddLineupOpen(false)} 
        title="Add New Lineup"
        maxWidth="max-w-2xl"
      >
        <AddLineupForm onClose={() => setIsAddLineupOpen(false)} onSave={fetchLineups} />
      </Modal>

      <Modal
        isOpen={!!editingLineup}
        onClose={() => setEditingLineup(null)}
        title="Edit Lineup"
        maxWidth="max-w-xl"
      >
        {editingLineup && (
            <EditLineupForm
                lineup={editingLineup}
                onSave={fetchLineups}
                onClose={() => setEditingLineup(null)}
            />
        )}
      </Modal>
    </div>
  );
}

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
    <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500">This feature is currently under development.</p>
  </div>
);

const JobBoardView: React.FC<{ jobs: Job[]; onAddJob: () => void; onDeleteJob: (id: string) => void; }> = ({ jobs, onAddJob, onDeleteJob }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
        <h3 className="text-3xl font-bold text-gray-800">Job Board</h3>
        <Button onClick={onAddJob} variant="primary">+ Post New Job</Button>
    </div>
    <JobBoardListView jobs={jobs} onDeleteJob={onDeleteJob} />
  </div>
);

const MyProfileView: React.FC<{ user: any; profile: any; setProfile: any }> = ({ user, profile, setProfile }) => {
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    // Extended profile data state
    const [extraData, setExtraData] = useState<any>({});

    useEffect(() => {
        const fetchRealProfile = async () => {
            if (user?.uid) {
                try {
                    const data: any = await getUserProfile(user.uid);
                    if (data) {
                        setProfile((prev: any) => ({
                            ...prev,
                            fullName: data.fullName || prev.fullName,
                            phone: data.phone || prev.phone,
                            email: user.email,
                        }));
                        setExtraData(data); // Save all extended data
                    }
                } catch (e) {
                    console.error("Failed to load profile", e);
                }
            }
        };
        fetchRealProfile();
    }, [user, setProfile]);

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            alert("Passwords do not match!");
            return;
        }
        if (passwords.new.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        
        setLoading(true);
        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, passwords.new);
                alert("Password updated successfully!");
                setPasswords({ new: '', confirm: '' });
            } else {
                alert("User not authenticated.");
            }
        } catch (error: any) {
            console.error("Error updating password:", error);
            // Friendly error message for requires-recent-login
            if (error.code === 'auth/requires-recent-login') {
                alert("For security reasons, please log out and log in again to change your password.");
            } else {
                alert(`Failed to update password: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h3>
            
            <div className="space-y-6 mb-10">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Details</h4>
                <Input id="fullName" label="Full Name" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} />
                <Input id="email" label="Email" value={profile.email} disabled onChange={() => {}} className="bg-gray-50 text-gray-500" />
                <Input id="phone" label="Phone" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                
                <Input 
                    id="role" 
                    label="Role" 
                    value={extraData.role || user?.userType?.replace('_', ' ') || 'User'} 
                    disabled 
                    onChange={() => {}} 
                    className="bg-gray-50 text-gray-500 capitalize" 
                    wrapperClassName="mb-4"
                />

                {extraData.reportingManager && (
                    <Input id="reportingManager" label="Reporting Manager" value={extraData.reportingManager} disabled onChange={() => {}} className="bg-gray-50 text-gray-500" />
                )}

                {extraData.salary && (
                    <Input id="salary" label="Salary" value={extraData.salary} disabled onChange={() => {}} className="bg-gray-50 text-gray-500" />
                )}

                {extraData.workingLocations && extraData.workingLocations.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Working Locations</label>
                        <div className="bg-gray-50 border border-gray-300 text-gray-500 rounded-md px-3 py-2 text-sm">
                            {Array.isArray(extraData.workingLocations) ? extraData.workingLocations.join(', ') : extraData.workingLocations}
                        </div>
                    </div>
                )}

                {extraData.vendors && extraData.vendors.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Vendors</label>
                        <div className="bg-gray-50 border border-gray-300 text-gray-500 rounded-md px-3 py-2 text-sm">
                            {Array.isArray(extraData.vendors) ? extraData.vendors.join(', ') : extraData.vendors}
                        </div>
                    </div>
                )}

                {user?.userType === UserType.STORE_SUPERVISOR && extraData.storeLocation && (
                    <Input 
                        id="storeLocation" 
                        label="Assigned Store Location" 
                        value={extraData.storeLocation} 
                        disabled 
                        onChange={() => {}}
                        className="bg-gray-50 text-gray-500" 
                        wrapperClassName="mb-4"
                    />
                )}

                <div className="flex justify-end">
                    <Button onClick={() => alert('Profile updated successfully!')} variant="primary">Save Details</Button>
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Security</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        id="newPassword" 
                        label="New Password" 
                        type="password"
                        value={passwords.new} 
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                        placeholder="New Password"
                    />
                    <Input 
                        id="confirmPassword" 
                        label="Confirm Password" 
                        type="password" 
                        value={passwords.confirm} 
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                        placeholder="Confirm Password"
                    />
                </div>
                <div className="flex justify-end">
                    <Button 
                        onClick={handlePasswordChange} 
                        variant="secondary" 
                        loading={loading}
                        disabled={!passwords.new || !passwords.confirm}
                        className="bg-gray-800 text-white hover:bg-gray-900"
                    >
                        Update Password
                    </Button>
                </div>
            </div>
        </div>
    );
};

const PartnerRequirementsDetailView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={onBack}>&larr; Back</Button>
            <h2 className="text-2xl font-bold text-gray-800">Partner Requirements Breakdown</h2>
        </div>
        <Placeholder title="Detailed Requirements Breakdown" />
    </div>
);

const AdminDashboardContent: React.FC<AdminDashboardContentProps> = ({
  pipelineStats,
  vendorStats,
  complaintStats,
  partnerRequirementStats,
  hrStats,
  candidatesByProcess,
  candidatesByRole,
  teamPerformance,
  requirementBreakdown,
  jobs,
  onAddJob,
  onDeleteJob,
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
  onUpdateSettings,
  systemRoles,
  panelConfig,
}) => {
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [showPartnerBreakdown, setShowPartnerBreakdown] = useState(false);
  const [viewFilters, setViewFilters] = useState<any>({});
  
  // State for team members list
  const [teamMembersList, setTeamMembersList] = useState<any[]>([]);

  // Fetch team members on mount
  const fetchTeamMembers = async () => {
      const members = await getAllTeamMembers();
      setTeamMembersList(members);
  };

  useEffect(() => {
      fetchTeamMembers();
  }, []);

  // Ensure list is refreshed when user navigates to Settings to see the latest team members
  useEffect(() => {
      if (activeAdminMenuItem === AdminMenuItem.Settings) {
          fetchTeamMembers();
      }
  }, [activeAdminMenuItem]);

  // Mock profile data for MyProfileView
  const [profile, setProfile] = useState({
    fullName: currentUser?.email?.split('@')[0] || 'User',
    email: currentUser?.email || '',
    phone: '123-456-7890'
  });

  const handleStatClick = (view: AdminMenuItem, filter: any = {}) => {
      setViewFilters({ ...viewFilters, [view]: filter });
      onAdminMenuItemClick(view);
  };

  const createTeamMember = async (memberData: any) => {
    // Logic to map role to UserType
    let newUserType = UserType.TEAM;
    const roleLower = memberData.role.toLowerCase();
    if (roleLower.includes('hr')) newUserType = UserType.HR;
    else if (roleLower.includes('lead') || roleLower.includes('manager')) newUserType = UserType.TEAMLEAD;
    // Removed logic mapping supervisor to UserType.STORE_SUPERVISOR to ensure they fall into internal team categories if added here.

    try {
        await createSecondaryUser(memberData.email, "password", {
            email: memberData.email,
            userType: newUserType,
            fullName: memberData.name,
            phone: memberData.mobile,
            // Extended fields for profile view
            role: memberData.role,
            post: memberData.post,
            salary: memberData.salary,
            reportingManager: memberData.reportingManager,
            workingLocations: memberData.workingLocations, // Array
            vendors: memberData.vendors, // Array
        });

        alert(`Team member ${memberData.name} created successfully! Login Password is 'password'.`);
        
        // Refresh the list after adding
        fetchTeamMembers();

    } catch (error: any) {
        alert("Failed to create team member: " + error.message);
    }
  };

  const renderContent = () => {
    // Show detailed breakdown view if flagged
    if (showPartnerBreakdown && (userType === UserType.PARTNER || userType === UserType.ADMIN)) {
        return <PartnerRequirementsDetailView onBack={() => setShowPartnerBreakdown(false)} />;
    }

    switch (activeAdminMenuItem) {
      case AdminMenuItem.Dashboard:
        if (userType === UserType.HR) {
            return <HRDashboardView onNavigate={onAdminMenuItemClick} />;
        }
        if (userType === UserType.PARTNER) {
            return <PartnerDashboardView 
                onNavigate={(item) => {
                    if (item === AdminMenuItem.PartnerRequirementsDetail) {
                        setShowPartnerBreakdown(true);
                    } else {
                        onAdminMenuItemClick(item);
                    }
                }} 
                partnerRequirementStats={partnerRequirementStats}
                activeCandidatesCount={0} // Mock data removed
                pendingInvoicesCount={0} // Mock data removed
                supervisorsCount={0} // Mock data removed
            />;
        }
        // Admin, Team Lead, Team default dashboard
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Candidate Pipeline"
                    isSplitMetrics={true}
                    metrics={[
                        { label: "Active", value: pipelineStats.active, color: "text-blue-600" },
                        { label: "Interview", value: pipelineStats.interview, color: "text-purple-600" },
                        { label: "Rejected", value: pipelineStats.rejected, color: "text-red-600" },
                        { label: "Quit", value: pipelineStats.quit, color: "text-gray-800" },
                    ]}
                />
                <StatCard 
                    title="Total Vendors" 
                    value={vendorStats.total} 
                />
                <StatCard 
                    title="Complaints"
                    isSplitMetrics={false}
                    metrics={[
                        { label: "Active", value: complaintStats.active, color: "text-red-600" },
                        { label: "Closed", value: complaintStats.closed, color: "text-green-600" },
                    ]}
                />
                 <StatCard 
                    title="Requirements Update"
                    value={partnerRequirementStats.total}
                    isSplitMetrics={true}
                    metrics={[
                        { label: "Pending", value: partnerRequirementStats.pending, color: "text-yellow-600" },
                        { label: "Approved", value: partnerRequirementStats.approved, color: "text-green-600" },
                    ]}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressBarCard title="Candidates by Process" data={candidatesByProcess} />
              <ProgressBarCard title="Candidates by Role" data={candidatesByRole} />
            </div>
            
            {/* HR Updates Section */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">HR Updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <span className="block text-sm text-gray-500 font-medium">Total Selected</span>
                        <span className="text-2xl font-bold text-blue-600">{hrStats.totalSelected}</span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg text-center">
                        <span className="block text-sm text-gray-500 font-medium">Total Offer Released</span>
                        <span className="text-2xl font-bold text-indigo-600">{hrStats.totalOfferReleased}</span>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg text-center">
                        <span className="block text-sm text-gray-500 font-medium">Onboarding Pending</span>
                        <span className="text-2xl font-bold text-yellow-600">{hrStats.totalOnboardingPending}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col justify-between">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b border-gray-200 pb-1">New Joining</h4>
                        <div className="flex justify-between items-center text-sm">
                            <div className="text-center">
                                <span className="block text-xs text-gray-400 uppercase">Day</span>
                                <span className="font-bold text-gray-800">{hrStats.newJoining.day}</span>
                            </div>
                            <div className="text-center border-l border-r border-gray-200 px-2">
                                <span className="block text-xs text-gray-400 uppercase">Week</span>
                                <span className="font-bold text-gray-800">{hrStats.newJoining.week}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs text-gray-400 uppercase">Month</span>
                                <span className="font-bold text-gray-800">{hrStats.newJoining.month}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RequirementsBreakdownView data={requirementBreakdown} />

            <TeamPerformanceTable data={teamPerformance} />
          </div>
        );
      case AdminMenuItem.DailyLineups:
        return <DailyLineupsView userType={userType} />;
      case AdminMenuItem.SelectionDashboard:
        return <SelectionDashboardView initialStage={viewFilters[AdminMenuItem.SelectionDashboard]?.stage} />;
      case AdminMenuItem.AllCandidates:
        return <AllCandidatesView initialStatus={viewFilters[AdminMenuItem.AllCandidates]?.status} />;
      case AdminMenuItem.Attendance:
        return <AttendanceView />;
      case AdminMenuItem.Complaints:
        return <ComplaintsView initialStatus={viewFilters[AdminMenuItem.Complaints]?.status} />;
      case AdminMenuItem.WarningLetters:
        return <WarningLettersView />;
      case AdminMenuItem.Reports:
        return <ReportsView userType={userType} currentUser={currentUser} />;
      case AdminMenuItem.ManageJobBoard:
        return <JobBoardView jobs={jobs} onAddJob={() => setIsAddJobModalOpen(true)} onDeleteJob={onDeleteJob} />;
      case AdminMenuItem.VendorDirectory:
        return <VendorDirectoryView vendors={vendors} onUpdateSettings={onUpdateSettings} availableLocations={locations} availableJobRoles={jobRoles} />;
      case AdminMenuItem.DemoRequests:
        return <DemoRequestsView />;
      case AdminMenuItem.Revenue:
        return <RevenueView />;
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
            panelConfig={panelConfig}
            currentUser={currentUser}
            currentLogoSrc={currentLogoSrc}
            onLogoUpload={onLogoUpload}
            onOpenAddTeamMemberModal={() => setIsAddTeamMemberModalOpen(true)}
            teamMembers={teamMembersList} // Pass fetched team members to SettingsView
        />;
      // HR
      case AdminMenuItem.ManagePayroll:
        return <ManagePayrollView />;
      case AdminMenuItem.GenerateOfferLetter:
        return <GenerateOfferLetterView />;
      case AdminMenuItem.CTCGenerate:
        return <CTCGeneratorView />;
      case AdminMenuItem.Payslips:
        return <PayslipsView />;
      case AdminMenuItem.EmployeeManagement:
        return <EmployeeManagementView />;
      case AdminMenuItem.MyProfile:
        return <MyProfileView user={currentUser} profile={profile} setProfile={setProfile} />;
      // Partner
      case AdminMenuItem.PartnerActiveCandidates:
        return <PartnerActiveCandidatesView />;
      case AdminMenuItem.PartnerUpdateStatus:
        return <PartnerUpdateStatusView />;
      case AdminMenuItem.ManageSupervisors:
        return <PartnerManageSupervisorsView stores={stores} />;
      case AdminMenuItem.PartnerRequirements:
        return <PartnerRequirementsView initialStatus={viewFilters[AdminMenuItem.PartnerRequirements]?.status} />;
      case AdminMenuItem.PartnerInvoices:
        return <PartnerInvoicesView />;
      case AdminMenuItem.PartnerHelpCenter:
        return <Placeholder title="Partner Help Center" />; // Placeholder for now
      case AdminMenuItem.PartnerSalaryUpdates:
        return <PartnerSalaryUpdatesView />;
      // Supervisor
      case AdminMenuItem.SupervisorDashboard:
        return <SupervisorDashboardView />;
      case AdminMenuItem.StoreAttendance:
        return <StoreAttendanceView />;
      case AdminMenuItem.StoreEmployees:
        return <StoreEmployeesView />;
      case AdminMenuItem.MyAttendance:
        // Check if user is a supervisor, if so render StoreAttendanceView to mark team attendance
        if (userType === UserType.STORE_SUPERVISOR) {
            return <StoreAttendanceView />;
        }
        return <MyAttendanceView />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
      
      <Modal 
        isOpen={isAddJobModalOpen} 
        onClose={() => setIsAddJobModalOpen(false)} 
        title="Post New Job"
        maxWidth="max-w-4xl"
      >
        <JobPostingForm 
            onAddJob={(job) => {
                onAddJob(job);
                setIsAddJobModalOpen(false);
            }} 
            isModalMode={true} 
            onClose={() => setIsAddJobModalOpen(false)}
            availableVendors={vendors}
            availableStores={stores} // Pass availableStores here
        />
      </Modal>

      <AddTeamMemberModal 
        isOpen={isAddTeamMemberModalOpen}
        onClose={() => setIsAddTeamMemberModalOpen(false)}
        onSave={(data) => {
            createTeamMember(data);
            setIsAddTeamMemberModalOpen(false);
        }}
        availableLocations={locations}
        availableVendors={vendors.map(v => v.name)}
        availableRoles={systemRoles?.map(r => r.name) || []}
        availableManagers={teamMembersList.filter(m => m.userType === UserType.TEAMLEAD).map(m => m.fullName)} // Pass filtered team leads
      />
    </div>
  );
};

export default AdminDashboardContent;
