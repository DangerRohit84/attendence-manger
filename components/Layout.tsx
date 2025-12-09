import React from 'react';
import { AppView, AuthState } from '../types';
import { LayoutDashboard, UserPlus, ScanLine, Users, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  auth: AuthState;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, auth, onLogout }) => {
  // Define all possible items
  const allNavItems = [
    { id: AppView.DASHBOARD, label: auth.role === 'STUDENT' ? 'My Dashboard' : 'Dashboard', icon: LayoutDashboard, roles: ['TEACHER', 'STUDENT'] },
    { id: AppView.KIOSK, label: auth.role === 'TEACHER' ? 'Host Session' : 'Scan Attendance', icon: ScanLine, roles: ['TEACHER', 'STUDENT'] },
    { id: AppView.REGISTER, label: 'Register Users', icon: UserPlus, roles: ['TEACHER'] },
    { id: AppView.ID_CARD, label: 'Manage Users', icon: Users, roles: ['TEACHER'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(auth.role || ''));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Sentinel
          </h1>
          <p className="text-xs text-slate-500 mt-1">Smart Attendance AI</p>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {auth.role} Menu
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? auth.role === 'TEACHER' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${auth.role === 'TEACHER' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
               {auth.role === 'TEACHER' ? 'T' : auth.currentUser?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{auth.role === 'TEACHER' ? 'Teacher Admin' : auth.currentUser?.name}</p>
               <p className="text-xs text-slate-500 truncate">{auth.role}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
        <header className="p-6 md:p-8 flex items-center justify-between">
           <h2 className="text-xl font-semibold text-white">
             {navItems.find(n => n.id === currentView)?.label || 'Sentinel'}
           </h2>
           <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                <div className={`w-2 h-2 rounded-full ${process.env.API_KEY ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-slate-400">AI System {process.env.API_KEY ? 'Ready' : 'Offline'}</span>
              </div>
           </div>
        </header>
        <div className="px-6 md:px-8 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
