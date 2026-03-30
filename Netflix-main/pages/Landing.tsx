import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { AppRoute, Plan } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Plus, ChevronRight, Play, Loader2, Check } from 'lucide-react';

export const Landing: React.FC = () => {
  const { login, loginWithGoogle, user } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'hero' | 'login' | 'plans'>('hero');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Sync step with URL hash or User Status on mount
  useEffect(() => {
    if (window.location.hash === `#${AppRoute.LOGIN}`) {
      setStep('login');
    }

    // Auto-redirect to Plans if logged in but inactive
    if (user && user.subscriptionStatus !== 'active' && user.role !== 'admin') {
      setStep('plans');
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const snap = await getDocs(collection(db, 'plans'));
      const fetchedPlans = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Plan))
        .filter(p => p.active === true)
        .sort((a, b) => a.price - b.price);
      setPlans(fetchedPlans);
      if (fetchedPlans.length > 0) setSelectedPlan(fetchedPlans[0]);
    } catch (e) {
      console.error("Error fetching plans", e);
    }
    setLoadingPlans(false);
  };

  const faqs = [
    { q: "What is NETFLIX?", a: "NETFLIX is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices." },
    { q: "How much does NETFLIX cost?", a: "Watch NETFLIX on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from ₹199 to ₹649 a month. No extra costs, no contracts." },
    { q: "Where can I watch?", a: "Watch anywhere, anytime. Sign in with your NETFLIX account to watch instantly on the web at NETFLIX.com from your personal computer or on any internet-connected device." },
    { q: "How do I cancel?", a: "NETFLIX is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime." }
  ];

  const handleStart = () => {
    setStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'login') {
      await login(email, password);
      await fetchPlans();
      setStep('plans');
    }
  };



  const handlePayment = async () => {
    if (!selectedPlan || !user) return;

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key || key === "PLACEHOLDER_KEY") {
      alert("Razorpay Key ID missing! Configure VITE_RAZORPAY_KEY_ID in .env file.");
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

        try {
          await updateDoc(doc(db, 'users', user.uid), {
            plan: selectedPlan.name,
            subscriptionStatus: 'active',
            razorpayPlanId: selectedPlan.razorpayPlanId,
            updatedAt: new Date().toISOString()
          });
          alert(`Successfully subscribed to ${selectedPlan.name}!`);
          window.location.hash = AppRoute.PROFILES;
          window.location.reload();
        } catch (e) {
          console.error("Error updating subscription:", e);
          alert("Payment succeeded but failed to update account. Please contact support.");
        }
      },
      prefill: {
        name: user.email?.split('@')[0] || 'User',
        email: user.email,
        contact: ""
      },
      theme: { color: "#E50914" },
      modal: {
        ondismiss: function () {

        }
      }
    };

    // @ts-ignore
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  if (step === 'plans') {
    return (
      <div className="min-h-screen bg-[#141414] text-white font-sans">
        <nav className="border-b border-gray-800 px-8 py-5 flex justify-between items-center">
          <img src="/logoN.png" alt="NETFLIX" className="h-20 md:h-28 cursor-pointer object-contain" onClick={() => setStep('hero')} />
          <button onClick={() => { setStep('hero'); }} className="text-white font-bold hover:underline">Sign Out</button>
        </nav>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <span className="text-sm text-gray-400 uppercase">Step 2 of 3</span>
          <h2 className="text-3xl font-bold mb-4">Choose the plan that's right for you</h2>
          <ul className="list-disc list-inside mb-8 space-y-2 text-lg text-gray-300">
            <li>Watch all you want. Ad-free.</li>
            <li>Recommendations just for you.</li>
            <li>Change or cancel your plan anytime.</li>
          </ul>

          {loadingPlans ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-red-600" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p)}
                  className={`border-2 rounded p-4 cursor-pointer relative transition-all ${selectedPlan?.id === p.id ? 'border-[#e50914] shadow-xl bg-red-900/20' : 'border-gray-700 hover:border-gray-500'}`}
                >
                  {selectedPlan?.id === p.id && <div className="absolute top-0 right-0 bg-[#e50914] text-white text-xs font-bold px-2 py-1 rounded-bl">SELECTED</div>}
                  <div className="bg-[#e50914] text-white font-bold p-2 rounded w-min mb-2 text-sm">{p.name}</div>
                  <div className="text-2xl font-bold mb-2 text-white">₹{p.price}</div>
                  <div className="text-sm text-gray-400 font-semibold mb-4">{p.quality} Quality</div>

                  <div className="border-t border-gray-700 pt-4 space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Resolution</span>
                      <span className="font-bold text-white">{p.resolution}</span>
                    </div>
                    {p.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Check className="w-4 h-4 text-[#e50914]" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {plans.length === 0 && <div className="col-span-3 text-center text-gray-400">No active plans found. Please contact support.</div>}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={!selectedPlan}
            className="w-full bg-[#e50914] text-white text-2xl font-bold py-4 rounded hover:bg-[#f6121d] disabled:opacity-50 transition"
          >
            Subscribe & Pay
          </button>
        </div>
      </div>
    );
  }

  // ... (Hero and Login Steps remain same as previous, just showing changes for Plans) ...
  // Re-rendering the full Hero/Login/FAQ flow for completeness as requested by file override nature
  return (
    <div className="relative min-h-screen w-full bg-black overflow-x-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 opacity-50 h-[700px]">
        <img src="https://res.cloudinary.com/dpba1gvra/image/upload/v1769948810/background_avf03e.jpg" className="w-full h-full object-cover" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      <div className="relative z-10">
        <nav className="px-6 py-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
          <img
            src="/logoN.png"
            alt="NETFLIX"
            className="h-20 md:h-32 cursor-pointer object-contain"
            onClick={() => setStep('hero')}
          />
          <div className="flex gap-4">
            <button
              onClick={() => window.location.hash = AppRoute.LOGIN}
              className="bg-[#e50914] text-white px-4 py-1.5 rounded font-medium hover:bg-[#f40612] transition text-sm"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Login / Hero Content */}
        <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-4">
          {step === 'login' ? (
            <div className="bg-black/75 p-16 rounded md:w-[450px] w-full border border-gray-800 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-3xl font-bold mb-8 text-white text-left">Sign In</h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Email or phone number"
                  className="p-4 rounded bg-[#333] text-white focus:outline-none focus:bg-[#454545] border-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="p-4 rounded bg-[#333] text-white focus:outline-none focus:bg-[#454545] border-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="bg-[#e50914] py-3.5 rounded font-bold text-white mt-6 hover:bg-[#f6121d] transition">
                  Sign In
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-600"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await loginWithGoogle();
                    window.location.hash = AppRoute.PROFILES;
                  }}
                  className="bg-white py-3.5 rounded font-bold text-black hover:bg-gray-200 transition w-full flex items-center justify-center gap-2 border border-white"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Sign In with Google
                </button>

                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="accent-gray-500" /> Remember me</label>
                  <a href="#" className="hover:underline">Need help?</a>
                </div>
              </form>
              <div className="text-left mt-16 text-gray-500">
                New to NETFLIX? <button onClick={() => setStep('hero')} className="text-white hover:underline">Sign up now</button>.
              </div>
            </div>
          ) : (
            <div className="text-center text-white px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg max-w-4xl mx-auto leading-tight">
                Unlimited movies, TV shows and more
              </h1>
              <p className="text-xl md:text-2xl font-medium mb-8 drop-shadow-md">
                Watch anywhere. Cancel anytime.
              </p>
              <p className="text-lg md:text-xl mb-4">
                Ready to watch? Enter your email to create or restart your membership.
              </p>
              <div className="flex flex-col md:flex-row gap-2 justify-center items-center w-full max-w-3xl mx-auto">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full md:w-2/3 p-4 bg-black/60 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white h-14"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  onClick={handleStart}
                  className="bg-[#e50914] text-white text-2xl font-bold px-8 py-3 rounded hover:bg-[#f6121d] transition flex items-center gap-2 h-14 whitespace-nowrap"
                >
                  Get Started <ChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Blocks */}
      <div className="border-t-8 border-[#232323] bg-black text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Enjoy on your TV</h2>
            <p className="text-xl md:text-2xl font-medium">
              Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.
            </p>
          </div>
          <div className="relative">
            <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tv.png" alt="TV" className="relative z-10" />
            <video
              className="absolute top-[20.5%] left-[13%] w-[73%] h-[54%] object-cover z-0"
              autoPlay
              playsInline
              muted
              loop
              src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/video-tv-in-0819.m4v"
            />
          </div>
        </div>
      </div>

      <div className="border-t-8 border-[#232323] bg-black text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="relative order-2 md:order-1">
            <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/mobile-0819.jpg" alt="Mobile" className="relative z-10" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black border-2 border-gray-700 rounded-xl flex items-center gap-4 p-3 w-[80%] z-20">
              <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/boxshot.png" className="h-16" alt="Poster" />
              <div className="flex-1">
                <div className="font-bold">Stranger Things</div>
                <div className="text-blue-500 text-sm">Downloading...</div>
              </div>
              <div className="w-12 h-12 bg-[url('https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/download-icon.gif')] bg-cover bg-no-repeat bg-center"></div>
            </div>
          </div>
          <div className="text-center md:text-left order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Download your shows to watch offline</h2>
            <p className="text-xl md:text-2xl font-medium">
              Save your favourites easily and always have something to watch.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t-8 border-[#232323] bg-black text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Watch everywhere</h2>
            <p className="text-xl md:text-2xl font-medium">
              Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.
            </p>
          </div>
          <div className="relative">
            <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/device-pile-in.png" alt="Device Pile" className="relative z-10" />
            <video
              className="absolute top-[10%] left-[18%] w-[63%] h-[47%] object-cover z-0"
              autoPlay
              playsInline
              muted
              loop
              src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/video-devices-in.m4v"
            />
          </div>
        </div>
      </div>

      <div className="border-t-8 border-[#232323] bg-black text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img src="https://occ-0-2087-2164.1.nflxso.net/dnm/api/v6/19OhWN2dO19C9txTON9tvTFtefw/AAAABVr8nYuAg0xDpXDv0VI9HUoH7r2aGp4TKRCsKNQrMwxzTtr-NlwOHeS8bCI2oeZddmu3nMYr3j9MjYhHyjBASb1FaOGYZNYvPBCL.png" alt="Kids" />
          </div>
          <div className="text-center md:text-left order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Create profiles for kids</h2>
            <p className="text-xl md:text-2xl font-medium">
              Send children on adventures with their favourite characters in a space made just for them—free with your membership.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t-8 border-[#232323] bg-black py-16 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#2d2d2d] hover:bg-[#414141] transition">
                <button
                  className="w-full p-6 text-left flex justify-between items-center text-xl md:text-2xl font-medium border-b border-black"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  {faq.q}
                  {activeFaq === i ? <Plus className="rotate-45 transition-transform" /> : <Plus className="transition-transform" />}
                </button>
                {activeFaq === i && (
                  <div className="p-6 text-lg md:text-xl border-t border-black animate-in slide-in-from-top-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg md:text-xl mb-4">
              Ready to watch? Enter your email to create or restart your membership.
            </p>
            <div className="flex flex-col md:flex-row gap-2 justify-center items-center w-full max-w-3xl mx-auto">
              <input
                type="email"
                placeholder="Email address"
                className="w-full md:w-2/3 p-4 bg-black/60 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white h-14"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleStart}
                className="bg-[#e50914] text-white text-2xl font-bold px-8 py-3 rounded hover:bg-[#f6121d] transition flex items-center gap-2 h-14 whitespace-nowrap"
              >
                Get Started <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-8 border-[#232323] bg-black text-[#737373] py-16 px-4 md:px-12">
        <div className="max-w-5xl mx-auto">
          <p className="mb-8">Questions? Call 000-800-919-1694</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm underline">
            <a href={`#${AppRoute.FAQ}`} className="hover:text-gray-500">FAQ</a>
            <a href={`#${AppRoute.HELP}`} className="hover:text-gray-500">Help Centre</a>
            <a href={`#${AppRoute.ACCOUNT}`} className="hover:text-gray-500">Account</a>
            <a href={`#${AppRoute.MEDIA}`} className="hover:text-gray-500">Media Centre</a>
            <a href={`#${AppRoute.INVESTORS}`} className="hover:text-gray-500">Investor Relations</a>
            <a href={`#${AppRoute.WAYS_TO_WATCH}`} className="hover:text-gray-500">Ways to Watch</a>
            <a href={`#${AppRoute.TERMS}`} className="hover:text-gray-500">Terms of Use</a>
            <a href={`#${AppRoute.PRIVACY}`} className="hover:text-gray-500">Privacy</a>
            <a href={`#${AppRoute.COOKIES}`} className="hover:text-gray-500">Cookie Preferences</a>
            <a href={`#${AppRoute.CORPORATE}`} className="hover:text-gray-500">Corporate Information</a>
            <a href={`#${AppRoute.CONTACT}`} className="hover:text-gray-500">Contact Us</a>
            <a href={`#${AppRoute.SPEED_TEST}`} className="hover:text-gray-500">Speed Test</a>
            <a href={`#${AppRoute.LEGAL}`} className="hover:text-gray-500">Legal Notices</a>
            <a href={`#${AppRoute.ORIGINALS}`} className="hover:text-gray-500">Only on Netflix</a>
          </div>
          <div className="mt-8">
            <button className="border border-[#737373] px-4 py-2 rounded text-sm flex items-center gap-2 hover:text-white hover:border-white transition">
              English
            </button>
          </div>
          <p className="mt-6 text-sm">Netflix India</p>
        </div>
      </footer>
    </div>
  );
};
