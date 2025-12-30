
import React from 'react';
import Modal from './Modal';
import { Job } from '../types';
import Button from './Button';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onApply: (job: Job) => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onApply }) => {
  if (!job) return null;

  const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-1 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  const icons = {
    salary: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.196.552-.257m-4.283 4.283c.103.158.196.346.257.552m4.283-4.283a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243zm-1.06-5.518a3.001 3.001 0 014.242 0 3 3 0 010 4.242 3 3 0 01-4.242 0 3 3 0 010-4.242zM10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>,
    location: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>,
    experience: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v10a2 2 0 01-2-2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    openings: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.115 16.428a1 1 0 001.414 0L4 14.842V18a1 1 0 001 1h8a1 1 0 001-1v-3.158l1.47-1.586a1 1 0 000-1.414l-4.243-4.243a1 1 0 00-1.414 0L1 15.014a1 1 0 000 1.414z" /></svg>,
    // Add other icons as needed
  };

  return (
    <Modal isOpen={!!job} onClose={onClose} title={job.title} maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          {job.companyLogoSrc && <img src={job.companyLogoSrc} alt={`${job.company} logo`} className="h-16 w-16 object-contain border p-1 rounded-lg bg-white" />}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-md font-semibold text-blue-600">{job.partnerName || job.company}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <DetailItem icon={icons.salary} label="Salary" value={<>{job.salaryRange} {job.incentive && <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">+ {job.incentive} Inc.</span>}</>} />
          <DetailItem icon={icons.location} label="Location" value={<>{job.jobCity}, {job.locality} {job.storeName && `(${job.storeName})`}</>} />
          <DetailItem icon={icons.experience} label="Experience" value={job.experienceLevel} />
          <DetailItem icon={icons.openings} label="Openings" value={job.numberOfOpenings} />
        </div>
        
        <div className="prose prose-sm max-w-none text-gray-600 border-t pt-4">
          <p>{job.description}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="button" variant="primary" onClick={() => onApply(job)}>Apply Now</Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobDetailModal;
