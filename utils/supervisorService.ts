
// utils/supervisorService.ts

export interface StoreEmployee {
  id: string;
  name: string;
  role: string;
  phone: string;
  joiningDate: string;
  status: 'Active' | 'On Leave';
}

export interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave' | 'Week Off';
}

const MOCK_STORE_EMPLOYEES: StoreEmployee[] = [
    { id: 'SE001', name: 'Rohan Sharma', role: 'Sales Associate', phone: '9876500001', joiningDate: '2023-01-15', status: 'Active' },
    { id: 'SE002', name: 'Priya Patel', role: 'Cashier', phone: '9876500002', joiningDate: '2023-03-10', status: 'Active' },
    { id: 'SE003', name: 'Amit Singh', role: 'Store Keeper', phone: '9876500003', joiningDate: '2023-06-20', status: 'Active' },
    { id: 'SE004', name: 'Kavita Das', role: 'Helper', phone: '9876500004', joiningDate: '2023-08-01', status: 'On Leave' },
];

const ATTENDANCE_KEY = 'rkm_store_attendance';

export const getStoreEmployees = (): StoreEmployee[] => {
    // In a real app, this would fetch from a database based on the supervisor's assigned store
    return MOCK_STORE_EMPLOYEES;
};

export const getAttendanceForDate = (date: string): AttendanceRecord[] => {
    try {
        const allAttendance = JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '{}');
        return allAttendance[date] || [];
    } catch {
        return [];
    }
};

export const saveAttendanceForDate = (date: string, records: AttendanceRecord[]) => {
    const allAttendance = JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '{}');
    allAttendance[date] = records;
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(allAttendance));
};
