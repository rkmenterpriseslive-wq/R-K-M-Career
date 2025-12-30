
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Job, AppUser } from '../types';
import Button from './Button';
import { usePopup } from '../contexts/PopupContext';

interface ApplyJobModalProps {
  job: Job | null;
  currentUser: AppUser | null;
  onClose: () => void;
  onSubmit: (details: { role: string; teamMember: string }) => void;
  teamMembers: any[];
}

const ApplyJobModal: React.FC<ApplyJobModalProps> = ({ job, currentUser, onClose, onSubmit, teamMembers = [] }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const { showPopup } = usePopup();

  const roles = job ? job.title.split(',').map(role => role.trim()).filter(Boolean) : [];

  // Filter team members to only show specific names as requested.
  const reportingTeamMembers = teamMembers.filter(member => 
    ['Muskan Singh', 'Surekha Choudhary'].includes(member.fullName)
  );

  useEffect(() => {
    // Auto-select role if there's only one. Reset if job changes or modal closes.
    if (job && roles.length === 1) {
      setSelectedRole(roles[0]);
    } else {
      setSelectedRole('');
    }
    // Reset team member selection when modal opens/changes
    setSelectedTeamMember('');
  }, [job]); // Dependency on the job object

  if (!job || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !selectedTeamMember) {
      alert('Please select a role and a team member.');
      return;
    }
    onSubmit({ role: selectedRole, teamMember: selectedTeamMember });
  };

  return (
    <Modal isOpen={!!job} onClose={onClose} title={`Apply for ${job.title}`} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit}>
        <p className="text-gray-600 mb-4">Confirm your application details.</p>

        {/* Job Info Card */}
        <div className="border rounded-lg p-4 mb-4 bg-white">
          <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            
            {/* Brand */}
            <div className="flex items-start gap-3 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v10a2 2 0 01-2-2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Brand Name</p>
                <p className="font-semibold">{job.company}</p>
              </div>
            </div>
            
            {/* Partner */}
            {job.partnerName && (
              <div className="flex items-start gap-3 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Partner Name</p>
                  <p className="font-semibold">{job.partnerName}</p>
                </div>
              </div>
            )}

            {/* Store */}
            {job.storeName && (
              <div className="flex items-start gap-3 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Store</p>
                  <p className="font-semibold">{job.storeName}</p>
                </div>
              </div>
            )}
            
            {/* Location */}
            <div className="flex items-start gap-3 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold">{job.jobCity}</p>
              </div>
            </div>

          </div>
        </div>

        {/* User Info Banner */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-6 text-sm">
          You are applying as: <span className="font-bold">{currentUser.fullName || currentUser.email}</span> ({currentUser.phone || currentUser.email})
        </div>

        <div className="space-y-4">
          {/* Select Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Select Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="" disabled>Choose a role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Select Team Member */}
          <div>
            <label htmlFor="teamMember" className="block text-sm font-medium text-gray-700 mb-1">
              Select Your Reporting Team Member <span className="text-red-500">*</span>
            </label>
            <select
              id="teamMember"
              value={selectedTeamMember}
              onChange={(e) => setSelectedTeamMember(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="" disabled>Choose your team member contact</option>
              {reportingTeamMembers.map((member) => (
                <option key={member.id} value={member.fullName}>{member.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Next Steps Box */}
        <div className="bg-gray-50 border-dashed border-l-4 border-gray-300 text-gray-700 p-4 mt-6 text-sm">
          <p className="font-bold mb-1">Next Steps:</p>
          <p>
            Once you submit, the assigned team member will review your profile. After confirmation, you will receive interview details (Date, Time, and Venue) in your "My Interviews" tab.
          </p>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8">
          <Button type="submit" className="w-full justify-center">
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplyJobModal;
