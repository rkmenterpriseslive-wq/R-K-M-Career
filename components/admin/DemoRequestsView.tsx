
import React, { useState, useMemo } from 'react';
import { DemoRequest, UserType } from '../../types';
import { updateDemoRequest } from '../../services/firestoreService';
import { createSecondaryUser } from '../../services/firebaseService';
import { usePopup } from '../../contexts/PopupContext';
import Button from '../Button';

interface DemoRequestsViewProps {
    demoRequests: DemoRequest[];
}

const DemoRequestsView: React.FC<DemoRequestsViewProps> = ({ demoRequests = [] }) => {
    const { showPopup } = usePopup();

    const handleApprove = async (request: DemoRequest) => {
        if (request.teamSize === 'Hire Yourself') {
            if (window.confirm(`Approve this 'Hire Yourself' request for ${request.companyName}? This will create a new Team account with a default password.`)) {
                try {
                    const userType = UserType.TEAM;
                    const profileData = {
                        email: request.email,
                        userType: userType,
                        fullName: request.companyName,
                        phone: request.mobileNo,
                        profile_complete: true,
                    };
    
                    await createSecondaryUser(request.email, "password", profileData);
                    await updateDemoRequest(request.id, { status: 'Approved' });
                    
                    showPopup({
                        type: 'success',
                        title: 'Request Approved!',
                        message: `Team account for ${request.email} created with default password "password".`
                    });
                } catch (error: any) {
                    console.error("Failed to approve 'Hire Yourself' request:", error);
                    let errorMessage = 'Failed to approve request. An unexpected error occurred.';
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = 'An account with this email already exists. The request cannot be approved automatically.';
                    }
                    showPopup({ type: 'error', title: 'Approval Failed', message: errorMessage });
                }
            }
        } else if (request.teamSize === 'Hire Us') {
            if (window.confirm(`Approve this 'Hire Us' query from ${request.companyName}? No user account will be created.`)) {
                try {
                    await updateDemoRequest(request.id, { status: 'Approved' });
                    showPopup({
                        type: 'success',
                        title: 'Query Approved!',
                        message: `The 'Hire Us' query from ${request.companyName} has been marked as approved for follow-up.`
                    });
                } catch (error) {
                    console.error("Failed to approve 'Hire Us' query:", error);
                    showPopup({ type: 'error', title: 'Approval Failed', message: 'Failed to approve the query.' });
                }
            }
        } else {
            alert(`Invalid service type "${request.teamSize}" for this demo request.`);
        }
    };

    const handleReject = async (id: string) => {
         if (window.confirm('Reject this demo request?')) {
            try {
                await updateDemoRequest(id, { status: 'Rejected' });
            } catch (error) {
                console.error("Failed to reject request:", error);
                alert('Failed to reject request.');
            }
        }
    };
    
    const summary = useMemo(() => ({
        total: demoRequests.length,
        pending: demoRequests.filter(r => (r.status || 'Pending') === 'Pending').length,
        approved: demoRequests.filter(r => r.status === 'Approved').length,
        rejected: demoRequests.filter(r => r.status === 'Rejected').length,
    }), [demoRequests]);
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Demo Requests</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border"><h4 className="text-sm font-semibold text-gray-500">Total Requests</h4><p className="text-3xl font-bold text-gray-900">{summary.total}</p></div>
                <div className="bg-white p-6 rounded-xl border"><h4 className="text-sm font-semibold text-gray-500">Pending</h4><p className="text-3xl font-bold text-yellow-600">{summary.pending}</p></div>
                <div className="bg-white p-6 rounded-xl border"><h4 className="text-sm font-semibold text-gray-500">Approved</h4><p className="text-3xl font-bold text-green-600">{summary.approved}</p></div>
                <div className="bg-white p-6 rounded-xl border"><h4 className="text-sm font-semibold text-gray-500">Rejected</h4><p className="text-3xl font-bold text-red-600">{summary.rejected}</p></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                     <h3 className="text-lg font-bold text-gray-800">All Requests</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {demoRequests.length > 0 ? (
                                demoRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{req.companyName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{req.email}</div>
                                            <div className="text-sm text-gray-500">{req.mobileNo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Head: {req.teamHead}</div>
                                            <div className="text-xs text-gray-500">Service: {req.teamSize}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.requestDate).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-base">
                                        No demo requests found.
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

export default DemoRequestsView;
