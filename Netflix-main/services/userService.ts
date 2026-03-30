import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User, Profile, Movie } from '../types';

// --- User Operations ---

export const syncUser = async (user: User): Promise<void> => {
    if (!user.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        // Create new user doc if it doesn't exist
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            role: user.role || 'user',
            plan: user.plan || 'Free', // Default entry
            subscriptionStatus: user.subscriptionStatus || 'inactive',
            createdAt: new Date().toISOString()
        });
    } else {
        // Optional: Update last seen or other metadata if needed
        // const data = snap.data();
        // if (data.email !== user.email) await updateDoc(userRef, { email: user.email });
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(usersRef);
        return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

export const toggleBlockUser = async (uid: string, currentStatus: 'active' | 'blocked' = 'active'): Promise<void> => {
    try {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        await updateDoc(doc(db, 'users', uid), {
            status: newStatus
        });
    } catch (error) {
        console.error("Error toggling block status:", error);
    }
};

// --- Profile Operations ---

export const getProfiles = async (uid: string): Promise<Profile[]> => {
    try {
        const profilesRef = collection(db, 'users', uid, 'profiles');
        const snap = await getDocs(profilesRef);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
    } catch (error) {
        console.error("Error fetching profiles:", error);
        return [];
    }
};

export const createProfile = async (uid: string, profile: Omit<Profile, 'id'>): Promise<Profile | null> => {
    try {
        const profilesRef = collection(db, 'users', uid, 'profiles');
        const docRef = await addDoc(profilesRef, {
            ...profile,
            myList: [] // Ensure myList starts empty
        });
        return { id: docRef.id, ...profile, myList: [] };
    } catch (error) {
        console.error("Error creating profile:", error);
        return null;
    }
};

export const updateProfile = async (uid: string, profileId: string, data: Partial<Profile>): Promise<void> => {
    try {
        const profileRef = doc(db, 'users', uid, 'profiles', profileId);
        await updateDoc(profileRef, data);
    } catch (error) {
        console.error("Error updating profile:", error);
    }
};

export const deleteProfile = async (uid: string, profileId: string): Promise<void> => {
    // Optional: Implement if needed
};


// --- My List Operations (Operating on specific Profile) ---

export const addToMyList = async (uid: string, profileId: string, movieId: string): Promise<void> => {
    try {
        const profileRef = doc(db, 'users', uid, 'profiles', profileId);
        await updateDoc(profileRef, {
            myList: arrayUnion(movieId)
        });
    } catch (error) {
        console.error("Error adding to my list:", error);
    }
};

export const removeFromMyList = async (uid: string, profileId: string, movieId: string): Promise<void> => {
    try {
        const profileRef = doc(db, 'users', uid, 'profiles', profileId);
        await updateDoc(profileRef, {
            myList: arrayRemove(movieId)
        });
    } catch (error) {
        console.error("Error removing from my list:", error);
    }
};
