
import React, { useState, useEffect } from 'react';
import Button from '../Button';
import { getAttendanceData } from '../../services/supabaseService';

interface AttendanceRow {
    id: string;
    candidateName: string;
    vendor: string;
    role: string;
    baseCommission: number | null; // null if not applicable (e.g., fixed salary roles)
    daysPresent: number;
    lastSaved?: string;
}

const AttendanceView: React.FC = () => {
    // Default to current month (e.g., "2023-10")
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Calculate total days in the selected month
    const totalDaysInMonth = React.useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    }, [selectedMonth]);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                // Fetch real attendance data from service
                // For now, this service might return empty or raw data which needs mapping
                const data = await getAttendanceData();
                // If data is empty (no backend records yet), we initialize with empty array
                // In a real scenario, you'd merge this with the list of active candidates for the month
                setAttendanceData(data as AttendanceRow[]);
            } catch (e) {
                console.error("Failed to fetch attendance", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [selectedMonth]);

    const handleAttendanceChange = (id: string, value: string) => {
        const days = parseInt(value, 10);
        // Validate input (0 to totalDaysInMonth)
        if (!isNaN(days) && days >= 0 && days <= totalDaysInMonth) {
            setAttendanceData(prev => prev.map(row => 
                row.id === id ? { ...row, daysPresent: days } : row
            ));
        } else if (value === '') {
             setAttendanceData(prev => prev.map(row => 
                row.id === id ? { ...row, daysPresent: 0 } : row
            ));
        }
    };

    const handleSave = (id: string) => {
        // In a real app, this would be an API call
        console.log(`Saving attendance for ID: ${id}`);
        alert('Attendance saved successfully!');
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const calculatePayable = (base: number | null, present: number) => {
        if (base === null) return '-';
        // Simple proration logic: (Base / Total Days) * Present Days
        const payable = (base / totalDaysInMonth) * present;
        return formatCurrency(Math.round(payable));
    };

    const getVendorBadgeStyle = (vendor: string) => {
        if (vendor === 'Direct') return 'bg-blue-100 text-blue-800';
        return 'bg-indigo-100 text-indigo-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Commission Attendance</h2>
                    <p className="text-gray-600 mt-1">Manage attendance and track commission payouts.</p>
                </div>
                
                <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
                    <label htmlFor="month-picker" className="block text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Select Month</label>
                    <input 
                        type="month" 
                        id="month-picker"
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Base Commission</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Payable Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceData.length > 0 ? attendanceData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{row.candidateName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${getVendorBadgeStyle(row.vendor)}`}>
                                            {row.vendor}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {row.role}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                        {row.baseCommission !== null ? formatCurrency(row.baseCommission) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center">
                                            <div className="relative flex items-center">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max={totalDaysInMonth}
                                                    value={row.daysPresent}
                                                    onChange={(e) => handleAttendanceChange(row.id, e.target.value)}
                                                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                                <span className="inline-flex items-center px-3 py-1 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                    / {totalDaysInMonth}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`text-lg font-bold ${row.baseCommission ? 'text-green-600' : 'text-gray-400'}`}>
                                            {calculatePayable(row.baseCommission, row.daysPresent)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Button variant="small-light" size="sm" onClick={() => handleSave(row.id)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-100">
                                            Save
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {loading ? "Loading attendance records..." : "No attendance records found for this month."}
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

export default AttendanceView;
