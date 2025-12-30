

import React, { useMemo } from 'react';
import { Interview, AppUser, StoreSupervisor } from '../../types';

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-500 mb-1">{title}</h4>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

interface MyInterviewsViewProps {
    currentUser: AppUser | null;
    candidates: any[];
    supervisors?: StoreSupervisor[];
}

const MyInterviewsView: React.FC<MyInterviewsViewProps> = ({ currentUser, candidates, supervisors }) => {
    const interviews: Interview[] = useMemo(() => {
        if (!currentUser || !candidates) return [];

        const mapCandidateStatusToInterviewStatus = (candidateStatus?: string, candidateStage?: string): Interview['status'] => {
            const status = (candidateStatus || '').toLowerCase();
            const stage = (candidateStage || '').toLowerCase();

            // Positive outcomes (interview is done and was successful)
            if (stage === 'selected' || stage === 'joined' || status.includes('accepted') || status.includes('joined') || status.includes('attended')) {
                return 'Completed';
            }
            // Negative outcomes
            if (stage === 'rejected' || status.includes('rejected') || status.includes('absconded')) {
                return 'Cancelled';
            }
            // If it's still scheduled or in the interview process without a final decision
            if (status.includes('scheduled') || stage === 'interview') {
                return 'Scheduled';
            }
            
            // Fallback for any other state, defaults to scheduled
            return 'Scheduled';
        };

        return candidates
            .filter(c => 
                (c.userId === currentUser.uid || c.email === currentUser.email) && 
                c.interviewDate // Show any record that has an interview date, regardless of stage
            )
            .map(c => {
                const interviewDateTime = new Date(c.interviewDate);
                if (isNaN(interviewDateTime.getTime())) {
                    return null;
                }

                let supervisorName: string | undefined = undefined;
                if (supervisors && c.storeLocation && c.location) {
                    const storeIdentifier = `${c.storeLocation} - ${c.location}`;
                    const supervisor = supervisors.find(sup => sup.storeLocation === storeIdentifier);
                    if (supervisor) {
                        supervisorName = supervisor.name;
                    }
                }

                const interviewStatus = mapCandidateStatusToInterviewStatus(c.status, c.stage);

                return {
                    id: c.id,
                    jobTitle: c.role || 'N/A',
                    company: c.vendor || 'N/A',
                    storeName: c.storeLocation || c.storeName || undefined,
                    round: 'First Round',
                    date: interviewDateTime.toISOString(),
                    time: interviewDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    type: 'Store Location',
                    locationOrLink: c.interviewDetails || 'Details to be confirmed',
                    status: interviewStatus,
                    supervisorName: supervisorName,
                } as Interview;
            })
            .filter((i): i is Interview => i !== null)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [candidates, currentUser, supervisors]);

    const summary = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        const upcoming = interviews.filter(i => i.status === 'Scheduled' && new Date(i.date) >= today).length;
        const completed = interviews.filter(i => i.status === 'Completed').length;
        const rescheduled = interviews.filter(i => i.status === 'Rescheduled').length;
        return { upcoming, completed, rescheduled };
    }, [interviews]);

    const getStatusInfo = (status: Interview['status']) => {
        switch (status) {
            case 'Completed': return { text: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> };
            case 'Scheduled': return { text: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> };
            case 'Cancelled': return { text: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> };
            case 'Rescheduled': return { text: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
            default: return { text: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-500', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
        }
    };

    const icons = {
        location: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        supervisor: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        status: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">My Interviews</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Upcoming" value={summary.upcoming} color="text-blue-600" />
                <StatCard title="Completed" value={summary.completed} color="text-green-600" />
                <StatCard title="Rescheduled" value={summary.rescheduled} color="text-yellow-600" />
            </div>

            <div className="relative pl-5 before:content-[''] before:absolute before:left-5 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-200">
                {interviews.length > 0 ? interviews.map((interview) => {
                    const statusInfo = getStatusInfo(interview.status);
                    const date = new Date(interview.date);

                    return (
                        <div key={interview.id} className="relative pl-10 pb-8">
                            {/* Timeline Dot with Icon */}
                            <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.bg} ${statusInfo.text} ring-8 ring-gray-100`}>
                                {statusInfo.icon}
                            </div>
                            
                            {/* Card Content */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-blue-300 ml-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-600">{interview.jobTitle}</p>
                                        <p className="text-xl font-bold text-gray-900">{interview.company}</p>
                                        {interview.storeName && (
                                            <p className="text-sm text-gray-600 mt-1">{interview.storeName}</p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0 mt-2 sm:mt-0">
                                        <p className="font-bold text-gray-800">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p className="text-sm text-gray-500">{interview.time}</p>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div className="flex items-start gap-3">
                                        {icons.location}
                                        <div>
                                            <p className="font-semibold text-gray-800">{interview.type}</p>
                                            {interview.type === 'Store Location' ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(interview.locationOrLink)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs break-all"
                                                    aria-label={`Open map for ${interview.locationOrLink}`}
                                                >
                                                    {interview.locationOrLink}
                                                </a>
                                            ) : (
                                                <p className="text-gray-500 text-xs break-all">{interview.locationOrLink}</p>
                                            )}
                                        </div>
                                    </div>
                                    {interview.supervisorName && (
                                        <div className="flex items-start gap-3">
                                            {icons.supervisor}
                                            <div>
                                                <p className="font-semibold text-gray-800">Supervisor</p>
                                                <p className="text-gray-500">{interview.supervisorName}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        {icons.status}
                                        <div>
                                            <p className="font-semibold text-gray-800">Status</p>
                                            <p className={`font-bold ${statusInfo.text}`}>{interview.status}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                     <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm ml-4">
                        <svg className="mx-auto h-16 w-16 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11h.01M12 11h.01M9 11h.01" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15h.01" />
                        </svg>
                        <p className="mt-4 text-lg font-semibold text-gray-800">No interviews scheduled.</p>
                        <p className="text-sm mt-1">When an interview is scheduled for you, it will appear here in a timeline format.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyInterviewsView;
