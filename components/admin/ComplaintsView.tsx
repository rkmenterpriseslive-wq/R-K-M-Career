
import React, { useState, useMemo, useEffect } from 'react';
import { Ticket } from '../../types';
import Button from '../Button';

// Mock data to simulate empty state initially as per screenshot, 
// but structured to hold Ticket objects.
const MOCK_TICKETS: Ticket[] = []; 

const ComplaintsView: React.FC<{ initialStatus?: string }> = ({ initialStatus }) => {
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [filterStatus, setFilterStatus] = useState<string>(initialStatus || 'All');

    useEffect(() => {
        if (initialStatus) {
            setFilterStatus(initialStatus);
        }
    }, [initialStatus]);

    const filteredTickets = useMemo(() => {
        if (filterStatus === 'All') return tickets;
        if (filterStatus === 'Active') return tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
        if (filterStatus === 'Closed') return tickets.filter(t => t.status === 'Resolved');
        return tickets.filter(t => t.status === filterStatus);
    }, [tickets, filterStatus]);

    const summary = useMemo(() => {
        return {
            total: tickets.length,
            active: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length,
            resolved: tickets.filter(t => t.status === 'Resolved').length
        };
    }, [tickets]);

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
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">Total Tickets</h4>
                    <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">Active</h4>
                    <p className="text-3xl font-bold text-red-600">{summary.active}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">Resolved</h4>
                    <p className="text-3xl font-bold text-green-600">{summary.resolved}</p>
                </div>
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
                                            <div className="text-sm font-medium text-blue-600">{ticket.id}</div>
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
                                            <Button variant="ghost" size="sm">View</Button>
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
        </div>
    );
};

export default ComplaintsView;
