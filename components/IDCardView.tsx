import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/storage';
import QRCode from 'react-qr-code';
import { Download, Search, User as UserIcon, Trash2 } from 'lucide-react';
import Button from './Button';

const IDCardView: React.FC = () => {
  const [users, setUsers] = useState(getUsers());
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Refresh users when component mounts or search clears
    setUsers(getUsers());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      deleteUser(id);
      setUsers(getUsers()); // Refresh list
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  const downloadQR = (id: string, name: string) => {
    const svg = document.getElementById(`qr-${id}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${name}-QR.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold text-white mb-2">Manage Users</h2>
           <p className="text-slate-400">View registered users, download ID cards, or remove users.</p>
         </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search users..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
           <p className="text-slate-500">No users found. Go to 'Register' to add someone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl overflow-hidden shadow-xl transform transition-all hover:scale-[1.02]">
              <div className={`p-4 flex items-center justify-between ${user.status === 'PENDING' ? 'bg-amber-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                 <h3 className="text-white font-bold truncate">{user.name}</h3>
                 <span className="text-xs bg-white/20 text-white px-2 py-1 rounded font-mono uppercase">{user.role}</span>
              </div>
              <div className="p-6 flex flex-col items-center">
                 <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-sm overflow-hidden mb-4 bg-slate-200 flex items-center justify-center">
                   {user.photoData ? (
                     <img src={user.photoData} alt={user.name} className="w-full h-full object-cover" />
                   ) : (
                     <UserIcon className="w-12 h-12 text-slate-400" />
                   )}
                 </div>
                 <div className="bg-white p-2 rounded-lg border border-slate-100 mb-4">
                    <QRCode id={`qr-${user.id}`} value={user.id} size={120} />
                 </div>
                 <div className="text-center mb-6">
                   <p className="text-xs text-slate-400 font-mono break-all px-4">{user.id}</p>
                   {user.status === 'PENDING' && (
                     <p className="text-xs text-amber-600 font-semibold mt-1">Pending Face Registration</p>
                   )}
                 </div>
                 
                 <div className="flex gap-2 w-full">
                   <Button variant="secondary" onClick={() => downloadQR(user.id, user.name)} className="flex-1 text-sm bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 hover:text-slate-900 shadow-none">
                     <Download className="w-4 h-4 mr-2" />
                     Save ID
                   </Button>
                   <Button variant="danger" onClick={() => handleDelete(user.id)} className="px-3">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IDCardView;