import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StoreProvider, useStore } from './context/Store';
import { AppRoute } from './types';
import { Offline } from './components/Offline';
import { SystemMonitor } from './components/SystemMonitor';
import { Toaster } from './components/Toaster';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Landing = React.lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const ProfileSelection = React.lazy(() => import('./pages/ProfileSelection').then(module => ({ default: module.ProfileSelection })));
const Search = React.lazy(() => import('./pages/Search').then(module => ({ default: module.Search })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const ContentManager = React.lazy(() => import('./pages/admin/ContentManager').then(module => ({ default: module.ContentManager })));
const SectionManager = React.lazy(() => import('./pages/admin/SectionManager').then(module => ({ default: module.SectionManager })));
const SettingsManager = React.lazy(() => import('./pages/admin/SettingsManager').then(module => ({ default: module.SettingsManager })));
const PlanManager = React.lazy(() => import('./pages/admin/PlanManager').then(module => ({ default: module.PlanManager })));
const ComingSoonManager = React.lazy(() => import('./pages/admin/ComingSoonManager').then(module => ({ default: module.ComingSoonManager })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Account = React.lazy(() => import('./pages/Account').then(module => ({ default: module.Account })));
const InfoPage = React.lazy(() => import('./pages/InfoPage').then(module => ({ default: module.InfoPage })));
const Downloads = React.lazy(() => import('./pages/Downloads').then(module => ({ default: module.Downloads })));

const Router: React.FC = () => {
  const { user, currentProfile, isLoading } = useStore();
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Security: Disable Context Menu (DRM Simulation)
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Security: Session/Tab Detection
    const channel = new BroadcastChannel('netflix_session');
    channel.postMessage('new_tab');
    channel.onmessage = (msg) => {
      if (msg.data === 'new_tab') {
        console.warn("Security Alert: Multiple sessions detected.");
      }
    };

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('contextmenu', handleContextMenu);
      channel.close();
    }
  }, []);

  if (isOffline) {
    return <Offline />;
  }

  // Determine which component to render
  const getComponent = () => {
    // Admin Routes
    if (currentHash.startsWith('#/admin')) {
      if (!user || user.role !== 'admin') {
        window.location.hash = user ? AppRoute.BROWSE : AppRoute.LOGIN;
        return null;
      }
      switch (currentHash) {
        case '#/admin/content': return <ContentManager />;
        case '#/admin/sections': return <SectionManager />;
        case '#/admin/settings': return <SettingsManager />;
        case '#/admin/plans': return <PlanManager />;
        case '#/admin/coming-soon': return <ComingSoonManager />;
        default: return <AdminDashboard />;
      }
    }

    // Public Routes
    if (currentHash === `#${AppRoute.LOGIN}`) {
      if (user) {
        window.location.hash = AppRoute.BROWSE;
        return null;
      }
      return <Login />;
    }

    // Info Pages
    const infoRoutes = [
      AppRoute.FAQ, AppRoute.HELP, AppRoute.MEDIA, AppRoute.INVESTORS,
      AppRoute.JOBS, AppRoute.WAYS_TO_WATCH, AppRoute.TERMS, AppRoute.PRIVACY,
      AppRoute.COOKIES, AppRoute.CORPORATE, AppRoute.CONTACT, AppRoute.SPEED_TEST,
      AppRoute.LEGAL, AppRoute.ORIGINALS, AppRoute.AUDIO_DESCRIPTION, AppRoute.GIFT_CARDS
    ];

    if (infoRoutes.some(route => currentHash === `#${route}`)) {
      return <InfoPage />;
    }

    // Auth Checks
    if (!user) return <Landing />;
    if (user.subscriptionStatus !== 'active' && user.role !== 'admin') return <Landing />;
    if (!currentProfile) return <ProfileSelection />;

    // App Routes
    switch (currentHash) {
      case `#${AppRoute.PROFILES}`: return <ProfileSelection />;
      case `#${AppRoute.SEARCH}`: return <Search />;
      case `#${AppRoute.TV_SHOWS}`: return <Home category="tv" />;
      case `#${AppRoute.MOVIES}`: return <Home category="movie" />;
      case `#${AppRoute.NEW_POPULAR}`: return <Home category="new" />;
      case `#${AppRoute.MY_LIST}`: return <Home category="my-list" />;
      case `#${AppRoute.ACCOUNT}`: return <Account />;
      case '#/downloads': return <Downloads />;
      default: return <Home />;
    }
  };

  const Component = getComponent();

  return (
    <AnimatePresence mode="wait">
      {Component && (
        <motion.div
          key={currentHash}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {Component}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <SystemMonitor />
      <Toaster />
      <Suspense fallback={
        <div className="h-screen w-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e50914]"></div>
        </div>
      }>
        <Router />
      </Suspense>
    </StoreProvider>
  );
};

export default App;