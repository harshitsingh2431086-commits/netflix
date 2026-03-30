import React from 'react';

export const SkeletonHero: React.FC = () => {
    return (
        <div className="relative h-[85vh] md:h-[56.25vw] w-full bg-[#141414] overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gray-800/50"></div>
            <div className="absolute bottom-[20%] left-4 md:left-12 space-y-4 w-full max-w-2xl">
                <div className="h-8 md:h-16 bg-gray-700/50 rounded w-3/4"></div>
                <div className="h-4 md:h-6 bg-gray-700/50 rounded w-1/2"></div>
                <div className="h-20 bg-gray-700/50 rounded w-full hidden md:block"></div>
                <div className="flex gap-4 pt-4">
                    <div className="h-12 w-32 bg-gray-700/50 rounded"></div>
                    <div className="h-12 w-32 bg-gray-700/50 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export const SkeletonCard: React.FC<{ isLarge?: boolean }> = ({ isLarge }) => {
    return (
        <div
            className={`relative flex-none bg-[#2f2f2f] rounded-md overflow-hidden animate-pulse
      ${isLarge ? 'w-[160px] md:w-[200px] h-[240px] md:h-[300px]' : 'w-[200px] md:w-[240px] h-[110px] md:h-[135px]'}
      `}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
    );
};

export const SkeletonRow: React.FC<{ isLarge?: boolean }> = ({ isLarge }) => {
    return (
        <div className="mb-4 md:mb-8 pl-4 md:pl-12 space-y-4">
            <div className="h-6 w-48 bg-gray-800/50 rounded animate-pulse"></div>
            <div className="flex gap-2 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} isLarge={isLarge} />
                ))}
            </div>
        </div>
    );
};
