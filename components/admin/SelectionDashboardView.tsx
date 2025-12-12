
import React, { useState, useMemo, useEffect } from 'react';
import Button from '../Button';
import { getCandidates, updateCandidate } from '../../services/supabaseService';

// --- Types ---
type SelectionStage = 'Sourced' | 'On the way' | 'Interview' | 'Selected';

interface SelectionCandidate {
    id: string;
    name: string;
    role: string;
    store: string;
    contact: string;
    recruiter: string;
    stage: SelectionStage;
    date: string; // YYYY-MM-DD
    [key: string]: any; // Allow other properties
}

const STAGES: SelectionStage[] = ['Sourced', 'On the way', 'Interview', 'Selected'];

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
                </div>
            )}
        </div>
    );
};

const SelectionDashboardView: React.FC<{ initialStage?: string }> = ({ initialStage }) => {
    const [candidates, setCandidates] = useState<SelectionCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: '',
        store: '',
        recruiter: '',
        stage: initialStage || '',
        date: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getCandidates();
            // Map the data to match SelectionCandidate interface if needed
            // Defaulting stage to 'Sourced' if not present
            const formattedData = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                role: c.role || 'Unknown',
                store: c.storeLocation || c.store || 'Unknown',
                contact: c.phone || c.contact || '',
                recruiter: c.recruiter || 'Admin',
                stage: c.stage || 'Sourced',
                date: c.date || c.appliedDate || new Date().toISOString().split('T')[0]
            }));
            setCandidates(formattedData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialStage) {
            setFilters(prev => ({ ...prev, stage: initialStage }));
        }
    }, [initialStage]);

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e: React.DragEvent, targetStage: SelectionStage) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        
        // Optimistic UI update
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: targetStage } : c));
        
        // API Update
        try {
            await updateCandidate(id, { stage: targetStage });
        } catch (error) {
            console.error("Failed to update candidate stage", error);
            // Revert on error would go here
        }
    };

    // --- Filtering Logic ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({ role: '', store: '', recruiter: '', stage: '', date: '' });
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => 
            (filters.role === '' || c.role === filters.role) &&
            (filters.store === '' || c.store === filters.store) &&
            (filters.recruiter === '' || c.recruiter === filters.recruiter) &&
            (filters.stage === '' || c.stage === filters.stage) &&
            (filters.date === '' || c.date === filters.date)
        );
    }, [candidates, filters]);

    // --- Summary Calculation ---
    const recruiterStats = useMemo(() => {
        const stats: Record<string, { [key in SelectionStage]: number }> = {};
        
        candidates.forEach(c => {
            // Only count if stage is valid
            if (STAGES.includes(c.stage)) {
                const recruiterName = c.recruiter || 'Unknown';
                if (!stats[recruiterName]) {
                    stats[recruiterName] = { Sourced: 0, 'On the way': 0, Interview: 0, Selected: 0 };
                }
                stats[recruiterName][c.stage]++;
            }
        });

        return Object.entries(stats).map(([recruiter, counts]) => ({
            recruiter,
            ...counts,
            total: counts.Sourced + counts['On the way'] + counts.Interview + counts.Selected
        }));
    }, [candidates]);

    // --- Unique options for filters ---
    const uniqueRoles = [...new Set(candidates.map(c => c.role))];
    const uniqueStores = [...new Set(candidates.map(c => c.store))];
    const uniqueRecruiters = [...new Set(candidates.map(c => c.recruiter))];

    const selectStyles = "block w-full pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border";

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-xl font-medium text-gray-500">Track candidates through the hiring pipeline.</h2>
            </div>

            {/* --- KANBAN BOARD --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STAGES.map(stage => {
                    const stageCandidates = filteredCandidates.filter(c => c.stage === stage);
                    return (
                        <div 
                            key={stage} 
                            className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10">
                                <h3 className="font-bold text-gray-800 text-base">{stage} <span className="text-gray-500 font-normal">({stageCandidates.length})</span></h3>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                                {isLoading ? (
                                    <p className="text-center text-gray-400 text-xs mt-4">Loading...</p>
                                ) : stageCandidates.length > 0 ? (
                                    stageCandidates.map(c => (
                                        <KanbanCard 
                                            key={c.id} 
                                            candidate={c} 
                                            onDragStart={handleDragStart} 
                                        />
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                                        <span className="text-sm">No candidates</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- LIST VIEW & FILTERS --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800">Candidates List</h3>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Report
                    </button>
                </div>

                {/* Filters Row */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                            <select name="role" value={filters.role} onChange={handleFilterChange} className={selectStyles}>
                                <option value="">All Roles</option>
                                {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Store</label>
                            <select name="store" value={filters.store} onChange={handleFilterChange} className={selectStyles}>
                                <option value="">All Stores</option>
                                {uniqueStores.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Recruiter</label>
                            <select name="recruiter" value={filters.recruiter} onChange={handleFilterChange} className={selectStyles}>
                                <option value="">All Recruiters</option>
                                {uniqueRecruiters.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Stage</label>
                            <select name="stage" value={filters.stage} onChange={handleFilterChange} className={selectStyles}>
                                <option value="">All Stages</option>
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                            <div className="flex gap-2">
                                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className={`${selectStyles} px-2`} />
                                <button onClick={clearFilters} className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Store</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recruiter</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stage</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCandidates.length > 0 ? filteredCandidates.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.store}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.contact}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.recruiter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            c.stage === 'Selected' ? 'bg-green-100 text-green-800' :
                                            c.stage === 'Interview' ? 'bg-blue-100 text-blue-800' :
                                            c.stage === 'On the way' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {c.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-blue-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                        No candidates found for the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- SUMMARY TABLE --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Candidate Summary by Team Member</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team Member</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Sourced</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">On the way</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Interview</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Selected</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recruiterStats.map((stat) => (
                                <tr key={stat.recruiter} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{stat.recruiter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat.Sourced}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat['On the way']}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{stat.Interview}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">{stat.Selected}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">{stat.total}</td>
                                </tr>
                            ))}
                            {recruiterStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SelectionDashboardView;
