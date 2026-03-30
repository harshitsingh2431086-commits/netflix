import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie, Section } from '../types';
import { MovieCard } from './MovieCard';
import { Modal } from './Modal';
import { getContentBySection } from '../services/contentService'; // Changed
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RowProps {
  section: Section;
  isLarge?: boolean;
  movies?: Movie[]; // Optional: Pre-loaded movies (e.g. Continue Watching)
}

export const Row: React.FC<RowProps> = ({ section, isLarge, movies: initialMovies }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [movies, setMovies] = useState<Movie[]>(initialMovies || []);
  const [modalConfig, setModalConfig] = useState<{ movie: Movie; autoPlay: boolean } | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (initialMovies) {
      setMovies(initialMovies);
      return;
    }
    const loadContent = async () => {
      const data = await getContentBySection(section);
      setMovies(data);
    };
    loadContent();
  }, [section, initialMovies]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null; // Don't show empty rows

  return (
    <div
      className="mb-4 md:mb-8 pl-4 md:pl-12 group relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-xl font-semibold mb-2 text-[#e5e5e5] hover:text-white cursor-pointer transition w-fit">
          {section.title}
        </h2>
        <button
          onClick={() => setModalConfig(movies[0] ? { movie: movies[0], autoPlay: false } : null)}
          className="text-xs md:text-sm font-medium text-cyan-500 hover:text-cyan-400 transition-colors mr-4 md:mr-12"
        >
          Explore All &gt;
        </button>
      </div>

      <div className="relative">
        {/* Left Control */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 hidden md:flex items-center justify-center transition-all duration-300 h-full rounded-r ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronLeft className="text-white" size={32} />
        </button>

        <motion.div
          ref={rowRef}
          className="flex items-center gap-2 overflow-x-scroll hide-scrollbar scroll-smooth py-6 px-2"
          style={{ scrollBehavior: 'smooth', overflowY: 'visible' }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
            hidden: {}
          }}
        >
          {movies.map((movie) => (
            <motion.div key={movie.id} variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}>
              <MovieCard
                movie={movie}
                isLarge={isLarge}
                onSelect={(m) => setModalConfig({ movie: m, autoPlay: false })}
                onPlay={(m) => setModalConfig({ movie: m, autoPlay: true })}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Right Control */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 hidden md:flex items-center justify-center transition-all duration-300 h-full rounded-l ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronRight className="text-white" size={32} />
        </button>
      </div>

      <AnimatePresence>
        {modalConfig && (
          <Modal
            movie={modalConfig.movie}
            autoPlay={modalConfig.autoPlay}
            onClose={() => setModalConfig(null)}
            onSwitchMovie={(movie) => setModalConfig({ movie, autoPlay: true })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
