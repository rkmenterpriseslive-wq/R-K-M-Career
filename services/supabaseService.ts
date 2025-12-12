
import { ref, get, set, push, remove, update, onValue } from 'firebase/database';
import { db } from './firebaseService';
import { Job, UserType, TeamMemberPerformance } from '../types';

const jobsRef = ref(db, 'jobs');

// --- Jobs (Remains as-is, not requested for real-time) ---
export const getJobs = async (): Promise<Job[]> => {
  try {
    const snapshot = await get(jobsRef);
    if (snapshot.exists()) {
      const jobsData = snapshot.val();
      const jobsList: Job[] = Object.keys(jobsData).map(key => ({
        id: key,
        ...jobsData[key]
      }));
      jobsList.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
      return jobsList;
    }
    return [];
  } catch (error) {
    console.error("Error fetching jobs from Firebase:", error);
    return [];
  }
};

export const createJob = async (job: Omit<Job, 'id' | 'postedDate'>): Promise<Job | null> => {
  try {
    const newJobRef = push(jobsRef);
    
    // Create a copy and remove undefined fields because Firebase set() does not support them
    const cleanedJob = JSON.parse(JSON.stringify(job));

    const newJobData = {
      ...cleanedJob,
      postedDate: new Date().toISOString(),
    };
    await set(newJobRef, newJobData);
    
    const newJobId = newJobRef.key;
    if (!newJobId) {
        console.error("Failed to get new job ID from Firebase.");
        return null;
    }

    const createdJob: Job = {
      id: newJobId,
      ...newJobData,
    };
    return createdJob;

  } catch (error) {
    console.error("Error creating job in Firebase:", error);
    return null;
  }
};

export const deleteJob = async (id: string): Promise<void> => {
    try {
        const jobToDeleteRef = ref(db, `jobs/${id}`);
        await remove(jobToDeleteRef);
    } catch (error) {
        console.error(`Error deleting job ${id} from Firebase:`, error);
        throw error;
    }
};

// --- Users (Profile fetching remains on-demand) ---
export const createUserProfile = async (uid: string, email: string, userType: UserType, fullName?: string, phone?: string): Promise<void> => {
    const userRef = ref(db, `users/${uid}`);
    const isCandidate = userType === UserType.CANDIDATE;
    await set(userRef, {
        email,
        userType,
        fullName: fullName || null,
        phone: phone || null,
        profile_complete: !isCandidate, // false for new candidates, true for all others
    });
};

export const getUserProfile = async (uid: string): Promise<{ userType: UserType, fullName?: string, phone?: string, profile_complete?: boolean, [key: string]: any } | null> => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        return snapshot.val();
    }
    return null;
};

export const updateUserProfile = async (uid: string, data: any): Promise<void> => {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, data);
};

// --- REAL-TIME LISTENERS ---

// New real-time listener for team members
export const onTeamMembersChange = (callback: (teamMembers: any[]) => void) => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const teamTypes = [UserType.ADMIN, UserType.HR, UserType.TEAM, UserType.TEAMLEAD];
            const teamMembers = Object.keys(usersData)
                .map(key => ({ id: key, ...usersData[key] }))
                .filter(user => teamTypes.includes(user.userType));
            callback(teamMembers);
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};

