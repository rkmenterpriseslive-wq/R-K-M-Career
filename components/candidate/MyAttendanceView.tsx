
import React, { useState, useMemo, useEffect } from 'react';
import { AppUser, LeaveApplication } from '../../types';
import Button from '../Button';
import Input from '../Input';

type DayStatus = 'Present' | 'Absent' | 'Holiday' | 'Weekend' | 'Future' | 'Leave';

interface Day {
    date: number;
    status: DayStatus;
}

interface MyAttendanceViewProps {
    currentUser: AppUser | null;
}

const MyAttendanceView: React.FC<MyAttendanceViewProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'leave'>('calendar');
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    
    // State for leave application
    const [leaveData, setLeaveData] = useState({
        leaveType: 'Casual Leave' as LeaveApplication['leaveType'],
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [leaveHistory, setLeaveHistory] = useState<LeaveApplication[]>([]);
    const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

    const generateCalendarDays = (date: Date): Day[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        
        let calendarDays: Day[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarDays.push({ date: 0, status: 'Future' });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const weekDay = new Date(year, month, day).getDay();
            let status: DayStatus = 'Present';
            if (weekDay === 0 || weekDay === 6) status = 'Weekend';
            if (day === 10 || day === 26) status = 'Holiday';
            if (day === 5 || day === 18) status = 'Absent';
            if (day === 8 || day === 19) status = 'Leave';
            
            if (new Date(year, month, day) > new Date()) status = 'Future';

            calendarDays.push({ date: day, status });
        }
        return calendarDays;
    };

    const calendarDays = useMemo(() => generateCalendarDays(currentMonthDate), [currentMonthDate]);
    
    const summary = useMemo(() => {
        const present = calendarDays.filter(d => d.status === 'Present').length;
        const absent = calendarDays.filter(d => d.status === 'Absent').length;
        const leave = calendarDays.filter(d => d.status === 'Leave').length;
        const totalWorkingDays = present + absent;
        return { present, absent, leave, totalWorkingDays };
    }, [calendarDays]);

    const changeMonth = (offset: number) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };
    
    const getDayClasses = (status: DayStatus) => {
        switch(status) {
            case 'Present': return 'bg-green-100 border-green-200 text-green-800';
            case 'Absent': return 'bg-red-100 border-red-200 text-red-800';
            case 'Holiday': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
            case 'Leave': return 'bg-purple-100 border-purple-200 text-purple-800';
            case 'Weekend': return 'bg-gray-100 text-gray-400';
            default: return 'bg-white';
        }
    };
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handleLeaveFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setLeaveData({ ...leaveData, [e.target.name]: e.target.value });
    };

    const handleLeaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
            alert('Please fill all fields.');
            return;
        }
        setIsSubmittingLeave(true);
        // Simulate API call
        setTimeout(() => {
            const newApplication: LeaveApplication = {
                id: `L${Date.now()}`,
                userId: currentUser.uid,
                ...leaveData,
                status: 'Pending',
                submittedDate: new Date().toISOString()
            };
            setLeaveHistory(prev => [newApplication, ...prev]);
            setLeaveData({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
            setIsSubmittingLeave(false);
            alert('Leave application submitted successfully!');
        }, 1000);
    };
    
    const getStatusClasses = (status: LeaveApplication['status']) => {
        switch(status) {
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">My Attendance</h2>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('calendar')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        My Calendar
                    </button>
                    <button onClick={() => setActiveTab('leave')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'leave' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Apply Leave
                    </button>
                </nav>
            </div>

            {activeTab === 'calendar' ? (
                <div className="space-y-6 animate-fade-in">
                    <p className="text-gray-600 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        Your attendance is marked by your supervisor. This is a read-only view of your monthly attendance record.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-500">Total Working Days</h4>
                            <p className="text-3xl font-bold text-gray-900">{summary.totalWorkingDays}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-500">Present</h4>
                            <p className="text-3xl font-bold text-green-600">{summary.present}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-500">Absent</h4>
                            <p className="text-3xl font-bold text-red-600">{summary.absent}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                            <h3 className="text-lg font-semibold">{currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 mb-2">
                            {weekDays.map(day => <div key={day}>{day}</div>)}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((day, index) => (
                                <div key={index} className={`h-16 p-2 border rounded-lg flex flex-col items-center justify-center ${getDayClasses(day.status)}`}>
                                    {day.date > 0 && <span className="text-lg font-bold">{day.date}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Application Form</h3>
                        <form onSubmit={handleLeaveSubmit} className="space-y-4">
                             <div>
                                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                <select id="leaveType" name="leaveType" value={leaveData.leaveType} onChange={handleLeaveFormChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required>
                                    <option>Casual Leave</option>
                                    <option>Sick Leave</option>
                                    <option>Earned Leave</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input id="startDate" name="startDate" label="Start Date" type="date" value={leaveData.startDate} onChange={handleLeaveFormChange} required />
                                <Input id="endDate" name="endDate" label="End Date" type="date" value={leaveData.endDate} onChange={handleLeaveFormChange} required />
                            </div>
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea id="reason" name="reason" rows={4} value={leaveData.reason} onChange={handleLeaveFormChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required></textarea>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" variant="primary" loading={isSubmittingLeave}>Submit Application</Button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave History & Status</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaveHistory.length > 0 ? leaveHistory.map(leave => (
                                        <tr key={leave.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.leaveType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.startDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.endDate}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 truncate" style={{ maxWidth: '200px' }}>{leave.reason}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(leave.status)}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="text-center py-10 text-gray-500">You have not applied for any leave yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAttendanceView;
