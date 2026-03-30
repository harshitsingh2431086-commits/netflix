export interface Content {
  id: string; // Firestore Doc ID
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  mobile_poster_path?: string; // Mobile-specific poster (optional)
  mobile_backdrop_path?: string; // Mobile-specific backdrop (optional)
  youtubeId: string;
  movieDriveId?: string; // Google Drive File ID
  allowDownload?: boolean;
  allowPlayback?: boolean;
  isPublished?: boolean;
  type: 'movie' | 'tv';
  genres: string[];
  release_date: string;
  vote_average: number;
  featured?: boolean;
  createdAt: string;
  cast?: string[];
  tags?: string[];
  comingSoon?: boolean;
  progress?: number; // Optional: For Continue Watching
  duration?: number; // In minutes
  maturityRating?: string; // e.g. "U/A 13+"
  quality?: string; // e.g. "4K"
  partOfSeries?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  image?: string;
  type: 'content' | 'system';
  link?: string;
  createdAt: string;
  read?: boolean;
}

export interface Section {
  id: string;
  // (omitting untouched lines in replacement content to safe space if possible, but tool requires valid replacement) 
  // Actually I will do two separate calls or just include the full context if small enough.
  // The replace_file_content tool needs exact target content.
  // I'll split this into two separate edits for safety since they are far apart in the file.

  title: string;
  order: number;
  type: 'trending' | 'genre' | 'curated' | 'originals';
  genreFilter?: string; // If type is genre
  contentIds?: string[]; // If type is curated
  enabled: boolean;
  scopes: ('home' | 'tv' | 'movie' | 'new')[]; // Routes where section appears
}

export interface SiteSettings {
  siteName: string;
  heroContentId?: string; // ID of the content to show in Hero
  heroVideoQuality?: 'auto' | 'hd720' | 'hd1080' | 'highres'; // YouTube quality preference
  maintenanceMode: boolean;
  contactEmail?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  razorpayPlanId: string;
  features: string[];
  active: boolean;
  quality: 'Good' | 'Better' | 'Best';
  resolution: '720p' | '1080p' | '4K+HDR';
}

export interface Subscription {
  id: string;
  uid: string;
  planId: string;
  razorpaySubscriptionId: string;
  status: 'active' | 'created' | 'authenticated' | 'expired' | 'halted' | 'cancelled';
  currentPeriodStart: number;
  currentPeriodEnd: number;
}

// Keeping existing types for compatibility during migration, extending where necessary
export interface Movie extends Content { }

export interface User {
  uid: string;
  email: string;
  razorpayCustomerId?: string;
  plan: string; // Name of the plan for UI display
  subscriptionStatus?: 'active' | 'inactive' | 'canceled';
  role?: 'user' | 'admin';
  status?: 'active' | 'blocked';
  lastLoginAt?: string;
  lastLogoutAt?: string;
  lastActiveAt?: string;
  totalWatchTime?: number; // In seconds
  continueWatching?: ContinueWatchingItem[];
}

export interface ContinueWatchingItem {
  movieId: string;
  progress: number; // 0-100 percentage
  lastWatchedAt: string; // ISO String
  stoppedAt: number; // Seconds
  duration: number; // Seconds
}

export interface ViewingLog {
  id?: string;
  userId: string;
  contentId: string;
  contentType: 'movie' | 'trailer';
  genre: string[];
  startedAt: string;
  endedAt?: string;
  watchDurationSeconds: number;
}

export interface DownloadLog {
  id?: string;
  userId: string;
  movieId: string;
  downloadedAt: string;
}

export interface Session {
  id?: string;
  userId: string;
  sessionStart: string;
  sessionEnd?: string;
  totalSeconds?: number;
}

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string;
  isKids: boolean;
  myList: string[]; // Changed to string array for Firestore IDs
}

export enum AppRoute {
  LANDING = '/',
  BROWSE = '/browse',
  LOGIN = '/login',
  SIGNUP = '/signup',
  PROFILES = '/profiles',
  SEARCH = '/search',
  ACCOUNT = '/account',
  PLANS = '/plans',
  ADMIN = '/admin',
  ADMIN_CONTENT = '/admin/content',
  ADMIN_SECTIONS = '/admin/sections',
  ADMIN_PLANS = '/admin/plans',
  ADMIN_SETTINGS = '/admin/settings',
  ADMIN_COMING_SOON = '/admin/coming-soon',
  TV_SHOWS = '/tv-shows',
  MOVIES = '/movies',
  NEW_POPULAR = '/new-popular',
  MY_LIST = '/my-list',
  // Footer Pages
  FAQ = '/faq',
  HELP = '/help',
  MEDIA = '/media',
  INVESTORS = '/investors',
  JOBS = '/jobs',
  WAYS_TO_WATCH = '/ways-to-watch',
  TERMS = '/terms',
  PRIVACY = '/privacy',
  COOKIES = '/cookies',
  CORPORATE = '/corporate',
  CONTACT = '/contact',
  SPEED_TEST = '/speed-test',
  LEGAL = '/legal',
  ORIGINALS = '/originals',
  AUDIO_DESCRIPTION = '/audio-description',
  GIFT_CARDS = '/gift-cards'
}

export interface ContentRequest {
  id: string;
  userId: string;
  userEmail: string;
  contentTitle: string;
  status: 'pending' | 'resolved' | 'failed';
  createdAt: string;
}

export interface TMDBResponse {
  results: Movie[];
}
