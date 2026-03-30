import React from 'react';
import { Home, Search, PlayCircle, Download } from 'lucide-react';
import { AppRoute } from '../types';

interface MobileNavProps {
    user: any;
}

export const MobileNav: React.FC<MobileNavProps> = ({ user }) => {
    if (!user) return null;

    const navigate = (route: AppRoute) => {
        window.location.hash = route;
    };

    const isActive = (route: AppRoute) => window.location.hash === '#' + route;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-[#121212] bg-opacity-[.98] border-t border-[#2a2a2a] z-[90] lg:hidden flex items-center justify-between px-6 pb-2 backdrop-blur-sm">
            <div
                onClick={() => navigate(AppRoute.BROWSE)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 transition ${isActive(AppRoute.BROWSE) ? 'text-white' : 'text-[#8c8c8c]'}`}
            >
                <Home strokeWidth={isActive(AppRoute.BROWSE) ? 2.5 : 2} size={22} />
                <span className="text-[9px] font-medium tracking-wide">Home</span>
            </div>

            <div
                onClick={() => navigate(AppRoute.NEW_POPULAR)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 transition ${isActive(AppRoute.NEW_POPULAR) ? 'text-white' : 'text-[#8c8c8c]'}`}
            >
                <PlayCircle strokeWidth={isActive(AppRoute.NEW_POPULAR) ? 2.5 : 2} size={22} />
                <span className="text-[9px] font-medium tracking-wide">New & Hot</span>
            </div>

            <div
                onClick={() => navigate(AppRoute.SEARCH)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 transition ${isActive(AppRoute.SEARCH) ? 'text-white' : 'text-[#8c8c8c]'}`}
            >
                <Search strokeWidth={isActive(AppRoute.SEARCH) ? 2.5 : 2} size={22} />
                <span className="text-[9px] font-medium tracking-wide">Search</span>
            </div>

            <div
                onClick={() => navigate(AppRoute.MY_LIST)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 transition ${isActive(AppRoute.MY_LIST) ? 'text-white' : 'text-[#8c8c8c]'}`}
            >
                <Download strokeWidth={isActive(AppRoute.MY_LIST) ? 2.5 : 2} size={22} />
                <span className="text-[9px] font-medium tracking-wide">Downloads</span>
            </div>
        </div>
    );
};
