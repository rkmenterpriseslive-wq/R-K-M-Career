
import React, { lazy, Suspense } from 'react';
import Button from '../Button';
import { Job, Vendor, AppUser } from '../../types';

const JobPostingForm = lazy(() => import('../JobPostingForm'));

interface AddJobViewProps {
    onSaveJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => Promise<void>;
    onCancel: () => void;
    availableVendors?: Vendor[];
    availableStores?: { id: string; name: string; location: string }[];
    initialData?: Job | null;
    currentUser?: AppUser | null;
}

const AddJobView: React.FC<AddJobViewProps> = ({ onSaveJob, onCancel, availableVendors, availableStores, initialData, currentUser }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onCancel} className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back
                </Button>
                <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Edit Job' : 'Post New Job'}</h2>
            </div>
            
            <Suspense fallback={<div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">Loading form...</div>}>
                <JobPostingForm 
                    onSaveJob={onSaveJob}
                    onClose={onCancel}
                    availableVendors={availableVendors}
                    availableStores={availableStores}
                    initialData={initialData}
                    currentUser={currentUser}
                />
            </Suspense>
        </div>
    );
};

export default AddJobView;
