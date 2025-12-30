





import React, { useState, useMemo, useEffect, useRef } from 'react';
import Button from '../Button';
import { getCandidates, deleteCandidate, updateCandidate } from '../../services/firestoreService';
import EditCandidateModal from './EditCandidateModal';
import { AppUser, TeamMemberPerformance, UserType, Vendor, StoreSupervisor } from '../../types';
import Modal from '../Modal';
import AddLineupForm from './AddLineupForm';
import TransferCandidateModal from './TransferCandidateModal';

interface Candidate {
    id: string;
    name: string;
    email: string;
    role: string;
    vendor: string;
    storeLocation: string;
    status: string;
    recruiter: string;
    appliedDate: string;
    quitDate?: string;
    [key: string]: any;
}

interface AllCandidatesViewProps {
    initialStatus?: string;
    initialCallStatus?: string;
    showTitle?: boolean;
    currentUser: AppUser | null;
    teamMembers: TeamMemberPerformance[];
    vendors: Vendor[];
    jobRoles: string[];
    locations: string[];
    stores: { id: string; name: string; location: string; interviewAddress?: string }[];
    supervisors: StoreSupervisor[];
}

const getCallStatusClasses = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('interested') || lowerStatus.includes('direct') || lowerStatus.includes('applied') || lowerStatus.includes('callback')) {
        return 'bg-blue-100 text-blue-800';
    }
    if (lowerStatus.includes('not interested')) {
        return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800'; // for No Answer, Already Call, etc.
};

