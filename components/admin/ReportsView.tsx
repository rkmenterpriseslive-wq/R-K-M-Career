

import React, { useState, useMemo, lazy, Suspense } from 'react';
import Button from '../Button';
import DailyReportDetailView from './DailyReportDetailView';
import { AppUser, UserType, TeamMemberPerformance } from '../../types';

// Lazy load report detail components for better performance
const DailyLineupReportView = lazy(() => import('./DailyLineupReportView'));
const SelectionPipelineReportView = lazy(() => import('./SelectionPipelineReportView'));
const RecruiterPerformanceReportView = lazy(() => import('./RecruiterPerformanceReportView'));


interface ReportType {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    isViewable?: boolean;
}

const REPORT_TYPES: ReportType[] = [
    {
        id: 'daily-report',
        title: 'Daily Report',
        description: 'View and export daily submissions and selections.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
        isViewable: true,
    },
    {
        id: 'daily-lineup',
        title: 'Daily Lineup Report',
        description: 'Daily candidate submission and call status logs.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
        isViewable: true,
    },
    {
        id: 'selection-pipeline',
        title: 'Selection Pipeline',
        description: 'Candidates stage-wise status from Sourced to Selected.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        isViewable: true,
    },
    {
        id: 'attendance-commission',
        title: 'Attendance & Commission',
        description: 'Monthly attendance records and commission calculations.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
        id: 'complaints-log',
        title: 'Complaints Log',
        description: 'Register of candidate grievances and resolutions.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    },
    {
        id: 'warning-letters',
        title: 'Warning Letters',
        description: 'History of disciplinary actions and warning letters.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    {
        id: 'recruiter-performance',
        title: 'Recruiter Performance',
        description: 'Efficiency metrics for individual team members.',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        isViewable: true,
    },
];

interface GeneratedReport {
    id: string;
    name: string;
    date: string;
    generatedBy: string;
    downloadUrl: string;
}

interface ReportsViewProps {
    userType: UserType;
    currentUser: AppUser | null;
    candidates: any[];
    teamPerformance: TeamMemberPerformance[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ userType, currentUser, candidates, teamPerformance }) => {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [activeDetailView, setActiveDetailView] = useState<string | null>(null);
    const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
    
    // Configuration Form State
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [format, setFormat] = useState('Excel');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleReportSelect = (report: ReportType) => {
        setSelectedReport(report);
        // Reset form
        setDateRange({ start: '', end: '' });
        setFormat('Excel');
    };

    const handleGenerate = () => {
        if (!selectedReport) return;

        if (format === 'View' && selectedReport.isViewable) {
            setActiveDetailView(selectedReport.id);
            return;
        }

        if (format === 'PDF') {
            alert('PDF export is not implemented. Please choose CSV or Excel to download a CSV file.');
            return;
        }

        setIsGenerating(true);

        // Helper function for CSV generation
        const escapeCSV = (str: any): string => {
            if (str === undefined || str === null) return '';
            const val = String(str);
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                const escapedVal = val.replace(/"/g, '""');
                return `"${escapedVal}"`;
            }
            return val;
        };

        const downloadCSV = (headers: string[], rows: string[][], fileName: string) => {
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');
    
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);

        const filteredCandidates = (candidates || []).filter(c => {
            const appliedDate = c.appliedDate ? new Date(c.appliedDate) : null;
            if (!appliedDate) return false;
            return (!startDate || appliedDate >= startDate) && (!endDate || appliedDate <= endDate);
        });

        const fileNameBase = `${selectedReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
        
        let reportGenerated = false;

        switch (selectedReport.id) {
            case 'daily-report': {
                const submissions = filteredCandidates.filter(c => c.callStatus === 'Interested');
                const selections = filteredCandidates.filter(c => c.stage === 'Selected');
                
                const headers = ["Report Type", "Recruiter", "Client", "Position", "Candidate Name", "Mobile No", "Location", "Status"];
                
                const submissionRows = submissions.map((c: any) => [
                    escapeCSV('Submission'),
                    escapeCSV(c.recruiter),
                    escapeCSV(c.vendor),
                    escapeCSV(c.role),
                    escapeCSV(c.name),
                    escapeCSV(c.phone),
                    escapeCSV(c.location),
                    escapeCSV(c.callStatus),
                ]);

                const selectionRows = selections.map((c: any) => [
                    escapeCSV('Selection'),
                    escapeCSV(c.recruiter),
                    escapeCSV(c.vendor),
                    escapeCSV(c.role),
                    escapeCSV(c.name),
                    escapeCSV(c.phone),
                    escapeCSV(c.location),
                    escapeCSV(c.stage),
                ]);

                downloadCSV(headers, [...submissionRows, ...selectionRows], `${fileNameBase}.csv`);
                reportGenerated = true;
                break;
            }
            case 'daily-lineup': {
                const headers = ["Recruiter", "Client", "Position", "Candidate", "Mobile No", "Location", "Call Status", "Applied Date"];
                const rows = filteredCandidates.map((c: any) => [
                    escapeCSV(c.recruiter),
                    escapeCSV(c.vendor),
                    escapeCSV(c.role),
                    escapeCSV(c.name),
                    escapeCSV(c.phone),
                    escapeCSV(c.location),
                    escapeCSV(c.callStatus),
                    escapeCSV(c.appliedDate ? new Date(c.appliedDate).toLocaleDateString() : ''),
                ]);
                downloadCSV(headers, rows, `${fileNameBase}.csv`);
                reportGenerated = true;
                break;
            }
            case 'selection-pipeline': {
                 const headers = ["Candidate Name", "Role", "Vendor", "Store Location", "Status", "Stage", "Applied Date"];
                 const rows = filteredCandidates.map((c: any) => [
                    escapeCSV(c.name),
                    escapeCSV(c.role),
                    escapeCSV(c.vendor),
                    escapeCSV(c.storeLocation),
                    escapeCSV(c.status),
                    escapeCSV(c.stage),
                    escapeCSV(c.appliedDate ? new Date(c.appliedDate).toLocaleDateString() : ''),
                 ]);
                 downloadCSV(headers, rows, `${fileNameBase}.csv`);
                 reportGenerated = true;
                break;
            }
            case 'recruiter-performance': {
                const headers = ["Recruiter", "Total Submissions", "Interested", "Interview", "Selected", "Joined"];
                const stats: Record<string, { submissions: number, interested: number, interview: number, selected: number, joined: number }> = {};
                
                const recruiters = teamPerformance.map(tm => tm.fullName).filter(Boolean) as string[];
                recruiters.forEach(recruiter => {
                    stats[recruiter] = { submissions: 0, interested: 0, interview: 0, selected: 0, joined: 0 };
                });

                filteredCandidates.forEach(c => {
                    if (c.recruiter && recruiters.includes(c.recruiter)) {
                        stats[c.recruiter].submissions++;
                        if (c.callStatus === 'Interested') stats[c.recruiter].interested++;
                        if (c.stage === 'Interview') stats[c.recruiter].interview++;
                        if (c.stage === 'Selected') stats[c.recruiter].selected++;
                        if (c.status === 'Joined') stats[c.recruiter].joined++;
                    }
                });
                
                const rows = Object.entries(stats).map(([recruiter, data]) => [
                    escapeCSV(recruiter),
                    escapeCSV(data.submissions),
                    escapeCSV(data.interested),
                    escapeCSV(data.interview),
                    escapeCSV(data.selected),
                    escapeCSV(data.joined),
                ]);
                downloadCSV(headers, rows, `${fileNameBase}.csv`);
                reportGenerated = true;
                break;
            }
            default:
                alert(`Export for "${selectedReport.title}" is not implemented yet.`);
        }

        if (reportGenerated) {
             const newReport: GeneratedReport = {
                id: `r${Date.now()}`,
                name: `${fileNameBase}.csv`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                generatedBy: currentUser?.email?.split('@')[0] || 'User',
                downloadUrl: '#' // This is now just for display
            };
            setRecentReports([newReport, ...recentReports]);
        }
        
        setIsGenerating(false);
    };
    
    if (activeDetailView) {
        return (
            <Suspense fallback={<div className="text-center p-10">Loading Report...</div>}>
                {activeDetailView === 'daily-report' && <DailyReportDetailView onBack={() => setActiveDetailView(null)} candidates={candidates} />}
                {activeDetailView === 'daily-lineup' && <DailyLineupReportView onBack={() => setActiveDetailView(null)} candidates={candidates} />}
                {activeDetailView === 'selection-pipeline' && <SelectionPipelineReportView onBack={() => setActiveDetailView(null)} candidates={candidates} />}
                {activeDetailView === 'recruiter-performance' && <RecruiterPerformanceReportView onBack={() => setActiveDetailView(null)} candidates={candidates} teamMembers={teamPerformance} />}
            </Suspense>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Reports Center</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Report Types Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {REPORT_TYPES.map(report => (
                        <div 
                            key={report.id}
                            onClick={() => handleReportSelect(report)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                                selectedReport?.id === report.id 
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                        >
                            <div className={`p-3 rounded-lg ${selectedReport?.id === report.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                {report.icon}
                            </div>
                            <div>
                                <h3 className={`font-bold ${selectedReport?.id === report.id ? 'text-blue-800' : 'text-gray-800'}`}>
                                    {report.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                    {report.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column: Configuration Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Report Configuration</h3>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col justify-center">
                            {selectedReport ? (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">{selectedReport.title}</h4>
                                        <p className="text-sm text-gray-500">Configure parameters to generate this report.</p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input 
                                                    type="date" 
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={dateRange.start}
                                                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                                />
                                                <input 
                                                    type="date" 
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={dateRange.end}
                                                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                                            <select 
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={format}
                                                onChange={(e) => setFormat(e.target.value)}
                                            >
                                                <option value="Excel">Excel (.xlsx)</option>
                                                <option value="PDF">PDF (.pdf)</option>
                                                <option value="CSV">CSV (.csv)</option>
                                                {selectedReport.isViewable && (
                                                    <option value="View">View on Screen</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button 
                                            variant="primary" 
                                            className="w-full justify-center" 
                                            onClick={handleGenerate}
                                            loading={isGenerating}
                                        >
                                            {format === 'View' ? 'View Report' : 'Generate Report'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>Select a report type from the list to configure details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recently Generated Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800">Recently Generated</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Report Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Generated By</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {/* File Icon */}
                                        <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        {report.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.generatedBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a href="#" className="text-blue-600 hover:text-blue-900 font-semibold">Download</a>
                                    </td>
                                </tr>
                            ))}
                            {recentReports.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No reports generated yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
