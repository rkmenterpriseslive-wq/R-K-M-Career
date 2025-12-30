




import React, { useState, useMemo, useEffect, useRef } from 'react';
import Button from '../Button';
import { getCandidates, updateCandidate } from '../../services/firestoreService';
import EditCandidateModal from './EditCandidateModal';
import { AppUser, TeamMemberPerformance, UserType } from '../../types';

// --- Types ---
type SelectionStage = 'Applied' | 'Sourced' | 'On the way' | 'Interview' | 'Selected';

interface SelectionCandidate {
    id: string;
    name: string;
    role: string;
    store: string;
    contact: string;
    recruiter: string;
    stage: SelectionStage;
    date: string; // YYYY-MM-DD
    interviewDate?: string;
    interviewDetails?: string;
    [key: string]: any; // Allow other properties
}

const STAGES: SelectionStage[] = ['Applied', 'Sourced', 'On the way', 'Interview', 'Selected'];

// --- Sub-components ---

const KanbanCard: React.FC<{ candidate: SelectionCandidate; onDragStart: (e: React.DragEvent, id: string) => void }> = ({ candidate, onDragStart }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, candidate.id)}
            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {/* Drag Handle Icon */}
                    <div className="text-gray-400 flex-shrink-0 cursor-move pt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    
                    {/* Candidate Details: Name then Store */}
                    <div className="flex flex-col min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate" title={candidate.name}>{candidate.name}</h4>
                        <span className="text-xs text-gray-500 truncate block" title={candidate.store}>{candidate.store}</span>
                    </div>
                </div>

                {/* View Toggle Button */}
                <button 
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors flex-shrink-0 ${isExpanded ? 'bg-gray-100 text-gray-600' : 'text-blue-600 hover:bg-blue-50'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? 'Hide' : 'View'}
                </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 pt-2 border-t border-gray-100 text-xs space-y-1.5 animate-fade-in">
                    <div className="grid grid-cols-3 gap-1">
                        <span className="text-gray-500 col-span-1">Role:</span>
                        <span className="font-medium text-gray-800 col-span-2 truncate">{candidate.role}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="text-gray-500 col-span-1">Phone:</span>
                        <span className="font-medium text-gray-800 col-span-2 truncate">{candidate.contact}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="text-gray-500 col-span-1">Recruiter:</span>
                        <span className="font-medium text-gray-800 col-span-2 truncate">{candidate.recruiter}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <span className="text-gray-500 col-span-1">Date:</span>
                        <span className="font-medium text-gray-800 col-span-2 truncate">{candidate.date}</span>
                    </div>
                    {candidate.stage === 'Interview' && candidate.interviewDate && (
                        <>
                            <div className="grid grid-cols-3 gap-1 mt-2 pt-1 border-t">
                                <span className="text-gray-500 col-span-1">Interview:</span>
                                <span className="font-medium text-gray-800 col-span-2 truncate">{new Date(candidate.interviewDate).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-gray-500 col-span-1">Address:</span>
                                <span className="font-medium text-gray-800 col-span-2 truncate" title={candidate.interviewDetails}>{candidate.interviewDetails}</span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface SelectionDashboardViewProps {
    initialStage?: string;
    currentUser: AppUser | null;
    teamMembers: TeamMemberPerformance[];
    candidates: any[]; // Prop for real-time candidates
}

const SelectionDashboardView: React.FC<SelectionDashboardViewProps> = ({ initialStage, currentUser, teamMembers, candidates: rawCandidates }) => {
    const [candidates, setCandidates] = useState<SelectionCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ role: '', store: '', recruiter: '', stage: initialStage || '', date: '' });
    const [interviewDateFilter, setInterviewDateFilter] = useState<string | null>(null);
    
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<SelectionCandidate | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsLoading(true);
        const formattedData = (rawCandidates || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            role: c.role || 'Unknown',
            store: c.storeLocation || c.store || 'Unknown',
            contact: c.phone || c.contact || '',
            recruiter: c.recruiter || 'Admin',
            stage: c.stage || 'Sourced',
            date: c.date || c.appliedDate || new Date().toISOString().split('T')[0],
            interviewDate: c.interviewDate || null,
            interviewDetails: c.interviewDetails || null,
        }));
        setCandidates(formattedData);
        setIsLoading(false);
    }, [rawCandidates]); // Re-format when raw data changes

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    useEffect(() => {
        if (initialStage) {
            setFilters(prev => ({ ...prev, stage: initialStage }));
        }
    }, [initialStage]);

    const handleSave = async (id: string, updatedData: Partial<SelectionCandidate>) => {
        try {
            await updateCandidate(id, updatedData);
            setEditingCandidate(null);
        } catch (error) {
            console.error("Failed to update candidate", error);
        }
    };

    const handleMove = async (id: string, targetStage: SelectionStage) => {
        // Optimistic UI update for smoother UX
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: targetStage } : c));
        try {
            await updateCandidate(id, { stage: targetStage });
        } catch (error) {
            console.error("Failed to move candidate", error);
            // Real-time listener will correct the state on failure.
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData('text/plain', id);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent, targetStage: SelectionStage) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        handleMove(id, targetStage);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const clearFilters = () => {
        setFilters({ role: '', store: '', recruiter: '', stage: '', date: '' });
        setInterviewDateFilter(null);
    };

    const roleFilteredCandidates = useMemo(() => {
        if (!currentUser || !teamMembers) return candidates;
        const { userType, fullName } = currentUser;
        
        if (userType === UserType.ADMIN || userType === UserType.HR) {
            return candidates;
        }
    
        if (userType === UserType.TEAMLEAD) {
            const myReports = teamMembers
                .filter(member => member.reportingManager === fullName)
                .map(member => member.fullName);
            const visibleRecruiters = new Set([fullName, ...myReports]);
            return candidates.filter(c => c.recruiter && visibleRecruiters.has(c.recruiter));
        }
    
        if (userType === UserType.TEAM) {
            return candidates.filter(c => c.recruiter === fullName);
        }
        
        if (userType === UserType.STORE_SUPERVISOR) {
            if (!currentUser.storeLocation) return [];
            return candidates.filter(c => c.store === currentUser.storeLocation);
        }
    
        return [];
    }, [candidates, currentUser, teamMembers]);

    const interviewSummary = useMemo(() => {
        const upcoming: Record<string, SelectionCandidate[]> = {};
        const past: Record<string, SelectionCandidate[]> = {};
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        roleFilteredCandidates.forEach(c => {
            if (c.stage === 'Interview' && c.interviewDate) {
                try {
                    const interviewDateObj = new Date(c.interviewDate);
                    if (isNaN(interviewDateObj.getTime())) return; 
    
                    const interviewDay = new Date(interviewDateObj);
                    interviewDay.setHours(0, 0, 0, 0);
                    
                    const dateString = interviewDay.toISOString().split('T')[0];
    
                    if (interviewDay >= today) {
                        if (!upcoming[dateString]) upcoming[dateString] = [];
                        upcoming[dateString].push(c);
                    } else {
                        if (!past[dateString]) past[dateString] = [];
                        past[dateString].push(c);
                    }
                } catch (e) {
                    console.warn(`Invalid interview date for candidate ${c.id}: ${c.interviewDate}`);
                }
            }
        });
    
        const sortObjectByDate = (obj: Record<string, any[]>, order: 'asc' | 'desc' = 'asc') => {
            return Object.entries(obj)
                .sort(([dateA], [dateB]) => {
                    const timeA = new Date(dateA).getTime();
                    const timeB = new Date(dateB).getTime();
                    return order === 'asc' ? timeA - timeB : timeB - timeA;
                });
        };
    
        return {
            upcoming: sortObjectByDate(upcoming, 'asc'),
            past: sortObjectByDate(past, 'desc')
        };
    }, [roleFilteredCandidates]);

    const filteredCandidates = useMemo(() => {
        return roleFilteredCandidates.filter(c => {
            const mainFiltersMatch = (filters.role === '' || c.role === filters.role) &&
                (filters.store === '' || c.store === filters.store) &&
                (filters.recruiter === '' || c.recruiter === filters.recruiter) &&
                (filters.stage === '' || c.stage === filters.stage) &&
                (filters.date === '' || c.date === filters.date);

            if (!mainFiltersMatch) return false;

            if (interviewDateFilter) {
                return c.interviewDate && c.interviewDate.startsWith(interviewDateFilter);
            }
            
            return true;
        });
    }, [roleFilteredCandidates, filters, interviewDateFilter]);

    const recruiterStats = useMemo(() => {
        const stats: Record<string, { [key in SelectionStage | 'total']?: number }> = {};
        candidates.forEach(c => {
            if (STAGES.includes(c.stage)) {
                const recruiterName = c.recruiter || 'Unknown';
                if (!stats[recruiterName]) {
                    stats[recruiterName] = { Applied: 0, Sourced: 0, 'On the way': 0, Interview: 0, Selected: 0 };
                }
                const currentStage = c.stage;
                if (stats[recruiterName]![currentStage] !== undefined) {
                    stats[recruiterName]![currentStage]!++;
                }
            }
        });
        return Object.entries(stats).map(([recruiter, counts]) => ({
            recruiter,
            ...counts,
            total: (counts.Applied || 0) + (counts.Sourced || 0) + (counts['On the way'] || 0) + (counts.Interview || 0) + (counts.Selected || 0)
        }));
    }, [candidates]);

    const uniqueRoles = [...new Set(candidates.map(c => c.role))];
    const uniqueStores = [...new Set(candidates.map(c => c.store))];
    const uniqueRecruiters = [...new Set(candidates.map(c => c.recruiter))];

    const selectStyles = "block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border";
    
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-8 pb-10">
            <div><h2 className="text-xl font-medium text-gray-500">Track candidates through the hiring pipeline.</h2></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {STAGES.map(stage => {
                    let stageCandidates = filteredCandidates.filter(c => c.stage === stage);
                    
                    if (stage === 'Sourced') {
                        stageCandidates = stageCandidates.filter(c => c.date && c.date.startsWith(today));
                    }
                    
                    return (
                        <div key={stage} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage)}>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10">
                                <h3 className="font-bold text-gray-800 text-base">{stage} <span className="text-gray-500 font-normal">({stageCandidates.length})</span></h3>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                                {isLoading ? <p className="text-center text-gray-400 text-xs mt-4">Loading...</p> : stageCandidates.length > 0 ? stageCandidates.map(c => <KanbanCard key={c.id} candidate={c} onDragStart={handleDragStart} />) : <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400"><span className="text-sm">No candidates</span></div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Interview Summary</h3>
                    {interviewDateFilter && (
                         <button 
                            onClick={() => setInterviewDateFilter(null)} 
                            className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full hover:bg-red-100 transition-colors"
                        >
                            Clear Date Filter: {new Date(interviewDateFilter).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6 border-r border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-700 text-base">Upcoming Interviews</h4>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                            {interviewSummary.upcoming.length > 0 ? (
                                interviewSummary.upcoming.map(([date, candidates]) => (
                                    <button 
                                        key={date}
                                        onClick={() => setInterviewDateFilter(interviewDateFilter === date ? null : date)}
                                        className={`w-full flex justify-between items-center p-3 rounded-lg text-left transition-colors duration-200 ${interviewDateFilter === date ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-blue-50'}`}
                                    >
                                        <span className="font-semibold text-gray-800 text-sm">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{candidates.length} {candidates.length > 1 ? 'candidates' : 'candidate'}</span>
                                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {candidates.length}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No upcoming interviews scheduled.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-700 text-base">Past Interviews (No Shows)</h4>
                        </div>
                         <div className="max-h-64 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                            {interviewSummary.past.length > 0 ? (
                                interviewSummary.past.map(([date, candidates]) => (
                                    <button 
                                        key={date}
                                        onClick={() => setInterviewDateFilter(interviewDateFilter === date ? null : date)}
                                        className={`w-full flex justify-between items-center p-3 rounded-lg text-left transition-colors duration-200 ${interviewDateFilter === date ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-gray-50 hover:bg-yellow-50'}`}
                                    >
                                        <span className="font-semibold text-gray-800 text-sm">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{candidates.length} {candidates.length > 1 ? 'no-shows' : 'no-show'}</span>
                                            <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {candidates.length}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No past no-shows found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800">Candidates List</h3>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download Report</button>
                </div>
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Role</label><select name="role" value={filters.role} onChange={handleFilterChange} className={selectStyles}><option value="">All Roles</option>{uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Store</label><select name="store" value={filters.store} onChange={handleFilterChange} className={selectStyles}><option value="">All Stores</option>{uniqueStores.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Recruiter</label><select name="recruiter" value={filters.recruiter} onChange={handleFilterChange} className={selectStyles}><option value="">All Recruiters</option>{uniqueRecruiters.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Stage</label><select name="stage" value={filters.stage} onChange={handleFilterChange} className={selectStyles}><option value="">All Stages</option>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Date</label><div className="flex gap-2"><input type="date" name="date" value={filters.date} onChange={handleFilterChange} className={`${selectStyles} px-2`} /><button onClick={clearFilters} className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Clear</button></div></div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Name</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Store</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recruiter</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stage</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Interview</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applied Date</th><th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th></tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCandidates.length > 0 ? filteredCandidates.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.role}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.store}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.contact}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.recruiter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ c.stage === 'Selected' ? 'bg-green-100 text-green-800' : c.stage === 'Interview' ? 'bg-blue-100 text-blue-800' : c.stage === 'On the way' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{c.stage}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {c.interviewDate ? (
                                            new Date(c.interviewDate).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'})
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.date ? c.date.split('T')[0] : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                        <button onClick={() => setActiveDropdown(c.id === activeDropdown ? null : c.id)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                                        {activeDropdown === c.id && (
                                            <div ref={dropdownRef} className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                                <div className="py-1" role="menu" aria-orientation="vertical">
                                                    <button onClick={() => { setEditingCandidate(c); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Edit</button>
                                                    <div className="border-t my-1"></div>
                                                    {STAGES.filter(s => s !== c.stage).map(stage => <button key={stage} onClick={() => { handleMove(c.id, stage); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Move to {stage}</button>)}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">No candidates found for the current filters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-800">Candidate Summary by Team Member</h3></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team Member</th><th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Applied</th><th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Sourced</th><th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">On the way</th><th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Interview</th><th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Selected</th><th className="px-6 py-4 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Total</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recruiterStats.map((stat) => <tr key={stat.recruiter} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{stat.recruiter}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat.Applied || 0}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat.Sourced || 0}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat['On the way'] || 0}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat.Interview || 0}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">{stat.Selected || 0}</td><td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">{stat.total || 0}</td></tr>)}
                            {recruiterStats.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No data available.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {editingCandidate && <EditCandidateModal candidate={editingCandidate} onClose={() => setEditingCandidate(null)} onSave={handleSave as any} />}
        </div>
    );
};

export default SelectionDashboardView;