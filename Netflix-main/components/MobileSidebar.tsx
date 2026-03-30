import React, { useRef, useEffect } from 'react';
import { useStore } from '../context/Store';
import { AppRoute } from '../types';
import { X, Home, Tv, Film, Plus, LogOut, User, Menu } from 'lucide-react';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout, currentProfile } = useStore();
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-[90] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 w-[70%] max-w-[300px] h-full bg-[#141414] z-[100] transform transition-transform duration-300 ease-in-out border-r border-[#333] ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-5 flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 border-b border-[#333] pb-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={currentProfile?.avatarUrl || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"}
                                alt="Profile"
                                className="w-10 h-10 rounded shadow-md"
                            />
                            <div>
                                <p className="font-bold text-white text-sm">{currentProfile?.name || 'User'}</p>
                                <p className="text-xs text-gray-400">Switch Profiles</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 space-y-2">
                        <SidebarItem icon={Home} label="Home" route={AppRoute.BROWSE} onClose={onClose} />
                        <SidebarItem icon={Tv} label="TV Shows" route={AppRoute.TV_SHOWS} onClose={onClose} />
                        <SidebarItem icon={Film} label="Movies" route={AppRoute.MOVIES} onClose={onClose} />
                        <div className="my-4 border-t border-[#333]" />
                        <SidebarItem icon={Plus} label="My List" route={AppRoute.MY_LIST} onClose={onClose} />
                        <SidebarItem icon={User} label="Account" route={AppRoute.ACCOUNT} onClose={onClose} />
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto border-t border-[#333] pt-6">
                        <button
                            onClick={() => {
                                onClose();
                                logout();
                                window.location.hash = AppRoute.LANDING;
                            }}
                            className="flex items-center gap-4 text-gray-400 hover:text-white transition w-full px-2 py-3 rounded hover:bg-[#333]"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                        <div className="mt-4 text-xs text-gray-600 px-2">
                            Version 2.0.0
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

const SidebarItem = ({ icon: Icon, label, route, onClose }: { icon: any, label: string, route: string, onClose: () => void }) => {
    const isActive = window.location.hash === `#${route}`;
    return (
        <button
            onClick={() => {
                onClose();
                window.location.hash = route;
            }}
            className={`flex items-center gap-4 w-full px-2 py-4 rounded transition-colors ${isActive ? 'text-white border-l-4 border-[#e50914] bg-[#222]' : 'text-gray-400 hover:text-white hover:bg-[#222]'
                }`}
        >
            <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
            <span className={`font-medium ${isActive ? 'text-white font-bold' : ''}`}>{label}</span>
        </button>
    );
}
