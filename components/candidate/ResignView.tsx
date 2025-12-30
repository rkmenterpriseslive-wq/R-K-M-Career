import React, { useState, useEffect } from 'react';
import { AppUser, Resignation } from '../../types';
import Button from '../Button';
import { submitResignation } from '../../services/firestoreService';
import { usePopup } from '../../contexts/PopupContext';

interface ResignViewProps {
    currentUser: AppUser | null;
    resignation: Resignation | null;
}

const ResignView: React.FC<ResignViewProps> = ({ currentUser, resignation }) => {
    const [reason, setReason] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showPopup } = usePopup();

    const handleSubmit = async () => {
        if (!currentUser) {
            showPopup({ type: 'error', title: 'Error', message: 'You must be logged in to submit a resignation.' });
            return;
        }
        if (!reason.trim()) {
            showPopup({ type: 'error', title: 'Error', message: 'Please provide a reason for your resignation.' });
            return;
        }
        if (!isConfirmed) {
            showPopup({ type: 'error', title: 'Error', message: 'Please confirm your intention to resign by checking the box.' });
            return;
        }
        setIsLoading(true);

        const resignationData = {
            employeeId: currentUser.uid,
            employeeName: currentUser.fullName || currentUser.email || 'N/A',
            reason: reason.trim(),
        };
        
        try {
            await submitResignation(resignationData);
            // The view will update automatically due to the real-time listener in App.tsx
            showPopup({ type: 'success', title: 'Submitted', message: 'Your resignation has been submitted successfully.' });
        } catch (error) {
            console.error("Failed to submit resignation:", error);
            showPopup({ type: 'error', title: 'Submission Failed', message: 'There was an error submitting your request. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (isoString: string | undefined) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };
    
    const getStatusClasses = (status: Resignation['status']) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Pending HR Approval': return 'bg-yellow-100 text-yellow-800 animate-pulse';
            case 'Rejected': return 'bg-red-100 text-red-800';
        }
    };

    if (resignation) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800">Resignation Status</h2>
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-900">Your resignation request has been submitted.</h3>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClasses(resignation.status)}`}>
                            {resignation.status}
                        </span>
                    </div>
                    
                    <div className="mt-6 border-t pt-6 space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                            <span className="font-medium text-gray-500">Submitted On:</span>
                            <span className="col-span-2 text-gray-800 font-semibold">{formatDate(resignation.submittedDate)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <span className="font-medium text-gray-500">Reason Provided:</span>
                            <p className="col-span-2 text-gray-700 italic">"{resignation.reason}"</p>
                        </div>
                        {resignation.status === 'Approved' && (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="font-medium text-gray-500">Notice Period Starts:</span>
                                    <span className="col-span-2 text-gray-800 font-semibold">{formatDate(resignation.noticePeriodStartDate)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="font-medium text-gray-500">Suggested Last Working Day:</span>
                                    <span className="col-span-2 text-gray-800 font-semibold">{formatDate(resignation.lastWorkingDay)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="font-medium text-gray-500">HR Remarks:</span>
                                    <p className="col-span-2 text-gray-700">{resignation.hrRemarks}</p>
                                </div>
                            </>
                        )}
                         {resignation.status === 'Pending HR Approval' && (
                             <div className="text-center p-4 bg-blue-50 text-blue-700 rounded-lg">
                                 Your request is being reviewed by HR. Updates will appear here shortly.
                             </div>
                         )}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Submit Resignation</h2>
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-600 mb-6">
                    Please fill out the form below to formally submit your resignation. This action is irreversible once submitted and approved by HR.
                </p>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Resignation *
                        </label>
                        <textarea
                            id="reason"
                            rows={5}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Please provide a brief reason for leaving."
                            required
                        />
                    </div>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="confirmation"
                                type="checkbox"
                                checked={isConfirmed}
                                onChange={(e) => setIsConfirmed(e.target.checked)}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="confirmation" className="font-medium text-gray-700">
                                I understand that this is a formal resignation and I wish to proceed.
                            </label>
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            loading={isLoading}
                            disabled={!isConfirmed || !reason.trim()}
                            className="w-full justify-center"
                            variant="danger"
                        >
                            Submit Resignation
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResignView;