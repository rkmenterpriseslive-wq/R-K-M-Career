
import React, { useState, useMemo } from 'react';
import Input from '../Input';
import { AppUser } from '../../types';

interface StoreEmployeesViewProps {
    currentUser: AppUser | null;
    candidates: any[];
}

const getStatusClasses = (status: string) => {
    if (status === 'Selected' || status === 'Joined') return 'bg-green-100 text-green-800';
    if (status === 'Active') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
};

const StoreEmployeesView: React.FC<StoreEmployeesViewProps> = ({ currentUser, candidates }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const activeCandidates = useMemo(() => {
        if (!currentUser || !currentUser.storeLocation) {
            return [];
        }
        const activeStatuses = ['Active', 'Selected', 'Joined'];
        return candidates.filter(c => 
            c.storeLocation === currentUser.storeLocation &&
            activeStatuses.includes(c.status)
        );
    }, [currentUser, candidates]);

    const filteredCandidates = useMemo(() => {
        if (!searchTerm.trim()) return activeCandidates;
        return activeCandidates.filter(c =>
            (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [activeCandidates, searchTerm]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">In-Store Active Candidates</h2>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Input
                    id="search"
                    label="Search by Name or Role"
                    placeholder="e.g., Aarav Sharma, Sales Associate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied/Joining Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCandidates.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.phone || c.contact}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(c.joiningDate || c.appliedDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(c.status)}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                             {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">
                                        No active candidates found for this store.
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

export default StoreEmployeesView;
