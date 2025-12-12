
import React, { useState } from 'react';
import Button from '../Button';

interface DailyReportDetailViewProps {
    onBack: () => void;
}

const DailyReportDetailView: React.FC<DailyReportDetailViewProps> = ({ onBack }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Mock data can be added here later. For now, empty arrays to match the screenshot's empty state.
    const submissions: any[] = [];
    const selections: any[] = [];

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
                            <tbody className="bg-white">
                                {submissions.length > 0 ? (
                                    submissions.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200">
                                            {/* Render rows here */}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm border-r border-l border-b border-gray-200">
                                            No submissions found for your team today
                                            <div className="h-20 border-l border-gray-200 absolute left-1/4 top-1/2 hidden"></div>
                                            {/* Helper grid lines simulation for empty state visuals if needed, but simple text is cleaner */}
                                        </td>
                                    </tr>
                                )}
                                {/* Add empty rows with vertical lines to match the "grid" look of the screenshot if desirable, 
                                    but standard empty state is usually preferred for web apps. 
                                    Below adds purely visual vertical dividers for the empty state row to match screenshot style roughly */}
                                {submissions.length === 0 && (
                                    <tr className="h-0">
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="h-24"></td>
                                    </tr>
                                )}
                            </tbody>
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
                            <tbody className="bg-white">
                                {selections.length > 0 ? (
                                    selections.map((item, index) => (
                                        <tr key={index}>
                                            {/* Render rows here */}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                                            No selections found for your team today
                                        </td>
                                    </tr>
                                )}
                                 {selections.length === 0 && (
                                    <tr className="h-0">
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="border-r border-gray-200 h-24"></td>
                                        <td className="h-24"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyReportDetailView;
