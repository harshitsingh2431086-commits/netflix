import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Layout } from '../components/Layout';
import { CreditCard, ChevronDown, Monitor, PenSquare, X, Check, Trash2, Save } from 'lucide-react';
import { useDataSaver } from '../hooks/useDataSaver';
import { AppRoute, Plan } from '../types';
import { doc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

declare const Razorpay: any;

const AVATARS = [
    'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png',
    'https://img.freepik.com/premium-vector/funny-green-face-square-avatar-cartoon-emotion-icon_53562-16129.jpg',
    'https://i.pinimg.com/736x/b6/77/cd/b677cd1cde292f261166533d6fe75872.jpg',
    'https://mir-s3-cdn-cf.behance.net/project_modules/disp/84c20033850498.56ba69ac290ea.png',
    'https://i.pinimg.com/474x/fb/8e/8a/fb8e8a96fca2f049334f312086a6e2f6--vini-cata.jpg'
];

export const Account: React.FC = () => {
    const { user, profiles, logout, currentProfile, isPWAInstallable, installPWA } = useStore();
    const { isDataSaver, toggleDataSaver } = useDataSaver();
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('********');
    const [phone, setPhone] = useState('');

    // New State for Plans
    const [showPlans, setShowPlans] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    // Avatar Selector State
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);

    // Profile Management State
    const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Sync phone from user doc if available
    useEffect(() => {
        if (user) {
            setEmail(user.email);
            // In a real app we'd fetch the user doc to get the phone number if stored there
        }
    }, [user]);

    if (!user) return null;

    const handleUpdateEmail = async () => {
        if (!isEditingEmail) { setIsEditingEmail(true); return; }
        try {
            await updateDoc(doc(db, 'users', user.uid), { email: email });
            alert("Account email updated! (Note: Re-login may be required)");
            setIsEditingEmail(false);
        } catch (e) { alert("Error updating email."); }
    };

    const handleUpdatePhone = async () => {
        if (!isEditingPhone) { setIsEditingPhone(true); return; }
        try {
            await updateDoc(doc(db, 'users', user.uid), { phone: phone });
            alert("Phone number updated!");
            setIsEditingPhone(false);
        } catch (e) { alert("Error updating phone."); }
    };

    const handlePasswordReset = async () => {
        if (confirm(`Send password reset email to ${user.email}?`)) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                alert("Password reset email sent! Check your inbox.");
            } catch (e: any) {
                alert("Error sending reset email: " + e.message);
            }
        }
    };

    const handleCancelMembership = async () => {
        if (!user.plan || user.subscriptionStatus === 'canceled') {
            alert("No active membership to cancel.");
            return;
        }

        if (confirm("Are you sure you want to cancel your Premium membership? You will lose access to premium features immediately.")) {
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    plan: 'Canceled',
                    subscriptionStatus: 'canceled'
                });
                alert("Membership canceled successfully.");
                window.location.reload();
            } catch (e) {
                console.error("Error canceling membership:", e);
                alert("Failed to cancel membership. Please try again.");
            }
        }
    };

    const handleAvatarChange = async (url: string) => {
        if (currentProfile) {
            try {
                await updateDoc(doc(db, 'users', user.uid, 'profiles', currentProfile.id), { avatarUrl: url });
                alert("Profile picture updated!");
                window.location.reload();
            } catch (e) {
                console.error(e);
                alert("Failed to update picture");
            }
        }
    };

    const handleProfileExpand = (profile: any) => {
        if (expandedProfileId === profile.id) {
            setExpandedProfileId(null);
        } else {
            setExpandedProfileId(profile.id);
            setEditName(profile.name);
        }
    };

    const handleSaveProfileName = async (profileId: string) => {
        if (!editName.trim()) return;
        try {
            await updateDoc(doc(db, 'users', user.uid, 'profiles', profileId), { name: editName });
            alert("Profile updated");
            window.location.reload();
        } catch (e) {
            alert("Error updating profile");
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (profiles.length <= 1) {
            alert("Cannot delete the last profile.");
            return;
        }
        if (confirm("Delete this profile? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'profiles', profileId));
                alert("Profile deleted");
                window.location.reload();
            } catch (e) {
                alert("Error deleting profile");
            }
        }
    };

    const fetchPlans = async () => {
        setLoadingPlans(true);
        setShowPlans(true);
        try {
            const colRef = collection(db, 'plans');
            const snap = await getDocs(colRef);
            const fetchedPlans = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Plan))
                .filter(p => p.active === true)
                .sort((a, b) => a.price - b.price);
            setPlans(fetchedPlans);
            setSelectedPlan(fetchedPlans[0] || null);
        } catch (e) {
            console.error("Error fetching plans", e);
            alert("Could not load plans. Please contact support.");
            setShowPlans(false);
        }
        setLoadingPlans(false);
    };

    const handleSubscribeToPlan = (selectedPlan: Plan) => {
        if (!selectedPlan) {
            alert("Please select a plan first.");
            return;
        }
        if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
            alert("Missing VITE_RAZORPAY_KEY_ID. Configure your Razorpay Key ID in .env.");
            return;
        }

        // Prevent subscribing to current plan
        if (user.plan === selectedPlan.name) return;

        const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!key || key === "PLACEHOLDER_KEY") {
            alert("Razorpay Key ID missing! Check .env file.");
            return;
        }

        const options = {
            key: key,
            amount: selectedPlan.price * 100,
            currency: "INR",
            name: "Netflix Premium",
            description: `${selectedPlan.name} Subscription`,
            image: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png",
            handler: async function (response: any) {
                alert(`Payment Successful! Plan: ${selectedPlan.name}`);
                await updateDoc(doc(db, 'users', user.uid), {
                    plan: selectedPlan.name,
                    subscriptionStatus: 'active',
                    razorpayPlanId: selectedPlan.razorpayPlanId
                });
                setShowPlans(false);
                window.location.reload();
            },
            prefill: {
                name: currentProfile?.name || 'User',
                email: user.email,
                contact: phone
            },
            theme: { color: "#E50914" }
        };
        const rzp1 = new Razorpay(options);
        rzp1.open();
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[#141414] text-white pt-24 pb-20 relative font-sans">

                {/* Avatar Selection Modal */}
                {showAvatarSelector && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
                        <div className="bg-[#1f1f1f] rounded-xl max-w-2xl w-full p-8 relative border border-gray-700 shadow-2xl">
                            <button onClick={() => setShowAvatarSelector(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-white text-center">Choose a Profile Icon</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 justify-items-center">
                                {AVATARS.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        className="w-24 h-24 rounded-md cursor-pointer hover:scale-110 hover:ring-2 hover:ring-white transition-all duration-200 object-cover"
                                        onClick={() => handleAvatarChange(url)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Plan Selection Modal */}
                {showPlans && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto animate-in fade-in duration-200">
                        <div className="bg-[#1f1f1f] rounded-xl max-w-5xl w-full p-8 relative border border-gray-700 shadow-2xl my-auto">
                            <button onClick={() => setShowPlans(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>

                            <h2 className="text-3xl font-bold mb-3 text-center">Choose the plan that's right for you</h2>
                            <p className="text-gray-400 mb-8 text-center text-sm">Watch all you want. Ad-free. Recommendations just for you. Change or cancel anytime.</p>

                            {loadingPlans ? (
                                <div className="text-center py-12 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-400">Loading plans...</p>
                                </div>
                            ) : plans.length === 0 ? (
                                <div className="text-center py-12 text-red-500 bg-red-900/10 rounded border border-red-900/50">
                                    No active plans found. Please contact admin.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {plans.map(plan => {
                                        const isCurrent = user.plan === plan.name;
                                        return (
                                            <div
                                                key={plan.id}
                                                className={`
                                                    relative rounded-xl p-6 cursor-pointer group transition-all duration-300 flex flex-col
                                                    border-2 ${isCurrent ? 'border-green-500 bg-green-900/10' : (selectedPlan?.id === plan.id ? 'border-[#e50914] bg-red-900/10' : 'border-gray-700 hover:border-gray-500 bg-[#2f2f2f]')}
                                                `}
                                                onClick={() => setSelectedPlan(plan)}
                                            >
                                                {isCurrent && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                        <Check size={12} /> Current Plan
                                                    </div>
                                                )}

                                                <div className="bg-red-600/20 text-red-500 text-xs font-bold px-2 py-1 rounded absolute top-4 right-4 uppercase border border-red-600/30">
                                                    {plan.resolution}
                                                </div>

                                                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                                                <div className="text-3xl font-bold mb-4 text-white">₹{plan.price}<span className="text-lg font-normal text-gray-400">/mo</span></div>

                                                <ul className="space-y-3 mb-8 flex-1">
                                                    {plan.features?.map((f, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                            <Check className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                                            <span>{f}</span>
                                                        </li>
                                                    ))}
                                                    <li className="flex items-center gap-3 text-sm text-gray-300">
                                                        <Monitor className="w-4 h-4 text-red-600 shrink-0" />
                                                        <span>{plan.quality} Quality</span>
                                                    </li>
                                                </ul>

                                                <button
                                                    disabled={isCurrent}
                                                    className={`
                                                        w-full py-3 rounded font-bold transition-all text-sm uppercase tracking-wide
                                                        ${isCurrent ? 'bg-green-600 text-white cursor-default opacity-100' : (selectedPlan?.id === plan.id ? 'bg-[#e50914] text-white' : 'bg-red-600 hover:bg-red-700 text-white')}
                                                    `}
                                                >
                                                    {isCurrent ? 'Active' : (selectedPlan?.id === plan.id ? 'Selected' : 'Select')}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {!loadingPlans && plans.length > 0 && (
                                <div className="mt-8">
                                    <button
                                        disabled={!selectedPlan || user.plan === selectedPlan?.name}
                                        onClick={() => selectedPlan && handleSubscribeToPlan(selectedPlan)}
                                        className="w-full bg-[#e50914] text-white font-bold py-3 rounded hover:bg-[#f6121d] disabled:opacity-50 transition uppercase tracking-wide"
                                    >
                                        Subscribe & Pay
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="max-w-5xl mx-auto px-4 sm:px-8">

                    {/* Header with Avatar */}
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-8">
                        <div className="relative group cursor-pointer" onClick={() => setShowAvatarSelector(true)}>
                            <img
                                src={currentProfile?.avatarUrl || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'}
                                alt="Profile"
                                className="w-20 h-20 rounded shadow-lg group-hover:opacity-75 transition duration-300 ring-2 ring-transparent group-hover:ring-gray-400 object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                <PenSquare className="text-white drop-shadow-lg" size={28} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Account</h1>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                Member since {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>

                    {/* Membership & Billing */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-gray-800">
                        <div className="md:col-span-1">
                            <h2 className="text-lg font-medium text-gray-400 uppercase tracking-wide">Membership & Billing</h2>
                            <button
                                onClick={handleCancelMembership}
                                className="mt-4 bg-gray-300 hover:bg-gray-200 text-black text-sm font-bold py-3 px-6 shadow-sm transition w-full md:w-auto rounded"
                            >
                                Cancel Membership
                            </button>
                        </div>
                        <div className="md:col-span-3">
                            <div className="flex justify-between items-center mb-3">
                                {isEditingEmail ? (
                                    <input
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="bg-[#333] border border-gray-600 p-2 rounded text-white focus:outline-none focus:border-white w-full max-w-sm"
                                    />
                                ) : (
                                    <span className="font-bold text-white text-lg">{user.email}</span>
                                )}
                                <button onClick={handleUpdateEmail} className="text-[#0073e6] hover:text-[#005bb5] hover:underline text-sm transition">
                                    {isEditingEmail ? 'Save' : 'Change account email'}
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-400 text-sm">Password: {password}</span>
                                <button onClick={handlePasswordReset} className="text-[#0073e6] hover:text-[#005bb5] hover:underline text-sm transition">Change password</button>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                                {isEditingPhone ? (
                                    <input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="bg-[#333] border border-gray-600 p-2 rounded text-white focus:outline-none focus:border-white w-full max-w-sm"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-sm">Phone: {phone}</span>
                                )}
                                <button onClick={handleUpdatePhone} className="text-[#0073e6] hover:text-[#005bb5] hover:underline text-sm transition">
                                    {isEditingPhone ? 'Save' : 'Change phone number'}
                                </button>
                            </div>

                            <div className="border-t border-gray-700 py-4 bg-gray-800/30 rounded mt-4 px-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CreditCard size={24} className="text-gray-400" />
                                    <span className="font-bold italic text-gray-400">Managed via Razorpay</span>
                                </div>
                                <button onClick={fetchPlans} className="text-[#0073e6] hover:text-[#005bb5] hover:underline text-sm font-bold transition uppercase tracking-wide">
                                    {user.plan === 'Premium' ? 'Manage Subscription' : 'Upgrade to Premium'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Plan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-gray-800">
                        <div className="md:col-span-1">
                            <h2 className="text-lg font-medium text-gray-400 uppercase tracking-wide">Plan Details</h2>
                        </div>
                        <div className="md:col-span-3">
                            {user.plan === 'Canceled' || user.subscriptionStatus === 'canceled' ? (
                                <div className="bg-gray-800/50 rounded border border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <X className="text-gray-400" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">No current plan</h3>
                                            <p className="text-gray-400 text-sm">Buy one for better experience</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm mb-4">
                                        Subscribe to a plan for unlimited streaming and premium features.
                                    </p>
                                    <button
                                        onClick={fetchPlans}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded font-bold transition text-sm uppercase tracking-wide"
                                    >
                                        Choose a Plan
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-white text-lg">{user.plan || 'Standard'}</span>
                                        <span className="bg-[#e50914] text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">HD</span>
                                    </div>
                                    <button onClick={fetchPlans} className="text-[#0073e6] hover:text-[#005bb5] hover:underline text-sm transition">Change plan</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-8 border-b border-gray-800">
                        <div className="md:col-span-1">
                            <h2 className="text-lg font-medium text-gray-400 uppercase tracking-wide">Settings</h2>
                        </div>
                        <div className="md:col-span-3 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-200">Ultra-Low-Data Mode</h3>
                                    <p className="text-sm text-gray-500">Save data by loading lower resolution images automatically.</p>
                                </div>
                                <button
                                    onClick={toggleDataSaver}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${isDataSaver ? 'bg-blue-600' : 'bg-gray-400'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDataSaver ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-200">Autoplay Previews</h3>
                                    <p className="text-sm text-gray-500">Automatically play video previews while browsing. Disabled on mobile by default.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const current = localStorage.getItem('autoplayEnabled') !== 'false';
                                        localStorage.setItem('autoplayEnabled', String(!current));
                                        window.location.reload();
                                    }}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${localStorage.getItem('autoplayEnabled') !== 'false' ? 'bg-blue-600' : 'bg-gray-400'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${localStorage.getItem('autoplayEnabled') !== 'false' ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* PWA Install Option - Only show on mobile if installable */}
                            {isPWAInstallable && (
                                <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 md:hidden">
                                    <div>
                                        <h3 className="font-bold text-gray-200">Download App</h3>
                                        <p className="text-sm text-gray-500">Install the Netflix Premium app for a better experience, offline viewing, and faster access.</p>
                                    </div>
                                    <button
                                        onClick={installPWA}
                                        className="bg-white text-black px-4 py-2 rounded font-bold text-sm hover:bg-gray-200 transition"
                                    >
                                        Install
                                    </button>
                                </div>
                            )}

                            <p className="text-[#0073e6] hover:text-[#005bb5] hover:underline text-sm cursor-pointer transition" onClick={() => { logout(); window.location.hash = AppRoute.LANDING; }}>
                                Sign out of all devices
                            </p>
                        </div>
                    </div>

                    {/* Profile & Parental Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <h2 className="text-lg font-medium text-gray-400 uppercase tracking-wide">Profile & Controls</h2>
                        </div>
                        <div className="md:col-span-3">
                            <div className="bg-[#1f1f1f] rounded border border-gray-800 overflow-hidden">
                                {profiles.map(profile => (
                                    <div key={profile.id} className="border-b border-gray-800 last:border-0">
                                        <div
                                            className="p-4 hover:bg-[#2f2f2f] transition cursor-pointer group flex items-center justify-between"
                                            onClick={() => handleProfileExpand(profile)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={profile.avatarUrl || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'}
                                                    alt={profile.name}
                                                    className="w-12 h-12 rounded"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
                                                    }}
                                                />
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-gray-200 transition">{profile.name}</p>
                                                    <p className="text-xs text-gray-500">{profile.isKids ? 'Kids Profile' : 'All Maturity Ratings'}</p>
                                                </div>
                                            </div>
                                            <ChevronDown className={`text-gray-500 group-hover:text-white transition ${expandedProfileId === profile.id ? 'rotate-180' : ''}`} />
                                        </div>

                                        {expandedProfileId === profile.id && (
                                            <div className="bg-[#2f2f2f] p-6 animate-in slide-in-from-top-2 space-y-4 cursor-default border-t border-gray-800">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Name</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="bg-[#1f1f1f] text-white px-3 py-2 rounded border border-gray-600 focus:border-white outline-none flex-1"
                                                        />
                                                        <button
                                                            onClick={() => handleSaveProfileName(profile.id)}
                                                            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
                                                        >
                                                            <Save size={16} /> Save
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm text-gray-300 font-bold">Language</p>
                                                        <p className="text-xs text-gray-500">English</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-300 font-bold">Maturity Settings</p>
                                                        <p className="text-xs text-gray-500">{profile.isKids ? 'Kids (12+)' : 'All Maturity Ratings'}</p>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-700 pt-4">
                                                    <button
                                                        onClick={() => handleDeleteProfile(profile.id)}
                                                        className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition"
                                                    >
                                                        <Trash2 size={16} /> Delete Profile
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};
