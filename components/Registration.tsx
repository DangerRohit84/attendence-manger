import React, { useState } from 'react';
import { User } from '../types';
import { saveUser, bulkCreateUsers } from '../services/storage';
import { ROLES } from '../constants';
import Camera from './Camera';
import Button from './Button';
import { UserPlus, CheckCircle, RefreshCcw, Upload, FileText } from 'lucide-react';
import QRCode from 'react-qr-code';

const Registration: React.FC = () => {
  const [mode, setMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
  
  // Single Registration State
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  // Bulk Import State
  const [csvData, setCsvData] = useState('');
  const [bulkStatus, setBulkStatus] = useState<string>('');

  const handleCapture = (img: string) => {
    setCapturedImage(img);
    setIsCameraActive(false);
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !capturedImage) return;

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      role,
      photoData: capturedImage,
      status: 'ACTIVE',
      registeredAt: new Date().toISOString()
    };

    saveUser(newUser);
    setRegisteredUser(newUser);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvData.trim()) return;

    try {
      const lines = csvData.trim().split('\n');
      const newUsers: User[] = [];
      
      lines.forEach((line, index) => {
        // Format: Name, Role, ID (Optional - if empty generated)
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 1) return;

        const uName = parts[0];
        const uRole = parts[1] && ROLES.includes(parts[1]) ? parts[1] : ROLES[0];
        // Use provided ID or generate one
        const uId = parts[2] || crypto.randomUUID();

        if (uName) {
          newUsers.push({
            id: uId,
            name: uName,
            role: uRole,
            photoData: null,
            status: 'PENDING', // Waiting for first scan to attach face
            registeredAt: new Date().toISOString()
          });
        }
      });

      bulkCreateUsers(newUsers);
      setBulkStatus(`Successfully imported ${newUsers.length} users. Instruct them to perform "Student Check-In" to enroll their face.`);
      setCsvData('');
    } catch (err) {
      setBulkStatus('Error parsing CSV. Please check format.');
    }
  };

  const reset = () => {
    setName('');
    setRole(ROLES[0]);
    setCapturedImage(null);
    setRegisteredUser(null);
    setIsCameraActive(false);
  };

  if (registeredUser) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700 animate-fade-in">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
        <p className="text-slate-400 mb-8 text-center">
          {registeredUser.name} has been added to the system.
        </p>
        
        <div className="bg-white p-4 rounded-xl mb-6 shadow-xl">
           <QRCode value={registeredUser.id} size={180} />
        </div>
        <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider font-semibold">User ID QR Code</p>

        <Button onClick={reset} variant="secondary">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Register Another
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode('SINGLE')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === 'SINGLE' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Single User (With Photo)
        </button>
        <button
          onClick={() => setMode('BULK')}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${mode === 'BULK' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Bulk Import (Excel/CSV)
        </button>
      </div>

      {mode === 'SINGLE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">New User Registration</h2>
              <p className="text-slate-400">Enter details and capture a reference photo for facial recognition.</p>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="pt-4">
                <Button 
                    type="submit" 
                    className="w-full py-3" 
                    disabled={!name || !capturedImage}
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Register User
                </Button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-slate-300">Reference Photo</label>
            {capturedImage ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-600 group">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => setCapturedImage(null)} variant="secondary">Retake Photo</Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 flex flex-col items-center justify-center aspect-video relative">
                {!isCameraActive ? (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-8 h-8 text-slate-400" />
                    </div>
                    <Button onClick={() => setIsCameraActive(true)} variant="secondary">Start Camera</Button>
                  </div>
                ) : (
                  <Camera isActive={true} onCapture={handleCapture} label="Align face specifically" />
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           <div>
              <h2 className="text-2xl font-bold text-white mb-2">Bulk Import</h2>
              <p className="text-slate-400">Import student lists. Users will be set to <span className="text-amber-400 font-mono">PENDING</span>. Their face will be registered automatically upon their first attendance scan.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">CSV Data (Name, Role, [Optional ID])</label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={`John Doe, Student, 12345\nJane Smith, Student\nDr. Brown, Staff`}
                className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Tip: Copy columns from Excel and paste here.
                </p>
                <Button onClick={handleBulkSubmit} disabled={!csvData.trim()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>

            {bulkStatus && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${bulkStatus.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                <FileText className="w-5 h-5" />
                <p>{bulkStatus}</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Registration;