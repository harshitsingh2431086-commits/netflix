import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { getAllUsers, toggleBlockUser } from '../../services/userService';
import { Search, Ban, CheckCircle, User as UserIcon } from 'lucide-react';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleBlock = async (uid: string, status: 'active' | 'blocked') => {
        if (!confirm(`Are you sure you want to ${status === 'active' ? 'BLOCK' : 'UNBLOCK'} this user?`)) return;

        await toggleBlockUser(uid, status);

        // Optimistic Update
        setUsers(users.map(u => u.uid === uid ? { ...u, status: status === 'active' ? 'blocked' : 'active' } : u));
    };

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="bg-[#1f1f1f] rounded-xl border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><UserIcon /> User Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search email..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-red-600"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-700">
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Last Active</th>
                            <th className="p-3">Watch Time</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center p-8 text-gray-500">Loading users...</td></tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user.uid} className="border-b border-gray-800 hover:bg-[#2a2a2a] transition">
                                <td className="p-3 text-white font-medium">{user.email}</td>
                                <td className="p-3 text-gray-400 text-sm capitalize">{user.role || 'user'}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'blocked' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                                        {user.status || 'Active'}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-400 text-sm">
                                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-3 text-gray-400 text-sm">
                                    {user.totalWatchTime ? Math.round(user.totalWatchTime / 60) + 'm' : '0m'}
                                </td>
                                <td className="p-3 text-right">
                                    {user.role !== 'admin' && (
                                        <button
                                            onClick={() => handleToggleBlock(user.uid, user.status as any || 'active')}
                                            className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ml-auto ${user.status === 'blocked'
                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                    : 'bg-red-600 text-white hover:bg-red-700'
                                                }`}
                                        >
                                            {user.status === 'blocked' ? <><CheckCircle size={12} /> Unblock</> : <><Ban size={12} /> Block</>}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
