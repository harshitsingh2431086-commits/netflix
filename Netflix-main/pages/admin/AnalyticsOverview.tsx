import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, orderBy, query, limit, where } from 'firebase/firestore';
import { BarChart2, Download, Play, Users, Clock } from 'lucide-react';
import { ViewingLog, DownloadLog } from '../../types';

export const AnalyticsOverview: React.FC = () => {
    const [stats, setStats] = useState({
        totalViews: 0,
        totalDownloads: 0,
        totalWatchTime: 0, // Minutes
        mostWatched: [] as any[],
        mostDownloaded: [] as any[],
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Limitation: In a real production app, this would use aggregated stats documents
                // reading thousands of logs on every load is expensive.
                // For this implementation, we will fetch recent logs and aggregate client-side for demo.

                const viewsRef = collection(db, 'viewing_logs');
                const downloadsRef = collection(db, 'download_logs');

                const recentViews = await getDocs(query(viewsRef, orderBy('startedAt', 'desc'), limit(100)));
                const recentDownloads = await getDocs(query(downloadsRef, orderBy('downloadedAt', 'desc'), limit(100)));

                let totalDuration = 0;
                const movieMap: Record<string, number> = {};
                const downloadMap: Record<string, number> = {};

                recentViews.docs.forEach(doc => {
                    const data = doc.data() as ViewingLog;
                    totalDuration += (data.watchDurationSeconds || 0);
                    movieMap[data.contentId] = (movieMap[data.contentId] || 0) + 1;
                });

                recentDownloads.docs.forEach(doc => {
                    const data = doc.data() as DownloadLog;
                    downloadMap[data.movieId] = (downloadMap[data.movieId] || 0) + 1;
                });

                setStats({
                    totalViews: recentViews.size, // in this sample batch
                    totalDownloads: recentDownloads.size, // in this sample batch
                    totalWatchTime: Math.floor(totalDuration / 60),
                    mostWatched: Object.entries(movieMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
                    mostDownloaded: Object.entries(downloadMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
                });

            } catch (e) {
                console.error("Error loading analytics", e);
            }
        };
        fetchAnalytics();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Play className="text-purple-500" />
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Recent Views</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
                </div>
                <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Download className="text-blue-500" />
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Recent Downloads</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalDownloads}</p>
                </div>
                <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-green-500" />
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Watch Time (Min)</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalWatchTime}m</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarChart2 size={18} /> Top Content (by Views)</h3>
                    <div className="space-y-3">
                        {stats.mostWatched.map(([id, count], i) => (
                            <div key={id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                                <span className="text-gray-300 truncate w-3/4">ID: {id}</span>
                                <span className="text-purple-400 font-bold">{count} views</span>
                            </div>
                        ))}
                        {stats.mostWatched.length === 0 && <p className="text-gray-500 italic">No data yet.</p>}
                    </div>
                </div>

                <div className="bg-[#1f1f1f] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Download size={18} /> Top Downloads</h3>
                    <div className="space-y-3">
                        {stats.mostDownloaded.map(([id, count], i) => (
                            <div key={id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                                <span className="text-gray-300 truncate w-3/4">ID: {id}</span>
                                <span className="text-blue-400 font-bold">{count} DLs</span>
                            </div>
                        ))}
                        {stats.mostDownloaded.length === 0 && <p className="text-gray-500 italic">No data yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
