import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { AppRoute } from '../types';

export const Login: React.FC = () => {
  const { login, loginWithGoogle, resetPassword, isLoading } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      window.location.hash = AppRoute.PROFILES;
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative bg-black md:bg-transparent">
      {/* Background Image - Only visible on desktop */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center z-0 opacity-50"
        style={{ backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/dace47b4-a5cb-4368-80fe-c26f3e77d540/f5b52435-458f-498f-9d1d-ccd4f1af9913/IN-en-20231023-popsignuptwoweeks-perspective_alpha_website_large.jpg')` }}
      />
      <div className="hidden md:block absolute inset-0 bg-black/40 z-0"></div>

      {/* Header */}
      <div className="relative z-10 px-4 py-4 md:px-12 md:py-6">
        <img 
          src="/logoN.png" 
          alt="Netflix" 
          className="h-12 md:h-12 cursor-pointer" 
          onClick={() => window.location.hash = AppRoute.LANDING}
        />
      </div>

      {/* Login Box */}
      <div className="relative z-10 flex justify-center items-center min-h-[calc(100vh-100px)]">
        <div className="bg-black/75 p-8 md:p-16 rounded-md w-full max-w-[450px] min-h-[600px]">
          <h1 className="text-white text-3xl font-bold mb-6">Sign In</h1>
          <p className="text-gray-400 mb-6 text-sm">Welcome back. Sign in to continue.</p>
          
          {error && (
            <div className="bg-[#e87c03] p-3 rounded text-white text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Email or phone number"
                className="w-full bg-[#333] text-white rounded px-4 py-4 focus:bg-[#454545] focus:outline-none focus:ring-0 border-b-2 border-transparent focus:border-[#e87c03] transition peer placeholder-transparent pt-6 pb-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
               <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-valid:top-1 peer-valid:text-xs pointer-events-none">
                Email or phone number
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full bg-[#333] text-white rounded px-4 py-4 focus:bg-[#454545] focus:outline-none focus:ring-0 border-b-2 border-transparent focus:border-[#e87c03] transition peer placeholder-transparent pt-6 pb-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="absolute left-4 top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-valid:top-1 peer-valid:text-xs pointer-events-none">
                Password
              </label>
              <button
                type="button"
                className="absolute right-4 top-4 text-gray-300 text-xs hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button 
              type="submit" 
              className={`bg-[#e50914] text-white font-bold py-3 rounded mt-6 hover:bg-[#c11119] transition ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In…' : 'Sign In'}
            </button>

            <div className="flex justify-between items-center text-[#b3b3b3] text-xs mt-2">
              <div className="flex items-center gap-1">
                <input type="checkbox" id="remember" className="w-4 h-4 bg-[#333] border-none rounded focus:ring-0 accent-[#737373]" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <button type="button" className="hover:underline" onClick={() => resetPassword(email)}>Forgot password?</button>
            </div>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await loginWithGoogle();
            }}
            className="bg-white py-3.5 rounded font-bold text-black hover:bg-gray-200 transition w-full flex items-center justify-center gap-2 border border-white"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <div className="mt-12 text-[#737373]">
            <p className="mb-4">
              New to Netflix? <span className="text-white hover:underline cursor-pointer" onClick={() => window.location.hash = AppRoute.LANDING}>Sign up now.</span>
            </p>
            <p className="text-xs">
              This page is protected by Google reCAPTCHA to ensure you're not a bot. <a href={`#${AppRoute.PRIVACY}`} className="text-[#0071eb] hover:underline">Learn more.</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-black/75 md:bg-black/75 border-t border-gray-800 md:border-none py-8 mt-auto md:mt-0">
         <div className="max-w-5xl mx-auto px-4 md:px-12 text-[#737373] text-sm">
             <p className="mb-6">Questions? Call 000-800-919-1694</p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                 <a href={`#${AppRoute.FAQ}`} className="hover:underline">FAQ</a>
                 <a href={`#${AppRoute.HELP}`} className="hover:underline">Help Centre</a>
                 <a href={`#${AppRoute.TERMS}`} className="hover:underline">Terms of Use</a>
                 <a href={`#${AppRoute.PRIVACY}`} className="hover:underline">Privacy</a>
                 <a href={`#${AppRoute.COOKIES}`} className="hover:underline">Cookie Preferences</a>
                 <a href={`#${AppRoute.CORPORATE}`} className="hover:underline">Corporate Information</a>
             </div>
         </div>
      </div>
    </div>
  );
};
