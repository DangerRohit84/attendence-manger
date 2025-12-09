import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers } from '../services/storage';
import Button from './Button';
import { GraduationCap, School, LogIn, ChevronRight, UserCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, user: User | null) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('TEACHER');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Load users for student dropdown
    const allUsers = getUsers();
    // Filter mostly for students, but technically any user can 'login' as a student role for attendance
    setUsers(allUsers);
  }, []);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulating auth - in real app, check password
    onLogin('TEACHER', null);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedStudentId);
    if (user) {
      onLogin('STUDENT', user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4">
      <div className="w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side - Teacher */}
        <div 
          onClick={() => setActiveTab('TEACHER')}
          className={`flex-1 p-8 md:p-12 transition-all duration-300 cursor-pointer md:cursor-default flex flex-col justify-center relative overflow-hidden ${
            activeTab === 'TEACHER' 
              ? 'bg-blue-900/20 md:bg-transparent' 
              : 'bg-slate-950/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
          }`}
        >
          {activeTab === 'TEACHER' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>}
          
          <div className="flex flex-col items-center text-center space-y-6 z-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${activeTab === 'TEACHER' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-800'}`}>
              <School className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Teacher Portal</h2>
              <p className="text-slate-400 text-sm">Create classes, generate QRs, and manage users.</p>
            </div>

            {activeTab === 'TEACHER' && (
              <form onSubmit={handleTeacherLogin} className="w-full max-w-xs space-y-4 animate-fade-in mt-4">
                <input 
                  type="password" 
                  placeholder="Password (Any)" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-none">
                  Access Dashboard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Divider for Mobile */}
        <div className="h-px w-full bg-slate-800 md:w-px md:h-auto"></div>

        {/* Right Side - Student */}
        <div 
          onClick={() => setActiveTab('STUDENT')}
          className={`flex-1 p-8 md:p-12 transition-all duration-300 cursor-pointer md:cursor-default flex flex-col justify-center relative overflow-hidden ${
            activeTab === 'STUDENT' 
              ? 'bg-emerald-900/20 md:bg-transparent' 
              : 'bg-slate-950/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
          }`}
        >
          {activeTab === 'STUDENT' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-400"></div>}

          <div className="flex flex-col items-center text-center space-y-6 z-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${activeTab === 'STUDENT' ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-800'}`}>
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Student Check-In</h2>
              <p className="text-slate-400 text-sm">Scan teacher's QR code to mark attendance.</p>
            </div>

            {activeTab === 'STUDENT' && (
              <form onSubmit={handleStudentLogin} className="w-full max-w-xs space-y-4 animate-fade-in mt-4">
                 <div className="relative">
                   <select 
                     value={selectedStudentId}
                     onChange={e => setSelectedStudentId(e.target.value)}
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                   >
                     <option value="">Select your name...</option>
                     {users.map(u => (
                       <option key={u.id} value={u.id}>
                         {u.name} {u.status === 'PENDING' ? ' (Pending)' : ''}
                       </option>
                     ))}
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <UserCircle className="w-5 h-5 text-slate-500" />
                   </div>
                 </div>
                 
                 <Button disabled={!selectedStudentId} type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border-none">
                   Start Attendance
                   <ChevronRight className="w-4 h-4 ml-2" />
                 </Button>
              </form>
            )}
          </div>
        </div>

      </div>
      
      <div className="fixed bottom-4 text-center text-slate-600 text-xs">
        <p>Sentinel Smart Attendance System • v1.0.2</p>
      </div>
    </div>
  );
};

export default Login;
