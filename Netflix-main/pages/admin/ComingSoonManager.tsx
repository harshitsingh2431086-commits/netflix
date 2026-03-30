import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query, where } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { Content } from '../../types';
import { Pencil, Trash2, Plus, X, Calendar } from 'lucide-react';

export const ComingSoonManager: React.FC = () => {
    const [contents, setContents] = useState<Content[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<Content>();

    const fetchContent = async () => {
        // Query for content where comingSoon is true
        // Note: You might need a composite index for this query: 'comingSoon' Ascending, 'release_date' Ascending
        try {
            const q = query(
                collection(db, 'content'),
                where('comingSoon', '==', true)
                // orderBy('release_date', 'asc') // Temporarily removed to avoid index issues if not created
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Content));
            // Sort manually if index is missing
            data.sort((a, b) => new Date(a.release_date || '').getTime() - new Date(b.release_date || '').getTime());
            setContents(data);
        } catch (e) {
            console.error("Error fetching coming soon:", e);
        }
    };

    useEffect(() => { fetchContent(); }, []);

    const onSubmit = async (data: Content) => {
        try {
            const formattedData = {
                ...data,
                comingSoon: true, // Force this flag
                genres: typeof data.genres === 'string' ? (data.genres as string).split(',').map((g: string) => g.trim()) : data.genres,
                cast: typeof data.cast === 'string' ? (data.cast as string).split(',').map((c: string) => c.trim()) : data.cast || [],
                tags: typeof data.tags === 'string' ? (data.tags as string).split(',').map((t: string) => t.trim()) : data.tags || [],
                vote_average: Number(data.vote_average) || 0
            };

            if (editingId) {
                await updateDoc(doc(db, 'content', editingId), formattedData);
            } else {
                await addDoc(collection(db, 'content'), {
                    ...formattedData,
                    createdAt: new Date().toISOString()
                });
            }
            setIsEditing(false);
            setEditingId(null);
            reset();
            fetchContent();
        } catch (e) {
            alert("Error saving content: " + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this content?")) {
            await deleteDoc(doc(db, 'content', id));
            fetchContent();
        }
    };

    const startEdit = (content: Content) => {
        setEditingId(content.id);
        setValue('title', content.title);
        setValue('overview', content.overview);
        setValue('poster_path', content.poster_path);
        setValue('backdrop_path', content.backdrop_path);
        setValue('youtubeId', content.youtubeId);
        setValue('type', content.type);
        setValue('genres', content.genres);
        setValue('cast', content.cast);
        setValue('tags', content.tags);
        setValue('release_date', content.release_date);
        setIsEditing(true);
    };

    return (
        <AdminLayout title="Coming Soon Manager">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-white font-bold text-xl">Coming Soon</h2>
                    <p className="text-gray-400 text-sm">Manage upcoming releases shown in the 'New & Popular' feed.</p>
                </div>
                <button
                    onClick={() => { reset(); setEditingId(null); setIsEditing(true); }}
                    className="bg-[#e50914] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition"
                >
                    <Plus size={18} /> Add Upcoming
                </button>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#181818] p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit Upcoming' : 'Add Upcoming'}</h3>
                            <button onClick={() => setIsEditing(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                                    <input {...register('title', { required: true })} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Avatar 3" />
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
                                <textarea {...register('overview')} rows={3} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Description of the upcoming title..."></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Poster URL</label>
                                    <input {...register('poster_path')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">YouTube Trailer ID</label>
                                    <input {...register('youtubeId')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="dQw4w9WgXcQ" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Release Date (Future)</label>
                                <input type="date" {...register('release_date', { required: true })} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Genres (comma separated)</label>
                                <input {...register('genres')} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none" placeholder="Action, Sci-Fi" />
                            </div>

                            <button type="submit" className="w-full bg-[#e50914] py-3 rounded font-bold hover:bg-red-700 transition mt-4">Save Upcoming Title</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-[#1f1f1f] rounded-lg border border-gray-800 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-[#141414] text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Release Date</th>
                            <th className="p-4">Type</th>
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
                                    <img src={c.poster_path} className="w-8 h-12 object-cover rounded bg-gray-700" alt="" />
                                    {c.title}
                                </td>
                                <td className="p-4 text-gray-400">{c.release_date}</td>
                                <td className="p-4 text-gray-400 capitalize">{c.type}</td>
                                <td className="p-4 text-right">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {contents.length === 0 && <div className="p-8 text-center text-gray-500">No upcoming content found. Add one to get started.</div>}
            </div>
        </AdminLayout>
    );
};
