
import React, { useState } from 'react';
import { DemoRequest } from '../../types';

// Mock data for demo purposes - initially empty to show the requested state
const MOCK_DEMO_REQUESTS: DemoRequest[] = [];

const DemoRequestsView: React.FC = () => {
    const [requests, setRequests] = useState<DemoRequest[]>(MOCK_DEMO_REQUESTS);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Demo Requests</h2>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Team Head</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Team Size</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.length > 0 ? (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.companyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.teamHead}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.teamSize}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={req.address}>{req.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.requestDate).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-base">
                                        No demo requests yet.
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
