import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useStore } from '../context/Store';
import { searchContent } from '../services/contentService';
import { Content } from '../types';
import { Modal } from '../components/Modal';

export const Search: React.FC = () => {
    const { searchQuery, setSearchQuery } = useStore();
    const [results, setResults] = useState<Content[]>([]);
    const [modalConfig, setModalConfig] = useState<{ movie: Content; autoPlay: boolean } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (searchQuery.length > 1) {
                setLoading(true);
                try {
                    const res = await searchContent(searchQuery);
                    setResults(res);
                } catch (e) {
                    console.error("Search error:", e);
                    setResults([]);
                }
                setLoading(false);
            } else {
                setResults([]);
            }
        };
        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    return (
        <Layout>
            <div className="pt-24 px-4 md:px-12 min-h-screen">
                {/* Mobile Search Input - Hidden on desktop as it's in the navbar */}
                <div className="md:hidden mb-8">
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search movies, TV shows..."
                            className="w-full bg-[#333] border border-gray-600 text-white px-10 py-3 rounded-md focus:outline-none focus:border-white transition-all text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <h2 className="text-gray-400 mb-6 text-sm md:text-base">
                    {searchQuery ? `Results for "${searchQuery}"` : "Start typing to search..."}
                </h2>

                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.map(movie => (
                        <div
                            key={movie.id}
                            className="relative aspect-video bg-[#2f2f2f] rounded cursor-pointer group overflow-hidden"
                            onClick={() => setModalConfig({ movie, autoPlay: false })}
                        >
                            <img
                                src={movie.backdrop_path || movie.poster_path || 'https://via.placeholder.com/300x170'}
                                alt={movie.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-bold text-center p-2">{movie.title}</span>
                            </div>
                        </div>
                    ))}
                </div>
                {!loading && results.length === 0 && searchQuery && searchQuery.length > 1 && (
                    <div className="text-center mt-20 text-gray-500">
                        <p>Your search for "{searchQuery}" did not have any matches.</p>
                        <p className="mt-2">Suggestions:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Try different keywords</li>
                            <li>Check the spelling</li>
                            <li>Try using a movie or TV show title</li>
                        </ul>
                    </div>
                )}
            </div>
            {modalConfig && (
                <Modal
                    movie={modalConfig.movie}
                    autoPlay={modalConfig.autoPlay}
                    onClose={() => setModalConfig(null)}
                    onSwitchMovie={(movie) => setModalConfig({ movie, autoPlay: true })}
                />
            )}
        </Layout>
    );
};