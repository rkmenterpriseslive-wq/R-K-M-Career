
// utils/hrService.ts

import { getEmployees } from './employeeService';

export interface HRDashboardStats {
    totalEmployees: number;
    newHires: number;
    pendingOnboarding: number;
    attrition: number;
    // New funnel metrics
    selected: number;
    offerReleased: number;
    joined: number;
}

export interface OnboardingCandidate {
    id: string;
    name: string;
    role: string;
    onboardingStatus: 'Pending Submission' | 'Pending Verification' | 'Onboarding Complete';
}

export interface RecentHire {
    id: string;
    name: string;
    role: string;
    joiningDate: string;
}

export const getHRDashboardStats = (): HRDashboardStats => {
    const employees = getEmployees();
    
    // Mock calculation for new hires this month
    const currentMonth = new Date().getMonth();
    const newHires = employees.filter(e => new Date(e.dateOfJoining).getMonth() === currentMonth).length;

    // Mock data for new metrics
    return {
        totalEmployees: 48,
        newHires: 5,
        pendingOnboarding: 3,
        attrition: 2.1, // As a percentage
        selected: 12,
        offerReleased: 8,
        joined: 5,
    };
};

export const getRecentActivities = (): string[] => {
    // In a real app, this would fetch from a database.
    return [];
};

export const getOnboardingPipeline = (): OnboardingCandidate[] => {
    // Mock data for the onboarding pipeline
    return [
        { id: 'CAND001', name: 'Alia Bhatt', role: 'Sales Associate', onboardingStatus: 'Pending Submission' },
        { id: 'CAND002', name: 'Ranbir Kapoor', role: 'Cashier', onboardingStatus: 'Pending Verification' },
        { id: 'CAND003', name: 'Deepika Padukone', role: 'Store Keeper', onboardingStatus: 'Pending Verification' },
    ];
};

export const getRecentHires = (): RecentHire[] => {
    // Mock data for recent hires
     const today = new Date();
    return [
        { id: 'EMP010', name: 'Varun Dhawan', role: 'Sales Associate', joiningDate: new Date(today.setDate(today.getDate() - 2)).toLocaleDateString() },
        { id: 'EMP011', name: 'Kiara Advani', role: 'Cashier', joiningDate: new Date(today.setDate(today.getDate() - 5)).toLocaleDateString() },
        { id: 'EMP012', name: 'Sidharth Malhotra', role: 'Store Manager', joiningDate: new Date(today.setDate(today.getDate() - 10)).toLocaleDateString() },
    ];
};
