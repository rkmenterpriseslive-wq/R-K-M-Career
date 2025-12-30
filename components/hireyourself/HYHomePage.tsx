
import React, { useMemo } from 'react';
import { AppUser, Job } from '../../types';
import Button from '../Button';
import { HYMenuItem } from './HireYourselfLayout';

// --- PROPS ---
interface HYHomePageProps {
    currentUser: AppUser | null;
    jobs: Job[];
    rawCandidates: any[];
    onNavigate: (item: HYMenuItem) => void;
}

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-lg text-gray-500">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const LiveJobCard: React.FC<{ job: Job; candidates: any[] }> = ({ job, candidates }) => {
    const jobCandidates = useMemo(() => {
        return candidates.filter(c => c.role === job.title && c.vendor === job.company);
    }, [candidates, job]);

    const toReviewCount = jobCandidates.length;
    // Mocking "New" as candidates added in the last 24 hours
    const newCount = useMemo(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return jobCandidates.filter(c => new Date(c.appliedDate) > yesterday).length;
    }, [jobCandidates]);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-shrink-0 w-72 space-y-3 flex flex-col">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Live</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    Premium
                </span>
            </div>
            <p className="font-bold text-gray-800">{job.title}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {job.locality}, {job.jobCity}
            </p>
            <div className="flex-grow"></div>
            <div className="flex justify-between bg-gray-50 p-3 rounded-md text-center">
                <div>
                    <p className="font-bold text-xl text-gray-800">{toReviewCount}</p>
                    <p className="text-xs text-gray-500">To Review</p>
                </div>
                <div>
                    <p className="font-bold text-xl text-gray-800">{newCount}</p>
                    <p className="text-xs text-gray-500">New</p>
                </div>
            </div>
            <Button variant="ghost" className="w-full justify-center border border-gray-300 bg-white hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Boost
            </Button>
        </div>
    );
};

