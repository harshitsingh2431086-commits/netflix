import { Movie } from '../types';
import { getYoutubeIdByIndex } from './videoData';

export const FEATURED_MOVIE: Movie = {
  id: "101",
  title: "Stranger Things",
  overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
  poster_path: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msUQ3wXR.jpg",
  backdrop_path: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYkJu64COIL.jpg",
  youtubeId: "b9EkMc79ZSU",
  genres: ["Sci-Fi", "Horror", "Drama"],
  vote_average: 9.8,
  release_date: "2022",
  type: 'tv',
  createdAt: new Date().toISOString()
};

const TITLES = [
  "The Dark Knight", "Inception", "Interstellar", "The Matrix", "Avengers: Endgame",
  "Spider-Man: No Way Home", "The Lion King", "Frozen II", "Joker", "Black Panther",
  "Avatar", "Titanic", "Star Wars: A New Hope", "Jurassic Park", "The Godfather"
];

const GENRES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Documentary"];

const REAL_IMAGES = [
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "https://image.tmdb.org/t/p/w500/9xkGlFRqrN8btTLU0KQvOfn2PHr.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniL6E8AHtMY4kOuxZn7S44.jpg",
    "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
];

export const generateMovies = (count: number): Movie[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i.toString(),
    title: TITLES[i % TITLES.length],
    overview: `Experience the critically acclaimed masterpiece ${TITLES[i % TITLES.length]}. A story of courage, determination, and destiny that has captivated audiences worldwide.`,
    poster_path: REAL_IMAGES[i % REAL_IMAGES.length],
    backdrop_path: REAL_IMAGES[(i + 1) % REAL_IMAGES.length], // Use next image for backdrop
    youtubeId: getYoutubeIdByIndex(i),
    genres: [GENRES[Math.floor(Math.random() * GENRES.length)]],
    vote_average: Math.floor(Math.random() * 30 + 70) / 10,
    release_date: (2018 + Math.floor(Math.random() * 6)).toString(),
    type: 'movie',
    cast: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson", "Margot Robbie"].sort(() => 0.5 - Math.random()).slice(0, 3),
    tags: ["Exciting", "Dark", "Witty", "Violent", "Emotional"].sort(() => 0.5 - Math.random()).slice(0, 3),
    createdAt: new Date().toISOString()
  }));
};

export const MOCK_CATEGORIES = [
  { title: "Trending Now", data: generateMovies(20) },
  { title: "Top Rated", data: generateMovies(20) },
  { title: "Action Thrillers", data: generateMovies(20) },
  { title: "Comedies", data: generateMovies(20) },
  { title: "Sci-Fi & Fantasy", data: generateMovies(20) },
];
