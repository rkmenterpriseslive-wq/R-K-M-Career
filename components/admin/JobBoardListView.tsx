import React from 'react';
import { Job } from '../../types';
import Button from '../Button';

interface JobBoardListViewProps {
  jobs: Job[];
  onDeleteJob: (id: string) => void;
}

const JobBoardListView: React.FC<JobBoardListViewProps> = ({ jobs, onDeleteJob }) => {
    
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (jobs.length === 0) {
        return (
            <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-gray-500">No jobs posted yet. Click "+ Post New Job" to get started.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header for larger screens */}
            <div className="px-6 py-3 bg-gray-50/75 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</div>
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Process</div>
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</div>
                <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</div>
                <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</div>
                <div className="col-span-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</div>
            </div>

            {/* List Body */}
            <div className="divide-y divide-gray-200">
                {jobs.map(job => (
                    <div key={job.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-2 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                        {/* Title & Image */}
                        <div className="col-span-2 md:col-span-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                                {job.companyLogoSrc ? (
                                    <img src={job.companyLogoSrc} alt={`${job.company} logo`} className="max-w-full max-h-full object-contain p-1" />
                                ) : (
                                    <span className="text-xl font-bold text-gray-400">{job.company.charAt(0)}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                <p className="text-xs text-gray-500 truncate">{job.company}</p>
                            </div>
                        </div>

                        {/* Process */}
                        <div className="col-span-1 md:col-span-2">
                            <p className="text-xs text-gray-400 font-bold uppercase md:hidden">Process</p>
                            <p className="text-sm text-gray-600">{job.jobType}</p>
                            <p className="text-xs text-gray-400">{job.numberOfOpenings} openings</p>
                        </div>
                        
                        {/* Location */}
                        <div className="col-span-1 md:col-span-2">
                            <p className="text-xs text-gray-400 font-bold uppercase md:hidden">Location</p>
                             <p className="text-sm text-gray-600 truncate">{job.jobCity}</p>
                             <p className="text-xs text-gray-400 truncate">{job.locality}</p>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 md:col-span-1">
                             <p className="text-xs text-gray-400 font-bold uppercase md:hidden">Status</p>
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>

                        {/* Created */}
                        <div className="col-span-1 md:col-span-1">
                             <p className="text-xs text-gray-400 font-bold uppercase md:hidden">Created</p>
                            <p className="text-sm text-gray-600">{formatDate(job.postedDate)}</p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 md:col-span-2 flex justify-start md:justify-end gap-2 pt-2 md:pt-0 border-t border-gray-100 md:border-0">
                             <Button variant="ghost" size="sm">Edit</Button>
                             <Button variant="danger" size="sm" onClick={() => window.confirm("Are you sure you want to delete this job?") && onDeleteJob(job.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobBoardListView;
