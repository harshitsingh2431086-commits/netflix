import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { downloadManager, DownloadItem } from '../services/downloadManager';
import { Play, Trash2, Smartphone, Download } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Movie } from '../types';

export const Downloads: React.FC = () => {
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [modalConfig, setModalConfig] = useState<{ movie: Movie; autoPlay: boolean } | null>(null);

    useEffect(() => {
        const unsubscribe = downloadManager.subscribe(setDownloads);
        return () => unsubscribe();
    }, []);

    const completed = downloads.filter(d => d.status === 'completed');
    const inProgress = downloads.filter(d => d.status !== 'completed');

    return (
        <Layout>
            <div className="pt-24 px-4 md:px-12 max-w-6xl mx-auto min-h-screen">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-gray-800 p-3 rounded-full">
                        <Download className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Smart Downloads</h1>
                </div>

                {/* Storage Meter */}
                <div className="mb-8 bg-zinc-800 rounded-lg p-4 flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-full">
                        <Smartphone size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Netflix Used</span>
                            <span>Free Space</span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-600 w-[15%]" /> {/* Mock */}
                            <div className="h-full bg-gray-500 w-[5%]" />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-6">
                    {downloads.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            <div className="bg-zinc-900 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download size={48} />
                            </div>
                            <p className="text-xl text-white font-medium mb-2">Movies and TV shows that you download appear here.</p>
                            <button onClick={() => window.location.hash = '/browse'} className="bg-white text-black px-6 py-2 rounded font-bold mt-4 hover:bg-gray-200">
                                Find Something to Download
                            </button>
                        </div>
                    )}

                    {inProgress.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg text-gray-400 font-medium">Downloading...</h2>
                            {inProgress.map(item => (
                                <div key={item.movieId} className="flex gap-4 items-center bg-zinc-900/50 p-2 rounded">
                                    <img src={`https://image.tmdb.org/t/p/w200${item.movie.poster_path}`} className="w-16 h-24 object-cover rounded" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm">{item.movie.title}</h3>
                                        <div className="text-xs text-orange-500 mb-1 capitalize">{item.status} {item.status === 'downloading' && `${Math.round(item.progress)}%`}</div>
                                        <div className="h-1 bg-zinc-700 rounded-full overflow-hidden w-full max-w-[200px]">
                                            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                        </div>
                                    </div>
                                    <button onClick={() => downloadManager.pauseDownload(item.movieId)} className="p-2 text-white">
                                        {item.status === 'paused' ? 'Resume' : 'Pause'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {completed.length > 0 && (
                        <div className="space-y-4">
                            {completed.map(item => (
                                <div key={item.movieId} className="flex gap-4 items-center group cursor-pointer hover:bg-zinc-900 p-2 rounded transition" onClick={() => setModalConfig({ movie: item.movie, autoPlay: true })}>
                                    <div className="relative">
                                        <img src={`https://image.tmdb.org/t/p/w300${item.movie.backdrop_path}`} className="w-32 h-20 object-cover rounded" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                                            <Play className="fill-white w-8 h-8" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-base">{item.movie.title}</h3>
                                        <p className="text-xs text-gray-400">{item.movie.genres.slice(0, 2).join(' • ')} | {item.size}</p>
                                    </div>
                                    <button className="p-3 text-gray-500 hover:text-white" onClick={(e) => { e.stopPropagation(); downloadManager.removeDownload(item.movieId); }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalConfig && (
                <Modal movie={modalConfig.movie} autoPlay={modalConfig.autoPlay} onClose={() => setModalConfig(null)} onSwitchMovie={() => { }} />
            )}
        </Layout>
    );
};
