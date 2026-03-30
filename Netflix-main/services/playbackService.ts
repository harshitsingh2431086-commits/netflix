import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User, ContinueWatchingItem, Movie } from '../types';

export const playbackService = {
    saveProgress: async (userId: string, movieId: string, progress: number, stoppedAt: number, duration: number) => {
        if (!userId || !movieId) return;

        const userRef = doc(db, 'users', userId);

        try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return;

            const userData = userSnap.data() as User;
            let continueWatching = userData.continueWatching || [];

            // Remove existing entry for this movie if it exists (to start fresh or update)
            continueWatching = continueWatching.filter(item => item.movieId !== movieId);

            // Add if progress is between 5% and 95% (Netflix logic: don't save if just started or basically finished)
            // Exception: for Drive videos (proxy), we might just save if > 10 seconds
            if (progress > 5 && progress < 95) {
                const newItem: ContinueWatchingItem = {
                    movieId,
                    progress,
                    stoppedAt,
                    duration,
                    lastWatchedAt: new Date().toISOString()
                };
                // Add to beginning of array
                continueWatching.unshift(newItem);
            }

            // Limit to 20 items
            if (continueWatching.length > 20) {
                continueWatching = continueWatching.slice(0, 20);
            }

            await updateDoc(userRef, { continueWatching });
        } catch (e) {
            console.error("Error saving progress", e);
        }
    },

    getContinueWatching: async (userId: string, allMovies: Movie[]): Promise<(Movie & { progress: number })[]> => {
        if (!userId) return [];
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return [];

            const list = (userSnap.data() as User).continueWatching || [];

            // Map IDs to full Movie objects
            const result: (Movie & { progress: number })[] = [];

            list.forEach(item => {
                const movie = allMovies.find(m => m.id === item.movieId);
                if (movie) {
                    result.push({ ...movie, progress: item.progress });
                }
            });

            return result;
        } catch (e) {
            console.error("Error fetching continue watching", e);
            return [];
        }
    },

    removeFromContinueWatching: async (userId: string, movieId: string) => {
        const userRef = doc(db, 'users', userId);
        try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return;

            const userData = userSnap.data() as User;
            const updatedList = (userData.continueWatching || []).filter(item => item.movieId !== movieId);

            await updateDoc(userRef, { continueWatching: updatedList });
        } catch (e) { console.error(e); }
    }
};
