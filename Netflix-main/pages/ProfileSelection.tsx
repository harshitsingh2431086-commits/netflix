import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { AppRoute, Profile } from '../types';
import { PlusCircle, Pencil, Check, X, ArrowLeft } from 'lucide-react';

export const ProfileSelection: React.FC = () => {
  const { profiles, selectProfile, addProfile, updateProfile, user } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Form State for Add/Edit
  const [name, setName] = useState('');
  const [kids, setKids] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const defaultAvatars = [
    'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png',
    'https://occ-0-64-58.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsToshpK6007kc/AAAABXYofBtCiQzmk7LrwdaGW7FLR8rZ1s_N4sZ08W6r3_88b19o5q9q0a-7.png?r=88c',
    'https://occ-0-64-58.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsToshpK6007kc/AAAABXvXOfBtCiQzmk7LrwdaGW7FLR8rZ1s_N4sZ08W6r3_88b19o5q9q0a-4.png?r=88c',
    'https://occ-0-64-58.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsToshpK6007kc/AAAABZOfBtCiQzmk7LrwdaGW7FLR8rZ1s_N4sZ08W6r3_88b19o5q9q0a-11.png?r=88c',
    'https://occ-0-64-58.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsToshpK6007kc/AAAABTOfBtCiQzmk7LrwdaGW7FLR8rZ1s_N4sZ08W6r3_88b19o5q9q0a-1.png?r=88c',
  ];

  const handleSelect = (profileId: string) => {
    if (isManaging) {
      const p = profiles.find(pr => pr.id === profileId);
      if (p) {
        setEditingProfile(p);
        setName(p.name);
        setKids(p.isKids);
        setAvatarUrl(p.avatarUrl || '');
      }
    } else {
      selectProfile(profileId);
      window.location.hash = AppRoute.BROWSE;
    }
  };

  const handleSave = async () => {
    if (!name) return;
    if (editingProfile) {
      await updateProfile(editingProfile.id, { name, isKids: kids, avatarUrl });
      setEditingProfile(null);
    } else {
      await addProfile(name, kids, avatarUrl);
      setIsAdding(false);
    }
    setName('');
    setKids(false);
    setAvatarUrl('');
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center animate-in fade-in duration-700 relative overflow-hidden">

      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {!editingProfile ? (
        <>
          <h1 className="text-3xl md:text-5xl text-white font-medium mb-12 drop-shadow-lg">
            {isManaging ? 'Manage Profiles:' : "Who's watching?"}
          </h1>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 z-10">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className="group flex flex-col items-center gap-4 cursor-pointer w-24 md:w-40 relative"
                onClick={() => handleSelect(profile.id)}
              >
                <div className="relative w-24 h-24 md:w-40 md:h-40 rounded overflow-hidden border-2 border-transparent group-hover:border-white transition duration-300 shadow-xl">
                  <img
                    src={profile.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
                    }}
                  />
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="border-2 border-white rounded-full p-2 md:p-4 bg-black/20">
                        <Pencil className="text-white w-6 h-6 md:w-10 md:h-10" />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-gray-400 group-hover:text-white text-lg md:text-xl transition duration-300">
                  {profile.name}
                </span>
              </div>
            ))}

            {/* Add Profile Button */}
            {!isManaging && !isAdding && (
              <div
                onClick={() => setIsAdding(true)}
                className="group flex flex-col items-center gap-4 cursor-pointer w-24 md:w-40"
              >
                <div className="w-24 h-24 md:w-40 md:h-40 rounded flex items-center justify-center bg-transparent group-hover:bg-white transition duration-300 border-2 border-transparent group-hover:border-white">
                  <PlusCircle className="text-gray-400 group-hover:text-gray-800 w-16 h-16" />
                </div>
                <span className="text-gray-400 group-hover:text-white text-lg md:text-xl transition duration-300">
                  Add Profile
                </span>
              </div>
            )}

            {isAdding && (
              <div className="flex flex-col items-center gap-4 w-[90vw] max-w-lg bg-[#1f1f1f] p-6 md:p-10 rounded-lg border border-gray-800 shadow-2xl animate-in zoom-in-95 z-50">
                <h3 className="text-white font-bold uppercase text-lg tracking-widest mb-4">Add Profile</h3>

                <div className="flex flex-col md:flex-row gap-8 w-full items-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-[#333] rounded overflow-hidden border-2 border-gray-600 shadow-lg">
                    <img src={avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} alt="New" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="bg-[#333] border border-white/20 text-white px-4 py-3 outline-none w-full text-lg rounded focus:border-white transition"
                    />

                    <label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer hover:text-white transition">
                      <input type="checkbox" className="accent-[#e50914] w-5 h-5" checked={kids} onChange={(e) => setKids(e.target.checked)} />
                      Kids profile?
                    </label>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-6">
                  <p className="text-gray-400 text-sm font-medium">Choose an icon:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {(user as any)?.photoURL && (
                      <button
                        onClick={() => setAvatarUrl((user as any).photoURL)}
                        className={`aspect-square rounded overflow-hidden border-2 transition ${avatarUrl === (user as any).photoURL ? 'border-white scale-110' : 'border-transparent hover:border-gray-500'}`}
                      >
                        <img src={(user as any).photoURL} className="w-full h-full object-cover" />
                      </button>
                    )}
                    {defaultAvatars.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAvatarUrl(url)}
                        className={`aspect-square rounded overflow-hidden border-2 transition ${avatarUrl === url ? 'border-white scale-110' : 'border-transparent hover:border-gray-500'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 w-full mt-8">
                  <button onClick={handleSave} className="flex-1 bg-white text-black font-bold py-3 uppercase hover:bg-[#e50914] hover:text-white transition rounded tracking-widest">Continue</button>
                  <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-800 text-white font-bold py-3 uppercase hover:bg-gray-700 transition rounded tracking-widest">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsManaging(!isManaging)}
            className={`mt-20 border px-8 py-2 tracking-widest transition uppercase text-sm md:text-lg font-bold shadow-md ${isManaging ? 'bg-white text-black border-white' : 'border-gray-500 text-gray-500 hover:text-white hover:border-white'}`}
          >
            {isManaging ? 'Done' : 'Manage Profiles'}
          </button>
        </>
      ) : (
        /* Edit Profile View */
        <div className="flex flex-col items-center max-w-2xl w-full px-6 z-10 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center justify-between w-full mb-8">
            <h1 className="text-3xl md:text-5xl text-white font-medium">Edit Profile</h1>
            <button onClick={() => setEditingProfile(null)} className="text-gray-400 hover:text-white transition"><X size={32} /></button>
          </div>

          <div className="flex flex-col md:flex-row gap-10 w-full border-t border-b border-gray-700 py-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 md:w-32 md:h-32 rounded overflow-hidden group">
                <img src={avatarUrl || editingProfile.avatarUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Pencil size={24} />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="bg-[#333] p-2 w-full">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-white text-xl placeholder-gray-500"
                  placeholder="Profile Name"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-gray-400 text-lg">Choose your icon:</h3>

                {/* Avatar Selection Grid */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {/* Google Photo Option (Only if available) */}
                  {(user as any)?.photoURL && (
                    <button
                      onClick={() => setAvatarUrl((user as any).photoURL)}
                      className={`relative aspect-square rounded overflow-hidden border-2 transition ${avatarUrl === (user as any).photoURL ? 'border-white scale-110 z-10' : 'border-transparent hover:border-gray-500'}`}
                    >
                      <img src={(user as any).photoURL} className="w-full h-full object-cover" />
                      <div className="absolute top-0 right-0 bg-blue-600 p-0.5"><Check size={10} /></div>
                    </button>
                  )}

                  {defaultAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAvatarUrl(url)}
                      className={`aspect-square rounded overflow-hidden border-2 transition ${avatarUrl === url ? 'border-white scale-110 z-10' : 'border-transparent hover:border-gray-500'}`}
                    >
                      <img src={url} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="kids-mode"
                  className="accent-[#e50914] w-5 h-5"
                  checked={kids}
                  onChange={(e) => setKids(e.target.checked)}
                />
                <label htmlFor="kids-mode" className="text-white text-lg flex flex-col">
                  <span>Kids Profile?</span>
                  <span className="text-xs text-gray-500">Only see TV shows and movies rated for children.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full mt-10">
            <button
              onClick={handleSave}
              className="px-8 py-2 bg-white text-black font-bold uppercase tracking-wider hover:bg-[#e50914] hover:text-white transition flex items-center justify-center gap-2"
            >
              <Check size={20} /> Save Changes
            </button>
            <button
              onClick={() => setEditingProfile(null)}
              className="px-8 py-2 border border-gray-500 text-gray-500 font-bold uppercase tracking-wider hover:border-white hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
