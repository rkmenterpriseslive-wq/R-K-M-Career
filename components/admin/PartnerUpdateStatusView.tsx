





import React, { useState, useMemo, FC } from 'react';
import { AppUser, PartnerUpdatableCandidate, PartnerUpdateStatus, UserType, Vendor } from '../../types';
import { updateCandidate } from '../../services/firestoreService';
import Input from '../Input';
import Button from '../Button';
import Modal from '../Modal';
import StatCard from './StatCard';
import { usePopup } from '../../contexts/PopupContext';

interface PartnerUpdateStatusViewProps {
    currentUser: AppUser | null;
    vendors: Vendor[];
    candidates: any[];
    showPopup: (config: any) => void;
}

const ALL_STATUSES: PartnerUpdateStatus[] = [
    'Pending', 'Contacted - Interested', 'Contacted - Not Interested', 
    'Interview Scheduled', 'Interview Attended', 'Offer Accepted', 
    'Offer Rejected', 'Joined', 'Absconded'
];

const getStatusClasses = (status: string) => {
    if (status === 'Selected' || status.includes('Interested') || status.includes('Accepted') || status.includes('Joined') || status.includes('Attended')) return 'bg-green-100 text-green-800';
    if (status === 'Rejected' || status.includes('Not Interested') || status.includes('Absconded')) return 'bg-red-100 text-red-800';
    if (status.includes('Scheduled')) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
};

const ICONS = {
    lineup: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    done: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    rejected: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
    pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    vendor: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};


const UpdateStatusForm: FC<{ 
    candidate: PartnerUpdatableCandidate, 
    onSave: (id: string, newStatus: PartnerUpdateStatus, remarks: string) => void, 
    onClose: () => void,
    isSubmitting: boolean
}> = ({ candidate, onSave, onClose, isSubmitting }) => {
    const [newStatus, setNewStatus] = useState<PartnerUpdateStatus>('Interview Attended');
    const [remarks, setRemarks] = useState(candidate.remarks || '');

    const handleSave = () => {
        onSave(candidate.id, newStatus, remarks);
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select 
                    id="status-select" 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value as PartnerUpdateStatus)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                    {ALL_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                <textarea 
                    id="remarks" 
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Scheduled interview for next Tuesday..."
                />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={isSubmitting}>Save Status</Button>
            </div>
        </div>
    );
};

const CandidateCVModal: FC<{
    candidate: PartnerUpdatableCandidate;
    onClose: () => void;
}> = ({ candidate, onClose }) => {
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`CV: ${candidate.name}`}
            maxWidth="max-w-2xl"
        >
            <div className="font-sans text-gray-800 p-4 bg-gray-50 rounded-lg">
                <header className="text-center pb-4 border-b-2 border-gray-200">
                    <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
                    <p className="text-md text-blue-600 font-semibold mt-1">{candidate.role}</p>
                    <p className="text-sm text-gray-500 mt-2">{candidate.phone}</p>
                </header>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold border-b pb-1 mb-3 text-gray-700">Application Details</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <strong className="text-gray-500">Client / Brand:</strong>
                        <span>{candidate.client}</span>

                        <strong className="text-gray-500">Sourced By:</strong>
                        <span>{candidate.vendor}</span>

                        <strong className="text-gray-500">Last Updated:</strong>
                        <span>{new Date(candidate.lastUpdated).toLocaleString()}</span>
                        
                        <strong className="text-gray-500">Current Status:</strong>
                        <span className={`font-semibold ${getStatusClasses(candidate.status).replace('bg-', 'text-')}`}>{candidate.status}</span>
                    </div>
                </section>

                {candidate.remarks && (
                    <section className="mt-6">
                        <h2 className="text-lg font-semibold border-b pb-1 mb-3 text-gray-700">Remarks</h2>
                        <p className="text-sm text-gray-600 italic bg-white p-3 rounded border border-gray-200">
                            "{candidate.remarks}"
                        </p>
                    </section>
                )}
            </div>
            <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};


