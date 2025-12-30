

import React, { useState, useMemo, useEffect } from 'react';
import { Ticket } from '../../types';
import Button from '../Button';
import Modal from '../Modal';
import { updateComplaint } from '../../services/firestoreService';

interface ComplaintsViewProps {
    complaints: Ticket[];
    initialStatus?: string;
}

const ComplaintsView: React.FC<ComplaintsViewProps> = ({ complaints, initialStatus }) => {
    const [filterStatus, setFilterStatus] = useState<string>(initialStatus || 'All');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [hrRemarks, setHrRemarks] = useState('');
    const [newStatus, setNewStatus] = useState<'In Progress' | 'Resolved'>('In Progress');

    useEffect(() => {
        if (initialStatus) {
            setFilterStatus(initialStatus);
        }
    }, [initialStatus]);
    
    useEffect(() => {
        if (selectedTicket) {
            setHrRemarks(selectedTicket.hrRemarks || '');
            if (selectedTicket.status === 'Open') {
                setNewStatus('In Progress');
            }
        }
    }, [selectedTicket]);

    const filteredTickets = useMemo(() => {
        if (filterStatus === 'All') return complaints;
        if (filterStatus === 'Active') return complaints.filter(t => t.status === 'Open' || t.status === 'In Progress');
        if (filterStatus === 'Closed') return complaints.filter(t => t.status === 'Resolved');
        return complaints.filter(t => t.status === filterStatus);
    }, [complaints, filterStatus]);

    const summary = useMemo(() => {
        return {
            total: complaints.length,
            active: complaints.filter(t => t.status === 'Open' || t.status === 'In Progress').length,
            resolved: complaints.filter(t => t.status === 'Resolved').length
        };
    }, [complaints]);

    const handleSaveStatus = async () => {
        if (!selectedTicket) return;
        try {
            await updateComplaint(selectedTicket.id, {
                status: newStatus,
                hrRemarks: hrRemarks,
                ...(newStatus === 'Resolved' && { resolvedDate: new Date().toISOString() })
            });
            alert('Ticket updated successfully!');
        } catch (error) {
            alert('Failed to update ticket.');
        } finally {
            setSelectedTicket(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Open': return 'bg-red-100 text-red-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Help Desk</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h4 className="text-sm font-semibold text-gray-500 mb-1">Total Tickets</h4><p className="text-3xl font-bold text-gray-900">{summary.total}</p></div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h4 className="text-sm font-semibold text-gray-500 mb-1">Active</h4><p className="text-3xl font-bold text-red-600">{summary.active}</p></div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h4 className="text-sm font-semibold text-gray-500 mb-1">Resolved</h4><p className="text-3xl font-bold text-green-600">{summary.resolved}</p></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Tickets List</h3>
                    <div>
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)} 
                            className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="All">All Tickets</option>
                            <option value="Active">Active</option>
                            <option value="Closed">Resolved</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket / User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-blue-600">{ticket.id.substring(0, 8)}...</div>
                                            <div className="text-xs text-gray-500">{ticket.submittedBy}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{ticket.subject}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{ticket.category}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(ticket.submittedDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>View / Update</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No tickets found matching the filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTicket && (
                 <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={`Manage Ticket #${selectedTicket.id.substring(0,8)}...`}>
                     <div className="space-y-4 text-sm">
                         <div className="grid grid-cols-3 gap-2"><strong className="text-gray-600">Subject:</strong><span className="col-span-2">{selectedTicket.subject}</span></div>
                         <div className="grid grid-cols-3 gap-2"><strong className="text-gray-600">User:</strong><span className="col-span-2">{selectedTicket.submittedBy} ({selectedTicket.userType})</span></div>
                         <div className="grid grid-cols-3 gap-2"><strong className="text-gray-600">Submitted:</strong><span className="col-span-2">{new Date(selectedTicket.submittedDate).toLocaleString()}</span></div>
                         <div>
                             <strong className="text-gray-600">Description:</strong>
                             <p className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTicket.description}</p>
                         </div>
                         <div className="border-t pt-4 space-y-3">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                                 <select value={newStatus} onChange={e => setNewStatus(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                     <option value="In Progress">In Progress</option>
                                     <option value="Resolved">Resolved</option>
                                 </select>
                              </div>
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">HR Remarks</label>
                                 <textarea value={hrRemarks} onChange={e => setHrRemarks(e.target.value)} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                              </div>
                         </div>
                         <div className="flex justify-end pt-4 gap-3">
                              <Button variant="secondary" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                              <Button variant="primary" onClick={handleSaveStatus}>Save Changes</Button>
                         </div>
                     </div>
                 </Modal>
            )}
        </div>
    );
};

export default ComplaintsView;
