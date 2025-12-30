





import React, { useState, useMemo, useEffect } from 'react';
import Input from '../Input';
import Button from '../Button';
import { AppUser, Vendor } from '../../types';

interface ActiveCandidate {
    id: string;
    name: string;
    client: string;
    role: string;
    storeName: string;
    vendor: string;
    joiningDate: string;
    status: string;
}

const StatCard: React.FC<{ title: string; value: number | string; color?: string; icon: React.ReactNode }> = ({ title, value, color = 'text-gray-900', icon }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">{title}</h4>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
            {icon}
        </div>
    </div>
);

interface PartnerActiveCandidatesViewProps {
    currentUser: AppUser | null;
    vendors: Vendor[];
    candidates: any[]; // New prop for real-time candidates
}

const getStatusClasses = (status: string) => {
    if (status === 'Selected' || status === 'Joined') return 'bg-green-100 text-green-800';
    if (status === 'Active') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
};


const PartnerActiveCandidatesView: React.FC<PartnerActiveCandidatesViewProps> = ({ currentUser, vendors, candidates: allCandidates }) => {
    const [filters, setFilters] = useState({ search: '', client: '', storeName: '' });

    const candidates = useMemo(() => {
        if (!currentUser || !allCandidates || !currentUser.email) return [];
    
        const activeStatuses = ['Active', 'Selected', 'Joined'];
        
        // 1. Find the partner's configuration (case-insensitive email match).
        const partnerVendor = vendors.find(v => v.email?.toLowerCase() === currentUser.email!.toLowerCase());

        if (!partnerVendor) {
            return []; // If no vendor config, they see nothing.
        }
        
        // 2. Collect all identifiers for this partner.
        const partnerEmail = currentUser.email.toLowerCase();
        const partnerName = partnerVendor.partnerName;
    
        return allCandidates
            .filter((c: any) => {
                // First, ensure the candidate has an active status for this view
                const isActiveStatus = activeStatuses.includes(c.status);
                if (!isActiveStatus) return false;
    
                // 3. Filter candidates based on a strict match of partner name or email.
                const candidatePartnerEmail = c.partnerEmail?.toLowerCase();
                const candidatePartnerName = c.partnerName;

                return (
                    (partnerName && candidatePartnerName && candidatePartnerName === partnerName) ||
                    (candidatePartnerEmail && candidatePartnerEmail === partnerEmail)
                );
            })
            .map((c: any): ActiveCandidate => ({
                id: c.id,
                name: c.name,
                client: c.vendor,
                role: c.role,
                storeName: c.storeLocation || c.storeName || 'N/A',
                vendor: c.vendor,
                joiningDate: c.joiningDate || c.appliedDate || new Date().toISOString(),
                status: c.status,
            }));
    }, [currentUser, vendors, allCandidates]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ search: '', client: '', storeName: '' });
    };

    const summaryStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const newJoiners = candidates.filter(c => {
            if (c.status !== 'Joined') return false;
            const joiningDate = new Date(c.joiningDate);
            return joiningDate.getMonth() === currentMonth && joiningDate.getFullYear() === currentYear;
        }).length;

        const clientCounts = candidates.reduce((acc, c) => {
            acc[c.client] = (acc[c.client] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topClient = Object.entries(clientCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

        return {
            total: candidates.length,
            newJoiners,
            topClientName: topClient ? topClient[0] : 'N/A',
            topClientCount: topClient ? topClient[1] : 0,
        };
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c =>
            (filters.search === '' || 
             c.name.toLowerCase().includes(filters.search.toLowerCase()) || 
             c.role.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.client === '' || c.client === filters.client) &&
            (filters.storeName === '' || c.storeName === filters.storeName)
        );
    }, [candidates, filters]);
    
    const uniqueClients = useMemo(() => [...new Set(candidates.map(c => c.client).filter(Boolean))], [candidates]);
    const uniqueStoreNames = useMemo(() => [...new Set(candidates.map(c => c.storeName).filter(Boolean))], [candidates]);

    const selectClassName = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">My Active Employees</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="Total Active Employees" value={summaryStats.total} color="text-blue-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                 <StatCard title="New Joiners (This Month)" value={summaryStats.newJoiners} color="text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>} />
                 <StatCard title={`Top Client: ${summaryStats.topClientName}`} value={summaryStats.topClientCount} color="text-purple-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <Input id="search" name="search" label="Search by Name/Role" placeholder="e.g., Aarav, Picker" value={filters.search} onChange={handleFilterChange} wrapperClassName="mb-0" />
                    <div>
                         <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                         <select id="client" name="client" value={filters.client} onChange={handleFilterChange} className={selectClassName}>
                            <option value="">All Clients</option>
                            {uniqueClients.map(client => <option key={client} value={client}>{client}</option>)}
                         </select>
                    </div>
                     <div>
                         <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                         <select id="storeName" name="storeName" value={filters.storeName} onChange={handleFilterChange} className={selectClassName}>
                            <option value="">All Stores</option>
                            {uniqueStoreNames.map(store => <option key={store} value={store}>{store}</option>)}
                         </select>
                    </div>
                    <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joining Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCandidates.length > 0 ? filteredCandidates.map(candidate => (
                                <tr key={candidate.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.client}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.storeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(candidate.joiningDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(candidate.status)}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">No active employees match the current filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PartnerActiveCandidatesView;