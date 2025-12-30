

import React, { useState, useMemo } from 'react';
import { StoreEmployee, AttendanceRecord } from '../../utils/supervisorService';
import * as supervisorService from '../../utils/supervisorService';
import { AdminMenuItem } from '../../types';
import Button from '../Button';

interface SupervisorDashboardViewProps {
    onNavigate: (item: AdminMenuItem) => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; description?: string; }> = ({ title, value, icon, color, description }) => (
    <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-gray-500">{title}</p>
                <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text', 'bg').replace('-600', '-100')}`}>
                {icon}
            </div>
        </div>
        {description && <p className="text-xs text-gray-400 mt-2">{description}</p>}
    </div>
);

const AttendanceProgress: React.FC<{ present: number; absent: number; onLeave: number; total: number }> = ({ present, absent, onLeave, total }) => {
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    const circumference = 2 * Math.PI * 15.9155;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Attendance</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-28 h-28">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path 
                            className="text-green-500" 
                            strokeWidth="3" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={strokeDashoffset} 
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="none" 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">{percentage}%</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2 text-sm w-full">
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>Present</span> <span className="font-bold">{present}</span></div>
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Absent</span> <span className="font-bold">{absent}</span></div>
                    <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>On Leave</span> <span className="font-bold">{onLeave}</span></div>
                </div>
            </div>
        </div>
    );
};

const SupervisorDashboardView: React.FC<SupervisorDashboardViewProps> = ({ onNavigate }) => {
    const [employees] = useState<StoreEmployee[]>(supervisorService.getStoreEmployees());
    const [todaysAttendance] = useState<AttendanceRecord[]>(supervisorService.getAttendanceForDate(new Date().toISOString().slice(0, 10)));

    const summary = useMemo(() => {
        const present = todaysAttendance.filter(rec => rec.status === 'Present').length;
        const absent = todaysAttendance.filter(rec => rec.status === 'Absent').length;
        const onLeave = todaysAttendance.filter(rec => rec.status === 'Leave').length;

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) )); // Monday as start of week
        startOfWeek.setHours(0, 0, 0, 0);

        const newJoiners = employees.filter(e => new Date(e.joiningDate) >= startOfWeek).length;

        return { present, absent, onLeave, total: employees.length, newJoiners };
    }, [employees, todaysAttendance]);
    
    const todaysStatusMap = useMemo(() => {
        const map = new Map<string, string>();
        todaysAttendance.forEach(rec => map.set(rec.employeeId, rec.status));
        return map;
    }, [todaysAttendance]);
    
    const getStatusClasses = (status?: string) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-800';
            case 'Absent': return 'bg-red-100 text-red-800';
            case 'Leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const ICONS = {
        team: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        newJoiner: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
        pending: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        markAttendance: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        viewTeam: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        updateStatus: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
        myProfile: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    };

    const quickLinks = [
        { label: "Mark Daily Attendance", item: AdminMenuItem.StoreAttendance, icon: ICONS.markAttendance },
        { label: "View Team List", item: AdminMenuItem.StoreEmployees, icon: ICONS.viewTeam },
        // FIX: Replaced incorrect AdminMenuItem.PartnerUpdateStatus with AdminMenuItem.PartnerTrackApplicants
        { label: "Update Interview Status", item: AdminMenuItem.PartnerTrackApplicants, icon: ICONS.updateStatus },
        { label: "My Profile", item: AdminMenuItem.MyProfile, icon: ICONS.myProfile }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Team Strength" value={summary.total} icon={ICONS.team} color="text-blue-600" />
                <KpiCard title="New Joiners This Week" value={summary.newJoiners} icon={ICONS.newJoiner} color="text-green-600" />
                <KpiCard title="Pending Actions" value="1" icon={ICONS.pending} color="text-yellow-600" description="Mark Today's Attendance" />
                <AttendanceProgress present={summary.present} absent={summary.absent} onLeave={summary.onLeave} total={summary.total} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Team at a Glance (Today)</h3>
                    <div className="max-h-80 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {employees.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">{emp.name}</p>
                                    <p className="text-xs text-gray-500">{emp.role}</p>
                                </div>
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(todaysStatusMap.get(emp.id))}`}>
                                    {todaysStatusMap.get(emp.id) || 'Not Marked'}
                                </span>
                            </div>
                        ))}
                         {employees.length === 0 && (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm italic">
                                No employees assigned to this store.
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
                    <div className="space-y-3">
                        {quickLinks.map(link => (
                            <Button key={link.item} variant="small-light" onClick={() => onNavigate(link.item)} className="w-full text-left justify-start p-3 !font-medium">
                                {link.icon} {link.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboardView;
