import React, { useEffect, useState } from 'react';
import { X, Check, Info, AlertTriangle } from 'lucide-react';
import { downloadManager } from '../services/downloadManager';

export interface ToastMessage {
    id: string;
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
}

export const Toaster: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        // Subscribe to DownloadManager events
        const unsubscribe = downloadManager.onEvent((event) => {
            const id = Math.random().toString(36).substr(2, 9);
            const newToast: ToastMessage = {
                id,
                type: event.type === 'error' ? 'error' : 'info',
                title: event.title,
                message: event.message
            };

            setToasts(prev => [...prev, newToast]);

            // Auto-dismiss
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        });

        return () => unsubscribe();
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-md pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="pointer-events-auto bg-[#333] text-white px-4 py-3 rounded shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom fade-in duration-300 border-l-4 border-[#e50914]"
                >
                    <div className="mt-1">
                        {toast.type === 'success' && <Check size={18} className="text-green-500" />}
                        {toast.type === 'error' && <AlertTriangle size={18} className="text-orange-500" />}
                        {toast.type === 'info' && <Info size={18} className="text-blue-400" />}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">{toast.title}</h4>
                        <p className="text-xs text-gray-300">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
