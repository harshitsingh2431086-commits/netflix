import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Hero } from '../components/Hero';
import { Row } from '../components/Row';
import { getSections, getContentBySection } from '../services/contentService';
import { Section, Movie } from '../types';
import { useStore } from '../context/Store';
import { MovieCard } from '../components/MovieCard';
import { Modal } from '../components/Modal';
import { SkeletonHero, SkeletonRow } from '../components/Skeleton';

interface HomeProps {
  category?: 'tv' | 'movie' | 'new' | 'my-list';
}

export const Home: React.FC<HomeProps> = ({ category }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const { myList, profiles, currentProfile, user } = useStore();
  const [myListMovies, setMyListMovies] = useState<Movie[]>([]);
  const [continueWatchingMovies, setContinueWatchingMovies] = useState<Movie[]>([]);
  const [modalConfig, setModalConfig] = useState<{ movie: Movie; autoPlay: boolean } | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);

      if (category === 'my-list') {
        // ... (existing my-list logic)
        if (currentProfile?.myList && currentProfile.myList.length > 0) {
          const tempSection: Section = {
            id: 'mylist', title: 'My List', order: 0, type: 'curated', contentIds: currentProfile.myList, enabled: true
          };
          const movies = await getContentBySection(tempSection);
          setMyListMovies(movies);
        } else { setMyListMovies([]); }
      } else {
        const scope = category === 'tv' ? 'tv' : category === 'movie' ? 'movie' : category === 'new' ? 'new' : 'home';
        const data = await getSections(scope as any);
        let finalSections = data;

        // Fetch Continue Watching if on Home and User exists
        if (scope === 'home' && currentProfile) {
          try {
            const { playbackService } = await import('../services/playbackService');
            // We need all movies to hydrate. Ideally we have a better way, but for now fetch trending/all
            // Actually playbackService expects allMovies to map IDs.
            // Strategy: Fetch sections first, then get 'continueWatching' IDs from user profile, 
            // then fetch those specific IDs using getContentBySection 'curated' logic.

            // 1. Get IDs from User profile (we need to re-fetch user or trust store? Store is OK)
            // Check store user object
            const cwItems = currentProfile.user?.continueWatching || [];
            if (cwItems.length > 0) {
              const ids = cwItems.map(i => i.movieId);
              const tempSection: Section = {
                id: 'continue-watching', title: 'Continue Watching', order: -1, type: 'curated', contentIds: ids, enabled: true
              };
              const cwMovies = await getContentBySection(tempSection);

              // Merge progress
              const moviesWithProgress = cwMovies.map(m => {
                const item = cwItems.find(x => x.movieId === m.id);
                return { ...m, progress: item?.progress || 0 };
              });

              if (moviesWithProgress.length > 0) {
                // Create a pseudo-section with PRE-LOADED content (Row component usually fetches itself)
                // We need to pass this pre-loaded content to Row? 
                // Row component currently fetches by section.
                // Refactor Row to accept `initialMovies`? Or just let Row fetch "curated"?
                // Row fetching "curated" won't have "progress" data.

                // Solution: We will inject this special section and modify generic Row logic 
                // OR handle it here.
                // Actually, simplest is: Modify Row to accept `movies` prop to override fetching.

                // Let's add 'movies' prop to Row.
              }
            }
          } catch (e) { console.error(e); }
        }

        setSections(finalSections);
      }
      setLoading(false);
    };
    loadContent();
  }, [category, currentProfile, currentProfile?.myList]); // Depend on myList/Profile to refresh

  return (
    <Layout>
      {category !== 'my-list' && <Hero />}
      <div className={`relative ${category !== 'my-list' ? 'pt-8 md:pt-16 px-4 md:px-12' : 'pt-24 px-4 md:px-12'} space-y-2 md:space-y-4 pb-20 overflow-x-hidden min-h-[500px]`}>

        {/* Continue Watching Row */}
        {category !== 'my-list' && continueWatchingMovies.length > 0 && (
          <Row
            section={{ id: 'continue-watching', title: 'Continue Watching', order: -1, type: 'curated', contentIds: [], enabled: true, scopes: ['home'] }}
            movies={continueWatchingMovies}
          />
        )}

        {category === 'my-list' ? (
          <div>
            <h1 className="text-2xl font-bold mb-6 text-white">My List</h1>
            {myListMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {myListMovies.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={(m) => setModalConfig({ movie: m, autoPlay: false })}
                    onPlay={(m) => setModalConfig({ movie: m, autoPlay: true })}
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-500">Your list is empty.</div>
            )}
          </div>
        ) : (
          !loading && sections.length > 0 ? (
            sections.map((section) => (
              <Row
                key={section.id}
                section={section}
                isLarge={section.type === 'originals'}
              />
            ))
          ) : loading ? (
            <div className="space-y-8">
              <SkeletonHero />
              {[...Array(4)].map((_, i) => (
                <SkeletonRow key={i} isLarge={i === 0} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 pt-20">
              <p>No content available.</p>
            </div>
          )
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
