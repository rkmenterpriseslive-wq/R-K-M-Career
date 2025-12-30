

import React, { useState, useMemo } from 'react';
import Button from '../Button';

interface DailyReportDetailViewProps {
    onBack: () => void;
    candidates: any[];
}

const DailyReportDetailView: React.FC<DailyReportDetailViewProps> = ({ onBack, candidates }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    const submissions = useMemo(() => {
        return (candidates || []).filter(c => 
            c.callStatus === 'Interested' && 
            c.appliedDate && 
            c.appliedDate.startsWith(selectedDate)
        );
    }, [candidates, selectedDate]);

    const selections = useMemo(() => {
        return (candidates || []).filter(c => 
           c.stage === 'Selected' && 
           c.appliedDate && 
           c.appliedDate.startsWith(selectedDate)
       );
   }, [candidates, selectedDate]);


    const TableHeader = () => (
        <thead className="bg-yellow-400 border-b border-black">
            <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase w-16">S. No.</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase">Recruiter Name</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase">Client Name</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase">Position</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase">Candidate Name</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase">Mobile No</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r border-black uppercase">Location</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-black uppercase">Status</th>
            </tr>
        </thead>
    );
    
    const TableBody: React.FC<{ data: any[], emptyMessage: string, statusField: string }> = ({ data, emptyMessage, statusField }) => (
        <tbody className="bg-white">
            {data.length > 0 ? (
                data.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{index + 1}</td>
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{item.recruiter || '-'}</td>
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{item.vendor || '-'}</td>
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{item.role || '-'}</td>
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{item.name || '-'}</td>
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{item.phone || '-'}</td>
                        <td className="px-4 py-2 text-sm border-r border-gray-200">{item.location || '-'}</td>
                        <td className="px-4 py-2 text-sm">{item[statusField] || '-'}</td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm border-r border-l border-b border-gray-200">
                        {emptyMessage}
                    </td>
                </tr>
            )}
        </tbody>
    );

    return (
        <div className="space-y-6 bg-white min-h-screen p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Daily Report View</h2>
                <Button variant="secondary" onClick={onBack} className="bg-white border border-gray-300 hover:bg-gray-50 text-sm">
                    Back to Reports
                </Button>
            </div>

            <div className="space-y-8">
                {/* Daily New Submissions Table */}
                <div className="border border-black">
                    <div className="flex border-b border-black">
                        <div className="w-40 p-2 border-r border-black flex items-center justify-center font-bold bg-white">
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full text-sm focus:outline-none font-bold text-center"
                            />
                        </div>
                        <div className="flex-1 p-2 text-center font-bold text-black bg-white">
                            Daily New Submissions
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <TableHeader />
                            <TableBody data={submissions} emptyMessage="No interested candidates found for this date." statusField="callStatus" />
                        </table>
                    </div>
                </div>

                {/* New Selection Today Table */}
                <div className="border border-black mt-8">
                    <div className="p-2 text-center font-bold text-black bg-white border-b border-black">
                        New Selection Today
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <TableHeader />
                            <TableBody data={selections} emptyMessage="No selections found for this date." statusField="stage" />
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyReportDetailView;
