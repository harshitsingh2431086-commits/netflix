import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { submitContentRequest } from '../services/requestService';
import { Send, CheckCircle2 } from 'lucide-react';

export const RequestContent: React.FC = () => {
    const { user } = useStore();
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const success = await submitContentRequest(user.uid, user.email, title.trim());
        setIsSubmitting(false);

        if (success) {
            setIsSuccess(true);
            setTitle('');
            setTimeout(() => setIsSuccess(false), 5000);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-[#181818] rounded-xl p-6 border border-zinc-800 shadow-xl max-w-2xl mx-auto my-8">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                Want a specific show or movie?
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Type the name below and <span className="text-red-500 font-bold">OUR team ensures that in 48 hours content will be there</span>.
                Our team will try hard to get your favorites!
            </p>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    placeholder="Enter movie or show name..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-3 px-4 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-600 transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting || isSuccess}
                />

                <button
                    type="submit"
                    disabled={!title.trim() || isSubmitting || isSuccess}
                    className="absolute right-2 top-1.5 p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-zinc-800 disabled:text-gray-500 transition-all active:scale-95"
                >
                    {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </button>
            </form>

            <div className="mt-4 flex items-center gap-2 min-h-[20px]">
                {isSuccess && (
                    <span className="text-green-500 text-xs font-medium animate-in fade-in slide-in-from-left-2 transition-all">
                        Request submitted! Your content is on its way.
                    </span>
                )}
                {isSubmitting && (
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
            </div>
        </div>
    );
};