// New real-time listener for candidates
export const onCandidatesChange = (callback: (candidates: any[]) => void) => {
    const candidatesRef = ref(db, 'candidates');
    const unsubscribe = onValue(candidatesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            callback(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};

// New real-time listener for complaints
export const onComplaintsChange = (callback: (complaints: any[]) => void) => {
    const complaintsRef = ref(db, 'complaints');
    const unsubscribe = onValue(complaintsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            callback(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};

// New real-time listener for requirements
export const onRequirementsChange = (callback: (requirements: any[]) => void) => {
    const requirementsRef = ref(db, 'partner_requirements');
    const unsubscribe = onValue(requirementsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            callback(Object.keys(data).map(key => ({ id: key, ...data[key] })));
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};

// --- SYNCHRONOUS DATA PROCESSORS ---

// This function processes a raw list of team members into the hierarchical performance structure.
export const processTeamPerformanceStats = (allMembers: any[]): TeamMemberPerformance[] => {
    try {
        const relevantMembers = allMembers.filter(member => 
            member.userType !== UserType.ADMIN && member.userType !== UserType.HR
        );

        const allByName: Record<string, any> = {};
        relevantMembers.forEach(m => { if(m.fullName) allByName[m.fullName] = m; });
        
        const rootNodes: any[] = [];
        const childrenMap: Record<string, any[]> = {}; 

        relevantMembers.forEach(member => {
            const managerName = member.reportingManager;
            const isRoot = !managerName || managerName === 'Admin' || !allByName[managerName];

            if (isRoot) {
                rootNodes.push(member);
            } else {
                if (!childrenMap[managerName]) childrenMap[managerName] = [];
                childrenMap[managerName].push(member);
            }
        });

        const sortedFlatList: any[] = [];
        
        const traverse = (node: any, level: number) => {
            sortedFlatList.push({ ...node, level });
            const kids = childrenMap[node.fullName] || [];
            kids.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
            kids.forEach(kid => traverse(kid, level + 1));
        };

        rootNodes.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        rootNodes.forEach(node => traverse(node, 0));

        // In a real-time app, these stats would be calculated based on candidate data.
        // For now, returning structure with placeholder stats.
        return sortedFlatList.map(member => ({
            id: member.id,
            teamMember: member.fullName || member.email || 'Unknown User',
            role: member.role || (member.userType === UserType.TEAMLEAD ? 'Team Lead' : 'Team Member'),
            isDownline: member.level > 0, 
            total: 0, selected: 0, pending: 0, rejected: 0, quit: 0, successRate: 0
        }));
    } catch (error) {
        console.error("Error processing team performance stats:", error);
        return [];
    }
};

// --- LEGACY/ON-DEMAND FUNCTIONS (Can be deprecated or used for specific cases) ---
// Note: These are now superseded by the real-time listeners for the main dashboard.
// They are kept for other potential uses.

export const getAllTeamMembers = async (): Promise<any[]> => {
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const teamTypes = [UserType.ADMIN, UserType.HR, UserType.TEAM, UserType.TEAMLEAD];
            const teamMembers = Object.keys(usersData)
                .map(key => ({ id: key, ...usersData[key] }))
                .filter(user => teamTypes.includes(user.userType));
            return teamMembers;
        }
        return [];
    } catch (error) {
        console.error("Error fetching team members:", error);
        return [];
    }
};

export const getCandidates = async (): Promise<any[]> => {
    try {
        const snapshot = await get(ref(db, 'candidates'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
};

export const createCandidate = async (candidateData: any): Promise<any> => {
    try {
        const newRef = push(ref(db, 'candidates'));
        const payload = { ...candidateData, id: newRef.key, createdAt: new Date().toISOString() };
        await set(newRef, payload);
        return payload;
    } catch (error) {
        console.error("Error creating candidate:", error);
        throw error;
    }
};

export const updateCandidate = async (id: string, updates: any): Promise<void> => {
    try {
        await update(ref(db, `candidates/${id}`), updates);
    } catch (error) {
        console.error(`Error updating candidate ${id}:`, error);
        throw error;
    }
};

export const getComplaints = async (): Promise<any[]> => {
  try {
    const snapshot = await get(ref(db, 'complaints'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return [];
  }
};

export const getPartnerRequirements = async (): Promise<any[]> => {
  try {
    const snapshot = await get(ref(db, 'partner_requirements'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching partner requirements:", error);
    return [];
  }
};

export const createPartnerRequirement = async (req: any): Promise<any> => {
    try {
        const newRef = push(ref(db, 'partner_requirements'));
        const payload = { ...req, id: newRef.key, postedDate: new Date().toISOString() };
        await set(newRef, payload);
        return payload;
    } catch (error) {
        console.error("Error creating partner requirement:", error);
        throw error;
    }
};

export const updatePartnerRequirement = async (id: string, updates: any): Promise<void> => {
    try {
        await update(ref(db, `partner_requirements/${id}`), updates);
    } catch (error) {
        console.error("Error updating partner requirement:", error);
        throw error;
    }
};

export const getAttendanceData = async (): Promise<any[]> => {
    try {
        const snapshot = await get(ref(db, 'attendance'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return [];
    }
};

export const getSettings = async (): Promise<any | null> => {
    try {
        const settingsRef = ref(db, 'settings');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

export const updateSettings = async (settingsUpdate: any): Promise<void> => {
    try {
        const settingsRef = ref(db, 'settings');
        await update(settingsRef, settingsUpdate);
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};
