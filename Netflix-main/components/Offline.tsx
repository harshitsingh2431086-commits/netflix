import React from 'react';

export const Offline: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-[#141414] z-[9999] flex flex-col items-center justify-center text-white px-6 text-center">
            <div className="bg-[#1f1f1f] p-8 rounded-full mb-6 animate-pulse">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
            <p className="text-gray-400 mb-8 max-w-md">
                It seems you've lost your internet connection. Please verify your network to continue watching.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition"
            >
                Try Again
            </button>
        </div>
    );
};
