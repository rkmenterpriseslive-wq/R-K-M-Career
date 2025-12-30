

import React, { useState, useMemo, FC } from 'react';
import { PartnerUpdateStatus, TeamMemberPerformance } from '../../types';
import { updateCandidate } from '../../services/firestoreService';
import Button from '../Button';
import Modal from '../Modal';
import { usePopup } from '../../contexts/PopupContext';

interface InterviewCandidate {
    id: string;
    name: string;
    phone: string;
    role: string;
    recruiter: string;
    submittedDate: string;
    interviewDate: string;
    status: PartnerUpdateStatus;
    remarks?: string;
    partnerName?: string;
    brand?: string;
}

interface PartnerInterviewLineupsViewProps {
    candidates: any[];
    teamMembers: TeamMemberPerformance[];
    showPopup: (config: any) => void;
}

const ALL_STATUSES: PartnerUpdateStatus[] = [
    'Interview Attended', 'Offer Accepted', 'Offer Rejected', 'Joined', 'Absconded'
];

const getStatusClasses = (status: PartnerUpdateStatus) => {
    if (status.includes('Accepted') || status.includes('Joined') || status.includes('Attended')) return 'bg-green-100 text-green-800';
    if (status.includes('Rejected') || status.includes('Absconded')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800'; // For Interview Scheduled
};

const UpdateStatusForm: FC<{ 
    candidate: InterviewCandidate, 
    onSave: (id: string, newStatus: PartnerUpdateStatus, remarks: string) => void, 
    onClose: () => void 
}> = ({ candidate, onSave, onClose }) => {
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
                    placeholder="e.g., Candidate performed well, good fit for the role..."
                />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Status</Button>
            </div>
        </div>
    );
};


const PartnerInterviewLineupsView: React.FC<PartnerInterviewLineupsViewProps> = ({ candidates, showPopup }) => {
    const [selectedCandidate, setSelectedCandidate] = useState<InterviewCandidate | null>(null);

    const interviewCandidates = useMemo(() => {
        return (candidates || [])
            .filter(c => c.stage === 'Interview' || c.status === 'Interview Scheduled')
            .map((c: any): InterviewCandidate => ({
                id: c.id,
                name: c.name,
                phone: c.phone || 'N/A',
                role: c.role,
                recruiter: c.recruiter || 'N/A',
                submittedDate: new Date(c.appliedDate).toLocaleDateString(),
                interviewDate: c.interviewDate ? new Date(c.interviewDate).toLocaleString() : 'Not Set',
                status: c.status,
                remarks: c.remarks,
                partnerName: c.partnerName,
                brand: c.vendor,
            }));
    }, [candidates]);

    const handleUpdateClick = (candidate: InterviewCandidate) => {
        setSelectedCandidate(candidate);
    };

    const handleCloseModal = () => {
        setSelectedCandidate(null);
    };

    const handleSaveStatus = async (id: string, newStatus: PartnerUpdateStatus, remarks: string) => {
        try {
            await updateCandidate(id, { status: newStatus, remarks });
            showPopup({ type: 'success', title: 'Status Updated', message: 'Candidate status has been successfully updated.' });
            handleCloseModal();
            // The view will update automatically due to the real-time listener in App.tsx
        } catch (error) {
            console.error("Failed to update candidate status:", error);
            showPopup({ type: 'error', title: 'Update Failed', message: 'Could not update the candidate status.' });
        }
    };
    
    const summary = useMemo(() => ({
        total: interviewCandidates.length,
        pending: interviewCandidates.filter(c => c.status === 'Interview Scheduled').length,
        completed: interviewCandidates.filter(c => c.status !== 'Interview Scheduled').length,
    }), [interviewCandidates]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Interview Lineups</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-500">Total Interviews</h4>
                    <p className="text-3xl font-bold text-blue-600">{summary.total}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-500">Pending</h4>
                    <p className="text-3xl font-bold text-yellow-600">{summary.pending}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-500">Completed / Updated</h4>
                    <p className="text-3xl font-bold text-green-600">{summary.completed}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner / Brand / Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sourced By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interview Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {interviewCandidates.map(candidate => (
                                <tr key={candidate.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                        <div className="text-xs text-gray-500">{candidate.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-semibold">{candidate.partnerName || 'Direct'}</div>
                                        <div className="text-xs">{candidate.brand}</div>
                                        <div className="text-xs text-gray-400">{candidate.role}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.recruiter}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.interviewDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(candidate.status)}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="primary" size="sm" onClick={() => handleUpdateClick(candidate)}>Update Status</Button>
                                    </td>
                                </tr>
                            ))}
                            {interviewCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        No candidates are currently scheduled for an interview.
                                    </td>
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
                   />
                </Modal>
            )}
        </div>
    );
};

export default PartnerInterviewLineupsView;