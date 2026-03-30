import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../types';
import { Modal } from './Modal';
import { getHeroContent, getSiteSettings } from '../services/contentService';
import { Info, Play } from 'lucide-react';

export const Hero: React.FC = () => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [autoPlayModal, setAutoPlayModal] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoQuality, setVideoQuality] = useState<string>('hd1080');
  const iframeRef = useRef<HTMLIFrameElement>(null);



  useEffect(() => {
    const loadHero = async () => {
      const heroContent = await getHeroContent();
      if (heroContent) setMovie(heroContent);

      // Fetch quality setting
      const settings = await getSiteSettings();
      if (settings.heroVideoQuality) {
        setVideoQuality(settings.heroVideoQuality);
      }
    };
    loadHero();
  }, []);

  // YouTube postMessage API for mute and quality control
  useEffect(() => {
    if (iframeRef.current && videoLoaded) {
      // Mute Control
      const muteCommand = isMuted ? 'mute' : 'unMute';
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: muteCommand }),
        '*'
      );

      // Aggressive Quality Control
      if (videoQuality !== 'auto') {
        const qualityVal = videoQuality === 'highres' ? 'highres' : videoQuality;
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'setPlaybackQuality', args: [qualityVal] }),
          '*'
        );
      }
    }
  }, [isMuted, videoLoaded, videoQuality]);

  // Start video after 5 second delay (only on desktop or if user enabled autoplay)
  const [showVideo, setShowVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = window.innerWidth < 768;
    setIsMobile(checkMobile);

    // Check user autoplay preference (default: enabled on desktop, disabled on mobile)
    const userAutoplayPref = localStorage.getItem('autoplayEnabled');
    const shouldAutoplay = userAutoplayPref !== null
      ? userAutoplayPref === 'true'
      : !checkMobile; // Default to enabled on desktop, disabled on mobile

    if (movie?.youtubeId && shouldAutoplay) {
      const showTimer = setTimeout(() => setShowVideo(true), 5000); // 5 second delay
      const loadTimer = setTimeout(() => setVideoLoaded(true), 7000); // Mark as loaded after 7s
      return () => {
        clearTimeout(showTimer);
        clearTimeout(loadTimer);
      };
    }
  }, [movie?.youtubeId]);

  if (!movie) return <div className="h-[70vh] md:h-[56.25vw] bg-[#141414] animate-pulse flex items-center justify-center text-gray-700">Loading Preview...</div>;

  // Build YouTube embed URL with quality parameter (requests max quality based on settings)
  const finalQuality = videoQuality === 'highres' ? 'highres' : videoQuality;
  const qualityParam = finalQuality !== 'auto' ? `&vq=${finalQuality}` : '&vq=hd1080';
  const youtubeEmbedUrl = movie.youtubeId
    ? `https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${movie.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&start=10&enablejsapi=1&origin=${window.location.origin}${qualityParam}`
    : null;

  return (
    <div className="relative h-[85vh] md:h-[56.25vw] md:max-h-[85vh] w-full bg-[#141414] overflow-hidden group">
      {/* Fallback Backdrop Image - Shows when video not loaded */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${videoLoaded && youtubeEmbedUrl ? 'opacity-0' : 'opacity-100'}`}>
        {/* Mobile backdrop */}
        <img
          src={movie.mobile_backdrop_path || movie.backdrop_path || 'https://via.placeholder.com/1920x1080'}
          alt={movie.title}
          className="md:hidden w-full h-full object-cover object-center"
        />
        {/* Desktop backdrop */}
        <img
          src={movie.backdrop_path || 'https://via.placeholder.com/1920x1080'}
          alt={movie.title}
          className="hidden md:block w-full h-full object-cover object-center"
        />
      </div>

      {/* Video Player - Direct iframe embed (starts after 5 second delay) */}
      {/* Video Player - Direct iframe embed (starts after 5 second delay) */}
      {youtubeEmbedUrl && showVideo && (
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none animate-fade-in">
          <iframe
            ref={iframeRef}
            src={youtubeEmbedUrl}
            title="Hero Video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] md:w-[150%] md:h-[150%] min-w-full min-h-full opacity-60 md:opacity-100 mix-blend-screen md:mix-blend-normal"
            style={{ border: 'none' }}
          />
        </div>
      )}

      {/* Vignette Overlays - Cinematic Layering */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent opacity-90 z-[2]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent opacity-90 z-[2]"></div>
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#141414] to-transparent z-[3]"></div>

      {/* Manual Mute Toggle */}
      {videoLoaded && youtubeEmbedUrl && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-[35%] right-8 z-30 border border-white/30 rounded-full p-3 bg-black/20 hover:bg-white/10 transition backdrop-blur-sm hidden md:flex items-center justify-center group"
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:scale-110 transition"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:scale-110 transition"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          )}
        </button>
      )}

      {/* Content - Positioned at bottom to show video above */}
      <div className="absolute bottom-[15%] md:bottom-[20%] left-4 md:left-12 max-w-2xl space-y-3 md:space-y-4 z-10 w-full pr-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-xl text-white tracking-tighter leading-tight"
        >
          {movie.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center gap-3 text-white font-semibold drop-shadow-md text-lg"
        >
          <span className="text-[#46d369]">98% Match</span>
          <span className="text-gray-300">{movie.release_date?.substring(0, 4) || '2023'}</span>
          <span className="border border-white/40 px-1 text-xs rounded-sm bg-black/20 uppercase">{movie.type}</span>
          {movie.quality && <span className="border border-white/40 px-1 text-xs rounded-sm bg-black/20 uppercase">{movie.quality}</span>}
        </motion.div>

        {/* Overview - Hidden on mobile, only visible on desktop */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="hidden md:block text-base md:text-lg text-white drop-shadow-md line-clamp-3 text-shadow-md w-full md:w-full font-medium leading-relaxed"
        >
          {movie.overview}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 pt-4 w-full md:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 md:px-8 py-3 md:py-3 rounded md:rounded-md font-bold hover:bg-white/80 transition text-lg md:text-xl active:scale-95"
            onClick={() => {
              setAutoPlayModal(true);
              setShowModal(true);
            }}
          >
            <Play fill="black" size={24} />
            Play
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[rgba(109,109,110,0.7)] text-white px-6 md:px-8 py-3 md:py-3 rounded md:rounded-md font-bold hover:bg-[rgba(109,109,110,0.4)] transition text-lg md:text-xl active:scale-95"
            onClick={() => {
              setAutoPlayModal(false);
              setShowModal(true);
            }}
          >
            <Info size={24} />
            More Info
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && <Modal movie={movie} autoPlay={autoPlayModal} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};
