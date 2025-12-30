import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Job, AppUser, Vendor } from '../../types';
import Button from '../Button';

const AddJobView = lazy(() => import('../admin/AddJobView'));

interface HYJobsPageProps {
    jobs: Job[];
    onAddJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => Promise<void>;
    onUpdateJob: (jobId: string, jobData: Partial<Omit<Job, 'id' | 'postedDate' | 'adminId'>>) => Promise<void>;
    onDeleteJob: (id: string) => void;
    vendors: Vendor[];
    stores: { id: string; name: string; location: string }[];
    currentUser: AppUser | null;
}

const HYJobsPage: React.FC<HYJobsPageProps> = (props) => {
    const [isAddingJob, setIsAddingJob] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');

    const myJobs = useMemo(() => {
        if (!props.currentUser) return [];
        return props.jobs.filter(job => job.adminId === props.currentUser?.uid);
    }, [props.jobs, props.currentUser]);

    // For now, all jobs are considered 'active' as there's no status field.
    // This structure allows for easy implementation of a 'closed' status later.
    const activeJobs = myJobs;
    const closedJobs: Job[] = []; // Placeholder for future implementation

    const handleSaveJobCreation = async (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => {
        await props.onAddJob(job);
        setIsAddingJob(false);
    };

    const handleSaveJobUpdate = async (jobData: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => {
        if (!editingJob) return;
        await props.onUpdateJob(editingJob.id, jobData);
        setEditingJob(null);
    };
    
    if (isAddingJob || editingJob) {
        return (
            <Suspense fallback={<div className="p-12 text-center">Loading form...</div>}>
                <AddJobView
                    initialData={editingJob}
                    onSaveJob={editingJob ? handleSaveJobUpdate : handleSaveJobCreation}
                    onCancel={() => { setIsAddingJob(false); setEditingJob(null); }}
                    availableVendors={props.vendors}
                    availableStores={props.stores}
                    currentUser={props.currentUser}
                />
            </Suspense>
        );
    }
    
    const tabButtonClasses = (isActive: boolean) => 
        `px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
        }`;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const renderJobsList = (jobsToList: Job[]) => {
        if (jobsToList.length === 0) {
            return <div className="p-12 text-center text-gray-500">No jobs found in this category.</div>;
        }

        return (
            <div className="divide-y divide-gray-200">
                {jobsToList.map(job => (
                    <div key={job.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-2 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="col-span-2 md:col-span-4 flex items-center gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                <p className="text-xs text-gray-500 truncate">{job.company}</p>
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Location</p><p className="text-sm text-gray-600 truncate">{job.jobCity}</p></div>
                        <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Openings</p><p className="text-sm text-gray-600">{job.numberOfOpenings}</p></div>
                        <div className="col-span-1 md:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase md:hidden">Created</p><p className="text-sm text-gray-600">{formatDate(job.postedDate)}</p></div>
                        <div className="col-span-2 md:col-span-2 flex justify-start md:justify-end gap-2 pt-2 md:pt-0 border-t border-gray-100 md:border-0">
                            <Button variant="ghost" size="sm" onClick={() => setEditingJob(job)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => props.onDeleteJob(job.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">My Jobs</h2>
                <Button variant="primary" onClick={() => { setEditingJob(null); setIsAddingJob(true); }}>
                    + Post New Job
                </Button>
            </div>

            {/* Tabs for Active and Closed jobs */}
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg w-fit">
                <button className={tabButtonClasses(activeTab === 'active')} onClick={() => setActiveTab('active')}>
                    Active Jobs ({activeJobs.length})
                </button>
                <button className={tabButtonClasses(activeTab === 'closed')} onClick={() => setActiveTab('closed')}>
                    Closed / Rejected Jobs ({closedJobs.length})
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header for larger screens */}
                <div className="px-6 py-3 bg-gray-50/75 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</div>
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</div>
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Openings</div>
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</div>
                    <div className="col-span-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</div>
                </div>

                {renderJobsList(activeTab === 'active' ? activeJobs : closedJobs)}
            </div>
        </div>
    );
};

export default HYJobsPage;
