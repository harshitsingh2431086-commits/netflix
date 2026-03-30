import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Content, Section, SiteSettings } from '../types';

// --- READ OPERATIONS (Client) ---

export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const docRef = doc(db, 'settings', 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as SiteSettings;
  } catch (e) {
    console.error("Error fetching settings:", e);
  }
  return { siteName: "NETFLIX", maintenanceMode: false };
};

export const getHeroContent = async (): Promise<Content | null> => {
  try {
    const settings = await getSiteSettings();
    if (settings.heroContentId) {
      const docRef = doc(db, 'content', settings.heroContentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Content;
    }
    // Fallback: Get most recent movie
    const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as Content;
  } catch (e) { console.error(e); }
  return null;
};

export const getSections = async (scope?: 'home' | 'tv' | 'movie' | 'new'): Promise<Section[]> => {
  try {
    // Fetch ALL sections and filter/sort client-side to avoid "Existing Index" error requirements
    const colRef = collection(db, 'sections');
    const snap = await getDocs(colRef);
    const sections = snap.docs.map(d => ({ id: d.id, ...d.data() } as Section));

    return sections
      .filter(s => s.enabled !== false) // Treat undefined or true as enabled
      .filter(s => {
        if (!scope) return true;
        const target = scope;
        // Support both old 'scope' and new 'scopes' array
        const sScopes = s.scopes || [(s as any).scope || 'home'];
        return sScopes.includes(target);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    console.error("Error fetching sections:", e);
    return [];
  }
};

export const getContentBySection = async (section: Section): Promise<Content[]> => {
  try {
    let q;
    const contentRef = collection(db, 'content');

    if (section.type === 'genre' && section.genreFilter) {
      q = query(contentRef, where('genres', 'array-contains', section.genreFilter), limit(20));
    } else if (section.type === 'originals') {
      // Assuming originals are TV shows or have a flag
      q = query(contentRef, where('type', '==', 'tv'), limit(20));
    } else if (section.type === 'curated' && section.contentIds && section.contentIds.length > 0) {
      // Firestore 'in' query supports up to 10
      const chunk = section.contentIds.slice(0, 10);
      q = query(contentRef, where('__name__', 'in', chunk));
    } else {
      // Trending / Default
      q = query(contentRef, orderBy('vote_average', 'desc'), limit(20));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Content));
  } catch (e) {
    console.error(`Error fetching section ${section.title}`, e);
    return [];
  }
};

export const searchContent = async (text: string): Promise<Content[]> => {
  // Client-side search matching title, overview, genres, cast, and tags
  const q = query(collection(db, 'content'), limit(100));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Content));
  const searchLower = text.toLowerCase();

  return all.filter(c => {
    const titleMatch = c.title?.toLowerCase().includes(searchLower);
    const overviewMatch = c.overview?.toLowerCase().includes(searchLower);
    const genreMatch = c.genres?.some(g => g.toLowerCase().includes(searchLower));
    const castMatch = c.cast?.some(a => a.toLowerCase().includes(searchLower));
    const tagMatch = c.tags?.some(t => t.toLowerCase().includes(searchLower));
    return titleMatch || overviewMatch || genreMatch || castMatch || tagMatch;
  });
}


export const clearDatabase = async () => {

  const confirmText = "Are you sure you want to DELETE ALL content and sections? This cannot be undone.";
  if (!window.confirm(confirmText)) return;

  // 1. Delete All Content
  const contentQ = query(collection(db, 'content'));
  const contentSnap = await getDocs(contentQ);
  const contentDeletions = contentSnap.docs.map(d => deleteDoc(doc(db, 'content', d.id)));
  await Promise.all(contentDeletions);

  // 2. Delete All Sections
  const sectionsQ = query(collection(db, 'sections'));
  const sectionsSnap = await getDocs(sectionsQ);
  const sectionDeletions = sectionsSnap.docs.map(d => deleteDoc(doc(db, 'sections', d.id)));
  await Promise.all(sectionDeletions);


  alert("All data cleared successfully.");
};
