import React, { useEffect, useState } from 'react';
import { getContentRequests, updateRequestStatus, deleteRequest } from '../../services/requestService';
import { ContentRequest } from '../../types';
import { Trash2, CheckCircle, Clock, XCircle, Mail } from 'lucide-react';

export const RequestManager: React.FC = () => {
    const [requests, setRequests] = useState<ContentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        const data = await getContentRequests();
        setRequests(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id: string, status: 'pending' | 'resolved' | 'failed') => {
        const success = await updateRequestStatus(id, status);
        if (success) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this request?")) return;
        const success = await deleteRequest(id);
        if (success) {
            setRequests(prev => prev.filter(r => r.id !== id));
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading requests...</div>;
    }

    return (
        <div className="bg-[#1f1f1f] rounded-xl border border-gray-800 overflow-hidden shadow-2xl animate-in fade-in duration-500">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-zinc-900 to-[#1f1f1f]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Mail className="text-red-500" size={20} />
                    Content Requests
                </h2>
                <span className="bg-red-600/20 text-red-500 text-xs font-bold px-3 py-1 rounded-full border border-red-600/30">
                    {requests.length} Total
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Title Requested</th>
                            <th className="px-6 py-4 font-semibold">User Email</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {requests.length > 0 ? requests.map((request) => (
                            <tr key={request.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-200">{request.contentTitle}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {request.userEmail}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(request.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${request.status === 'resolved' ? 'bg-green-600/10 text-green-500 border-green-600/30' :
                                            request.status === 'failed' ? 'bg-red-600/10 text-red-500 border-red-600/30' :
                                                'bg-blue-600/10 text-blue-500 border-blue-600/30'
                                        }`}>
                                        {request.status === 'resolved' && <CheckCircle size={10} />}
                                        {request.status === 'failed' && <XCircle size={10} />}
                                        {request.status === 'pending' && <Clock size={10} />}
                                        {request.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleStatusUpdate(request.id, 'resolved')}
                                            className="p-1.5 bg-green-600/20 text-green-500 rounded hover:bg-green-600 hover:text-white transition-all shadow-lg"
                                            title="Mark Resolved"
                                        >
                                            <CheckCircle size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(request.id, 'failed')}
                                            className="p-1.5 bg-red-600/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition-all shadow-lg"
                                            title="Mark Failed"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                        <div className="w-px h-6 bg-gray-800 mx-1" />
                                        <button
                                            onClick={() => handleDelete(request.id)}
                                            className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-red-600 hover:text-white transition-all shadow-lg"
                                            title="Delete Request"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <Mail className="mx-auto mb-2 opacity-20" size={48} />
                                    No pending requests found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
