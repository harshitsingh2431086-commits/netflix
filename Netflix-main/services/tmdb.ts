import { Movie, TMDBResponse } from '../types';
import { getRandomYoutubeId } from './videoData';

const getApiKey = () => {
  // Check for process.env safely to avoid ReferenceErrors in browser environments
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

const API_KEY = getApiKey();
const BASE_URL = 'https://api.themoviedb.org/3';

export const requests = {
  fetchTrending: `/trending/all/week?api_key=${API_KEY}&language=en-US`,
  fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213`,
  fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
  fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
  fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
  fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
  fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749`,
  fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99`,
};

// Helper to format TMDB image URLs
// Helper to format TMDB image URLs
export const getImage = (path: string | null, size: 'original' | 'w500' | 'w200' | 'w1280' = 'w500') => {
  if (!path || path.includes('http')) return path || 'https://via.placeholder.com/500x281?text=No+Image';

  // Data Saver Check
  let finalSize = size;
  try {
    const isDataSaver = localStorage.getItem('netflix_data_saver_mode') === 'true';
    if (isDataSaver) {
      if (size === 'original' || size === 'w1280') finalSize = 'w780'; // Reduce 4k/HD to 720p equivalent
      if (size === 'w500') finalSize = 'w342'; // Card size reduction
    }
  } catch (e) { }

  return `https://image.tmdb.org/t/p/${finalSize}${path}`;
};

export const fetchMovies = async (url: string): Promise<Movie[]> => {
  // 1. If no API Key is available, return empty array (Demo mode disabled)
  if (!API_KEY) {
    console.warn("TMDB API Key missing. Please check .env file.");
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`);

    // 2. If API Key is invalid (401) or other error
    if (!response.ok) {
      console.warn(`TMDB API request failed (${response.status}).`);
      return [];
    }

    const data: any = await response.json();

    if (!data.results) {
      return [];
    }

    // 3. Process real data
    return data.results.map((movie: any) => ({
      id: movie.id?.toString() || Math.random().toString(),
      title: movie.title || movie.name || 'Untitled',
      overview: movie.overview || '',
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      youtubeId: getRandomYoutubeId(),
      type: movie.media_type === 'tv' ? 'tv' : 'movie',
      genres: [], // TMDB returns genre_ids, strictly we need strings.
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || '',
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    // 4. Network failures (offline)
    console.warn("TMDB Network Error.");
    return [];
  }
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  if (!query) return [];

  // Fallback if no API key
  if (!API_KEY) {
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      return [];
    }

    const data: any = await response.json();

    if (!data.results) return [];

    return data.results
      .filter((m: any) => m.backdrop_path)
      .map((movie: any) => ({
        id: movie.id?.toString() || Math.random().toString(),
        title: movie.title || movie.name || 'Untitled',
        overview: movie.overview || '',
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        youtubeId: getRandomYoutubeId(),
        type: movie.media_type === 'tv' ? 'tv' : 'movie',
        genres: [],
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || movie.first_air_date || '',
        createdAt: new Date().toISOString()
      }));
  } catch (e) {
    return [];
  }
}

export const CATEGORIES = [
  { title: "Trending Now", url: requests.fetchTrending },
  { title: "NETFLIX Originals", url: requests.fetchNetflixOriginals, isLarge: true },
  { title: "Top Rated", url: requests.fetchTopRated },
  { title: "Action Thrillers", url: requests.fetchActionMovies },
  { title: "Comedies", url: requests.fetchComedyMovies },
  { title: "Scary Movies", url: requests.fetchHorrorMovies },
  { title: "Romance", url: requests.fetchRomanceMovies },
  { title: "Documentaries", url: requests.fetchDocumentaries },
];