const AllCandidatesView: React.FC<AllCandidatesViewProps> = ({ initialStatus, initialCallStatus, showTitle = true, currentUser, teamMembers, vendors, jobRoles, locations, stores, supervisors }) => {
    const isDailyLineupView = showTitle === false;

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        vendor: '',
        storeLocation: '',
        status: initialStatus || '',
        callStatus: initialCallStatus || '',
        recruiter: '',
        appliedDate: '',
        quitDate: '',
    });

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [callingAgainCandidate, setCallingAgainCandidate] = useState<Candidate | null>(null);
    const [transferringCandidate, setTransferringCandidate] = useState<Candidate | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const brandToPartnerMap = useMemo(() => {
        const map = new Map<string, string>();
        (vendors || []).forEach(vendor => {
            if (vendor.partnerName) {
                (vendor.brandNames || []).forEach(brand => {
                    map.set(brand.toLowerCase(), vendor.partnerName!);
                });
            }
        });
        return map;
    }, [vendors]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchData = async () => {
        setIsLoading(true);
        const data = await getCandidates();
        // Transform legacy 'Direct Application' status to 'Applied' for consistency
        const transformedData = (data as Candidate[]).map(c => {
            if (c.callStatus === 'Direct Application') {
                return { ...c, callStatus: 'Applied' };
            }
            return c;
        });
        setCandidates(transformedData);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (initialStatus) {
            setFilters(prev => ({ ...prev, status: initialStatus }));
        }
        if (initialCallStatus) {
            setFilters(prev => ({ ...prev, callStatus: initialCallStatus }));
        }
    }, [initialStatus, initialCallStatus]);
    
    // NEW: Memoize application counts
    const applicationCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!candidates) return counts;

        candidates.forEach(c => {
            if (c.email) {
                counts[c.email] = (counts[c.email] || 0) + 1;
            }
        });
        return counts;
    }, [candidates]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({ search: '', role: '', vendor: '', storeLocation: '', status: '', callStatus: '', recruiter: '', appliedDate: '', quitDate: '' });
    };

    const filteredCandidates = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        let baseFiltered = candidates.filter(c => {
            const dateFilterMatch = isDailyLineupView
                ? (c.appliedDate && c.appliedDate.startsWith(today))
                : (filters.appliedDate === '' || (c.appliedDate && c.appliedDate.startsWith(filters.appliedDate)));
            
            // For Daily Lineup view, all call statuses are now shown, including "Interested".

            return (
                (filters.search === '' || (c.name && c.name.toLowerCase().includes(filters.search.toLowerCase())) || (c.email && c.email.toLowerCase().includes(filters.search.toLowerCase()))) &&
                (filters.role === '' || c.role === filters.role) &&
                (filters.vendor === '' || c.vendor === filters.vendor) &&
                (filters.storeLocation === '' || c.storeLocation === filters.storeLocation) &&
                (filters.status === '' || c.status === filters.status) &&
                (filters.callStatus === '' || c.callStatus === filters.callStatus) &&
                (filters.recruiter === '' || c.recruiter === filters.recruiter) &&
                dateFilterMatch &&
                (filters.quitDate === '' || (c.quitDate && c.quitDate.startsWith(filters.quitDate)))
            );
        });

        // Apply role-based filtering
        if (!currentUser || !teamMembers) return baseFiltered;

        const { userType, fullName, email } = currentUser;
        
        if (userType === UserType.ADMIN || userType === UserType.HR) {
            return baseFiltered;
        }

        if (userType === UserType.TEAMLEAD) {
            // Team Leads see their own candidates + candidates of their entire downline
            const startIndex = teamMembers.findIndex(member => member.id === currentUser.uid);

            if (startIndex !== -1) {
                const selfEntry = teamMembers[startIndex];
                const selfLevel = selfEntry.level ?? 0;

                const downline = [selfEntry];
                for (let i = startIndex + 1; i < teamMembers.length; i++) {
                    const currentMember = teamMembers[i];
                    const currentLevel = currentMember.level ?? -1;

                    if (currentLevel > selfLevel) {
                        downline.push(currentMember);
                    } else {
                        break;
                    }
                }
                
                const visibleRecruiters = new Set(downline.map(m => m.fullName).filter(Boolean));
                return baseFiltered.filter(c => c.recruiter && visibleRecruiters.has(c.recruiter));
            }
             return [];
        }

        if (userType === UserType.TEAM) {
            return baseFiltered.filter(c => c.recruiter === fullName);
        }

        if (userType === UserType.PARTNER) {
            return baseFiltered.filter(c => c.partnerEmail === email);
        }
        
        if (userType === UserType.STORE_SUPERVISOR) {
             return baseFiltered.filter(c => c.supervisorEmail === email);
        }
    
        return [];
    }, [candidates, filters, currentUser, teamMembers, isDailyLineupView]);

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to permanently delete this candidate?")) {
            try {
                await deleteCandidate(id);
                await fetchData(); // Refetch data from Firestore to ensure UI is in sync
                alert("Candidate deleted.");
            } catch (error) {
                console.error("Failed to delete candidate:", error);
                alert("Could not delete candidate.");
            }
        }
    };

    const handleSave = async (id: string, updatedData: Partial<Candidate>) => {
        try {
            await updateCandidate(id, updatedData);
            if (editingCandidate) setEditingCandidate(null);
            await fetchData(); // Refetch data from Firestore to ensure UI is in sync
            alert("Candidate updated.");
        } catch (error) {
            console.error("Failed to update candidate:", error);
            alert("Could not update candidate.");
        }
    };

    const handleSaveTransfer = async (id: string, transferData: Partial<Candidate>) => {
        try {
            await updateCandidate(id, transferData);
            setTransferringCandidate(null);
            await fetchData(); // Refetch data from Firestore to ensure UI is in sync
            alert("Candidate transferred successfully.");
        } catch (error) {
            console.error("Failed to transfer candidate:", error);
            alert("Could not transfer candidate.");
        }
    };

    const handleCallAgain = (candidate: Candidate) => {
        setCallingAgainCandidate(candidate);
    };

    const exportToCSV = (candidatesToExport: Candidate[], bToPMap: Map<string, string>, isLineupView: boolean) => {
        const headers = [
            "Candidate Name", "Email", "Phone", "Role", "Partner Name", "Store/Location",
            "Call Status", "Recruiter", "Applied Date"
        ];
        if (!isLineupView) {
            headers.push("Quit Date");
        }
    
        const escapeCSV = (str: string | undefined | null): string => {
            if (str === undefined || str === null) {
                return '';
            }
            const val = String(str);
            if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                const escapedVal = val.replace(/"/g, '""');
                return `"${escapedVal}"`;
            }
            return val;
        };
        
        const rows = candidatesToExport.map(c => {
            const rowData = [
                escapeCSV(c.name),
                escapeCSV(c.email),
                escapeCSV(c.phone || c.contact),
                escapeCSV(c.role),
                escapeCSV(c.partnerName || bToPMap.get(c.vendor) || c.vendor),
                escapeCSV(c.storeLocation),
                escapeCSV(c.callStatus),
                escapeCSV(c.recruiter),
                escapeCSV(c.appliedDate ? c.appliedDate.split('T')[0] : ''),
            ];
            if (!isLineupView) {
                rowData.push(escapeCSV(c.quitDate ? c.quitDate.split('T')[0] : ''));
            }
            return rowData.join(',');
        });
    
        const csvString = [headers.join(','), ...rows].join('\n');
    
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const fileName = isLineupView 
                ? `Daily_Lineup_${new Date().toISOString().split('T')[0]}.csv` 
                : `All_Candidates_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const uniqueRoles = [...new Set(candidates.map(c => c.role).filter(Boolean))];
    const uniqueVendors = [...new Set(candidates.map(c => c.vendor).filter(Boolean))];
    const uniqueStores = [...new Set(candidates.map(c => c.storeLocation).filter(Boolean))];
    const uniqueStatuses = [...new Set(candidates.map(c => c.status).filter(Boolean))];
    const uniqueCallStatuses = [...new Set(candidates.map(c => c.callStatus).filter(Boolean))];
    const uniqueRecruiters = [...new Set(candidates.map(c => c.recruiter).filter(Boolean))];

    const inputStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-700 bg-white";
    const labelStyles = "block text-xs font-semibold text-gray-500 mb-1";

    return (
        <div className="space-y-6">
            {showTitle && <h2 className="text-3xl font-bold text-gray-800">All Candidates</h2>}

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label className={labelStyles}>Search Name/Email</label>
                        <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className={inputStyles} placeholder="" />
                    </div>
                    <div>
                        <label className={labelStyles}>Role</label>
                        <select name="role" value={filters.role} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyles}>Vendor</label>
                        <select name="vendor" value={filters.vendor} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueVendors.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyles}>Store / Location</label>
                        <select name="storeLocation" value={filters.storeLocation} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueStores.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyles}>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={labelStyles}>Call Status</label>
                        <select name="callStatus" value={filters.callStatus} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueCallStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isDailyLineupView ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4 items-end`}>
                    <div>
                        <label className={labelStyles}>Recruiter</label>
                        <select name="recruiter" value={filters.recruiter} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueRecruiters.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyles}>Applied Date</label>
                        <input type="date" name="appliedDate" value={filters.appliedDate} onChange={handleFilterChange} className={inputStyles} placeholder="dd-mm-yyyy" disabled={isDailyLineupView} />
                    </div>
                    {!isDailyLineupView && (
                        <div>
                            <label className={labelStyles}>Quit Date</label>
                            <input type="date" name="quitDate" value={filters.quitDate} onChange={handleFilterChange} className={inputStyles} placeholder="dd-mm-yyyy" />
                        </div>
                    )}
                    <div className="flex gap-2 col-span-2">
                        <Button variant="secondary" onClick={clearFilters} className="w-full justify-center bg-gray-200 hover:bg-gray-300 text-gray-800">Clear All</Button>
                        <Button variant="primary" onClick={() => exportToCSV(filteredCandidates, brandToPartnerMap, isDailyLineupView)} className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">Export</Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile No</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Partner Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Store / Location</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recruiter</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applied Date</th>
                                {!isDailyLineupView && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quit Date</th>
                                )}
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={isDailyLineupView ? 9 : 10} className="px-6 py-10 text-center text-gray-500">Loading candidates...</td></tr>
                            ) : filteredCandidates.length > 0 ? filteredCandidates.map((candidate) => {
                                const appCount = candidate.email ? applicationCounts[candidate.email] : 1;
                                return (
                                <tr key={candidate.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                            {candidate.name}
                                            {appCount > 1 && (
                                                <span 
                                                    className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full"
                                                    title={`This candidate has ${appCount} applications in total.`}
                                                >
                                                    MULTIPLE
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">{candidate.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.phone || candidate.contact || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {candidate.partnerName || 'Direct'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.storeLocation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getCallStatusClasses(candidate.callStatus)}`}>
                                            {candidate.callStatus || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.recruiter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {candidate.appliedDate ? (
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{new Date(candidate.appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-xs text-gray-500">{new Date(candidate.appliedDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-600">-</span>
                                        )}
                                    </td>
                                    {!isDailyLineupView && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.quitDate ? candidate.quitDate.split('T')[0] : '-'}</td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {isDailyLineupView ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="primary" size="sm" onClick={() => handleCallAgain(candidate)}>
                                                    Call Again
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(candidate.id)} className="text-red-600 hover:bg-red-50 p-2" aria-label="Delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveDropdown(candidate.id === activeDropdown ? null : candidate.id)}
                                                    className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>
                                                {activeDropdown === candidate.id && (
                                                    <div ref={dropdownRef} className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                                            <button
                                                                onClick={() => { setEditingCandidate(candidate); setActiveDropdown(null); }}
                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                role="menuitem"
                                                            >
                                                                Edit Details
                                                            </button>
                                                            <button
                                                                onClick={() => { setTransferringCandidate(candidate); setActiveDropdown(null); }}
                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                role="menuitem"
                                                            >
                                                                Transfer Candidate
                                                            </button>
                                                            <div className="border-t my-1"></div>
                                                            <button
                                                                onClick={() => { handleDelete(candidate.id); setActiveDropdown(null); }}
                                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                                role="menuitem"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan={isDailyLineupView ? 9 : 10} className="px-6 py-10 text-center text-gray-500">No candidates found for the current filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {callingAgainCandidate && (
                <Modal 
                    isOpen={!!callingAgainCandidate} 
                    onClose={() => setCallingAgainCandidate(null)} 
                    title={`Follow-up Call: ${callingAgainCandidate.name}`}
                    maxWidth="max-w-3xl"
                >
                    <AddLineupForm 
                        onClose={() => setCallingAgainCandidate(null)} 
                        onSave={() => { 
                            setCallingAgainCandidate(null); 
                            fetchData(); // Refresh data after save
                        }}
                        vendors={vendors}
                        jobRoles={jobRoles}
                        locations={locations}
                        stores={stores}
                        supervisors={supervisors}
                        initialData={callingAgainCandidate}
                        currentUser={currentUser}
                    />
                </Modal>
            )}

            {editingCandidate && (
                <EditCandidateModal
                    candidate={editingCandidate}
                    onClose={() => setEditingCandidate(null)}
                    onSave={handleSave as any}
                />
            )}

            {transferringCandidate && (
                <TransferCandidateModal
                    candidate={transferringCandidate}
                    onClose={() => setTransferringCandidate(null)}
                    onSave={handleSaveTransfer}
                    vendors={vendors}
                    jobRoles={jobRoles}
                    locations={locations}
                    stores={stores}
                    supervisors={supervisors || []}
                />
            )}
        </div>
    );
};

export default AllCandidatesView;
