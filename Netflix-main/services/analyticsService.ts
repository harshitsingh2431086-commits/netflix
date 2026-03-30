import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AnalyticsEvent {
    type: 'download_start' | 'download_complete' | 'download_failed' | 'download_paused';
    movieId: string;
    movieTitle: string;
    userId?: string;
    networkType: string;
    batteryLevel: number;
    timestamp: string;
}

export const analyticsService = {
    // Legacy generic logger
    logEvent: async (event: Omit<AnalyticsEvent, 'timestamp'>) => {
        try {
            await addDoc(collection(db, 'analytics'), {
                ...event,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Analytics Error", e);
        }
    },

    // View Tracking (Start) - Returns Log ID
    logViewStart: async (userId: string, contentId: string, contentType: 'movie' | 'trailer', genre: string[] = []): Promise<string | null> => {
        try {
            const docRef = await addDoc(collection(db, 'viewing_logs'), {
                userId,
                contentId,
                contentType,
                genre,
                startedAt: new Date().toISOString(),
                watchDurationSeconds: 0
            });
            return docRef.id;
        } catch (e) {
            console.error("Error logging view start:", e);
            return null;
        }
    },

    // View Tracking (End) - Updates Duration
    logViewEnd: async (logId: string, durationSeconds: number, userId: string) => {
        try {
            if (!logId) return;
            const logRef = doc(db, 'viewing_logs', logId);
            await updateDoc(logRef, {
                watchDurationSeconds: durationSeconds,
                endedAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error logging view end:", e);
        }
    },

    // Download Tracking
    logDownload: async (userId: string, movieId: string) => {
        try {
            await addDoc(collection(db, 'download_logs'), {
                userId,
                movieId,
                downloadedAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error logging download:", e);
        }
    },
    // Heartbeat Tracking (Presence)
    updateHeartbeat: async (userId: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                lastActive: new Date().toISOString()
            });
        } catch (e) {
            // Silently fail for heartbeat to not spam console
        }
    }
};
