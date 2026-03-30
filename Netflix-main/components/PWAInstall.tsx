import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { X, Download, Share } from 'lucide-react';

export const PWAInstall: React.FC = () => {
    const { isPWAInstallable, isPWAStandalone, installPWA } = useStore();
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        if (isPWAStandalone) return;

        // Show prompt after a small delay if installable
        if (isPWAInstallable) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }

        // iOS Prompt Logic - show once per session if not installed
        if (isIosDevice && !localStorage.getItem('iosInstallPromptSeen') && !isPWAStandalone) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [isPWAInstallable, isPWAStandalone]);

    const handleInstallClick = async () => {
        await installPWA();
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (isIOS) localStorage.setItem('iosInstallPromptSeen', 'true');
    };

    if (!isVisible || isPWAStandalone) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-6 md:hidden animate-slide-up">
            <div className="bg-[#1f1f1f] rounded-xl p-4 shadow-2xl border border-gray-700 flex flex-col gap-4 relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                    <img src="/favicon.png" alt="Netflix" className="w-12 h-12 rounded object-cover bg-black" />
                    <div>
                        <h3 className="font-bold text-white text-sm">Install App for Best Experience</h3>
                        <p className="text-xs text-gray-400">Faster access, fullscreen & offline capable.</p>
                    </div>
                </div>

                {isIOS ? (
                    <div className="bg-[#333] p-3 rounded text-xs text-gray-300">
                        <p className="flex items-center gap-2 mb-1">
                            1. Tap the <Share className="w-4 h-4" /> Share button below
                        </p>
                        <p className="flex items-center gap-2">
                            2. Select <span className="font-bold text-white">+ Add to Home Screen</span>
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-white text-black py-2.5 rounded font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Install App
                    </button>
                )}
            </div>
        </div>
    );
};
