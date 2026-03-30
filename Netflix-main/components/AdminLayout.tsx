import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { AppRoute } from '../types';
import { LayoutDashboard, Film, Layers, Settings, LogOut, Home, CreditCard, Menu, X, Clock } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', hash: '#' + AppRoute.ADMIN },
    { icon: Film, label: 'Content', hash: '#' + AppRoute.ADMIN_CONTENT },
    { icon: Clock, label: 'Coming Soon', hash: '#' + AppRoute.ADMIN_COMING_SOON },
    { icon: Layers, label: 'Sections', hash: '#' + AppRoute.ADMIN_SECTIONS },
    { icon: CreditCard, label: 'Plans', hash: '#' + AppRoute.ADMIN_PLANS },
    { icon: Settings, label: 'Settings', hash: '#' + AppRoute.ADMIN_SETTINGS },
  ];

  return (
    <div className="flex h-screen bg-[#141414] text-gray-100 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full w-64 bg-black border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <img src="/logoN.png" alt="NETFLIX ADMIN" className="h-16 object-contain mb-2" />
            <h1 className="text-[#e50914] text-xs font-bold tracking-widest uppercase">Admin Panel</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.hash}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${window.location.hash === item.hash
                ? 'bg-[#e50914] text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </a>
          ))}

          <div className="pt-8 mt-8 border-t border-gray-800">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
              <Home size={20} />
              <span>Back to App</span>
            </a>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => { logout(); window.location.hash = AppRoute.LOGIN; }}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 w-full rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#141414] w-full">
        <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 px-4 md:px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-white p-1"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold">{title}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};