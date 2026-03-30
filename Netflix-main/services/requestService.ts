import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ContentRequest } from '../types';

export const submitContentRequest = async (userId: string, userEmail: string, title: string) => {
    try {
        await addDoc(collection(db, 'content_requests'), {
            userId,
            userEmail,
            contentTitle: title,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.error("Error submitting request:", e);
        return false;
    }
};

export const getContentRequests = async (): Promise<ContentRequest[]> => {
    try {
        const q = query(collection(db, 'content_requests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ContentRequest));
    } catch (e) {
        console.error("Error fetching requests:", e);
        return [];
    }
};

export const updateRequestStatus = async (requestId: string, status: 'pending' | 'resolved' | 'failed') => {
    try {
        await updateDoc(doc(db, 'content_requests', requestId), { status });
        return true;
    } catch (e) {
        console.error("Error updating request:", e);
        return false;
    }
};

export const deleteRequest = async (requestId: string) => {
    try {
        await deleteDoc(doc(db, 'content_requests', requestId));
        return true;
    } catch (e) {
        console.error("Error deleting request:", e);
        return false;
    }
};
