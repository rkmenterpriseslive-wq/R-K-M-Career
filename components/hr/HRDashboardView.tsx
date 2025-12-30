
import React from 'react';
import { AdminMenuItem } from '../../types';
import { getHRDashboardStats, getRecentHires, getOnboardingPipeline, OnboardingCandidate, RecentHire, HRDashboardStats } from '../../utils/hrService';
import Button from '../Button';

interface HRDashboardViewProps {
    onNavigate: (item: AdminMenuItem) => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; description?: string }> = ({ title, value, icon, color, description }) => (
    <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-gray-500">{title}</p>
                <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text', 'bg').replace('-600', '-100')}`}>
                {icon}
            </div>
        </div>
        {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
    </div>
);

const RecruitmentFunnel: React.FC<{ data: HRDashboardStats }> = ({ data }) => {
    const FunnelStep: React.FC<{ value: number, label: string, isFirst?: boolean, isLast?: boolean }> = ({ value, label, isFirst, isLast }) => {
        const conversion = isFirst ? 100 : Math.round((value / data.selected) * 100);
        return (
            <div className="flex items-center">
                {!isFirst && (
                    <div className="flex flex-col items-center mx-4 w-24">
                        <span className="text-sm font-bold text-blue-600">{conversion}%</span>
                        <span className="text-xs text-gray-500">Conversion</span>
                    </div>
                )}
                <div className="flex flex-col items-center text-center">
                    <p className="text-3xl font-extrabold text-gray-800">{value}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Recruitment Funnel (This Month)</h3>
            <div className="flex items-center justify-between">
                <FunnelStep value={data.selected} label="Selected" isFirst />
                <FunnelStep value={data.offerReleased} label="Offer Released" />
                <FunnelStep value={data.joined} label="Joined" isLast />
            </div>
        </div>
    );
};

const OnboardingPipeline: React.FC<{ data: OnboardingCandidate[] }> = ({ data }) => {
    const statusCounts = data.reduce((acc, curr) => {
        acc[curr.onboardingStatus] = (acc[curr.onboardingStatus] || 0) + 1;
        return acc;
    }, {} as Record<OnboardingCandidate['onboardingStatus'], number>);

    const total = data.length;
    
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Onboarding Pipeline</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm font-medium mb-1"><span className="text-gray-700">Pending Submission</span><span className="text-gray-500">{statusCounts['Pending Submission'] || 0} / {total}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${total > 0 ? ((statusCounts['Pending Submission'] || 0) / total) * 100 : 0}%` }}></div></div>
                </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1"><span className="text-gray-700">Pending Verification</span><span className="text-gray-500">{statusCounts['Pending Verification'] || 0} / {total}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${total > 0 ? ((statusCounts['Pending Verification'] || 0) / total) * 100 : 0}%` }}></div></div>
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium mb-1"><span className="text-gray-700">Onboarding Complete</span><span className="text-gray-500">{statusCounts['Onboarding Complete'] || 0} / {total}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${total > 0 ? ((statusCounts['Onboarding Complete'] || 0) / total) * 100 : 0}%` }}></div></div>
                </div>
            </div>
        </div>
    );
};


const HRDashboardView: React.FC<HRDashboardViewProps> = ({ onNavigate }) => {
    const stats = getHRDashboardStats();
    const recentHires = getRecentHires();
    const onboardingPipeline = getOnboardingPipeline();

    const ICONS = {
        employees: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        newHires: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
        onboarding: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
        attrition: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /><path d="M17 11l4 4m0-4l-4 4" /></svg>,
    };

    const actionLinks = [
        { label: 'Manage Onboarding', item: AdminMenuItem.EmployeeManagement, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
        { label: 'Process Payroll', item: AdminMenuItem.ManagePayroll, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Generate Offer Letters', item: AdminMenuItem.GenerateOfferLetter, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: 'View All Employees', item: AdminMenuItem.EmployeeManagement, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    ];


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Employees" value={stats.totalEmployees} icon={ICONS.employees} color="text-blue-600" />
                <KpiCard title="New Hires (This Month)" value={stats.newHires} icon={ICONS.newHires} color="text-green-600" />
                <KpiCard title="Pending Onboarding" value={stats.pendingOnboarding} icon={ICONS.onboarding} color="text-yellow-600" />
                <KpiCard title="Attrition Rate (Month)" value={`${stats.attrition}%`} icon={ICONS.attrition} color="text-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecruitmentFunnel data={stats} />
                <OnboardingPipeline data={onboardingPipeline} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Hires</h3>
                     <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-100">
                                <tr>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">Name</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">Role</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase py-2">Joining Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentHires.map(hire => (
                                    <tr key={hire.id} className="border-b border-gray-100 last:border-0">
                                        <td className="py-3"><p className="font-semibold text-sm text-gray-900">{hire.name}</p></td>
                                        <td className="py-3 text-sm text-gray-600">{hire.role}</td>
                                        <td className="py-3 text-sm text-gray-600">{hire.joiningDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Action Center</h3>
                    <div className="space-y-3">
                        {actionLinks.map(link => (
                             <Button key={link.item} variant="small-light" onClick={() => onNavigate(link.item)} className="w-full text-left justify-start p-3 !font-medium">
                                {link.icon} {link.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboardView;
