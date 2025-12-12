
import React, { useState, useMemo, useEffect } from 'react';
import Button from '../Button';
import { getCandidates } from '../../services/supabaseService';

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
}

const AllCandidatesView: React.FC<{ initialStatus?: string }> = ({ initialStatus }) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        vendor: '',
        storeLocation: '',
        status: initialStatus || '',
        recruiter: '',
        appliedDate: '',
        quitDate: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getCandidates();
            // Map generic candidate data to View interface if necessary, 
            // mostly assuming fields match or handle missing ones gracefully
            setCandidates(data as Candidate[]);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialStatus) {
            setFilters(prev => ({ ...prev, status: initialStatus }));
        }
    }, [initialStatus]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            role: '',
            vendor: '',
            storeLocation: '',
            status: '',
            recruiter: '',
            appliedDate: '',
            quitDate: ''
        });
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => {
            return (
                (filters.search === '' || (c.name && c.name.toLowerCase().includes(filters.search.toLowerCase())) || (c.email && c.email.toLowerCase().includes(filters.search.toLowerCase()))) &&
                (filters.role === '' || c.role === filters.role) &&
                (filters.vendor === '' || c.vendor === filters.vendor) &&
                (filters.storeLocation === '' || c.storeLocation === filters.storeLocation) &&
                (filters.status === '' || c.status === filters.status) &&
                (filters.recruiter === '' || c.recruiter === filters.recruiter) &&
                (filters.appliedDate === '' || c.appliedDate === filters.appliedDate) &&
                (filters.quitDate === '' || (c.quitDate && c.quitDate === filters.quitDate))
            );
        });
    }, [candidates, filters]);

    // Unique values for dropdowns
    const uniqueRoles = [...new Set(candidates.map(c => c.role).filter(Boolean))];
    const uniqueVendors = [...new Set(candidates.map(c => c.vendor).filter(Boolean))];
    const uniqueStores = [...new Set(candidates.map(c => c.storeLocation).filter(Boolean))];
    const uniqueStatuses = [...new Set(candidates.map(c => c.status).filter(Boolean))];
    const uniqueRecruiters = [...new Set(candidates.map(c => c.recruiter).filter(Boolean))];

    const inputStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-700 bg-white";
    const labelStyles = "block text-xs font-semibold text-gray-500 mb-1";

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">All Candidates</h2>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className={labelStyles}>Recruiter</label>
                        <select name="recruiter" value={filters.recruiter} onChange={handleFilterChange} className={inputStyles}>
                            <option value="">All</option>
                            {uniqueRecruiters.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyles}>Applied Date</label>
                        <input type="date" name="appliedDate" value={filters.appliedDate} onChange={handleFilterChange} className={inputStyles} placeholder="dd-mm-yyyy" />
                    </div>
                    <div>
                        <label className={labelStyles}>Quit Date</label>
                        <input type="date" name="quitDate" value={filters.quitDate} onChange={handleFilterChange} className={inputStyles} placeholder="dd-mm-yyyy" />
                    </div>
                    <div className="flex gap-2 col-span-2">
                        <Button variant="secondary" onClick={clearFilters} className="w-full justify-center bg-gray-200 hover:bg-gray-300 text-gray-800">Clear All</Button>
                        <Button variant="primary" onClick={() => alert('Exporting data...')} className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">Export</Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Store / Location</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recruiter</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applied Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Quit Date</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">Loading candidates...</td></tr>
                            ) : filteredCandidates.length > 0 ? filteredCandidates.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                        <div className="text-xs text-gray-500">{candidate.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.vendor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.storeLocation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            candidate.status === 'Active' ? 'bg-green-100 text-green-800' :
                                            candidate.status === 'Quit' ? 'bg-red-100 text-red-800' :
                                            candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            candidate.status === 'Selected' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.recruiter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.quitDate ? new Date(candidate.quitDate).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 hover:text-blue-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">No candidates found for the current filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllCandidatesView;