const PartnerUpdateStatusView: React.FC<PartnerUpdateStatusViewProps> = ({ currentUser, vendors, candidates: allCandidates, showPopup }) => {
    const [filters, setFilters] = useState({
        search: '',
        client: '',
        role: '',
        status: '',
        startDate: '',
        endDate: '',
        storeName: '',
    });
    const [selectedCandidate, setSelectedCandidate] = useState<PartnerUpdatableCandidate | null>(null);
    const [viewingCVCandidate, setViewingCVCandidate] = useState<PartnerUpdatableCandidate | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const partnerCandidates = useMemo(() => {
        if (!currentUser || !allCandidates) return [];
    
        let relevantCandidates: any[] = [];
    
        if (currentUser.userType === UserType.PARTNER) {
            if (!vendors || !currentUser.email) return [];
            
            // 1. Find the partner's configuration (case-insensitive email match).
            const partnerVendor = vendors.find(v => v.email?.toLowerCase() === currentUser.email!.toLowerCase());
    
            if (!partnerVendor) {
                return []; // If no vendor config, they see nothing.
            }
            
            // 2. Collect all identifiers for this partner.
            const partnerEmail = currentUser.email.toLowerCase();
            const partnerName = partnerVendor.partnerName;
            
            // 3. Filter candidates based on a strict match of partner name or email.
            // The broad brand-based check is removed to prevent partners from seeing
            // other partners' candidates who might be hiring for the same brand.
            relevantCandidates = allCandidates.filter(c => {
                const candidatePartnerEmail = c.partnerEmail?.toLowerCase();
                const candidatePartnerName = c.partnerName;
        
                return (
                    (partnerName && candidatePartnerName && candidatePartnerName === partnerName) ||
                    (candidatePartnerEmail && candidatePartnerEmail === partnerEmail)
                );
            });
    
        } else if (currentUser.userType === UserType.STORE_SUPERVISOR) {
             // A candidate is visible to a supervisor if their 'supervisorEmail' field
            // exactly matches the email of the logged-in supervisor.
            relevantCandidates = allCandidates.filter(c => c.supervisorEmail === currentUser.email);
        }
    
        return relevantCandidates
            .map((c: any): PartnerUpdatableCandidate => ({
                id: c.id,
                name: c.name,
                client: c.vendor,
                partnerName: c.partnerName,
                role: c.role,
                phone: c.phone || 'N/A',
                storeName: c.storeLocation || c.storeName || 'N/A',
                // Display the most accurate current status or stage from the candidate record.
                status: (c.status || c.stage || 'Pending') as PartnerUpdateStatus,
                lastUpdated: c.updatedAt || c.appliedDate,
                remarks: c.remarks || '',
                vendor: c.recruiter || 'N/A'
            }));
    }, [currentUser, vendors, allCandidates]);

    const summaryStats = useMemo(() => {
        const stats = {
            interviewLineups: partnerCandidates.length,
            interviewDone: 0,
            interviewRejected: 0,
            interviewPending: 0,
        };

        partnerCandidates.forEach(c => {
            if (['Interview Attended', 'Offer Accepted', 'Joined', 'Selected'].includes(c.status)) {
                stats.interviewDone++;
            } else if (['Rejected', 'Offer Rejected', 'Absconded', 'Not Interested', 'Contacted - Not Interested'].includes(c.status)) {
                stats.interviewRejected++;
            } else { 
                stats.interviewPending++;
            }
        });

        return stats;
    }, [partnerCandidates]);

    const uniqueClients = useMemo(() => [...new Set(partnerCandidates.map(c => c.client))], [partnerCandidates]);
    const uniqueRoles = useMemo(() => [...new Set(partnerCandidates.map(c => c.role))], [partnerCandidates]);
    const uniqueStatuses = useMemo(() => [...new Set(partnerCandidates.map(c => c.status).filter(Boolean))], [partnerCandidates]) as string[];
    const uniqueStoreNames = useMemo(() => [...new Set(partnerCandidates.map(c => c.storeName).filter(Boolean))], [partnerCandidates]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            client: '',
            role: '',
            status: '',
            startDate: '',
            endDate: '',
            storeName: '',
        });
    };

    const handleUpdateClick = (candidate: PartnerUpdatableCandidate) => {
        setSelectedCandidate(candidate);
    };

    const handleViewCVClick = (candidate: PartnerUpdatableCandidate) => {
        setViewingCVCandidate(candidate);
    };

    const handleCloseModal = () => {
        setSelectedCandidate(null);
    };

    const handleSaveStatus = async (id: string, newStatus: PartnerUpdateStatus, remarks: string) => {
        setIsLoading(true);
        try {
            const updateData: any = {
                status: newStatus,
                remarks: remarks,
                updatedAt: new Date().toISOString()
            };

            // Also update the 'stage' if it's a major milestone
            if (['Selected', 'Joined', 'Offer Accepted'].includes(newStatus)) {
                updateData.stage = 'Selected';
            } else if (newStatus.includes('Rejected') || newStatus.includes('Absconded')) {
                updateData.stage = 'Rejected';
            } else if (newStatus.includes('Interview')) {
                updateData.stage = 'Interview';
            }
            
            await updateCandidate(id, updateData);
            showPopup({ type: 'success', title: 'Status Updated', message: 'Candidate status has been successfully updated.' });
            handleCloseModal();
        } catch (error) {
            console.error("Failed to update candidate status:", error);
            showPopup({ type: 'error', title: 'Update Failed', message: 'Could not update the candidate status.' });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = useMemo(() => {
        return partnerCandidates.filter(c => {
            const searchMatch = filters.search === '' ||
                c.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                c.phone.toLowerCase().includes(filters.search.toLowerCase()) ||
                c.client.toLowerCase().includes(filters.search.toLowerCase()) ||
                c.role.toLowerCase().includes(filters.search.toLowerCase()) ||
                c.storeName.toLowerCase().includes(filters.search.toLowerCase());
            
            const clientMatch = filters.client === '' || c.client === filters.client;
            const roleMatch = filters.role === '' || c.role === filters.role;
            const statusMatch = filters.status === '' || c.status === filters.status;
            const storeNameMatch = filters.storeName === '' || c.storeName === filters.storeName;
    
            const lastUpdatedDate = new Date(c.lastUpdated);
            const startDateMatch = filters.startDate === '' || lastUpdatedDate >= new Date(filters.startDate);
            const endDateMatch = filters.endDate === '' || lastUpdatedDate <= new Date(new Date(filters.endDate).setHours(23, 59, 59, 999));
    
            return searchMatch && clientMatch && roleMatch && statusMatch && storeNameMatch && startDateMatch && endDateMatch;
        });
    }, [partnerCandidates, filters]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Candidate Pipeline</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Candidates" value={summaryStats.interviewLineups.toString()} valueColor="text-blue-600" icon={ICONS.lineup} />
                <StatCard title="Action Completed" value={summaryStats.interviewDone.toString()} valueColor="text-green-600" icon={ICONS.done} />
                <StatCard title="Negative Status" value={summaryStats.interviewRejected.toString()} valueColor="text-red-600" icon={ICONS.rejected} />
                <StatCard title="Pending Action" value={summaryStats.interviewPending.toString()} valueColor="text-yellow-600" icon={ICONS.pending} />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <Input
                        id="search"
                        name="search"
                        label="Search"
                        placeholder="Name, Phone, Store..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        wrapperClassName="mb-0"
                    />
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <select id="client" name="client" value={filters.client} onChange={handleFilterChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">All</option>
                            {uniqueClients.map(client => <option key={client} value={client}>{client}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select id="role" name="role" value={filters.role} onChange={handleFilterChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">All</option>
                            {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                        <select id="storeName" name="storeName" value={filters.storeName} onChange={handleFilterChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">All</option>
                            {uniqueStoreNames.map(store => <option key={store} value={store}>{store}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">All</option>
                            {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <Input
                        id="startDate"
                        name="startDate"
                        label="Updated From"
                        type="date"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        wrapperClassName="mb-0"
                    />
                    <Input
                        id="endDate"
                        name="endDate"
                        label="Updated To"
                        type="date"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        wrapperClassName="mb-0"
                    />
                    <Button variant="secondary" onClick={clearFilters} className="w-full h-[42px]">
                        Clear Filters
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner / Brand / Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCandidates.map(candidate => (
                                <tr key={candidate.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                        <div className="text-sm text-gray-500">{candidate.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-semibold">{candidate.partnerName || 'Direct'}</div>
                                        <div className="text-xs">{candidate.client}</div>
                                        <div className="text-xs text-gray-400">{candidate.role}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.storeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(candidate.lastUpdated).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(candidate.status)}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewCVClick(candidate)}>View CV</Button>
                                        <Button variant="primary" size="sm" onClick={() => handleUpdateClick(candidate)}>Update</Button>
                                    </td>
                                </tr>
                            ))}
                             {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">No candidates found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedCandidate && (
                <Modal 
                    isOpen={!!selectedCandidate} 
                    onClose={handleCloseModal} 
                    title={`Update Status for ${selectedCandidate.name}`}
                    description={`Current Status: ${selectedCandidate.status}`}
                >
                   <UpdateStatusForm 
                       candidate={selectedCandidate}
                       onSave={handleSaveStatus}
                       onClose={handleCloseModal}
                       isSubmitting={isLoading}
                   />
                </Modal>
            )}

            {viewingCVCandidate && (
                <CandidateCVModal 
                    candidate={viewingCVCandidate}
                    onClose={() => setViewingCVCandidate(null)}
                />
            )}
        </div>
    );
};

export default PartnerUpdateStatusView;