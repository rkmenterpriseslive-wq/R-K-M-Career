
import React, { useState, useMemo } from 'react';
import Button from '../Button';
import Input from '../Input';
import { TeamMemberPerformance } from '../../types';

interface RecruiterPerformanceReportViewProps {
    onBack: () => void;
    candidates: any[];
    teamMembers: TeamMemberPerformance[];
}

const RecruiterPerformanceReportView: React.FC<RecruiterPerformanceReportViewProps> = ({ onBack, candidates, teamMembers }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({ start: firstDayOfMonth, end: todayStr });

    const performanceData = useMemo(() => {
        const stats: Record<string, { submissions: number, interested: number, interview: number, selected: number, joined: number }> = {};

        const recruiters = teamMembers.map(tm => tm.fullName).filter(Boolean) as string[];
        recruiters.forEach(recruiter => {
            stats[recruiter] = { submissions: 0, interested: 0, interview: 0, selected: 0, joined: 0 };
        });

        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);

        (candidates || []).forEach(c => {
            if (!c.recruiter || !recruiters.includes(c.recruiter)) return;

            const appliedDate = c.appliedDate ? new Date(c.appliedDate) : null;
            if (!appliedDate) return;

            if ((!startDate || appliedDate >= startDate) && (!endDate || appliedDate <= endDate)) {
                stats[c.recruiter].submissions++;
                if (c.callStatus === 'Interested') stats[c.recruiter].interested++;
                if (c.stage === 'Interview') stats[c.recruiter].interview++;
                if (c.stage === 'Selected') stats[c.recruiter].selected++;
                if (c.status === 'Joined') stats[c.recruiter].joined++;
            }
        });

        return Object.entries(stats).map(([recruiter, data]) => ({ recruiter, ...data }));
    }, [candidates, teamMembers, dateRange]);

    return (
        <div className="space-y-6 bg-gray-50 min-h-screen p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recruiter Performance Report</h2>
                <Button variant="secondary" onClick={onBack} className="bg-white border border-gray-300 hover:bg-gray-100 text-sm">
                    Back to Reports
                </Button>
            </div>
            
            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-end gap-4">
                <Input
                    id="startDate"
                    label="Start Date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    wrapperClassName="mb-0"
                />
                <Input
                    id="endDate"
                    label="End Date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    wrapperClassName="mb-0"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Recruiter</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Total Submissions</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Interested</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Interview</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Selected</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {performanceData.map((data) => (
                                <tr key={data.recruiter} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{data.recruiter}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">{data.submissions}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">{data.interested}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">{data.interview}</td>
                                    <td className="px-6 py-4 text-center text-sm text-blue-600 font-bold">{data.selected}</td>
                                    <td className="px-6 py-4 text-center text-sm text-green-600 font-bold">{data.joined}</td>
                                </tr>
                            ))}
                            {performanceData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No performance data available for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RecruiterPerformanceReportView;
