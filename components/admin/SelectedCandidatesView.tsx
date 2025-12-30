
import React, { useMemo } from 'react';
import Button from '../Button';
import { Vendor } from '../../types';

interface SelectedCandidatesViewProps {
    candidates: any[];
    onGenerateOfferClick: (candidate: any) => void;
    vendors: Vendor[];
}

const SelectedCandidatesView: React.FC<SelectedCandidatesViewProps> = ({ candidates, onGenerateOfferClick, vendors }) => {

    const brandToPartnerMap = useMemo(() => {
        const map = new Map<string, string>();
        (vendors || []).forEach(vendor => {
            if (vendor.partnerName) {
                (vendor.brandNames || []).forEach(brand => {
                    map.set(brand.toLowerCase(), vendor.partnerName!);
                });
            }
        });
        return map;
    }, [vendors]);

    const readyForOfferCandidates = useMemo(() => {
        return (candidates || []).filter(c => c.stage === 'Selected' && c.status !== 'Joined' && c.status !== 'Offer Released');
    }, [candidates]);

    const offerGeneratedCandidates = useMemo(() => {
        return (candidates || []).filter(c => c.status === 'Offer Released');
    }, [candidates]);


    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Selected Candidates Pipeline</h2>

            {/* NEW: Professional Summary Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Offer Stage Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ready for Offer Card */}
                    <div className="flex items-center p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                        <div className="p-3 bg-blue-100 rounded-full mr-4">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-600">{readyForOfferCandidates.length}</p>
                            <p className="text-sm font-medium text-gray-600">Ready for Offer</p>
                            <p className="text-xs text-gray-500">Awaiting offer letter generation.</p>
                        </div>
                    </div>
                    {/* Offer Released Card */}
                    <div className="flex items-center p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                        <div className="p-3 bg-indigo-100 rounded-full mr-4">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-indigo-600">{offerGeneratedCandidates.length}</p>
                            <p className="text-sm font-medium text-gray-600">Offer Released</p>
                            <p className="text-xs text-gray-500">Offers have been sent, awaiting response.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidates Ready for Offer Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Candidates Ready for Offer</h3>
                    <p className="text-sm text-gray-500 mt-1">These candidates are marked as 'Selected' and are awaiting an offer letter.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role & Partner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recruiter</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {readyForOfferCandidates.length > 0 ? readyForOfferCandidates.map(candidate => (
                                <tr key={candidate.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                        <div className="text-sm text-gray-500">{candidate.phone || candidate.contact}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{candidate.role}</div>
                                        <div className="text-sm text-gray-500">{brandToPartnerMap.get((candidate.vendor || '').toLowerCase()) || candidate.vendor}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.recruiter}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="primary" size="sm" onClick={() => onGenerateOfferClick(candidate)}>
                                            Generate Offer
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p>No candidates are currently in the 'Selected' stage.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Offer Generated Candidates Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Offer Generated Candidates</h3>
                    <p className="text-sm text-gray-500 mt-1">An offer letter has been generated for these candidates. Awaiting their response.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role & Partner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recruiter</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {offerGeneratedCandidates.length > 0 ? offerGeneratedCandidates.map(candidate => (
                                <tr key={candidate.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                        <div className="text-sm text-gray-500">{candidate.phone || candidate.contact}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{candidate.role}</div>
                                        <div className="text-sm text-gray-500">{brandToPartnerMap.get((candidate.vendor || '').toLowerCase()) || candidate.vendor}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.recruiter}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                            Offer Released
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        No offers have been generated for selected candidates yet.
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

export default SelectedCandidatesView;
