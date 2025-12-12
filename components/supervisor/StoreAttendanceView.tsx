
import React, { useState, useMemo, useEffect } from 'react';
import { StoreEmployee, AttendanceRecord } from '../../utils/supervisorService';
import * as supervisorService from '../../utils/supervisorService';
import Button from '../Button';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Week Off';

const StoreAttendanceView: React.FC = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [selectedDate, setSelectedDate] = useState(today);
    const [employees] = useState<StoreEmployee[]>(supervisorService.getStoreEmployees());
    const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const records = supervisorService.getAttendanceForDate(selectedDate);
        const attendanceMap = new Map<string, AttendanceStatus>();
        records.forEach(rec => {
            attendanceMap.set(rec.employeeId, rec.status);
        });
        setAttendance(attendanceMap);
    }, [selectedDate]);

    const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
        setAttendance(prev => new Map(prev).set(employeeId, status));
    };

    const handleSave = () => {
        setIsLoading(true);
        const recordsToSave: AttendanceRecord[] = employees.map(emp => ({
            employeeId: emp.id,
            date: selectedDate,
            status: attendance.get(emp.id) || 'Absent', // Default to absent if not set
        }));
        supervisorService.saveAttendanceForDate(selectedDate, recordsToSave);
        setTimeout(() => { // Simulate API call
            setIsLoading(false);
            alert('Attendance saved successfully!');
        }, 500);
    };

    const handleDownloadMonthlySheet = () => {
        const dateObj = new Date(selectedDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const monthName = dateObj.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Prepare map to hold all data for the month
        const attendanceMap = new Map<string, Record<number, string>>();
        
        employees.forEach(emp => {
            attendanceMap.set(emp.id, {});
        });

        // Fill data for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const records = supervisorService.getAttendanceForDate(dateStr);
            records.forEach(rec => {
                const empRecord = attendanceMap.get(rec.employeeId);
                if (empRecord) {
                    empRecord[day] = rec.status;
                }
            });
        }

        // Build CSV Content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Header Row
        let headerRow = "Employee Name,Role";
        for (let d = 1; d <= daysInMonth; d++) headerRow += `,${d}`;
        headerRow += ",Present,Absent,Leave,Week Off\n";
        csvContent += headerRow;

        // Data Rows
        employees.forEach(emp => {
            let row = `"${emp.name}","${emp.role}"`;
            const empData = attendanceMap.get(emp.id) || {};
            
            let p = 0, a = 0, l = 0, wo = 0;

            for (let d = 1; d <= daysInMonth; d++) {
                const status = empData[d] || '-';
                // Convert full status to short code for CSV readability
                let shortStatus = '-';
                if (status === 'Present') { shortStatus = 'P'; p++; }
                else if (status === 'Absent') { shortStatus = 'A'; a++; }
                else if (status === 'Leave') { shortStatus = 'L'; l++; }
                else if (status === 'Week Off') { shortStatus = 'WO'; wo++; }
                
                row += `,${shortStatus}`;
            }
            row += `,${p},${a},${l},${wo}\n`;
            csvContent += row;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_Sheet_${monthName}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const summary = useMemo(() => {
        const present = Array.from(attendance.values()).filter(s => s === 'Present').length;
        const absent = Array.from(attendance.values()).filter(s => s === 'Absent').length;
        const onLeave = Array.from(attendance.values()).filter(s => s === 'Leave').length;
        const weekOff = Array.from(attendance.values()).filter(s => s === 'Week Off').length;
        return { present, absent, onLeave, weekOff, total: employees.length };
    }, [attendance, employees]);
    
    const getStatusRadioClasses = (status: AttendanceStatus, currentStatus?: AttendanceStatus) => {
        const base = "px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors whitespace-nowrap";
        const selected = status === currentStatus;
        switch(status) {
            case 'Present': return `${base} ${selected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`;
            case 'Absent': return `${base} ${selected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`;
            case 'Leave': return `${base} ${selected ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`;
            case 'Week Off': return `${base} ${selected ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">My Team Attendance</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="attendance-date" className="sr-only">Select Date</label>
                        <input
                            type="date"
                            id="attendance-date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleDownloadMonthlySheet} className="w-full sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200"><h4 className="text-sm text-gray-500">Total Employees</h4><p className="text-2xl font-bold">{summary.total}</p></div>
                <div className="bg-white p-4 rounded-xl border border-gray-200"><h4 className="text-sm text-gray-500">Present</h4><p className="text-2xl font-bold text-green-600">{summary.present}</p></div>
                <div className="bg-white p-4 rounded-xl border border-gray-200"><h4 className="text-sm text-gray-500">Absent</h4><p className="text-2xl font-bold text-red-600">{summary.absent}</p></div>
                <div className="bg-white p-4 rounded-xl border border-gray-200"><h4 className="text-sm text-gray-500">On Leave</h4><p className="text-2xl font-bold text-yellow-600">{summary.onLeave}</p></div>
                <div className="bg-white p-4 rounded-xl border border-gray-200"><h4 className="text-sm text-gray-500">Week Off</h4><p className="text-2xl font-bold text-gray-600">{summary.weekOff}</p></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                                        <div className="text-xs text-gray-500">{emp.role}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap justify-center items-center gap-2">
                                            {(['Present', 'Absent', 'Leave', 'Week Off'] as AttendanceStatus[]).map(status => (
                                                <label key={status} className={getStatusRadioClasses(status, attendance.get(emp.id))}>
                                                    <input
                                                        type="radio"
                                                        name={`status-${emp.id}`}
                                                        value={status}
                                                        checked={attendance.get(emp.id) === status}
                                                        onChange={() => handleStatusChange(emp.id, status)}
                                                        className="sr-only"
                                                    />
                                                    {status}
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                        No employees found assigned to your store.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex justify-end">
                <Button variant="primary" size="lg" onClick={handleSave} loading={isLoading} disabled={employees.length === 0}>
                    Save Attendance
                </Button>
            </div>
        </div>
    );
};

export default StoreAttendanceView;
