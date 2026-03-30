import React, { useEffect, useState } from 'react';
import { Download, Check, Pause, Play, Trash2, Smartphone } from 'lucide-react';
import { downloadManager, DownloadItem } from '../services/downloadManager';
import { Movie } from '../types';

interface DownloadButtonProps {
    movie: Movie;
    variant?: 'icon' | 'full'; // Icon only vs Full button
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ movie, variant = 'full' }) => {
    const [download, setDownload] = useState<DownloadItem | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = downloadManager.subscribe((downloads) => {
            setDownload(downloads.find(d => d.movieId === movie.id));
        });
        return () => unsubscribe();
    }, [movie.id]);

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!download) {
            downloadManager.startDownload(movie);
        } else if (download.status === 'downloading') {
            downloadManager.pauseDownload(movie.id);
        } else if (download.status === 'paused') {
            downloadManager.resumeDownload(movie.id);
        } else if (download.status === 'completed') {
            // Usually open downloads page or delete, toggle for now just to demo delete or play
            // For this button, we might just let them delete or show "Downloaded"
        }
    };

    if (variant === 'icon') {
        if (download?.status === 'downloading' || download?.status === 'paused') {
            // Circular Progress
            const radius = 10;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (download.progress / 100) * circumference;

            return (
                <div className="relative w-8 h-8 flex items-center justify-center cursor-pointer" onClick={handleAction}>
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="16" cy="16" r={radius} stroke="gray" strokeWidth="2" fill="transparent" />
                        <circle cx="16" cy="16" r={radius} stroke={download.status === 'paused' ? 'orange' : '#0071eb'} strokeWidth="2" fill="transparent"
                            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                        {download.status === 'paused' ? <Pause size={10} fill="white" /> : <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                </div>
            );
        }

        if (download?.status === 'completed') {
            return (
                <div className="bg-[#0071eb] text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition" onClick={() => downloadManager.removeDownload(movie.id)}>
                    <Smartphone size={20} className="fill-current text-white" />
                </div>
            );
        }

        return (
            <button className="text-gray-300 hover:text-white transition" onClick={handleAction}>
                <Download size={24} />
            </button>
        );
    }

    // Full Button Variant (for Modal)
    return (
        <button
            onClick={handleAction}
            className={`flex items-center gap-2 px-6 py-2 rounded font-bold transition ${download?.status === 'completed'
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                }`}
        >
            {download ? (
                <>
                    {download.status === 'downloading' && (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Downloading {Math.round(download.progress)}%</span>
                        </>
                    )}
                    {download.status === 'paused' && <><Pause size={20} /> <span>Paused</span></>}
                    {download.status === 'completed' && <><Check size={20} /> <span>Downloaded</span></>}
                </>
            ) : (
                <>
                    <Download size={20} />
                    <span>Download</span>
                </>
            )}
        </button>
    );
};
