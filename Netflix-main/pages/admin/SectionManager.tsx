import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc, orderBy, query } from 'firebase/firestore';
import { Section } from '../../types';
import { Trash2, Plus, Pencil, X } from 'lucide-react';

export const SectionManager: React.FC = () => {
    const [sections, setSections] = useState<Section[]>([]);
    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState('genre');
    const [filter, setFilter] = useState('');
    const [scopes, setScopes] = useState<('home' | 'tv' | 'movie' | 'new')[]>(['home']);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchSections = async () => {
        const q = query(collection(db, 'sections'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setSections(snap.docs.map(d => ({ id: d.id, ...d.data() } as Section)));
    };

    useEffect(() => { fetchSections(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (scopes.length === 0) {
            alert("Please select at least one page.");
            return;
        }

        const data = {
            title,
            type: type as any,
            genreFilter: filter,
            scopes,
            enabled: true
        };

        try {
            if (isEditing && editingId) {
                await updateDoc(doc(db, 'sections', editingId), data);
            } else {
                await addDoc(collection(db, 'sections'), {
                    ...data,
                    order: sections.length + 1,
                });
            }
            resetForm();
            fetchSections();
        } catch (err) {
            console.error("Error saving section:", err);
            alert("Failed to save section");
        }
    };

    const handleEdit = (section: Section) => {
        setIsEditing(true);
        setEditingId(section.id);
        setTitle(section.title);
        setType(section.type);
        setFilter(section.genreFilter || '');
        setScopes(section.scopes || [(section as any).scope || 'home']);
        // Scroll to top or form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this section?")) return;
        await deleteDoc(doc(db, 'sections', id));
        fetchSections();
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setTitle('');
        setType('genre');
        setFilter('');
        setScopes(['home']);
    };

    const handleScopeToggle = (s: any) => {
        setScopes(prev =>
            prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
        );
    };

    const availableScopes = [
        { id: 'home', label: 'Home' },
        { id: 'tv', label: 'TV Shows' },
        { id: 'movie', label: 'Movies' },
        { id: 'new', label: 'New & Popular' }
    ];

    return (
        <AdminLayout title="Homepage Layout">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <div className="bg-[#1f1f1f] rounded-lg border border-gray-800 p-6">
                        <h3 className="font-bold mb-4">Current Sections</h3>
                        <div className="space-y-3">
                            {sections.map((s, idx) => (
                                <div
                                    key={s.id}
                                    className={`flex items-center justify-between bg-[#2a2a2a] p-4 rounded border ${editingId === s.id ? 'border-[#e50914]' : 'border-gray-700'} cursor-pointer hover:bg-[#333] transition-colors`}
                                    onClick={() => handleEdit(s)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 font-mono">#{s.order}</span>
                                        <div>
                                            <div className="font-bold">{s.title}</div>
                                            <div className="text-xs text-gray-400 capitalize">
                                                {s.type} {s.genreFilter && `(${s.genreFilter})`} • <span className="uppercase text-[#e50914]">
                                                    {(s.scopes || [(s as any).scope || 'home']).map(sc => sc.replace('new', 'New & Popular')).join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {sections.length === 0 && <p className="text-gray-500 text-center py-4">No sections configured.</p>}
                        </div>
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <div className="bg-[#1f1f1f] rounded-lg border border-gray-800 p-6 sticky top-24">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">{isEditing ? 'Edit Section' : 'Add New Section'}</h3>
                            {isEditing && <button onClick={resetForm} className="text-gray-400 hover:text-white"><X size={20} /></button>}
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Section Title</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 text-sm focus:border-white outline-none" placeholder="e.g. Action Movies" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-2 font-bold text-gray-200">Appears On (Select Multiple)</label>
                                <div className="grid grid-cols-1 gap-2 bg-[#2a2a2a] p-3 rounded border border-gray-700">
                                    {availableScopes.map(s => (
                                        <label key={s.id} className="flex items-center gap-3 cursor-pointer group hover:text-white transition">
                                            <input
                                                type="checkbox"
                                                className="accent-[#e50914] w-4 h-4 cursor-pointer"
                                                checked={scopes.includes(s.id as any)}
                                                onChange={() => handleScopeToggle(s.id)}
                                            />
                                            <span className="text-sm">{s.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Content Type</label>
                                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 text-sm outline-none">
                                    <option value="genre">By Genre (Auto)</option>
                                    <option value="curated">Curated Collection (Manual)</option>
                                    <option value="trending">Trending Now (Auto)</option>
                                    <option value="originals">Originals (Auto)</option>
                                </select>
                            </div>
                            {type === 'genre' && (
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Genre Filter</label>
                                    <input required value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 text-sm focus:border-white outline-none" placeholder="e.g. Action" />
                                </div>
                            )}
                            {type === 'curated' && (
                                <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 text-xs text-blue-200">
                                    For curated sections, assign content from the <strong>Content Manager</strong>.
                                </div>
                            )}

                            <div className="flex gap-2">
                                {isEditing && <button type="button" onClick={resetForm} className="flex-1 bg-gray-700 py-2 rounded font-bold hover:bg-gray-600 transition text-sm">Cancel</button>}
                                <button type="submit" className="flex-1 bg-[#e50914] py-2 rounded font-bold hover:bg-red-700 transition text-sm">
                                    {isEditing ? 'Update Section' : 'Add Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
};
