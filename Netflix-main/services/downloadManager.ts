import { Movie } from '../types';
import { analyticsService } from './analyticsService';

export interface DownloadItem {
    movieId: string;
    movie: Movie;
    status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
    progress: number; // 0-100
    downloadedAt: string;
    size: string; // e.g. "1.2 GB"
}

// Mock sizes
const calculateSize = (duration: number = 120) => {
    return `${(duration * 0.015).toFixed(1)} GB`; // Rough approx
};

class DownloadManager {
    private subscribers: ((downloads: DownloadItem[]) => void)[] = [];
    private downloads: DownloadItem[] = [];
    private intervals: { [key: string]: NodeJS.Timeout } = {};

    // System Intelligence State
    private wifiOnly: boolean = true; // Default
    private systemConstraints = {
        batteryLow: false,
        nonWifi: false
    };

    // Event Emitter for Toasts
    private eventListeners: ((event: { type: 'info' | 'error' | 'success', title: string, message: string }) => void)[] = [];

    constructor() {
        this.load();
        // Load preference
        try {
            const pref = localStorage.getItem('netflix_wifi_only');
            this.wifiOnly = pref === null ? true : pref === 'true';
        } catch (e) { }
    }

    onEvent(callback: (event: { type: 'info' | 'error' | 'success', title: string, message: string }) => void) {
        this.eventListeners.push(callback);
        return () => {
            this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
        };
    }

    private emitEvent(type: 'info' | 'error' | 'success', title: string, message: string) {
        this.eventListeners.forEach(cb => cb({ type, title, message }));
    }

    // Called by SystemMonitor
    updateSystemStatus(status: { batteryLow: boolean; nonWifi: boolean }) {
        const oldConstraints = { ...this.systemConstraints };
        this.systemConstraints = status;

        const wasBlocked = oldConstraints.batteryLow || (this.wifiOnly && oldConstraints.nonWifi);
        const isBlocked = status.batteryLow || (this.wifiOnly && status.nonWifi);

        if (isBlocked && !wasBlocked) {
            this.pauseAllAuto("System constraints (Battery/Network)");
            this.emitEvent('error', 'Downloads Paused', 'Battery low or mobile data detected.');
        } else if (!isBlocked && wasBlocked) {
            this.resumeAllAuto();
            this.emitEvent('info', 'Downloads Resumed', 'System constraints cleared.');
        }
    }

    setWifiOnly(enabled: boolean) {
        this.wifiOnly = enabled;
        localStorage.setItem('netflix_wifi_only', String(enabled));
        // Re-evaluate
        this.updateSystemStatus(this.systemConstraints);
    }

    getWifiOnly() { return this.wifiOnly; }

    private load() {
        try {
            const data = localStorage.getItem('netflix_downloads');
            if (data) {
                this.downloads = JSON.parse(data);
            }
        } catch (e) { console.error("Failed to load downloads", e); }
    }

    private save() {
        localStorage.setItem('netflix_downloads', JSON.stringify(this.downloads));
        this.notify();
    }