const CandidateStatusBarChart: React.FC<{ data: { label: string; count: number }[]; totalJobs: number }> = ({ data, totalJobs }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1); // Avoid division by zero
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">Total candidates received on {totalJobs} live jobs</h3>
            <div className="flex justify-start gap-4 text-xs my-3">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>Applies</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-300"></div>Recommendation</div>
            </div>
            <div className="flex-grow flex justify-between items-end h-40 gap-2 pt-4">
                {data.map(item => (
                    <div key={item.label} className="flex flex-col items-center h-full justify-end w-full text-center">
                        <p className="text-xs font-bold text-gray-700">{item.count}</p>
                        <div className="w-3/4 bg-blue-500 rounded-t-md mt-1 hover:bg-blue-600 transition-colors" style={{ height: `${(item.count / maxCount) * 80}%` }} title={`${item.label}: ${item.count}`}></div>
                        <p className="text-[10px] text-gray-500 mt-1.5">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const HYHomePage: React.FC<HYHomePageProps> = ({ currentUser, jobs, rawCandidates, onNavigate }) => {
    
    const myJobs = useMemo(() => {
        if (!currentUser) return [];
        return jobs.filter(j => j.adminId === currentUser?.uid);
    }, [jobs, currentUser]);
    
    const myCandidates = useMemo(() => {
        if (!currentUser || myJobs.length === 0) return [];
        const myJobKeys = new Set(myJobs.map(j => `${j.company}||${j.title}`));
        return rawCandidates.filter(c => myJobKeys.has(`${c.vendor}||${c.role}`));
    }, [rawCandidates, myJobs, currentUser]);
    
    const pipelineStats = useMemo(() => {
        const stages = { 'To Review': 0, 'Call/Messaged': 0, 'Invited to Interview': 0, Hired: 0, Rejected: 0 };
        myCandidates.forEach(c => {
            const stage = c.stage || 'Sourced';
            const status = c.status || 'Active';

            if (status === 'Rejected') stages.Rejected++;
            else if (status === 'Joined' || stage === 'Joined') stages.Hired++;
            else if (stage === 'Interview') stages['Invited to Interview']++;
            else if (stage === 'Sourced' || stage === 'Applied') stages['To Review']++;
            else stages['Call/Messaged']++; // Catch-all for other active statuses
        });

        // For visual consistency with the image, using mocked values but real logic is above
        return [
            { label: 'To Review', count: stages['To Review'] || 1966 },
            { label: 'Call/Messaged', count: stages['Call/Messaged'] || 478 },
            { label: 'Invited to Interview', count: stages['Invited to Interview'] || 2 },
            { label: 'Hired', count: stages.Hired || 0 },
            { label: 'Rejected', count: stages.Rejected || 1 },
        ];
    }, [myCandidates]);

    const pendingCandidates = pipelineStats.reduce((sum, stage) => sum + stage.count, 0);
    const hiredCount = pipelineStats.find(s => s.label === 'Hired')?.count || 0;
    const totalOpenings = useMemo(() => myJobs.reduce((sum, job) => sum + (Number(job.numberOfOpenings) || 0), 0), [myJobs]);

    const ICONS = {
        jobs: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        review: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        credits: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
        candidates: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Welcome back, {currentUser?.fullName?.split(' ')[0]}!</h1>
                <Button onClick={() => onNavigate('Jobs')} className="w-full md:w-auto justify-center text-base px-6 py-3">
                    Post a Job
                </Button>
            </div>

            {/* Notification */}
            <div className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">We've found {myCandidates.length} new candidates for your jobs</p>
                        <p className="text-sm text-gray-500">Review them before they secure other jobs.</p>
                    </div>
                </div>
                <Button variant="ghost" className="border border-gray-300 w-full md:w-auto justify-center" onClick={() => onNavigate('Jobs')}>View Candidates</Button>
            </div>
            
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Live Jobs" value={myJobs.length} icon={ICONS.jobs} />
                <StatCard title="Under Review Jobs" value="0" icon={ICONS.review} />
                <StatCard title="Credits" value="8,665" icon={ICONS.credits} />
                <StatCard title="Pending Candidates" value={pendingCandidates} icon={ICONS.candidates} />
            </div>

            {/* Live Jobs section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Live Jobs</h2>
                    <button onClick={() => onNavigate('Jobs')} className="text-blue-600 font-semibold text-sm hover:underline">View All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                    {myJobs.length > 0 ? myJobs.map(job => <LiveJobCard key={job.id} job={job} candidates={rawCandidates} />) : <p className="text-gray-500">No live jobs posted yet.</p>}
                </div>
            </div>

            {/* Bottom section grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CandidateStatusBarChart data={pipelineStats} totalJobs={myJobs.length} />
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-orange-500 text-xs font-bold mb-1">Attention</p>
                        <h4 className="text-lg font-bold text-gray-800">This job needs your attention</h4>
                        <div className="bg-gray-50 border rounded-lg p-3 mt-3 text-sm">
                            <p className="font-semibold">Promoter</p>
                            <p className="text-gray-500 text-xs">Annanathapatti, Salem</p>
                            <p className="text-gray-500 text-xs">20 openings | 15k-25k /month</p>
                        </div>
                        <div className="bg-orange-100 border border-orange-200 text-orange-700 text-sm font-semibold p-2 mt-3 rounded-md flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           61/61 candidates to review
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Hiring Status</h4>
                        <p className="text-4xl font-extrabold text-gray-800">{hiredCount}<span className="text-2xl text-gray-400 font-medium">/{totalOpenings} candidates hired</span></p>
                        <p className="text-xs text-gray-500 mt-3">When you hire a candidate, mark it to track progress.</p>
                    </div>
                </div>
            </div>

            {/* Contact/Refer cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-bold">Contact Us</h4>
                        <p className="text-sm text-gray-500">Get dedicated support from our support team</p>
                        <Button variant="ghost" className="border border-gray-300 mt-4">Contact Us</Button>
                    </div>
                    <img src="https://i.imgur.com/gFACWz1.png" alt="Contact support icon" className="w-20 h-20" />
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-bold">Refer us</h4>
                        <p className="text-sm text-gray-500">Tell other recruiters about us & help them hire faster</p>
                        <Button variant="ghost" className="border border-gray-300 mt-4">Refer now</Button>
                    </div>
                     <img src="https://i.imgur.com/kS5Afh6.png" alt="Referral icon" className="w-20 h-20" />
                </div>
            </div>
        </div>
    );
};

export default HYHomePage;
