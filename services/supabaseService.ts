

// services/firestoreService.ts
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, updateDoc, query, onSnapshot, orderBy, setDoc } from 'firebase/firestore';
import { firestoreDb } from './firebaseService'; // Import the Firestore instance
import { Job, UserType } from '../types';

const jobsCollection = collection(firestoreDb, 'jobs');
const usersCollection = collection(firestoreDb, 'users');
const candidatesCollection = collection(firestoreDb, 'candidates');
const complaintsCollection = collection(firestoreDb, 'complaints');
const partnerRequirementsCollection = collection(firestoreDb, 'partner_requirements');
const attendanceCollection = collection(firestoreDb, 'attendance');
const settingsDocRef = doc(firestoreDb, 'settings', 'appSettings'); // Assuming a single settings document

// --- Jobs ---
export const getJobs = async (): Promise<Job[]> => {
  try {
    const q = query(jobsCollection, orderBy('postedDate', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const jobsList: Job[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      return jobsList;
    }
    return [];
  } catch (error) {
    console.error("Error fetching jobs from Firestore:", error);
    return [];
  }
};

export const createJob = async (job: Omit<Job, 'id' | 'postedDate'>): Promise<Job | null> => {
  try {
    const newJobData = {
      ...job,
      postedDate: new Date().toISOString(),
    };
    const docRef = await addDoc(jobsCollection, newJobData); // Use addDoc for auto-generated ID
    
    const createdJob: Job = {
      id: docRef.id,
      ...newJobData,
    };
    return createdJob;

  } catch (error) {
    console.error("Error creating job in Firestore:", error);
    return null;
  }
};

export const deleteJob = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(jobsCollection, id));
    } catch (error) {
        console.error(`Error deleting job ${id} from Firestore:`, error);
        throw error;
    }
};

// --- Users (Profile fetching remains on-demand for single user, but also used by real-time listener) ---
export const createUserProfile = async (uid: string, email: string | null, userType: UserType, fullName?: string, phone?: string): Promise<void> => {
    const userDocRef = doc(usersCollection, uid);
    const isCandidate = userType === UserType.CANDIDATE;
    await setDoc(userDocRef, {
        email,
        userType,
        fullName: fullName || null,
        phone: phone || null,
        profile_complete: !isCandidate, // false for new candidates, true for all others
    });
};

export const getUserProfile = async (uid: string): Promise<{ userType: UserType, fullName?: string, phone?: string, profile_complete?: boolean, [key: string]: any } | null> => {
    const userDocRef = doc(usersCollection, uid);
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
        return snapshot.data() as { userType: UserType, fullName?: string, phone?: string, profile_complete?: boolean, [key: string]: any };
    }
    return null;
};

export const updateUserProfile = async (uid: string, data: any): Promise<void> => {
    const userDocRef = doc(usersCollection, uid);
    await updateDoc(userDocRef, data);
};

// --- REAL-TIME LISTENERS ---

// New real-time listener for team members
export const onTeamMembersChange = (callback: (teamMembers: any[]) => void) => {
    const q = query(usersCollection, orderBy('fullName')); // Order for consistent display
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const teamTypes = [UserType.ADMIN, UserType.HR, UserType.TEAM, UserType.TEAMLEAD];
        const teamMembers = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as any)
            .filter(user => teamTypes.includes(user.userType));
        callback(teamMembers);
    });
    return unsubscribe;
};

// New real-time listener for candidates
export const onCandidatesChange = (callback: (candidates: any[]) => void) => {
    const q = query(candidatesCollection, orderBy('appliedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
    return unsubscribe;
};

// New real-time listener for complaints
export const onComplaintsChange = (callback: (complaints: any[]) => void) => {
    const q = query(complaintsCollection, orderBy('submittedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
    return unsubscribe;
};

// New real-time listener for requirements
export const onRequirementsChange = (callback: (requirements: any[]) => void) => {
    const q = query(partnerRequirementsCollection, orderBy('postedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
    return unsubscribe;
};

// --- SYNCHRONOUS DATA PROCESSORS ---

export const processTeamPerformanceStats = (allMembers: any[]): any[] => {
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

// --- LEGACY/ON-DEMAND FUNCTIONS (Now use Firestore) ---

export const getAllTeamMembers = async (): Promise<any[]> => {
    try {
        const snapshot = await getDocs(usersCollection);
        if (!snapshot.empty) {
            const teamTypes = [UserType.ADMIN, UserType.HR, UserType.TEAM, UserType.TEAMLEAD];
            const teamMembers = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }) as any)
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
        const snapshot = await getDocs(candidatesCollection);
        if (!snapshot.empty) {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
};

export const createCandidate = async (candidateData: any): Promise<any> => {
    try {
        const docRef = await addDoc(candidatesCollection, { ...candidateData, createdAt: new Date().toISOString() });
        return { id: docRef.id, ...candidateData, createdAt: new Date().toISOString() };
    } catch (error) {
        console.error("Error creating candidate:", error);
        throw error;
    }
};

export const updateCandidate = async (id: string, updates: any): Promise<void> => {
    try {
        await updateDoc(doc(candidatesCollection, id), updates);
    } catch (error) {
        console.error(`Error updating candidate ${id}:`, error);
        throw error;
    }
};

export const deleteCandidate = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(candidatesCollection, id));
    } catch (error) {
        console.error(`Error deleting candidate ${id} from Firestore:`, error);
        throw error;
    }
};

export const getComplaints = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(complaintsCollection);
    if (!snapshot.empty) {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return [];
  }
};

export const getPartnerRequirements = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(partnerRequirementsCollection);
    if (!snapshot.empty) {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching partner requirements:", error);
    return [];
  }
};

export const createPartnerRequirement = async (req: any): Promise<any> => {
    try {
        const docRef = await addDoc(partnerRequirementsCollection, { ...req, postedDate: new Date().toISOString() });
        return { id: docRef.id, ...req, postedDate: new Date().toISOString() };
    } catch (error) {
        console.error("Error creating partner requirement:", error);
        throw error;
    }
};

export const updatePartnerRequirement = async (id: string, updates: any): Promise<void> => {
    try {
        await updateDoc(doc(partnerRequirementsCollection, id), updates);
    } catch (error) {
        console.error("Error updating partner requirement:", error);
        throw error;
    }
};

export const getAttendanceData = async (): Promise<any[]> => {
    try {
        const snapshot = await getDocs(attendanceCollection);
        if (!snapshot.empty) {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return [];
    }
};

export const getSettings = async (): Promise<any | null> => {
    try {
        const snapshot = await getDoc(settingsDocRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

export const updateSettings = async (settingsUpdate: any): Promise<void> => {
    try {
        // Use setDoc with merge:true to update or create the document
        await setDoc(settingsDocRef, settingsUpdate, { merge: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};