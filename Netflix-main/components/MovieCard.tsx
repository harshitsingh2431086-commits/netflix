import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { useStore } from '../context/Store';
import { getImage } from '../services/tmdb';
import { Play, Plus, ThumbsUp, ChevronDown, Check } from 'lucide-react';

interface MovieCardProps {
    movie: Movie;
    isLarge?: boolean;
    onSelect: (movie: Movie) => void;
    onPlay: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, isLarge, onSelect, onPlay }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { addToMyList, removeFromMyList, myList } = useStore();
    const inList = myList.includes(movie.id);

    // Calculate match score
    const matchScore = React.useMemo(() => Math.round(movie.vote_average * 10), [movie.vote_average]);

    const handleListToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inList) removeFromMyList(movie.id);
        else addToMyList(movie);
    };

    const handleLikeToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        // You can add additional logic here to save likes to Firestore if needed
    };

    return (
        <div
            className={`relative flex-none transition-all duration-300 ${isLarge ? 'w-[160px] md:w-[200px] h-[280px] md:h-[340px]' : 'w-[200px] md:w-[240px] h-[140px] md:h-[165px]'}`}
            onMouseEnter={() => {
                if (window.innerWidth >= 768) setIsHovered(true);
            }}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                // On mobile, clicking acts as select
                if (window.innerWidth < 768) onSelect(movie);
            }}
        >
            <motion.div
                className="absolute top-0 bg-[#181818] rounded-md shadow-xl z-50 overflow-hidden"
                initial={false}
                animate={{
                    scale: 1,
                    y: isHovered ? -20 : 0,
                    height: isHovered ? 'auto' : '100%',
                    zIndex: isHovered ? 99 : 1
                }}
                transition={{ duration: 0.3, delay: isHovered ? 0.5 : 0 }}
                style={{ width: '100%', originY: 0.5 }}
            >
                {/* Image / Video Area */}
                <div className="relative w-full aspect-video cursor-pointer" onClick={() => onSelect(movie)}>
                    {isHovered && movie.youtubeId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&modestbranding=1&iv_load_policy=3&playlist=${movie.youtubeId}`}
                            className="w-full h-full object-cover rounded-t-md scale-[1.35] pointer-events-none"
                            allow="autoplay; encrypted-media"
                            frameBorder="0"
                            title={movie.title}
                        />
                    ) : (
                        !imageError ? (
                            <img
                                src={getImage(
                                    window.innerWidth < 768
                                        ? (isLarge ? (movie.mobile_poster_path || movie.poster_path) : (movie.mobile_backdrop_path || movie.backdrop_path))
                                        : (isLarge ? movie.poster_path : movie.backdrop_path)
                                )}
                                alt={movie.title}
                                loading="lazy"
                                className="w-full h-full object-cover rounded-t-md"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-2 text-center">
                                <span className="text-gray-500 text-xs font-bold">{movie.title}</span>
                            </div>
                        )
                    )}
                </div>

                {/* Movie Title - Always Visible */}
                <div className="px-2 py-2 bg-[#181818]">
                    <p className="text-white text-xs font-medium truncate">{movie.title}</p>
                </div>

                {/* Expanded Info (Only visible on hoverDesktop) */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 shadow-lg bg-[#181818]"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <button
                                    className="bg-white text-black rounded-full p-1 hover:bg-gray-200 transition"
                                    onClick={(e) => { e.stopPropagation(); onPlay(movie); }}
                                >
                                    <Play size={16} fill="black" />
                                </button>
                                <button
                                    onClick={handleListToggle}
                                    className="border-2 border-gray-400 text-white rounded-full p-1 hover:border-white hover:bg-white/10 transition"
                                >
                                    {inList ? <Check size={16} /> : <Plus size={16} />}
                                </button>
                                <button
                                    onClick={handleLikeToggle}
                                    className={`border-2 ${isLiked ? 'border-white bg-white/20' : 'border-gray-400'} text-white rounded-full p-1 hover:border-white hover:bg-white/10 transition`}
                                >
                                    <ThumbsUp size={16} fill={isLiked ? 'white' : 'none'} />
                                </button>
                                <button
                                    className="ml-auto border-2 border-gray-400 text-white rounded-full p-1 hover:border-white hover:bg-white/10 transition"
                                    onClick={(e) => { e.stopPropagation(); onSelect(movie); }}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 mb-2">
                                <span className="text-green-400">{Math.round(movie.vote_average * 10)}% Match</span>
                                <span className="border border-gray-500 px-1">HD</span>
                                <div>{movie.progress && movie.progress > 0 && <span className="text-white ml-2">{Math.round(movie.progress)}% left</span>}</div>
                            </div>

                            <div className="flex gap-2 text-[10px] text-white flex-wrap">
                                {movie.genres?.slice(0, 3).map((g, i) => (
                                    <span key={i} className="flex items-center">
                                        {i > 0 && <span className="text-gray-500 mr-1">•</span>}
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Bar (Always visible if exists) */}
                {movie.progress !== undefined && movie.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-[60]">
                        <div
                            className="h-full bg-red-600"
                            style={{ width: `${movie.progress}%` }}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
};