import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { AppRoute, Notification as AppNotification } from '../types';
import { Search, Bell, ChevronDown, Menu, X, Trash2 } from 'lucide-react';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { MobileSidebar } from './MobileSidebar';
import { PWAInstall } from './PWAInstall';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { useOffline } from '../hooks/useOffline'; // Import Hook

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
  const isOffline = useOffline();
  const { user, logout, currentProfile, profiles, selectProfile, searchQuery, setSearchQuery } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  // ... (existing effects)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Notifications Listener
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(notifs);

      // Check for unread
      const unread = notifs.some(n => !n.read);
      setHasNewNotif(unread);

      // Trigger Browser Notification for newest if it just arrived
      const newest = notifs[0];
      if (newest && !newest.read && newest.createdAt > new Date(Date.now() - 10000).toISOString()) {
        showBrowserNotification(newest);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const showBrowserNotification = (notif: AppNotification) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(notif.title, {
        body: notif.message,
        icon: notif.image || '/favicon.png'
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
    await Promise.all(promises);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.hash = AppRoute.SEARCH;
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white padding-bottom-safe relative">
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-zinc-800 text-gray-300 text-xs md:text-sm text-center py-2 z-[200] border-t border-zinc-700 animate-in slide-in-from-bottom duration-300">
          You are currently offline. Some features may be unavailable.
        </div>
      )}

      {showNav && (
        <nav
          className={`fixed w-full z-[100] transition-colors duration-700 ease-in-out px-4 md:px-12 py-4 flex items-center justify-between ${isScrolled || mobileMenuOpen
            ? 'bg-[#141414] shadow-md'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
            }`}
        >
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile Menu Toggle (Keep for now, but MobileNav is primary) */}
            {user && (
              <div className="lg:hidden md:block hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6 cursor-pointer" /> : <Menu className="w-6 h-6 cursor-pointer" />}
              </div>
            )}

            <img
              src="/logoN.png"
              alt="NETFLIX"
              className="h-8 md:h-20 cursor-pointer object-contain"
              onClick={() => window.location.hash = AppRoute.BROWSE}
            />
            {user && (
              <ul className="hidden lg:flex gap-5 text-sm font-medium text-gray-200">
                <li className="hover:text-gray-400 cursor-pointer transition" onClick={() => window.location.hash = AppRoute.BROWSE}>Home</li>
                <li className="hover:text-gray-400 cursor-pointer transition" onClick={() => window.location.hash = AppRoute.TV_SHOWS}>TV Shows</li>
                <li className="hover:text-gray-400 cursor-pointer transition" onClick={() => window.location.hash = AppRoute.MOVIES}>Movies</li>
                <li className="hover:text-gray-400 cursor-pointer transition" onClick={() => window.location.hash = AppRoute.NEW_POPULAR}>New & Popular</li>
                <li className="hover:text-gray-400 cursor-pointer transition" onClick={() => window.location.hash = AppRoute.MY_LIST}>My List</li>
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {user ? (
              <>
                <form onSubmit={handleSearchSubmit} className={`hidden md:flex items-center border border-white/0 ${searchOpen ? 'border-white/100 bg-black/80' : ''} transition-all duration-300 p-1`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchOpen && !searchQuery) setSearchOpen(false);
                      else { setSearchOpen(true); document.getElementById('searchInput')?.focus(); }
                    }}
                  >
                    <Search className="w-6 h-6" />
                  </button>
                  <input
                    id="searchInput"
                    type="text"
                    placeholder="Titles, people, genres"
                    className={`${searchOpen ? 'w-40 md:w-60 px-2' : 'w-0 px-0'} bg-transparent transition-all duration-300 focus:outline-none text-sm`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                  />
                </form>

                <div className="relative">
                  <Bell
                    className="w-6 h-6 cursor-pointer hover:text-gray-300 hidden md:block"
                    onClick={() => { setShowNotifMenu(!showNotifMenu); if (!showNotifMenu) markAllRead(); }}
                  />
                  {hasNewNotif && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black hidden md:block"></span>
                  )}

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-4 w-80 bg-black/95 border border-gray-700 rounded-lg shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Notifications</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              className="p-4 hover:bg-white/5 transition flex gap-3 border-b border-gray-800 last:border-0 group cursor-pointer"
                              onClick={() => {
                                if (n.link) window.location.hash = n.link.startsWith('#') ? n.link.substring(1) : n.link;
                                setShowNotifMenu(false);
                              }}
                            >
                              {n.image && <img src={n.image} className="w-16 h-10 object-cover rounded" alt="" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white line-clamp-1">{n.title}</p>
                                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                              </div>
                              {!n.read && <div className="w-2 h-2 bg-red-600 rounded-full shrink-0 self-center"></div>}
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-gray-500 text-sm">
                            No new notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                  >
                    <img
                      src={currentProfile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                      alt="Profile"
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
                      }}
                    />
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                  </div>

                  {showAccountMenu && (
                    <div className="absolute right-0 mt-4 w-56 bg-black/90 border border-gray-700 rounded shadow-xl py-2 z-50">
                      <div className="py-2 px-3 flex flex-col gap-2 border-b border-gray-700">
                        {/* Show other profiles */}
                        {profiles.filter(p => p.id !== currentProfile?.id).map(profile => (
                          <div
                            key={profile.id}
                            className="flex items-center gap-3 hover:underline cursor-pointer"
                            onClick={() => selectProfile(profile.id)}
                          >
                            <img src={profile.avatarUrl} className="w-8 h-8 rounded" alt={profile.name} />
                            <span className="text-sm text-gray-300">{profile.name}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 hover:underline cursor-pointer" onClick={() => window.location.hash = AppRoute.PROFILES}>
                          <span className="text-sm text-gray-300 ml-11 hover:text-white">Manage Profiles</span>
                        </div>
                      </div>

                      <div className="py-2">
                        <button className="w-full text-left px-4 py-2 text-sm text-white hover:underline" onClick={() => window.location.hash = AppRoute.ACCOUNT}>Account</button>
                        <button className="w-full text-left px-4 py-2 text-sm text-white hover:underline" onClick={() => window.location.hash = AppRoute.HELP}>Help Center</button>
                        {user.role === 'admin' && (
                          <button className="w-full text-left px-4 py-2 text-sm text-white hover:underline text-red-500 font-bold" onClick={() => window.location.hash = AppRoute.ADMIN}>Admin Dashboard</button>
                        )}
                      </div>
                      <button
                        className="w-full text-center px-4 py-3 text-sm text-white hover:underline border-t border-gray-700 mt-2"
                        onClick={() => {
                          logout();
                          window.location.hash = AppRoute.LANDING;
                        }}
                      >
                        Sign out of NETFLIX
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => window.location.hash = AppRoute.LOGIN}
                className="bg-[#e50914] px-4 py-2 rounded text-sm font-medium hover:bg-[#f40612] transition"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Dropdown */}
          <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </nav>
      )}
      <main className="pb-16 lg:pb-0">
        {children}
      </main>
      <Footer />
      <MobileNav user={user} />
      <PWAInstall />
    </div>
  );
};
