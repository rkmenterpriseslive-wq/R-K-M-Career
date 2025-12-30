
import React, { useState } from 'react';
import { AppUser, Job, Vendor } from '../../types';
import HYHeader from './HYHeader';
import HYHomePage from './HYHomePage';
import HYJobsPage from './HYJobsPage';
import HYPlanPage from './HYPlanPage';
import HYMorePage from './HYMorePage';
import HYProfilePage from './HYProfilePage';
import { usePopup } from '../../contexts/PopupContext';

export type HYMenuItem = 'Home' | 'Jobs' | 'Plan' | 'More' | 'Profile';

interface HireYourselfLayoutProps {
    currentUser: AppUser | null;
    onLogout: () => void;
    jobs: Job[];
    rawCandidates: any[];
    onAddJob: (job: Omit<Job, 'id' | 'postedDate' | 'adminId'>) => Promise<void>;
    onUpdateJob: (jobId: string, jobData: Partial<Omit<Job, 'id' | 'postedDate' | 'adminId'>>) => Promise<void>;
    onDeleteJob: (id: string) => void;
    vendors: Vendor[];
    stores: { id: string; name: string; location: string }[];
}

const HireYourselfLayout: React.FC<HireYourselfLayoutProps> = (props) => {
    const [activeMenuItem, setActiveMenuItem] = useState<HYMenuItem>('Home');
    const { showPopup } = usePopup();

    const renderContent = () => {
        switch (activeMenuItem) {
            case 'Home':
                return <HYHomePage 
                            currentUser={props.currentUser} 
                            jobs={props.jobs} 
                            rawCandidates={props.rawCandidates} 
                            onNavigate={setActiveMenuItem}
                        />;
            case 'Jobs':
                return <HYJobsPage 
                    jobs={props.jobs} 
                    onAddJob={props.onAddJob}
                    onUpdateJob={props.onUpdateJob}
                    onDeleteJob={props.onDeleteJob}
                    vendors={props.vendors}
                    stores={props.stores}
                    currentUser={props.currentUser}
                />;
            case 'Plan':
                return <HYPlanPage />;
            case 'More':
                return <HYMorePage />;
            case 'Profile':
                return <HYProfilePage currentUser={props.currentUser} />;
            default:
                return <HYHomePage 
                            currentUser={props.currentUser} 
                            jobs={props.jobs} 
                            rawCandidates={props.rawCandidates}
                            onNavigate={setActiveMenuItem}
                        />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <HYHeader 
                activeItem={activeMenuItem}
                onItemClick={setActiveMenuItem}
                onLogout={props.onLogout}
                currentUser={props.currentUser}
            />
            <main className="flex-grow p-4 md:p-8 container mx-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default HireYourselfLayout;
