import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SiteSettings } from '../../types';
import { Save, Database, AlertTriangle, Settings } from 'lucide-react';

export const SettingsManager: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings>({ siteName: '', maintenanceMode: false, heroContentId: '', heroVideoQuality: 'hd1080' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getDoc(doc(db, 'settings', 'global')).then(snap => {
            if (snap.exists()) setSettings(snap.data() as SiteSettings);
        });
    }, []);

    const handleSave = async () => {
        await setDoc(doc(db, 'settings', 'global'), settings);
        alert("Settings saved!");
    };

    return (
        <AdminLayout title="Global Settings">
            <div className="max-w-2xl space-y-8">

                <div className="bg-[#1f1f1f] rounded-lg border border-gray-800 p-6">
                    <h3 className="font-bold mb-6 flex items-center gap-2"><Settings size={20} /> General Configuration</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Website Name</label>
                            <input
                                value={settings.siteName}
                                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                                className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Hero Content ID (Homepage Banner)</label>
                            <input
                                value={settings.heroContentId || ''}
                                onChange={e => setSettings({ ...settings, heroContentId: e.target.value })}
                                className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none"
                                placeholder="Paste a Content ID from the Content tab"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Hero Video Quality</label>
                            <select
                                value={settings.heroVideoQuality || 'hd1080'}
                                onChange={e => setSettings({ ...settings, heroVideoQuality: e.target.value as any })}
                                className="w-full bg-[#333] rounded p-2 text-white border border-gray-600 focus:border-white outline-none"
                            >
                                <option value="highres">4K / Highest Available</option>
                                <option value="hd1080">1080p (Full HD)</option>
                                <option value="hd720">720p (HD)</option>
                                <option value="auto">Auto (Let YouTube Decide)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="maintenance"
                                checked={settings.maintenanceMode}
                                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                className="w-5 h-5 accent-red-600"
                            />
                            <label htmlFor="maintenance" className="text-white cursor-pointer select-none">Maintenance Mode (Hide site from users)</label>
                        </div>
                    </div>

                    <button onClick={handleSave} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition">
                        <Save size={18} /> Save Changes
                    </button>
                </div>



            </div>
        </AdminLayout>
    );
};