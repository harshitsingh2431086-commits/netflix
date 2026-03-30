import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query, where, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { Content, Section, AppRoute } from '../../types';
import { Pencil, Trash2, Plus, X, Star, Play, FileVideo, Eye, EyeOff } from 'lucide-react';
import { extractGoogleDriveId, extractYoutubeId } from '../../services/utils';

export const ContentManager: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [sections, setSections] = useState<Section[]>([]); // Curated sections
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [heroContentId, setHeroContentId] = useState<string>('');

  const { register, handleSubmit, reset, setValue, watch } = useForm<Content>();
  const watchedYoutubeId = watch('youtubeId');
  const watchedDriveId = watch('movieDriveId');

  const fetchData = async () => {
    // Fetch Content
    const qContent = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
    const snapContent = await getDocs(qContent);
    setContents(snapContent.docs.map(d => ({ id: d.id, ...d.data() } as Content)));

    // Fetch All Sections (for manual content assignment)
    const qSections = query(collection(db, 'sections'), orderBy('title'));
    const snapSections = await getDocs(qSections);
    setSections(snapSections.docs.map(d => ({ id: d.id, ...d.data() } as Section)));

    // Fetch Hero Settings
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
      if (settingsSnap.exists()) {
        setHeroContentId(settingsSnap.data().heroContentId || '');
      }
    } catch (e) { console.error("Error fetching settings", e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSetHero = async (contentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Toggle off if already selected, or switch to new one
      const newId = heroContentId === contentId ? '' : contentId;
      await setDoc(doc(db, 'settings', 'global'), { heroContentId: newId }, { merge: true });
      setHeroContentId(newId);
    } catch (e) {
      alert('Failed to update Hero content');
    }
  };

  const onSubmit = async (data: Content) => {
    try {
      const formattedData = {
        ...data,
        // Auto-copy backdrop to poster (same image for both)
        poster_path: data.backdrop_path,
        mobile_poster_path: data.mobile_backdrop_path || data.backdrop_path,
        genres: typeof data.genres === 'string' ? (data.genres as string).split(',').map((g: string) => g.trim()) : data.genres,
        cast: typeof data.cast === 'string' ? (data.cast as string).split(',').map((c: string) => c.trim()) : data.cast || [],
        tags: typeof data.tags === 'string' ? (data.tags as string).split(',').map((t: string) => t.trim()) : data.tags || [],
        vote_average: Number(data.vote_average),
        // Ensure booleans are correct
        isPublished: !!data.isPublished,
        allowDownload: !!data.allowDownload,
        allowPlayback: !!data.allowPlayback,
      };

      let contentId = editingId;

      if (editingId) {
        await updateDoc(doc(db, 'content', editingId), formattedData);
      } else {
        const docRef = await addDoc(collection(db, 'content'), {
          ...formattedData,
          createdAt: new Date().toISOString()
        });
        contentId = docRef.id;
      }

      // Update Sections Logic
      if (contentId) {
        // Find which sections need updates
        const updatePromises = sections.map(async (section) => {
          const isSelected = selectedSectionIds.includes(section.id);
          const currentlyHasContent = section.contentIds?.includes(contentId!) || false;

          if (isSelected && !currentlyHasContent) {
            // Add to section
            await updateDoc(doc(db, 'sections', section.id), {
              contentIds: arrayUnion(contentId)
            });
          } else if (!isSelected && currentlyHasContent) {
            // Remove from section
            await updateDoc(doc(db, 'sections', section.id), {
              contentIds: arrayRemove(contentId)
            });
          }
        });
        await Promise.all(updatePromises);
      }

      setIsEditing(false);
      setEditingId(null);
      reset();
      fetchData(); // Refresh both content and sections data

      // Send Global Notification for new content
      if (!editingId) {
        await addDoc(collection(db, 'notifications'), {
          title: 'New Content Added',
          message: `${formattedData.title}: ${formattedData.overview?.substring(0, 100)}...`,
          image: formattedData.backdrop_path || formattedData.poster_path,
          type: 'content',
          link: `#${AppRoute.BROWSE}`,
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    } catch (e: any) {
      alert("Error saving content: " + e.message);
    }
  };

  const validateYoutubeId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);
  const validateDriveId = (id: string) => /^[a-zA-Z0-9_-]{20,}$/.test(id);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this content?")) {
      await deleteDoc(doc(db, 'content', id));
      fetchData();
    }
  };

  const startEdit = (content: Content) => {
    setEditingId(content.id);
    setValue('title', content.title);
    setValue('overview', content.overview);
    setValue('poster_path', content.poster_path);
    setValue('backdrop_path', content.backdrop_path);
    setValue('mobile_poster_path', content.mobile_poster_path || '');
    setValue('mobile_backdrop_path', content.mobile_backdrop_path || '');
    setValue('youtubeId', content.youtubeId);
    setValue('type', content.type);
    setValue('genres', content.genres);
    setValue('cast', content.cast);
    setValue('tags', content.tags);
    setValue('movieDriveId', content.movieDriveId);
    setValue('isPublished', content.isPublished !== false); // Default to true if undefined
    setValue('allowDownload', content.allowDownload !== false); // Default to true if undefined
    setValue('allowPlayback', content.allowPlayback !== false); // Default to true if undefined
    setValue('vote_average', content.vote_average);
    setValue('release_date', content.release_date);
    setValue('duration', content.duration);
    setValue('maturityRating', content.maturityRating);
    setValue('quality', content.quality);

    // Determine which curated sections this content is currently in
    const currentSections = sections.filter(s => s.contentIds?.includes(content.id)).map(s => s.id);
    setSelectedSectionIds(currentSections);

    setIsEditing(true);
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSectionIds(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  return (
    <AdminLayout title="Content Management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-gray-400">Manage Movies & TV Shows</h2>
        <button
          onClick={() => { reset(); setEditingId(null); setSelectedSectionIds([]); setIsEditing(true); }}
          className="bg-[#e50914] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition"
        >
          <Plus size={18} /> Add New
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Content' : 'Add Content'}</h3>
              <button onClick={() => setIsEditing(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <input {...register('title', { required: true })} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Stranger Things" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select {...register('type')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 outline-none">
                    <option value="movie">Movie</option>
                    <option value="tv">TV Show</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Overview</label>
                <textarea {...register('overview')} rows={4} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Movie description..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">🖥️ PC Thumbnail Link</label>
                  <input {...register('backdrop_path')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="https://... (used for both poster & backdrop)" />
                  <p className="text-xs text-gray-500 mt-1">This image will be used everywhere on desktop</p>
                </div>
                <div>
                  <label className="block text-sm text-purple-400 mb-1">📱 Smartphone Thumbnail Link</label>
                  <input {...register('mobile_backdrop_path')} className="w-full bg-[#333] rounded p-2 text-white border border-purple-600/50 focus:border-purple-500 outline-none" placeholder="https://... (leave empty to use PC image)" />
                  <p className="text-xs text-gray-500 mt-1">Optional - for mobile-optimized image</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#2a2a2a] p-4 rounded border border-gray-700">
                {/* YouTube Trailer Section */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-red-500 font-bold mb-2">
                    <Play size={16} /> YouTube Trailer ID
                  </label>
                  <input
                    {...register('youtubeId', {
                      validate: (value) => !value || validateYoutubeId(value) || 'Invalid YouTube ID (11 chars required)',
                      onChange: (e) => {
                        const extracted = extractYoutubeId(e.target.value);
                        if (extracted && extracted !== e.target.value) {
                          setValue('youtubeId', extracted, { shouldValidate: true });
                        }
                      }
                    })}
                    className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-red-500 outline-none mb-1"
                    placeholder="Paste YouTube Link or ID"
                  />
                  <p className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Supports Full Links & IDs</span>
                    {watchedYoutubeId && validateYoutubeId(watchedYoutubeId) && (
                      <span className="text-green-500 font-bold">✓ ID Detected</span>
                    )}
                  </p>

                  {/* Preview Helper */}
                  <div className="aspect-video bg-black rounded overflow-hidden relative group border border-gray-800">
                    {watchedYoutubeId && validateYoutubeId(watchedYoutubeId) ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${watchedYoutubeId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
                        {watchedYoutubeId ? 'Invalid ID' : 'Preview will appear here'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Drive Movie Section */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-blue-400 font-bold mb-2">
                    <FileVideo size={16} /> Google Drive File ID
                  </label>
                  <input
                    {...register('movieDriveId', {
                      validate: (value) => !value || validateDriveId(value) || 'Invalid Drive File ID',
                      onChange: (e) => {
                        const extracted = extractGoogleDriveId(e.target.value);
                        if (extracted && extracted !== e.target.value) {
                          setValue('movieDriveId', extracted, { shouldValidate: true });
                        }
                      }
                    })}
                    className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-blue-500 outline-none mb-1"
                    placeholder="Paste Drive Link or ID"
                  />
                  <p className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Supports Full Links & IDs</span>
                    {watchedDriveId && validateDriveId(watchedDriveId) && (
                      <span className="text-green-500 font-bold">✓ ID Detected</span>
                    )}
                  </p>

                  <div className="aspect-video bg-black rounded overflow-hidden relative flex items-center justify-center border border-gray-800">
                    {watchedDriveId && validateDriveId(watchedDriveId) ? (
                      <iframe
                        src={`https://drive.google.com/file/d/${watchedDriveId}/preview`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Drive Preview"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center">
                        <FileVideo className="mx-auto mb-1 text-gray-600" />
                        <span className="text-xs text-gray-600">{watchedDriveId ? 'Invalid ID' : 'Movie Preview'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...register('isPublished')} className="w-5 h-5 accent-green-500" />
                      <span className="text-white text-sm">Published</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...register('allowDownload')} className="w-5 h-5 accent-blue-500" />
                      <span className="text-white text-sm">Allow Download</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...register('allowPlayback')} className="w-5 h-5 accent-purple-500" />
                      <span className="text-white text-sm">Allow Playback</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rating (0-10)</label>
                  <input type="number" step="0.1" {...register('vote_average')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Release Year</label>
                  <input {...register('release_date')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="2023" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (min)</label>
                  <input type="number" {...register('duration')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="120" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Maturity Rating</label>
                  <select {...register('maturityRating')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 outline-none">
                    <option value="U">U</option>
                    <option value="U/A 7+">U/A 7+</option>
                    <option value="U/A 13+">U/A 13+</option>
                    <option value="U/A 16+">U/A 16+</option>
                    <option value="A">A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Quality</label>
                  <select {...register('quality')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 outline-none">
                    <option value="HD">HD</option>
                    <option value="4K">4K</option>
                    <option value="4K+HDR">4K+HDR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Genres (comma separated)</label>
                <input {...register('genres')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Action, Sci-Fi" />
              </div>

              {/* Sections Selector */}
              {sections.length > 0 && (
                <div className="bg-[#2a2a2a] p-4 rounded border border-gray-700">
                  <label className="block text-sm text-gray-400 mb-2 font-bold">Assign to Sections</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {sections.map(section => (
                      <div key={section.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`sec-${section.id}`}
                          checked={selectedSectionIds.includes(section.id)}
                          onChange={() => handleSectionToggle(section.id)}
                          className="accent-[#e50914]"
                        />
                        <label htmlFor={`sec-${section.id}`} className="text-sm cursor-pointer select-none">
                          {section.title} <span className="text-xs text-gray-500 uppercase">[{section.scope || 'home'}]</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Cast (comma separated)</label>
                <input {...register('cast')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Tom Cruise, Emily Blunt" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
                <input {...register('tags')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Exciting, Thrilling" />
              </div>

              <button type="submit" className="w-full bg-[#e50914] py-3 rounded font-bold hover:bg-red-700 transition mt-4">Save Content</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#1f1f1f] rounded-lg border border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-[#141414] text-gray-400 text-xs uppercase">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Status</th>
              <th className="p-4">Type</th>
              <th className="p-4">Rating</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {contents.map(c => (
              <tr
                key={c.id}
                className="hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                onClick={() => startEdit(c)}
              >
                <td className="p-4 font-medium flex items-center gap-3">
                  <button
                    onClick={(e) => handleSetHero(c.id, e)}
                    className={`p-1 rounded ${heroContentId === c.id ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50'}`}
                    title="Set as Homepage Hero"
                  >
                    <Star size={18} fill={heroContentId === c.id ? "currentColor" : "none"} />
                  </button>
                  <img src={c.poster_path} className="w-8 h-12 object-cover rounded bg-gray-700" alt="" />
                  {c.title}
                </td>
                <td className="p-4">
                  {c.isPublished !== false ? (
                    <span className="flex items-center gap-1 text-green-500 text-xs font-bold border border-green-500/30 bg-green-500/10 px-2 py-1 rounded-full w-fit">
                      <Eye size={12} /> Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500 text-xs font-bold border border-gray-600 bg-gray-700/30 px-2 py-1 rounded-full w-fit">
                      <EyeOff size={12} /> Draft
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-400 capitalize">{c.type}</td>
                <td className="p-4 text-green-500">{c.vote_average}</td>
                <td className="p-4 text-right">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(c); }} className="text-gray-400 hover:text-white mr-3 md:hidden"><Pencil size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contents.length === 0 && <div className="p-8 text-center text-gray-500">No content found. Please add some movies.</div>}
      </div>
    </AdminLayout>
  );
};