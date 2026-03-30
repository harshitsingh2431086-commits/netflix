import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile, Movie } from '../types';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithRedirect } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { syncUser, getProfiles, addToMyList as addToMyListService, removeFromMyList as removeFromMyListService, createProfile, updateProfile as updateProfileService } from '../services/userService';
import { analyticsService } from '../services/analyticsService';

interface StoreContextType {
  user: User | null;
  profiles: Profile[];
  currentProfile: Profile | null;
  selectProfile: (profileId: string) => void;
  updateProfile: (profileId: string, data: Partial<Profile>) => Promise<void>;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  myList: string[];
  addToMyList: (movie: Movie) => void;
  removeFromMyList: (movieId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addProfile: (name: string, isKids: boolean, avatarUrl?: string) => Promise<void>;
  isPWAInstallable: boolean;
  isPWAStandalone: boolean;
  installPWA: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Minutes

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!standalone);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Auto Logout on Inactivity
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        alert("Session expired due to inactivity.");
      }, INACTIVITY_LIMIT);
    };

    // Events to monitor
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Set initial timer
    resetTimer();

    // Attach listeners
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  // Heartbeat for Analytics
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      analyticsService.updateHeartbeat(user.uid);
    }, 30000); // 30s
    return () => clearInterval(interval);
  }, [user]);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore first to get the correct role
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let dbRole: 'user' | 'admin' = 'user';
        let userPlan = 'Free';
        let subscriptionStatus: 'active' | 'inactive' | 'canceled' = 'inactive';

        const userData = userSnap.exists() ? userSnap.data() : null;
        if (userData) {
          if (userData.role) dbRole = userData.role as 'user' | 'admin';
          if (userData.plan) userPlan = userData.plan;
          if (userData.subscriptionStatus) subscriptionStatus = userData.subscriptionStatus;
        } else {
          // Fallback for new users or if not found
          dbRole = (firebaseUser.email?.includes('admin')) ? 'admin' : 'user';
        }

        const mappedUser: User & { photoURL?: string } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          plan: userPlan,
          subscriptionStatus: subscriptionStatus,
          role: dbRole,
          photoURL: firebaseUser.photoURL || undefined
        };
        setUser(mappedUser as any);

        // Security Check: Blocked User
        if (dbRole === 'user' && (userData?.status === 'blocked')) {
          await signOut(auth);
          alert("Your account has been restricted. Please contact support.");
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Sync user to Firestore (will create if missing, or update basic fields)
        await syncUser(mappedUser);

        // Fetch User Profiles
        let userProfiles = await getProfiles(mappedUser.uid);

        // 1. Auto-create default profile if none exists
        if (userProfiles.length === 0) {
          const photo = firebaseUser.photoURL || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
          const newProfile = await createProfile(mappedUser.uid, {
            name: firebaseUser.displayName || 'Me',
            isKids: false,
            avatarUrl: photo,
            myList: []
          });
          if (newProfile) userProfiles = [newProfile];
        }

        // 2. Fix broken avatars (wallpapers.com 403s) or missing ones
        const fixedProfiles = await Promise.all(userProfiles.map(async (p) => {
          const isBroken = p.avatarUrl && (p.avatarUrl.includes('wallpapers.com') || p.avatarUrl === '');
          if (isBroken || !p.avatarUrl) {
            const newUrl = firebaseUser.photoURL || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
            // Update in Firestore
            await updateProfileService(mappedUser.uid, p.id, { avatarUrl: newUrl });
            return { ...p, avatarUrl: newUrl };
          }
          return p;
        }));

        setProfiles(fixedProfiles);

        localStorage.setItem('NETFLIX_user', JSON.stringify(mappedUser));

        // Restore current profile if exists in fetched profiles
        const storedProfileId = localStorage.getItem('NETFLIX_profile_id');
        if (storedProfileId) {
          const matchedProfile = fixedProfiles.find(p => p.id === storedProfileId);
          if (matchedProfile) setCurrentProfile(matchedProfile);
        }

      } else {
        setUser(null);
        setProfiles([]);
        setCurrentProfile(null);
        localStorage.removeItem('NETFLIX_user');
        localStorage.removeItem('NETFLIX_profile_id');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (e) {
        alert("Google sign-in is unavailable. Please try again later or use email login.");
      }
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (e) {
          alert("Sign in failed. Please check your credentials and try again.");
          setIsLoading(false);
          throw error;
        }
      }
    }
    setIsLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    setProfiles([]);
    setCurrentProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!email) {
      alert("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Check your inbox.");
    } catch {
      alert("Unable to send reset email. Verify the address and try again.");
    }
  };

  const selectProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setCurrentProfile(profile);
      localStorage.setItem('NETFLIX_profile_id', profile.id);
    }
  };

  const refreshProfile = async () => {
    if (user && currentProfile) {
      const updatedProfiles = await getProfiles(user.uid);
      setProfiles(updatedProfiles);
      const updatedCurrent = updatedProfiles.find(p => p.id === currentProfile.id);
      if (updatedCurrent) setCurrentProfile(updatedCurrent);
    }
  };

  const addToMyList = async (movie: Movie) => {
    if (!user || !currentProfile) return;

    // Optimistic Update
    const updatedProfile = { ...currentProfile, myList: [...currentProfile.myList, movie.id] };
    setCurrentProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));

    // Firestore Update
    await addToMyListService(user.uid, currentProfile.id, movie.id);
    await refreshProfile(); // Ensure sync
  };

  const removeFromMyList = async (movieId: string) => {
    if (!user || !currentProfile) return;

    // Optimistic Update
    const updatedProfile = { ...currentProfile, myList: currentProfile.myList.filter(id => id !== movieId) };
    setCurrentProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));

    // Firestore Update
    await removeFromMyListService(user.uid, currentProfile.id, movieId);
    await refreshProfile();
  };

  const addProfile = async (name: string, isKids: boolean, avatarUrl?: string) => {
    if (!user) return;
    const newProfile = {
      name,
      isKids,
      avatarUrl: avatarUrl || (isKids
        ? 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'
        : 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'),
      myList: []
    };
    await createProfile(user.uid, newProfile);
    // Refresh profiles
    const userProfiles = await getProfiles(user.uid);
    setProfiles(userProfiles);
  };

  return (
    <StoreContext.Provider value={{
      user,
      profiles,
      currentProfile,
      selectProfile,
      updateProfile: async (id, data) => {
        if (!user) return;
        await updateProfileService(user.uid, id, data);
        await refreshProfile();
        // and update profiles list
        const updated = await getProfiles(user.uid);
        setProfiles(updated);
      },
      isLoading,
      login,
      loginWithGoogle,
      logout,
      myList: currentProfile?.myList || [], // Return IDs
      addToMyList,
      removeFromMyList,
      searchQuery,
      setSearchQuery,
      addProfile,
      resetPassword,
      isPWAInstallable: isInstallable,
      isPWAStandalone: isStandalone,
      installPWA
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};
