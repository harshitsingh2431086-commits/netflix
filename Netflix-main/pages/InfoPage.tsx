import React from 'react';
import { AppRoute } from '../types';
import { useStore } from '../context/Store';

export const InfoPage: React.FC = () => {
  const { user } = useStore();
  const hash = window.location.hash.replace('#', '');
  const path = hash.startsWith('/') ? hash : `/${hash}`;
  // ... (renderContent code remains mostly same, just updating the header logic in return part below)

  // NOTE: Instead of replacing the whole file, I will just apply the change to imports and the header section safely.
  // Wait, the previous replacement text was too generic. I need to be precise.
  // I will split this into two calls: one for imports and state, one for the header JSX.


  const renderContent = (path: string) => {
    switch (path) {
      case AppRoute.FAQ:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="group bg-[#2f2f2f] p-4 rounded cursor-pointer border border-gray-700">
                <summary className="font-semibold text-lg list-none flex justify-between items-center text-white">
                  What is Netflix?
                  <span className="transform group-open:rotate-45 transition text-white">+</span>
                </summary>
                <p className="mt-2 text-gray-300">Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices.</p>
              </details>
              <details className="group bg-[#2f2f2f] p-4 rounded cursor-pointer border border-gray-700">
                <summary className="font-semibold text-lg list-none flex justify-between items-center text-white">
                  How much does Netflix cost?
                  <span className="transform group-open:rotate-45 transition text-white">+</span>
                </summary>
                <p className="mt-2 text-gray-300">Watch Netflix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from ₹149 to ₹649 a month. No extra costs, no contracts.</p>
              </details>
              <details className="group bg-[#2f2f2f] p-4 rounded cursor-pointer border border-gray-700">
                <summary className="font-semibold text-lg list-none flex justify-between items-center text-white">
                  Where can I watch?
                  <span className="transform group-open:rotate-45 transition text-white">+</span>
                </summary>
                <p className="mt-2 text-gray-300">Watch anywhere, anytime. Sign in with your Netflix account to watch instantly on the web at netflix.com from your personal computer or on any internet-connected device that offers the Netflix app, including smart TVs, smartphones, tablets, streaming media players and game consoles.</p>
              </details>
              <details className="group bg-[#2f2f2f] p-4 rounded cursor-pointer border border-gray-700">
                <summary className="font-semibold text-lg list-none flex justify-between items-center text-white">
                  How do I cancel?
                  <span className="transform group-open:rotate-45 transition text-white">+</span>
                </summary>
                <p className="mt-2 text-gray-300">Netflix is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime.</p>
              </details>
            </div>
          </div>
        );

      case AppRoute.HELP:
        return (
          <div className="space-y-8">
            <div className="bg-[#181818] border border-gray-700 rounded p-6 text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">How can we help?</h2>
              <input type="text" placeholder="Describe your issue" className="w-full max-w-lg mx-auto bg-[#333] border border-gray-600 p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:border-white" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 border border-gray-700 rounded hover:bg-[#2f2f2f] transition cursor-pointer">
                <h3 className="font-bold mb-2 text-white">Billing & Payments</h3>
                <p className="text-sm text-gray-400">Update payment method, billing dates, and plan details.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded hover:bg-[#2f2f2f] transition cursor-pointer">
                <h3 className="font-bold mb-2 text-white">Account Settings</h3>
                <p className="text-sm text-gray-400">Change password, email, or phone number.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded hover:bg-[#2f2f2f] transition cursor-pointer">
                <h3 className="font-bold mb-2 text-white">Fix a Problem</h3>
                <p className="text-sm text-gray-400">Troubleshoot streaming issues or error codes.</p>
              </div>
            </div>
          </div>
        );

      case AppRoute.MEDIA:
        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[#e50914] pl-4">
              <h2 className="text-xl font-bold text-white">Latest News</h2>
              <p className="text-gray-400 text-sm">February 1, 2026</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-700 rounded p-6 bg-[#181818]">
                <h3 className="font-bold text-white mb-2">New Originals Announced</h3>
                <p className="text-sm text-gray-400">Fresh slate of international originals arriving this spring.</p>
              </div>
              <div className="border border-gray-700 rounded p-6 bg-[#181818]">
                <h3 className="font-bold text-white mb-2">Partnership with Local Studios</h3>
                <p className="text-sm text-gray-400">Expanding regional storytelling with top creators.</p>
              </div>
              <div className="border border-gray-700 rounded p-6 bg-[#181818]">
                <h3 className="font-bold text-white mb-2">New Features Rolling Out</h3>
                <p className="text-sm text-gray-400">Improved recommendations and accessibility enhancements.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#2f2f2f] h-32 flex items-center justify-center font-bold text-gray-400 border border-gray-700">Press Releases</div>
              <div className="bg-[#2f2f2f] h-32 flex items-center justify-center font-bold text-gray-400 border border-gray-700">Brand Assets</div>
            </div>
          </div>
        );

      case AppRoute.INVESTORS:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Netflix Investors</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black border border-gray-700 text-white p-6 rounded">
                <h3 className="text-xl font-bold mb-2">Stock Info (NFLX)</h3>
                <p className="text-4xl font-bold text-[#e50914]">$650.00</p>
                <p className="text-sm text-green-500">+1.25% Today</p>
              </div>
              <div className="border border-gray-700 p-6 rounded bg-[#181818]">
                <h3 className="font-bold mb-2 text-white">Quarterly Earnings</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="cursor-pointer hover:text-white hover:underline">Q4 2025 Financial Statements</li>
                  <li className="cursor-pointer hover:text-white hover:underline">Letter to Shareholders</li>
                  <li className="cursor-pointer hover:text-white hover:underline">Earnings Webcast</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case AppRoute.JOBS:
        return (
          <div className="text-center space-y-8">
            <div className="bg-[#181818] border border-gray-800 text-white p-12 rounded">
              <h2 className="text-3xl font-bold mb-4">A great workplace combines stunning colleagues and hard problems.</h2>
              <p className="text-lg text-gray-400 mb-8">We are looking for talent to help us entertain the world.</p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold mb-4 text-white">Teams</h3>
              <div className="flex flex-wrap gap-2">
                {['Engineering', 'Content', 'Marketing', 'Finance', 'Legal', 'Product', 'Design'].map(team => (
                  <span key={team} className="bg-[#333] text-gray-200 px-3 py-1 rounded-full text-sm border border-gray-600">{team}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case AppRoute.WAYS_TO_WATCH:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Watch on any device</h2>
              <p className="text-gray-400">Stream on your phone, tablet, laptop, and TV without paying more.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4 border border-gray-700 rounded bg-[#181818]">
                <div className="text-4xl mb-2">📺</div>
                <h3 className="font-bold text-white">TVs</h3>
                <p className="text-xs text-gray-400">Smart TVs, Apple TV, Chromecast, and more.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded bg-[#181818]">
                <div className="text-4xl mb-2">💻</div>
                <h3 className="font-bold text-white">Computers</h3>
                <p className="text-xs text-gray-400">MacOS, Windows, Chromebook.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded bg-[#181818]">
                <div className="text-4xl mb-2">📱</div>
                <h3 className="font-bold text-white">Mobile</h3>
                <p className="text-xs text-gray-400">iPhone, iPad, Android phones & tablets.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded bg-[#181818]">
                <div className="text-4xl mb-2">🎮</div>
                <h3 className="font-bold text-white">Consoles</h3>
                <p className="text-xs text-gray-400">PlayStation, Xbox.</p>
              </div>
            </div>
          </div>
        );

      case AppRoute.TERMS:
        return (
          <div className="text-sm space-y-4 text-gray-400">
            <p><strong className="text-white">1. Membership</strong><br />Your Netflix membership will continue until terminated. To use the Netflix service you must have Internet access and a Netflix ready device, and provide us with one or more Payment Methods.</p>
            <p><strong className="text-white">2. Billing and Cancellation</strong><br />The membership fee for the Netflix service and any other charges you may incur in connection with your use of the service, such as taxes and possible transaction fees, will be charged to your Payment Method on the specific payment date indicated on the "Account" page.</p>
            <p><strong className="text-white">3. Netflix Service</strong><br />You must be at least 18 years of age, or the age of majority in your province, territory or country, to become a member of the Netflix service.</p>
          </div>
        );

      case AppRoute.PRIVACY:
        return (
          <div className="text-sm space-y-4 text-gray-400">
            <p>This Privacy Statement explains our practices, including your choices, regarding the collection, use, and disclosure of certain information, including your personal information, in connection with the Netflix service.</p>
            <h3 className="font-bold text-white">Collection of Information</h3>
            <p>We receive and store information you provide to us, information collected automatically, and information from other sources.</p>
            <h3 className="font-bold text-white">Use of Information</h3>
            <p>We use information to provide, analyze, administer, enhance and personalize our services, process registration and payments, and communicate with you.</p>
            <h3 className="font-bold text-white">Data Retention</h3>
            <p>We retain information as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements.</p>
            <h3 className="font-bold text-white">Your Rights</h3>
            <p>You may request access, correction, or deletion of your personal data as permitted by law.</p>
            <h3 className="font-bold text-white">Security</h3>
            <p>We use administrative, technical, and physical safeguards to protect your information.</p>
          </div>
        );

      case AppRoute.COOKIES:
        return (
          <div className="space-y-6">
            <p className="text-gray-400">We and our Service Providers use cookies and other technologies (such as web beacons), as well as advertising identifiers, for various reasons. For example, we use these technologies to make it easy to access our services by remembering you when you return, and to provide and analyze our services.</p>
            <div className="border border-gray-700 p-4 rounded bg-[#181818]">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-white">Essential Cookies</span>
                <span className="text-green-500 font-bold">Always On</span>
              </div>
              <p className="text-xs text-gray-400">These cookies are strictly necessary to provide our website or online service.</p>
            </div>
            <div className="border border-gray-700 p-4 rounded bg-[#181818]">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-white">Performance & Functionality</span>
                <input type="checkbox" defaultChecked className="toggle accent-[#e50914]" />
              </div>
              <p className="text-xs text-gray-400">These cookies help us personalize and enhance your online experience.</p>
            </div>
          </div>
        );

      case AppRoute.CORPORATE:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Corporate Information</h2>
            <p><strong className="text-white">Netflix, Inc.</strong></p>
            <address className="not-italic text-gray-400">
              100 Winchester Circle<br />
              Los Gatos, CA 95032<br />
              United States
            </address>
            <div className="mt-4">
              <h3 className="font-bold text-white">Executives</h3>
              <ul className="list-disc list-inside text-gray-400">
                <li>Ted Sarandos (Co-CEO)</li>
                <li>Greg Peters (Co-CEO)</li>
                <li>Reed Hastings (Chairman)</li>
              </ul>
            </div>
          </div>
        );

      case AppRoute.CONTACT:
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold text-white">Contact Customer Support</h2>
            <div className="bg-[#181818] p-8 rounded shadow-sm border border-gray-700 space-y-4">
              <p className="text-lg text-white">Call us from the Netflix app</p>
              <p className="text-gray-400 text-sm">Contacting us from the app is faster and we can verify your account instantly.</p>
              <button className="bg-black text-white border border-gray-600 px-6 py-2 rounded hover:border-white transition">Download App</button>
            </div>
            <div className="bg-[#181818] p-8 rounded shadow-sm border border-gray-700 space-y-4">
              <p className="text-lg text-white">Call us via Phone</p>
              <p className="text-2xl font-bold text-[#e50914]">000-800-919-1694</p>
              <p className="text-xs text-gray-400">Code: 123456</p>
            </div>
            <a href="https://help.netflix.com/en/contactus" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">Start Live Chat</a>
          </div>
        );

      case AppRoute.SPEED_TEST:
        return (
          <div className="w-full h-[600px] bg-black relative rounded overflow-hidden border border-gray-800">
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <p className="text-gray-500">Loading Fast.com...</p>
            </div>
            <iframe
              src="https://fast.com"
              className="w-full h-full border-none relative z-10"
              title="Fast.com Speed Test"
              allow="autoplay"
            />
            <div className="absolute bottom-6 right-6 z-20">
              <a
                href="https://fast.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/80 backdrop-blur border border-white/30 text-white px-4 py-2 rounded hover:bg-white hover:text-black transition text-sm font-bold flex items-center gap-2"
              >
                Open in New Tab ↗
              </a>
            </div>
          </div>
        );

      case AppRoute.LEGAL:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Legal Notices</h2>
            <p className="text-sm text-gray-400">The Netflix service and all content and software associated therewith, or any other features or functionalities of the Netflix service, are protected by copyright, trade secret or other intellectual property laws and treaties.</p>
            <ul className="list-disc list-inside text-gray-400 text-sm">
              <li className="cursor-pointer hover:text-white hover:underline">Copyright Infringement Claims</li>
              <li className="cursor-pointer hover:text-white hover:underline">Civil Code 2024</li>
              <li className="cursor-pointer hover:text-white hover:underline">Notices</li>
            </ul>
          </div>
        );

      case AppRoute.ORIGINALS:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Only on Netflix</h2>
            <p className="text-gray-400">Netflix is the home of amazing original programming that you can't find anywhere else. Movies, TV shows, specials and more, all tailored specifically to you.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-video bg-[#2f2f2f] rounded relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold bg-[#181818] group-hover:bg-[#e50914] transition duration-500 text-white">
                    NETFLIX ORIGINAL
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.location.hash = AppRoute.BROWSE}
              className="bg-[#e50914] text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition"
            >
              Browse All Originals
            </button>
          </div>
        );

      case AppRoute.AUDIO_DESCRIPTION:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Audio Description</h2>
            <p className="text-gray-400">Audio description is an optional narration track that describes what is happening on screen, including physical actions, facial expressions, costumes, settings and scene changes.</p>
            <div className="bg-[#181818] p-6 rounded border border-gray-700">
              <h3 className="font-bold text-white mb-4">Available Titles</h3>
              <p className="text-gray-400 text-sm mb-4">Most Netflix Original titles and many other TV shows and movies feature audio description.</p>
              <button
                onClick={() => window.location.hash = AppRoute.BROWSE}
                className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 transition"
              >
                Browse Audio Description
              </button>
            </div>
          </div>
        );

      case AppRoute.GIFT_CARDS:
        return (
          <div className="space-y-8 text-center">
            <div className="bg-gradient-to-r from-red-600 to-black p-1 rounded-lg">
              <div className="bg-[#141414] p-8 rounded">
                <h2 className="text-3xl font-bold text-white mb-4">Give the Gift of Netflix</h2>
                <p className="text-gray-400 mb-8">Netflix Gift Cards can be used to pay for an existing membership or start a new one.</p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button className="bg-[#e50914] text-white px-8 py-3 rounded font-bold hover:bg-red-700 transition">Buy Online</button>
                  <button className="border border-white text-white px-8 py-3 rounded font-bold hover:bg-white hover:text-black transition">Redeem Card</button>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="p-4 border border-gray-700 rounded">
                <h3 className="font-bold text-white mb-2">No Expiration</h3>
                <p className="text-xs text-gray-400">Netflix gift cards do not expire.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded">
                <h3 className="font-bold text-white mb-2">Any Plan</h3>
                <p className="text-xs text-gray-400">Can be applied to any plan, regardless of price.</p>
              </div>
              <div className="p-4 border border-gray-700 rounded">
                <h3 className="font-bold text-white mb-2">Instant Delivery</h3>
                <p className="text-xs text-gray-400">Digital cards are sent immediately via email.</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4 text-white">Page Not Found</h2>
            <p className="text-gray-400">The requested page does not exist or is under construction.</p>
          </div>
        );
    }
  };

  const getTitle = (path: string) => {
    switch (path) {
      case AppRoute.FAQ: return 'FAQ';
      case AppRoute.HELP: return 'Help Centre';
      case AppRoute.MEDIA: return 'Media Centre';
      case AppRoute.INVESTORS: return 'Investor Relations';
      case AppRoute.JOBS: return 'Jobs';
      case AppRoute.WAYS_TO_WATCH: return 'Ways to Watch';
      case AppRoute.TERMS: return 'Terms of Use';
      case AppRoute.PRIVACY: return 'Privacy';
      case AppRoute.COOKIES: return 'Cookie Preferences';
      case AppRoute.CORPORATE: return 'Corporate Information';
      case AppRoute.CONTACT: return 'Contact Us';
      case AppRoute.SPEED_TEST: return 'Internet Speed Test';
      case AppRoute.LEGAL: return 'Legal Notices';
      case AppRoute.LEGAL: return 'Legal Notices';
      case AppRoute.ORIGINALS: return 'Only on Netflix';
      case AppRoute.AUDIO_DESCRIPTION: return 'Audio Description';
      case AppRoute.GIFT_CARDS: return 'Gift Cards';
      default: return 'Netflix';
    }
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans">
      {/* Simple Header */}
      <div className="bg-black/50 px-4 py-4 md:px-12 border-b border-[#e50914] flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <img
          src="/logoN.png"
          alt="Netflix"
          className="h-8 md:h-10 cursor-pointer object-contain"
          onClick={() => window.location.hash = AppRoute.LANDING}
        />
        <button
          onClick={() => window.location.hash = user ? AppRoute.BROWSE : AppRoute.LOGIN}
          className="text-[#e50914] font-bold hover:underline text-sm uppercase"
        >
          {user ? 'Home' : 'Sign In'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white border-b border-gray-800 pb-4">{getTitle(path)}</h1>

        <div className="bg-black/40 p-6 md:p-10 rounded shadow-sm border border-gray-800 min-h-[400px]">
          {renderContent(path)}

          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
            <button
              onClick={() => window.history.back()}
              className="text-[#e50914] hover:underline font-medium flex items-center gap-1"
            >
              &larr; Go Back
            </button>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-[#141414] border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <div className="max-w-4xl mx-auto px-4">
          <p className="mb-4">Questions? Call 000-800-919-1694</p>
          <p>&copy; {new Date().getFullYear()} Netflix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
