import React, { useEffect, useState } from 'react';
import { AttendanceRecord, User, AuthState } from '../types';
import { getAttendance, getUsers } from '../services/storage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, AlertTriangle, CheckCircle, UserPlus, Clock } from 'lucide-react';

interface DashboardProps {
  auth: AuthState;
}

const Dashboard: React.FC<DashboardProps> = ({ auth }) => {
  const [stats, setStats] = useState<{
    totalUsers: number;
    pendingUsers: number;
    presentToday: number;
    rejectedToday: number;
    recentRecords: AttendanceRecord[];
  }>({ totalUsers: 0, pendingUsers: 0, presentToday: 0, rejectedToday: 0, recentRecords: [] });

  useEffect(() => {
    const users = getUsers();
    const attendance = getAttendance();
    
    // Filter for today
    const today = new Date().toDateString();
    let relevantRecords = attendance;

    // IF STUDENT: Only show THEIR records
    if (auth.role === 'STUDENT' && auth.currentUser) {
      relevantRecords = attendance.filter(r => r.userId === auth.currentUser?.id);
    }

    const todayRecords = relevantRecords.filter(r => new Date(r.timestamp).toDateString() === today);
    
    setStats({
      totalUsers: users.length,
      pendingUsers: users.filter(u => u.status === 'PENDING').length,
      presentToday: todayRecords.filter(r => r.status === 'PRESENT').length,
      rejectedToday: todayRecords.filter(r => r.status === 'REJECTED').length,
      recentRecords: relevantRecords.slice(0, 5) // Last 5
    });
  }, [auth.role, auth.currentUser]);

  const data = [
    { name: 'Present', value: stats.presentToday, color: '#22c55e' },
    { name: 'Issues', value: stats.rejectedToday, color: '#ef4444' },
  ];

  // Fill in "Absent" only for Global/Teacher view approx calculation or just empty space
  if (auth.role === 'TEACHER') {
     data.push({ name: 'Absent', value: Math.max(0, stats.totalUsers - stats.presentToday - stats.pendingUsers), color: '#334155' });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {auth.role === 'TEACHER' && (
          <>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-white">{stats.totalUsers}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Pending Reg.</p>
                <h3 className="text-3xl font-bold text-white">{stats.pendingUsers}</h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <UserPlus className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </>
        )}

        <div className={`bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between ${auth.role === 'STUDENT' ? 'col-span-2' : ''}`}>
          <div>
             <p className="text-slate-400 text-sm font-medium mb-1">{auth.role === 'STUDENT' ? 'My Check-Ins (Today)' : 'Marked Present'}</p>
             <h3 className="text-3xl font-bold text-white">{stats.presentToday}</h3>
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between ${auth.role === 'STUDENT' ? 'col-span-2' : ''}`}>
          <div>
             <p className="text-slate-400 text-sm font-medium mb-1">Failed Scans</p>
             <h3 className="text-3xl font-bold text-white">{stats.rejectedToday}</h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
           <h3 className="text-lg font-semibold text-white mb-6">Activity Overview</h3>
           {stats.presentToday === 0 && stats.rejectedToday === 0 ? (
             <div className="h-64 flex items-center justify-center text-slate-500">
               No activity recorded today.
             </div>
           ) : (
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {data.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               <div className="flex justify-center gap-6 mt-4">
                  {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-slate-300">{d.name}</span>
                    </div>
                  ))}
               </div>
             </div>
           )}
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">
            {auth.role === 'STUDENT' ? 'My Recent History' : 'Recent Global Scans'}
          </h3>
          <div className="space-y-4">
            {stats.recentRecords.length === 0 ? (
              <p className="text-slate-500 text-center py-10">No records yet.</p>
            ) : (
              stats.recentRecords.map((record) => (
                <div key={record.timestamp} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 bg-slate-800">
                        {record.photoSnapshot && <img src={record.photoSnapshot} alt="Snap" className="w-full h-full object-cover" />}
                     </div>
                     <div>
                       <p className="text-sm font-medium text-white">{record.userName}</p>
                       <p className="text-xs text-slate-500">{record.sessionName || 'General'} • {new Date(record.timestamp).toLocaleTimeString()}</p>
                     </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    record.status === 'PRESENT' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {record.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
