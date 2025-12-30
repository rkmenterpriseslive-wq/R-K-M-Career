import React, { useMemo, useState } from 'react';
import { Job, PartnerRequirement } from '../../types';
import Button from '../Button';

interface JobBoardListViewProps {
  jobs: Job[];
  requirements: PartnerRequirement[];
  onDeleteJob: (id: string) => void;
  onDeleteRequirement?: (id: string) => void;
  onEditJob: (job: Job) => void;
  onApproveRequirement: (req: PartnerRequirement) => void;
  onRejectRequirement: (id: string) => void;
  onEditRequirement?: (req: PartnerRequirement) => void;
}

const JobBoardListView: React.FC<JobBoardListViewProps> = ({ 
    jobs, 
    requirements, 
    onDeleteJob, 
    onDeleteRequirement,
    onEditJob, 
    onApproveRequirement, 
    onRejectRequirement,
    onEditRequirement
}) => {
    
    const [activeTab, setActiveTab] = useState<'jobs' | 'requirements'>('jobs');
    
    const adminPostedJobs = useMemo(() => {
        // This rule filters out jobs that were automatically created from an approved partner requirement.
        // It shows only jobs created directly by an admin via the 'Post New Job' form.
        return jobs.filter(job => job.jobCategory !== 'Partner');
    }, [jobs]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: PartnerRequirement['submissionStatus'] | 'Active') => {
        switch (status) {
            case 'Pending Review':
                return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 animate-pulse">Pending</span>;
            case 'Approved':
                return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
            case 'Rejected':
                return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
            case 'Active':
            default:
                return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
        }
    };
    
    const tabButtonClasses = (isActive: boolean) => 
        `px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
            isActive ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`;

    const renderJobsTable = () => (
        <div className="divide-y divide-gray-200">
            {adminPostedJobs.map(job => (
                <div key={job.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-2 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-2 md:col-span-3 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                            {job.companyLogoSrc ? <img src={job.companyLogoSrc} alt={`${job.company} logo`} className="max-w-full max-h-full object-contain p-1" /> : <span className="text-xl font-bold text-gray-400">{job.company.charAt(0)}</span>}
                        </div>
                        <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p><p className="text-xs text-gray-500 truncate">{job.company}</p></div>
                    </div>
                    <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Partner</p><p className="text-sm text-gray-600 truncate">{job.partnerName || 'Direct'}</p></div>
                    <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Process</p><p className="text-sm text-gray-600">{job.jobType}</p><p className="text-xs text-gray-400">{job.numberOfOpenings} openings</p></div>
                    <div className="col-span-1 md:col-span-1"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Location</p><p className="text-sm text-gray-600 truncate">{job.jobCity}</p><p className="text-xs text-gray-400 truncate">{job.locality}</p></div>
                    <div className="col-span-1 md:col-span-1"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Status</p>{getStatusBadge('Active')}</div>
                    <div className="col-span-1 md:col-span-1"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Created</p><p className="text-sm text-gray-600">{formatDate(job.postedDate)}</p></div>
                    <div className="col-span-2 md:col-span-2 flex justify-start md:justify-end gap-2 pt-2 md:pt-0 border-t border-gray-100 md:border-0">
                        <Button variant="ghost" size="sm" onClick={() => onEditJob(job)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => onDeleteJob(job.id)}>Delete</Button>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderRequirementsTable = () => (
         <div className="divide-y divide-gray-200">
            {requirements.map(req => (
                <div key={req.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-2 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="col-span-2 md:col-span-3 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                             {req.companyLogoSrc ? <img src={req.companyLogoSrc} alt={`${req.brand} logo`} className="max-w-full max-h-full object-contain p-1" /> : <span className="text-xl font-bold text-gray-400">{req.brand.charAt(0)}</span>}
                        </div>
                        <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{req.title}</p><p className="text-xs text-gray-500 truncate">{req.brand}</p></div>
                    </div>
                    <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Partner</p><p className="text-sm text-gray-600 truncate">{req.partnerName || 'N/A'}</p></div>
                     <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Process</p><p className="text-sm text-gray-600">{req.jobType}</p><p className="text-xs text-gray-400">{req.openings} openings</p></div>
                     <div className="col-span-1 md:col-span-1"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Location</p><p className="text-sm text-gray-600 truncate">{req.location}</p><p className="text-xs text-gray-400 truncate">{req.storeName}</p></div>
                    <div className="col-span-1 md:col-span-1"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Status</p>{getStatusBadge(req.submissionStatus)}</div>
                    <div className="col-span-1 md:col-span-1"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Created</p><p className="text-sm text-gray-600">{formatDate(req.postedDate)}</p></div>
                    <div className="col-span-2 md:col-span-2 flex justify-start md:justify-end gap-2 pt-2 md:pt-0 border-t border-gray-100 md:border-0">
                        {req.submissionStatus === 'Pending Review' && <>
                            <Button variant="primary" size="sm" onClick={() => onApproveRequirement(req)}>Approve</Button>
                            <Button variant="secondary" size="sm" onClick={() => onRejectRequirement(req.id)}>Reject</Button>
                        </>}
                        {onEditRequirement && <Button variant="ghost" size="sm" onClick={() => onEditRequirement(req)}>Edit</Button>}
                        {onDeleteRequirement && <Button variant="danger" size="sm" onClick={() => onDeleteRequirement(req.id)}>Delete</Button>}
                    </div>
                </div>
            ))}
        </div>
    );
    
    return (
        <div>
            <div className="flex items-center gap-2 p-2 mb-4 bg-gray-100 rounded-lg w-fit">
                <button className={tabButtonClasses(activeTab === 'jobs')} onClick={() => setActiveTab('jobs')}>
                    Job Postings ({adminPostedJobs.length})
                </button>
                <button className={tabButtonClasses(activeTab === 'requirements')} onClick={() => setActiveTab('requirements')}>
                    Partner Requirements ({requirements.length})
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header for larger screens */}
                <div className="px-6 py-3 bg-gray-50/75 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{activeTab === 'jobs' ? 'Title' : 'Requirement'}</div>
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Partner</div>
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Process</div>
                    <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</div>
                    <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</div>
                    <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</div>
                    <div className="col-span-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</div>
                </div>

                {/* List Body */}
                {activeTab === 'jobs' ? renderJobsTable() : renderRequirementsTable()}

                {(activeTab === 'jobs' && adminPostedJobs.length === 0) && (
                     <div className="p-12 text-center text-gray-500">No jobs have been posted directly by an admin.</div>
                )}
                {(activeTab === 'requirements' && requirements.length === 0) && (
                     <div className="p-12 text-center text-gray-500">No partner requirements submitted.</div>
                )}
            </div>
        </div>
    );
};

export default JobBoardListView;
