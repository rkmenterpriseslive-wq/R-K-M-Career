


import React from 'react';
import { AdminMenuItem, AppUser } from '../../types';
import Button from '../Button';

// --- NEW TYPES & SUB-COMPONENTS FOR THE REDESIGNED DASHBOARD ---

interface PartnerStats {
    totalOpenings: number;
    candidatesSubmitted: number;
    interviewsScheduled: number;
    offersReleased: number;
    candidatesJoined: number;
    fillRate: number; // percentage
    pendingRequirements: number;
    activeRequirements: number;
}

interface PartnerDashboardViewProps {
    onNavigate: (item: AdminMenuItem) => void;
    currentUser: AppUser | null;
    stats: PartnerStats;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; description?: string; onClick?: () => void }> = ({ title, value, icon, color, description, onClick }) => (
    <div onClick={onClick} className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all' : ''}`}>
        <div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text', 'bg').replace('-600', '-100')}`}>
                {icon}
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-4">{value}</p>
            <p className="text-sm font-semibold text-gray-600">{title}</p>
        </div>
        {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
    </div>
);

const ProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }}></div>
    </div>
);

const FunnelStep: React.FC<{ count: number; label: string; icon: React.ReactNode }> = ({ count, label, icon }) => (
    <div className="flex flex-col items-center text-center w-24">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-2">
            {icon}
        </div>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
        <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
    </div>
);

const FunnelArrow: React.FC = () => (
    <div className="flex-1 flex items-center justify-center text-gray-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
    </div>
);

// --- MAIN COMPONENT ---

const PartnerDashboardView: React.FC<PartnerDashboardViewProps> = ({ onNavigate, currentUser, stats }) => {
    
    const ICONS = {
        openings: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        joined: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
        fillRate: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>,
        pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        submitted: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        interview: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        offered: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    };

    const quickLinks = [
        { label: 'Track Applicants', item: AdminMenuItem.PartnerTrackApplicants, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
        { label: 'Post Job / Requirement', item: AdminMenuItem.PartnerPostJob, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: 'Manage Supervisors', item: AdminMenuItem.ManageSupervisors, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
        { label: 'Get Help', item: AdminMenuItem.PartnerHelpCenter, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Active Openings" value={stats.totalOpenings} icon={ICONS.openings} color="text-purple-600" description={`${stats.activeRequirements} active requirements`} onClick={() => onNavigate(AdminMenuItem.PartnerPostJob)} />
                <KpiCard title="Total Candidates Joined" value={stats.candidatesJoined} icon={ICONS.joined} color="text-green-600" description="Successfully onboarded" onClick={() => onNavigate(AdminMenuItem.PartnerActiveCandidates)} />
                <div>
                    <KpiCard title="Overall Fill Rate" value={`${stats.fillRate.toFixed(1)}%`} icon={ICONS.fillRate} color="text-blue-600" />
                    <div className="px-6 pb-4 bg-white rounded-b-xl -mt-2"><ProgressBar value={stats.fillRate} color="bg-blue-500" /></div>
                </div>
                <KpiCard title="Requirements Pending" value={stats.pendingRequirements} icon={ICONS.pending} color="text-yellow-600" description="Awaiting admin approval" onClick={() => onNavigate(AdminMenuItem.PartnerPostJob)} />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Candidate Pipeline</h3>
                <div className="flex items-center justify-around">
                    <FunnelStep count={stats.candidatesSubmitted} label="Submitted" icon={ICONS.submitted} />
                    <FunnelArrow />
                    <FunnelStep count={stats.interviewsScheduled} label="Interview" icon={ICONS.interview} />
                    <FunnelArrow />
                    <FunnelStep count={stats.offersReleased} label="Offered" icon={ICONS.offered} />
                    <FunnelArrow />
                    <FunnelStep count={stats.candidatesJoined} label="Joined" icon={ICONS.joined} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickLinks.map(link => (
                             <Button key={link.item} variant="small-light" onClick={() => onNavigate(link.item)} className="w-full text-left justify-start p-3 !font-medium">
                                {link.icon} {link.label}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center text-gray-600"><span className="mr-3 text-green-500">✓</span>Requirement for 'Picker' was approved.</li>
                        <li className="flex items-center text-gray-600"><span className="mr-3 text-blue-500">✓</span>You updated status for 'Anjali Verma'.</li>
                        <li className="flex items-center text-gray-600"><span className="mr-3 text-yellow-500">✓</span>A new invoice #INV-2024-01 was generated.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboardView;