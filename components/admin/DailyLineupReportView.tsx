
import React, { useState, useMemo } from 'react';
import Button from '../Button';

const DailyLineupReportView: React.FC<{ onBack: () => void; candidates: any[] }> = ({ onBack, candidates }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    const dailyLineups = useMemo(() => {
        return (candidates || []).filter(c => 
            c.appliedDate && 
            c.appliedDate.startsWith(selectedDate)
        );
    }, [candidates, selectedDate]);

    const TableHeader = () => (
        <thead className="bg-blue-500 border-b-2 border-black">
            <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase w-16">S. No.</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase">Recruiter</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase">Client</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase">Position</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase">Candidate</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase">Mobile No</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white border-r border-blue-600 uppercase">Location</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-white uppercase">Call Status</th>
            </tr>
        </thead>
    );

    const TableBody: React.FC<{ data: any[] }> = ({ data }) => (
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
                        <td className="px-4 py-2 text-sm">{item.callStatus || '-'}</td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm border-r border-l border-b border-gray-200">
                        No lineup data found for this date.
                    </td>
                </tr>
            )}
        </tbody>
    );

    return (
        <div className="space-y-6 bg-gray-50 min-h-screen p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Daily Lineup Report</h2>
                <Button variant="secondary" onClick={onBack} className="bg-white border border-gray-300 hover:bg-gray-100 text-sm">
                    Back to Reports
                </Button>
            </div>

            <div className="space-y-8">
                <div className="border-2 border-black">
                    <div className="flex border-b-2 border-black">
                        <div className="w-48 p-2 border-r-2 border-black flex items-center justify-center font-bold bg-white">
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full text-sm focus:outline-none font-bold text-center"
                            />
                        </div>
                        <div className="flex-1 p-2 text-center font-bold text-black bg-yellow-300">
                            Daily Lineup Report
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <TableHeader />
                            <TableBody data={dailyLineups} />
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyLineupReportView;
