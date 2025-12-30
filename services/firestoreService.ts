
// services/firestoreService.ts
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, updateDoc, query, onSnapshot, orderBy, setDoc, where, limit } from 'firebase/firestore';
import { firestoreDb, createCandidateAuthUser } from './firebaseService'; // Import the Firestore instance and auth helper
import { Job, UserType, Shift, DemoRequest, Ticket, Resignation, StoreSupervisor, PartnerRequirement } from '../types'; // Import StoreSupervisor

const jobsCollection = collection(firestoreDb, 'jobs');
const usersCollection = collection(firestoreDb, 'users');
const candidatesCollection = collection(firestoreDb, 'candidates');
const complaintsCollection = collection(firestoreDb, 'complaints');
const partnerRequirementsCollection = collection(firestoreDb, 'partner_requirements');
const attendanceCollection = collection(firestoreDb, 'attendance');
const shiftsCollection = collection(firestoreDb, 'shifts');
const demoRequestsCollection = collection(firestoreDb, 'demo_requests');
const resignationsCollection = collection(firestoreDb, 'resignations');
const storeSupervisorsCollection = collection(firestoreDb, 'store_supervisors'); // New collection for Store Supervisors
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
    throw error;
  }
};

export const onJobsChange = (callback: (jobs: Job[]) => void, onError: (error: any) => void) => {
    const q = query(jobsCollection, orderBy('postedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobsList: Job[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Job[];
        callback(jobsList);
    }, onError);
    return unsubscribe;
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

export const updateJob = async (id: string, updates: Partial<Job>): Promise<void> => {
    try {
        await updateDoc(doc(jobsCollection, id), updates);
    } catch (error) {
        console.error(`Error updating job ${id} from Firestore:`, error);
        throw error;
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

export const findUserByPhone = async (phone: string): Promise<{ email: string } | null> => {
    try {
        const q = query(usersCollection, where('phone', '==', phone), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            if (userData.email) {
                return { email: userData.email };
            }
        }
        return null;
    } catch (error) {
        console.error("Error finding user by phone:", error);
        return null;
    }
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
export const onComplaintsChange = (callback: (complaints: Ticket[]) => void) => {
    const q = query(complaintsCollection, orderBy('submittedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[];
        callback(data);
    });
    return unsubscribe;
};

// New real-time listener for requirements
export const onRequirementsChange = (callback: (requirements: any[]) => void, onError: (error: any) => void) => {
    const q = query(partnerRequirementsCollection, orderBy('postedDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    }, onError);
    return unsubscribe;
};

export const onDemoRequestsChange = (callback: (requests: DemoRequest[]) => void) => {
    const q = query(demoRequestsCollection, orderBy('requestDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DemoRequest[];
        callback(data);
    });
    return unsubscribe;
};

export const onUserResignationChange = (userId: string, callback: (resignations: Resignation[]) => void) => {
    const q = query(resignationsCollection, where('employeeId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resignation[];
        callback(data);
    });
    return unsubscribe;
};

// New real-time listener for store supervisors
export const onStoreSupervisorsChange = (callback: (supervisors: StoreSupervisor[]) => void, partnerId?: string) => {
    let q;
    if (partnerId) {
        q = query(storeSupervisorsCollection, where('partnerId', '==', partnerId), orderBy('name'));
    } else {
        q = query(storeSupervisorsCollection, orderBy('name'));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoreSupervisor[];
        callback(data);
    });
    return unsubscribe;
};


// --- Complaints (Help Center Tickets) ---
export const createComplaint = async (ticketData: Omit<Ticket, 'id' | 'submittedDate' | 'status'>): Promise<void> => {
    try {
        await addDoc(complaintsCollection, {
            ...ticketData,
            submittedDate: new Date().toISOString(),
            status: 'Open',
        });
    } catch (error) {
        console.error("Error creating complaint:", error);
        throw error;
    }
};

export const updateComplaint = async (id: string, updates: Partial<Omit<Ticket, 'id'>>): Promise<void> => {
    try {
        const complaintDocRef = doc(complaintsCollection, id);
        await updateDoc(complaintDocRef, updates);
    } catch (error) {
        console.error(`Error updating complaint ${id}:`, error);
        throw error;
    }
};

// --- Resignations ---
export const submitResignation = async (data: Omit<Resignation, 'id' | 'submittedDate' | 'status'>): Promise<void> => {
    try {
        await addDoc(resignationsCollection, {
            ...data,
            submittedDate: new Date().toISOString(),
            status: 'Pending HR Approval',
        });
    } catch (error) {
        console.error("Error submitting resignation:", error);
        throw error;
    }
};

// --- SYNCHRONOUS DATA PROCESSORS ---

export const processTeamPerformanceStats = (allMembers: any[], allCandidates: any[]): any[] => {
    try {
        const relevantMembers = allMembers.filter(member => 
            member.userType !== UserType.ADMIN && member.userType !== UserType.HR
        );

        // Group candidates by recruiter for efficient lookup
        const candidatesByRecruiter: Record<string, any[]> = {};
        allCandidates.forEach(candidate => {
            const recruiterName = candidate.recruiter;
            if (recruiterName) {
                if (!candidatesByRecruiter[recruiterName]) {
                    candidatesByRecruiter[recruiterName] = [];
                }
                candidatesByRecruiter[recruiterName].push(candidate);
            }
        });

        // Calculate stats for each member
        const membersWithStats = relevantMembers.map(member => {
            const memberName = member.fullName;
            const memberCandidates = memberName ? (candidatesByRecruiter[memberName] || []) : [];

            let selected = 0;
            let rejected = 0;
            let quit = 0;

            memberCandidates.forEach(c => {
                const status = c.status || '';
                const stage = c.stage || '';
                
                if (stage === 'Selected' || stage === 'Joined' || status === 'Joined') {
                    selected++;
                } else if (status === 'Rejected') {
                    rejected++;
                } else if (status === 'Quit') {
                    quit++;
                }
            });

            const total = memberCandidates.length;
            const pending = total - (selected + rejected + quit);
            const successRate = total > 0 ? (selected / total) * 100 : 0;

            return {
                ...member,
                total,
                selected,
                pending: pending > 0 ? pending : 0, // Ensure pending is not negative
                rejected,
                quit,
                successRate,
            };
        });

        // Now, apply hierarchy and aggregate stats up the chain
        const allByName: Record<string, any> = {};
        membersWithStats.forEach(m => { if(m.fullName) allByName[m.fullName] = m; });
        
        const rootNodes: any[] = [];
        const childrenMap: Record<string, any[]> = {}; 

        membersWithStats.forEach(member => {
            const managerName = member.reportingManager;
            const isRoot = !managerName || managerName === 'Admin' || !allByName[managerName];

            if (isRoot) {
                rootNodes.push(member);
            } else {
                if (!childrenMap[managerName]) childrenMap[managerName] = [];
                childrenMap[managerName].push(member);
            }
        });
        
        // Post-order traversal to aggregate stats from children to parents
        const aggregateStats = (node: any) => {
            const children = childrenMap[node.fullName] || [];
            children.forEach(child => {
                aggregateStats(child); // Recursively aggregate from the bottom up
                node.total += child.total;
                node.selected += child.selected;
                node.pending += child.pending;
                node.rejected += child.rejected;
                node.quit += child.quit;
            });
            // Recalculate success rate for the manager including their team's performance
            node.successRate = node.total > 0 ? (node.selected / node.total) * 100 : 0;
        };
        
        rootNodes.forEach(node => aggregateStats(node));

        // Now, flatten the tree for rendering
        const sortedFlatList: any[] = [];
        const traverseForFlattening = (node: any, level: number) => {
            sortedFlatList.push({ ...node, level });
            const kids = childrenMap[node.fullName] || [];
            kids.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
            kids.forEach(kid => traverseForFlattening(kid, level + 1));
        };

        rootNodes.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        rootNodes.forEach(node => traverseForFlattening(node, 0));

        // Final mapping to the TeamMemberPerformance structure
        return sortedFlatList.map(member => ({
            ...member, // This already contains all AppUser fields and calculated stats
            id: member.id,
            teamMember: member.fullName || member.email || 'Unknown User',
            role: member.role || (member.userType === UserType.TEAMLEAD ? 'Team Lead' : 'Team Member'),
            isDownline: member.level > 0,
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
        // Step 1: Create Auth user and User Profile with default password
        const uid = await createCandidateAuthUser(candidateData.email, 'password', {
            email: candidateData.email,
            userType: UserType.CANDIDATE,
            fullName: candidateData.name,
            phone: candidateData.phone,
        });

        // Step 2: Create Candidate document with auth UID
        const docRef = await addDoc(candidatesCollection, {
            ...candidateData,
            userId: uid, // Link to the created auth user
            createdAt: new Date().toISOString()
        });
        
        return { id: docRef.id, ...candidateData, createdAt: new Date().toISOString(), updated: false };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.warn(`Auth user for ${candidateData.email} already exists. Finding user to update/create candidate document.`);
            
            const userQuery = query(collection(firestoreDb, 'users'), where('email', '==', candidateData.email), limit(1));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                const userId = userDoc.id;

                // Query by phone number to find existing candidate record, as it's the more reliable unique identifier from the form.
                const candidateQuery = query(candidatesCollection, where('phone', '==', candidateData.phone), limit(1));
                const candidateSnapshot = await getDocs(candidateQuery);

                if (!candidateSnapshot.empty) {
                    // Candidate doc exists, update it for the new lineup context.
                    const candidateDoc = candidateSnapshot.docs[0];
                    console.log(`Found existing candidate ${candidateDoc.id}. Updating for new lineup.`);
                    await updateDoc(doc(candidatesCollection, candidateDoc.id), {
                        ...candidateData,
                        userId: userId, // Ensure userId is linked/updated
                        appliedDate: new Date().toISOString(), // Update application date for the new lineup context
                    });
                    return { id: candidateDoc.id, ...candidateData, updated: true };
                } else {
                    // No candidate doc, but user exists. Create a new candidate doc for this user.
                    console.log(`User profile found for ${candidateData.email}, but no candidate document. Creating one.`);
                    const docRef = await addDoc(candidatesCollection, {
                        ...candidateData,
                        userId: userId, // Link to the existing auth user
                        createdAt: new Date().toISOString()
                    });
                    // This is also an "update" in the context of the UI message.
                    return { id: docRef.id, ...candidateData, createdAt: new Date().toISOString(), updated: true };
                }
            } else {
                console.error(`Orphaned auth user found for ${candidateData.email}. Cannot proceed.`);
                throw new Error('A user with this mobile number exists but their profile is critically incomplete. Please contact support.');
            }
        }
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

export const submitApplication = async (applicationData: any): Promise<void> => {
    try {
        await addDoc(candidatesCollection, {
            ...applicationData,
            appliedDate: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error submitting application to Firestore:", error);
        throw error;
    }
};

// FIX: Updated getPartnerRequirements to use client-side sorting to avoid composite index.
export const getPartnerRequirements = async (partnerId?: string): Promise<PartnerRequirement[]> => {
  try {
    let q;
    // If a partnerId is provided, filter by it. This query uses a single-field index.
    if (partnerId) {
        q = query(partnerRequirementsCollection, where('partnerId', '==', partnerId));
    } else {
        // If no partnerId, fetch all requirements, ordered by date. This also uses a single-field index.
        q = query(partnerRequirementsCollection, orderBy('postedDate', 'desc'));
    }
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PartnerRequirement[];

    // If we filtered by partnerId, the query was not ordered, so we sort here on the client-side.
    if (partnerId) {
        data.sort((a, b) => {
            // Ensure postedDate exists and is valid before comparing
            const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
            const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
            return dateB - dateA; // Descending order (newest first)
        });
    }
    
    return data;

  } catch (error) {
    console.error("Error fetching partner requirements:", error);
    throw error;
  }
};

export const createPartnerRequirement = async (req: any): Promise<any> => {
    try {
        const docData = { 
            ...req, 
            postedDate: new Date().toISOString(),
            submissionStatus: 'Pending Review' as const
        };
        const docRef = await addDoc(partnerRequirementsCollection, docData);
        return { id: docRef.id, ...docData };
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

export const deletePartnerRequirement = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(partnerRequirementsCollection, id));
    } catch (error) {
        console.error(`Error deleting partner requirement ${id} from Firestore:`, error);
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

// --- Shifts (Clock In/Out) ---
export const getActiveShift = async (userId: string): Promise<Shift | null> => {
    try {
        const q = query(
            shiftsCollection,
            where('userId', '==', userId),
            where('status', '==', 'active'),
            orderBy('startTime', 'desc'),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Shift;
        }
        return null;
    } catch (error) {
        console.error("Error fetching active shift:", error);
        return null;
    }
};

export const startShift = async (userId: string): Promise<Shift | null> => {
    try {
        const now = new Date();
        const newShiftData = {
            userId,
            startTime: now.toISOString(),
            endTime: null,
            date: now.toISOString().split('T')[0], // YYYY-MM-DD
            status: 'active' as const,
        };
        const docRef = await addDoc(shiftsCollection, newShiftData);
        return { id: docRef.id, ...newShiftData };
    } catch (error) {
        console.error("Error starting shift:", error);
        return null;
    }
};

export const endShift = async (shiftId: string): Promise<void> => {
    try {
        const shiftDocRef = doc(shiftsCollection, shiftId);
        await updateDoc(shiftDocRef, {
            endTime: new Date().toISOString(),
            status: 'completed',
        });
    } catch (error) {
        console.error("Error ending shift:", error);
        throw error;
    }
};

// --- Demo Requests ---
export const createDemoRequest = async (requestData: Omit<DemoRequest, 'id' | 'requestDate' | 'status'>): Promise<void> => {
    try {
        await addDoc(demoRequestsCollection, {
            ...requestData,
            requestDate: new Date().toISOString(),
            status: 'Pending',
        });
    } catch (error) {
        console.error("Error creating demo request:", error);
        throw error;
    }
};

export const updateDemoRequest = async (id: string, updates: Partial<Omit<DemoRequest, 'id'>>): Promise<void> => {
    try {
        const demoRequestDocRef = doc(demoRequestsCollection, id);
        await updateDoc(demoRequestDocRef, updates);
    } catch (error) {
        console.error(`Error updating demo request ${id}:`, error);
        throw error;
    }
};


// --- Store Supervisors ---
export const createStoreSupervisor = async (supervisorData: Omit<StoreSupervisor, 'id'>): Promise<StoreSupervisor> => {
    try {
        const docRef = await addDoc(storeSupervisorsCollection, { ...supervisorData });
        return { id: docRef.id, ...supervisorData };
    } catch (error) {
        console.error("Error creating store supervisor:", error);
        throw error;
    }
};

export const getStoreSupervisors = async (partnerId?: string): Promise<StoreSupervisor[]> => {
    try {
        let q;
        if (partnerId) {
            q = query(storeSupervisorsCollection, where('partnerId', '==', partnerId), orderBy('name'));
        } else {
            q = query(storeSupervisorsCollection, orderBy('name'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoreSupervisor[];
    } catch (error) {
        console.error("Error fetching store supervisors:", error);
        return [];
    }
};

export const updateStoreSupervisor = async (id: string, updates: Partial<StoreSupervisor>): Promise<void> => {
    try {
        await updateDoc(doc(storeSupervisorsCollection, id), updates);
    } catch (error) {
        console.error(`Error updating store supervisor ${id}:`, error);
        throw error;
    }
};

export const deleteStoreSupervisor = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(storeSupervisorsCollection, id));
    } catch (error) {
        console.error(`Error deleting store supervisor ${id} from Firestore:`, error);
        throw error;
    }
};
