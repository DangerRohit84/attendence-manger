import React, { useState, useRef, useCallback, useEffect } from 'react';
import Camera from './Camera';
import jsQR from 'jsqr';
import QRCode from 'react-qr-code';
import { getUsers, logAttendance, saveUser } from '../services/storage';
import { verifyIdentity } from '../services/geminiService';
import { User, AttendanceRecord, AttendanceSession, AuthState } from '../types';
import Button from './Button';
import { 
  ShieldCheck, 
  ShieldAlert, 
  SwitchCamera, 
  Presentation, 
  ArrowLeft
} from 'lucide-react';

interface AttendanceKioskProps {
  auth: AuthState;
}

const AttendanceKiosk: React.FC<AttendanceKioskProps> = ({ auth }) => {
  // --- Teacher Host State ---
  const [className, setClassName] = useState('');
  const [sessionData, setSessionData] = useState<AttendanceSession | null>(null);

  // --- Student Join State ---
  // Steps: 'SCAN_SESSION_QR' -> 'FACE_VERIFY' -> 'RESULT'
  const [studentStep, setStudentStep] = useState<'SCAN_SESSION_QR' | 'FACE_VERIFY' | 'RESULT'>('SCAN_SESSION_QR');
  const [scannedSession, setScannedSession] = useState<AttendanceSession | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'PROCESSING' | 'SUCCESS' | 'FAILURE'>('PROCESSING');
  const [resultMessage, setResultMessage] = useState('');
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // --- Teacher Logic ---
  const createSession = () => {
    if (!className.trim()) return;
    const newSession: AttendanceSession = {
      sessionId: crypto.randomUUID(),
      className: className,
      timestamp: Date.now(),
      hostId: 'TEACHER_DEVICE'
    };
    setSessionData(newSession);
  };

  // --- Student Logic ---
  const handleSessionQrDetected = (data: string) => {
    try {
      const session = JSON.parse(data) as AttendanceSession;
      if (session.sessionId && session.className) {
        setScannedSession(session);
        setStudentStep('FACE_VERIFY');
        // Automatically trigger verification after a brief pause
        setTimeout(() => triggerVerification(session), 1500);
      }
    } catch (e) {
      console.error("Invalid QR", e);
    }
  };

  const triggerVerification = async (session: AttendanceSession) => {
    setVerificationStatus('PROCESSING');
    
    // Auth check: we use the logged in user
    const user = auth.currentUser;
    if (!user) {
        setVerificationStatus('FAILURE');
        setResultMessage("User session invalid.");
        return;
    }

    // Capture Face
    const video = document.querySelector('video');
    if (!video) {
        setVerificationStatus('FAILURE');
        setResultMessage("Camera error.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const currentFaceBase64 = canvas.toDataURL('image/jpeg', 0.85);

    // --- SCENARIO 1: ENROLLMENT (Pending User) ---
    if (user.status === 'PENDING' || !user.photoData) {
        try {
            // Update user with new face data
            const updatedUser: User = { 
              ...user, 
              photoData: currentFaceBase64, 
              status: 'ACTIVE' 
            };
            saveUser(updatedUser);
            
            // Log Attendance
            const record: AttendanceRecord = {
                id: crypto.randomUUID(),
                userId: user.id,
                userName: user.name,
                timestamp: new Date().toISOString(),
                status: 'PRESENT',
                verificationConfidence: 1.0,
                reason: "Initial Enrollment (First Scan)",
                photoSnapshot: currentFaceBase64,
                sessionName: session.className
            };
            logAttendance(record);
            
            setVerificationStatus('SUCCESS');
            setResultMessage(`Registration Complete! Welcome, ${user.name}.`);
            setStudentStep('RESULT');
        } catch (e) {
            setVerificationStatus('FAILURE');
            setResultMessage("Registration Failed.");
            setStudentStep('RESULT');
        }
        return;
    }

    // --- SCENARIO 2: VERIFICATION (Active User) ---
    try {
        const verification = await verifyIdentity(user.photoData, currentFaceBase64);
        
        const status = verification.match ? 'PRESENT' : 'REJECTED';
        const record: AttendanceRecord = {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
            status,
            verificationConfidence: verification.confidence,
            reason: verification.reason,
            photoSnapshot: currentFaceBase64,
            sessionName: session.className
        };
        logAttendance(record);

        if (verification.match) {
            setVerificationStatus('SUCCESS');
            setResultMessage("Verified! Marked Present.");
        } else {
            setVerificationStatus('FAILURE');
            setResultMessage("Face Mismatch. Try again.");
        }
        setStudentStep('RESULT');

    } catch (error: any) {
        setVerificationStatus('FAILURE');
        setResultMessage("AI Service Error.");
        setStudentStep('RESULT');
    }
  };

  // Generic Frame Handler
  const handleFrame = useCallback((video: HTMLVideoElement) => {
    if (studentStep !== 'SCAN_SESSION_QR') return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
         handleSessionQrDetected(code.data);
      }
    }
  }, [studentStep]);


  // --- TEACHER VIEW ---
  if (auth.role === 'TEACHER') {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        {!sessionData ? (
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <Presentation className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create Class Session</h2>
            <p className="text-slate-400">Enter the class name and generate a QR code for students to scan.</p>
            <input 
              type="text" 
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Class Name (e.g. Physics 101)"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Button onClick={createSession} disabled={!className.trim()} className="w-full py-4 text-lg">
              Generate Session QR
            </Button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-scale-in">
             <h2 className="text-2xl font-bold text-slate-900 mb-2">{sessionData.className}</h2>
             <p className="text-slate-500 mb-6">Display this code to your students.</p>
             <div className="p-4 border-4 border-slate-900 rounded-xl mb-6">
               <QRCode 
                 value={JSON.stringify(sessionData)} 
                 size={256} 
                 level="H"
               />
             </div>
             <p className="text-xs text-slate-400 font-mono mb-6">{sessionData.sessionId}</p>
             <div className="flex gap-4 w-full">
                <Button variant="danger" onClick={() => { setSessionData(null); setClassName(''); }} className="flex-1">
                  End Session
                </Button>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- STUDENT VIEW ---
  if (auth.role === 'STUDENT') {
    return (
      <div className="max-w-md mx-auto h-full flex flex-col animate-fade-in">
        {(studentStep === 'SCAN_SESSION_QR' || studentStep === 'FACE_VERIFY') && (
           <div className="flex-1 flex flex-col relative bg-black rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
              <Camera 
                isActive={true} 
                onFrame={handleFrame}
                facingMode={facingMode}
              />
              
              <div className="absolute top-4 right-4 z-20">
                <Button variant="secondary" onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')} className="w-10 h-10 p-0 rounded-full flex items-center justify-center">
                   <SwitchCamera className="w-5 h-5" />
                </Button>
              </div>

              {/* OVERLAYS */}
              {studentStep === 'SCAN_SESSION_QR' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                   <div className="w-64 h-64 border-2 border-emerald-400/50 rounded-xl relative">
                      <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1"></div>
                   </div>
                   <div className="mt-8 bg-black/60 backdrop-blur px-4 py-2 rounded-full">
                     <p className="text-white font-medium">Scan Teacher's QR Code</p>
                   </div>
                   <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                      <span className="text-xs text-emerald-400 font-mono uppercase">Scanning for Session</span>
                   </div>
                </div>
              )}

              {studentStep === 'FACE_VERIFY' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                   <div className="w-72 h-72 border-2 border-yellow-400 rounded-full relative overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                      <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                   </div>
                   <div className="mt-6 bg-black/70 backdrop-blur px-6 py-3 rounded-xl text-center">
                      <h3 className="text-xl font-bold text-white mb-1">
                         {verificationStatus === 'PROCESSING' ? 'Verifying Identity...' : 'Processing'}
                      </h3>
                      <p className="text-yellow-400 text-sm">Please look directly at the camera</p>
                   </div>
                </div>
              )}
           </div>
        )}

        {studentStep === 'RESULT' && (
           <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
             <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full text-center shadow-2xl">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${verificationStatus === 'SUCCESS' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                   {verificationStatus === 'SUCCESS' ? (
                     <ShieldCheck className="w-12 h-12 text-emerald-500" />
                   ) : (
                     <ShieldAlert className="w-12 h-12 text-red-500" />
                   )}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  {verificationStatus === 'SUCCESS' ? 'Success!' : 'Check-In Failed'}
                </h2>
                <p className={`text-lg mb-8 ${verificationStatus === 'SUCCESS' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {resultMessage}
                </p>

                <Button onClick={() => { setStudentStep('SCAN_SESSION_QR'); setScannedSession(null); }} className="w-full py-3">
                  Done
                </Button>
             </div>
           </div>
        )}
      </div>
    );
  }

  return null;
};

export default AttendanceKiosk;
