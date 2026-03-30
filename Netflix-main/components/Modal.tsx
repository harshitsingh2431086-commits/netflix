import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { useStore } from '../context/Store';
import { getImage } from '../services/tmdb';
import { getContentBySection, getSiteSettings } from '../services/contentService';
import { analyticsService } from '../services/analyticsService';
import { X, Play, Plus, Check, ThumbsUp, ArrowLeft, MessageSquare, FileVideo } from 'lucide-react';

interface ModalProps {
  movie: Movie;
  onClose: () => void;
  autoPlay?: boolean;
  onSwitchMovie?: (movie: Movie) => void;
}

export const Modal: React.FC<ModalProps> = ({ movie, onClose, autoPlay = false, onSwitchMovie }) => {
  const { myList, addToMyList, removeFromMyList } = useStore();
  const [viewMode, setViewMode] = useState<'details' | 'trailer' | 'movie'>(
    autoPlay ? (movie.movieDriveId ? 'movie' : 'trailer') : 'details'
  );
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<string>('');
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const inList = myList.includes(movie.id);
  // Calculate match score
  const matchScore = React.useMemo(() => Math.round((movie.vote_average || 9) * 10), [movie.vote_average]);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Analytics State
  const viewLogIdRef = useRef<string | null>(null);
  const viewStartTimeRef = useRef<number>(0);
  const { user } = useStore(); // Access User for tracking

  // Reset playing state and scroll to top when movie changes
  useEffect(() => {
    setViewMode(autoPlay ? (movie.movieDriveId ? 'movie' : 'trailer') : 'details');
    // Scroll to top of modal for visibility of video
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [movie.id, autoPlay, movie.movieDriveId]);

  // Tracking: Start/End Views
  useEffect(() => {
    const handleViewChange = async () => {
      // 1. End previous View if exists
      if (viewLogIdRef.current && user) {
        const duration = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        await analyticsService.logViewEnd(viewLogIdRef.current, duration, user.uid);
        viewLogIdRef.current = null;
      }

      // 2. Start new View if in viewing mode
      if ((viewMode === 'trailer' || viewMode === 'movie') && user) {
        viewStartTimeRef.current = Date.now();
        const type = viewMode === 'trailer' ? 'trailer' : 'movie';
        const logId = await analyticsService.logViewStart(user.uid, movie.id, type, movie.genres);
        viewLogIdRef.current = logId;
      }
    };

    handleViewChange();

    return () => {
      // Cleanup on unmount (close modal) or view mode change
      if (viewLogIdRef.current && user) {
        const duration = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        analyticsService.logViewEnd(viewLogIdRef.current, duration, user.uid);
      }
    };
  }, [viewMode, movie.id, user]);

  const handleDownloadClick = () => {
    if (user) {
      analyticsService.logDownload(user.uid, movie.id);
    }
  };

  useEffect(() => {
    const fetchSimilar = async () => {
      // Mock "More Like This" by fetching trending/default content
      // In a real app, this would use an algorithm based on movie.genres
      const movies = await getContentBySection({
        id: 'similar',
        title: 'Similar',
        type: 'trending',
        order: 0,
        enabled: true,
        scopes: ['movie']
      });
      // Filter out current movie and limit to 9
      setSimilarMovies(movies.filter(m => m.id !== movie.id).slice(0, 9));
    };
    fetchSimilar();
  }, [movie.id]);

  const toggleList = () => {
    if (inList) removeFromMyList(movie.id);
    else addToMyList(movie);
  };

  const handleAudioTrackChange = (trackId: string) => {
    if (!playerRef.current) return;

    try {
      // YouTube uses 'captions' for subtitles/tracks
      if (playerRef.current.setOption) {
        playerRef.current.setOption('captions', 'track', { languageCode: trackId });
      } else if (playerRef.current.loadModule) {
        playerRef.current.loadModule('captions');
        playerRef.current.setOption('captions', 'track', { languageCode: trackId });
      }

      setCurrentAudioTrack(trackId);
      setShowAudioMenu(false);
    } catch (e) {
      console.error('Failed to change audio/caption track:', e);
    }
  };

  const handleSubtitleToggle = (off: boolean) => {
    if (!playerRef.current) return;
    try {
      if (off) {
        playerRef.current.unloadModule('captions');
      } else {
        playerRef.current.loadModule('captions');
      }
      setShowAudioMenu(false);
    } catch (e) { }
  };

  useEffect(() => {
    const ensureYouTubeAPI = () =>
      new Promise<any>((resolve) => {
        const w = window as any;
        if (w.YT && w.YT.Player) resolve(w.YT);
        else {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
          w.onYouTubeIframeAPIReady = () => resolve(w.YT);
        }
      });

    const setMaxQuality = async (player: any) => {
      if (!player || !player.getAvailableQualityLevels) return;

      const settings = await getSiteSettings();
      const preferred = (settings.heroVideoQuality as any) || 'hd1080';

      const levels: string[] = player.getAvailableQualityLevels() || [];
      const order = ['highres', 'hd1080', 'hd720', 'large', 'medium', 'small'];

      // If preferred is in levels, use it. Otherwise fallback to best.
      let finalQuality = preferred;
      if (!levels.includes(preferred)) {
        finalQuality = order.find(q => levels.includes(q)) || 'highres';
      }

      if (player.setPlaybackQuality) player.setPlaybackQuality(finalQuality);
    };

    const initPlayer = async () => {
      if (viewMode !== 'trailer' || !movie.youtubeId || !containerRef.current) return;
      const YT = await ensureYouTubeAPI();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: movie.youtubeId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (e: any) => {
            setMaxQuality(e.target);
            try { e.target.playVideo(); } catch { }

            // Try to get available audio tracks (YouTube API limitation: not all videos support this)
            try {
              const options = e.target.getOptions();
              if (options && options.length > 0) {
                setAudioTracks(options);
              }
            } catch { }
          }
        }
      });
    };

    initPlayer();
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { }
        playerRef.current = null;
      }
    };
  }, [viewMode, movie.youtubeId]);

  // Gestures (Swipe to close)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchOffset, setTouchOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) setTouchOffset(diff); // Only allow dragging down
  };

  const handleTouchEnd = () => {
    if (touchOffset > 150) {
      onClose(); // Close if dragged enough
    } else {
      setTouchOffset(0); // Reset
    }
    setTouchStart(null);
  };

  // Tracking: Progress (Continue Watching)
  useEffect(() => {
    if (!user || (viewMode !== 'trailer' && viewMode !== 'movie')) return;

    const saveInterval = setInterval(async () => {
      let progress = 0;
      let duration = 0;
      let currentTime = 0;

      // YouTube Tracking
      if (viewMode === 'trailer' && playerRef.current && playerRef.current.getCurrentTime) {
        currentTime = playerRef.current.getCurrentTime();
        duration = playerRef.current.getDuration();
        if (duration > 0) progress = (currentTime / duration) * 100;
      }

      // Drive Proxy Tracking (Time based)
      if (viewMode === 'movie') {
        // Proxy: Assume 2 hour movie (7200s) for progress calculation if untrackable
        // This is a rough estimation since we can't get real duration from Drive preview
        currentTime = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        duration = 7200;
        progress = (currentTime / duration) * 100;
      }

      if (currentTime > 5 && progress < 98) {
        const { playbackService } = await import('../services/playbackService');
        await playbackService.saveProgress(user.uid, movie.id, progress, currentTime, duration);
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [viewMode, movie.id, user]);

  return (
    <motion.div
      ref={scrollerRef}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-4 md:py-8"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-full max-w-[850px] bg-[#181818] rounded-xl shadow-2xl overflow-hidden my-auto mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `translateY(${touchOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Drag Handle for Mobile */}
        <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mt-2 mb-1 md:hidden opacity-50" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-[#181818] rounded-full p-2 hover:bg-[#2a2a2a] transition"
        >
          <X size={24} />
        </button>

        {/* Video / Cover Area */}
        <div className="relative h-[280px] md:h-[400px] bg-black group">


          {viewMode === 'details' ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent z-[5]" />
              <img
                src={getImage(movie.backdrop_path, 'original')}
                alt={movie.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute bottom-10 left-10 z-10 max-w-lg">
                <h2 className="text-5xl font-bold mb-6 drop-shadow-lg tracking-tighter">{movie.title}</h2>
                <div className="flex items-center gap-4 flex-wrap">
                  {movie.youtubeId && (
                    <button
                      onClick={() => setViewMode('trailer')}
                      className="flex items-center gap-2 bg-white text-black hover:bg-opacity-90 px-6 py-2 rounded font-bold transition text-lg"
                    >
                      <Play fill="black" size={24} />
                      Watch Trailer
                    </button>
                  )}

                  {movie.movieDriveId && movie.allowPlayback !== false && (
                    <button
                      onClick={() => setViewMode('movie')}
                      className="flex items-center gap-2 bg-[#e50914] text-white hover:bg-red-700 px-6 py-2 rounded font-bold transition text-lg"
                    >
                      <Play fill="white" size={24} />
                      Watch Movie
                    </button>
                  )}

                  {movie.movieDriveId && movie.allowDownload !== false && (
                    <div className="flex flex-col items-start gap-1">
                      <a
                        href={`https://drive.google.com/uc?export=download&id=${movie.movieDriveId}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleDownloadClick}
                        className="flex items-center gap-2 bg-[#6d6d6eb3] text-white hover:bg-[#6d6d6e66] px-6 py-2 rounded font-bold transition text-lg"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        Download Movie
                      </a>
                    </div>
                  )}

                  {(movie.allowDownload !== false || movie.allowPlayback !== false) && movie.movieDriveId && (
                    <span className="w-full text-[10px] text-gray-400 mt-1">
                      Large file – playback & download speed depend on Google Drive
                    </span>
                  )}

                  <button
                    onClick={toggleList}
                    className="flex items-center justify-center border-2 border-gray-500 bg-[#2a2a2a]/60 text-white p-2 rounded-full hover:border-white transition"
                  >
                    {inList ? <Check size={24} /> : <Plus size={24} />}
                  </button>
                  <button className="flex items-center justify-center border-2 border-gray-500 bg-[#2a2a2a]/60 text-white p-2 rounded-full hover:border-white transition">
                    <ThumbsUp size={24} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full relative bg-black">
              <button
                onClick={() => setViewMode('details')}
                className="absolute top-4 left-4 z-50 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white flex items-center gap-2 border border-white/10"
              >
                <ArrowLeft size={20} /> Back
              </button>

              {/* Content Player Switcher */}
              {viewMode === 'trailer' && (
                <>
                  {/* Audio & Subtitles Controls */}
                  <div className="absolute bottom-16 right-4 z-[60]">
                    <div className="relative">
                      <button
                        onClick={() => setShowAudioMenu(!showAudioMenu)}
                        className="bg-black/60 p-2 md:p-3 rounded-full hover:bg-white/20 transition-all text-white flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md group"
                        title="Audio & Subtitles"
                      >
                        <MessageSquare size={20} className="md:w-6 md:h-6" />
                      </button>

                      {showAudioMenu && (
                        <div className="absolute bottom-12 right-0 bg-black/95 border border-gray-700 rounded-lg p-3 md:p-4 w-[200px] md:min-w-[250px] shadow-xl max-h-[50vh] overflow-y-auto">
                          <div className="text-white space-y-3">
                            <div>
                              <h4 className="text-xs md:text-sm font-bold mb-2 text-gray-300 uppercase tracking-wide">Audio</h4>
                              <div className="space-y-1">
                                {['English', 'Hindi', 'Spanish', 'French', 'German'].map((lang) => (
                                  <button
                                    key={lang}
                                    onClick={() => handleAudioTrackChange(lang.toLowerCase())}
                                    className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-gray-800 transition ${currentAudioTrack === lang.toLowerCase() ? 'bg-gray-700 text-white font-semibold' : 'text-gray-300'
                                      }`}
                                  >
                                    {lang}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-gray-700 pt-3">
                              <h4 className="text-xs md:text-sm font-bold mb-2 text-gray-300 uppercase tracking-wide">Subtitles</h4>
                              <div className="space-y-1">
                                <button
                                  onClick={() => handleSubtitleToggle(true)}
                                  className="w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-gray-800 transition text-gray-300"
                                >
                                  Off
                                </button>
                                {['English', 'Hindi', 'Spanish'].map((lang) => (
                                  <button
                                    key={lang}
                                    className="w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-gray-800 transition text-gray-300"
                                  >
                                    {lang}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div ref={containerRef} className="w-full h-full" />
                </>
              )}

              {viewMode === 'movie' && (
                <div className="w-full h-full flex items-center justify-center">
                  {movie.movieDriveId ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${movie.movieDriveId}/preview`}
                      className="w-full h-full border-none"
                      allowFullScreen
                      allow="autoplay"
                      title={movie.title}
                    />
                  ) : (
                    <div className="text-white text-center">
                      <FileVideo size={48} className="mx-auto mb-4 text-gray-500" />
                      <p className="text-xl font-bold">Movie not available</p>
                      <p className="text-gray-400">Please try again later.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-[#181818]">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span className="text-[#46d369] font-bold">{matchScore}% Match</span>
              <span className="text-gray-400">{movie.release_date?.substring(0, 4) || '2023'}</span>
              <span className="border border-gray-500 px-1 text-xs rounded">{movie.quality || 'HD'}</span>
              {movie.maturityRating && (
                <span className="border border-gray-500 px-1 text-xs rounded uppercase">{movie.maturityRating}</span>
              )}
              {movie.duration && (
                <span className="text-gray-400 text-sm">{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
              )}
            </div>
            {movie.duration && (
              <div className="text-xs text-gray-500 font-medium">
                Estimated Data Consumption: <span className="text-gray-300">~{((movie.duration / 60) * 1).toFixed(1)} GB</span>
              </div>
            )}
            <p className="text-lg leading-relaxed text-gray-200">
              {movie.overview}
            </p>
          </div>
          <div className="md:col-span-1 space-y-4 text-sm">
            <div>
              <span className="text-gray-500 block mb-1">Cast:</span>
              <span className="text-white text-sm">{movie.cast?.join(', ') || 'Cast unavailable'}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Genres:</span>
              <span className="text-white text-sm">{movie.genres?.join(', ') || 'Drama'}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">This show is:</span>
              <span className="text-white text-sm">{movie.tags?.join(', ') || 'Exciting'}</span>
            </div>
          </div>
        </div>

        {/* More Like This */}
        {similarMovies.length > 0 && (
          <div className="p-6 md:p-10 bg-[#181818] border-t border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">More Like This</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {similarMovies.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#2f2f2f] rounded-md cursor-pointer hover:bg-[#333] transition overflow-hidden group"
                  onClick={() => onSwitchMovie && onSwitchMovie(m)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={getImage(m.backdrop_path || m.poster_path)}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 text-xs font-bold bg-black/60 px-1 rounded text-white">
                      {Math.floor(Math.random() * 60 + 60)}m
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/30">
                      <div className="bg-white/90 rounded-full p-2">
                        <Play size={20} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#46d369] font-bold">{Math.round(m.vote_average * 10)}% Match</span>
                        <span className="border border-gray-500 px-1 text-[10px] uppercase text-gray-400">HD</span>
                      </div>
                      <div className="border border-gray-500 rounded-full p-1 hover:border-white text-white">
                        <Plus size={16} />
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{m.overview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