    subscribe(callback: (downloads: DownloadItem[]) => void) {
        this.subscribers.push(callback);
        callback(this.downloads);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    private notify() {
        this.subscribers.forEach(cb => cb(this.downloads));
    }

    getDownload(movieId: string) {
        return this.downloads.find(d => d.movieId === movieId);
    }

    getAll() {
        return this.downloads;
    }

    startDownload(movie: Movie) {
        if (this.getDownload(movie.id)) return; // Already exists

        // Check Constraints
        if (this.systemConstraints.batteryLow) {
            alert("Download blocked: Battery is too low (<20%).");
            return;
        }
        if (this.wifiOnly && this.systemConstraints.nonWifi) {
            const proceed = confirm("You are on Mobile Data. Download anyway? (This will disable Wi-Fi Only mode)");
            if (proceed) {
                this.setWifiOnly(false);
            } else {
                return; // Cancel
            }
        }

        const newItem: DownloadItem = {
            movieId: movie.id,
            movie,
            status: 'downloading',
            progress: 0,
            downloadedAt: new Date().toISOString(),
            size: calculateSize(120) // Default sizing
        };

        this.downloads.push(newItem);
        this.save();

        // --------------------------------------------------
        // ACTUAL DOWNLOAD TRIGGER (UX ILLUSION)
        // --------------------------------------------------
        if (movie.movieDriveId) {
            // Construct Google Drive Download URL
            // Format: https://drive.google.com/uc?export=download&id={FILE_ID}
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${movie.movieDriveId}`;

            // UX Feedback (Instant) - Specific copy requested by User
            this.emitEvent('info', 'Your download is starting...', 'You can keep watching while this downloads.');

            // Open in background tab logic
            setTimeout(() => {
                const win = window.open(downloadUrl, '_blank');
                if (win) {
                    win.blur();
                    window.focus();
                } else {
                    this.emitEvent('error', 'Popup Blocked', 'Please allow popups to save this file.');
                }
            }, 800); // Slight delay for UX smoothness
        } else {
            // Fallback for demo content without ID
            this.emitEvent('info', 'Download Queued', 'Simulated download (No Drive ID).');
        }

        // Analytics
        analyticsService.logEvent({
            type: 'download_start',
            movieId: movie.id,
            movieTitle: movie.title,
            userId: 'current-user', // In real app, pass from store or context
            networkType: this.systemConstraints.nonWifi ? 'cellular' : 'wifi',
            batteryLevel: 1 // placeholder
        });

        this.simulateProgress(movie.id);
    }

    pauseDownload(movieId: string) {
        const item = this.getDownload(movieId);
        if (!item) return;

        item.status = 'paused';
        if (this.intervals[movieId]) clearInterval(this.intervals[movieId]);
        this.save();
    }

    private pauseAllAuto(reason: string) {
        this.downloads.forEach(d => {
            if (d.status === 'downloading') {
                this.pauseDownload(d.movieId);
            }
        });
    }

    private resumeAllAuto() {
        // Optional: Auto-resume logic if desired
    }

    resumeDownload(movieId: string) {
        const item = this.getDownload(movieId);
        if (!item) return;

        // Check constraints before resume
        if (this.systemConstraints.batteryLow) {
            alert("Cannot resume: Battery too low.");
            return;
        }

        item.status = 'downloading';
        this.save();
        this.simulateProgress(movieId);
    }

    removeDownload(movieId: string) {
        this.downloads = this.downloads.filter(d => d.movieId !== movieId);
        if (this.intervals[movieId]) clearInterval(this.intervals[movieId]);
        this.save();
    }

    private simulateProgress(movieId: string) {
        if (this.intervals[movieId]) clearInterval(this.intervals[movieId]);

        // Speed: 1% every 150ms
        this.intervals[movieId] = setInterval(() => {
            const item = this.getDownload(movieId);
            if (!item || item.status !== 'downloading') {
                clearInterval(this.intervals[movieId]);
                return;
            }

            item.progress += 1;

            if (item.progress >= 100) {
                item.progress = 100;
                item.status = 'completed';
                clearInterval(this.intervals[movieId]);

                analyticsService.logDownload('current-user', item.movie.id);

                analyticsService.logEvent({
                    type: 'download_complete',
                    movieId: item.movie.id,
                    movieTitle: item.movie.title,
                    networkType: 'unknown',
                    batteryLevel: 1
                });

                this.emitEvent('success', 'Download Complete', `${item.movie.title} is ready to watch.`);

                // Trigger browser notification if available
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Download Complete", { body: `${item.movie.title} is ready to watch offline.` });
                }
            }

            this.save(); // Triggers re-render
        }, 150);
    }
}

export const downloadManager = new DownloadManager();
