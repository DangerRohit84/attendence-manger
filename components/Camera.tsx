import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon } from 'lucide-react';
import Button from './Button';

interface CameraProps {
  onCapture?: (imageData: string) => void;
  onFrame?: (video: HTMLVideoElement) => void;
  isActive: boolean;
  label?: string;
  facingMode?: 'user' | 'environment';
}

const Camera: React.FC<CameraProps> = ({ 
  onCapture, 
  onFrame, 
  isActive, 
  label, 
  facingMode = 'user' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    // Stop existing stream first if facingMode changed
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError("Camera access denied or unavailable.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, facingMode]); // Re-run if facingMode changes

  // Frame loop for QR scanning
  useEffect(() => {
    let animationFrameId: number;
    
    const loop = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && onFrame) {
        onFrame(videoRef.current);
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    if (isActive && onFrame) {
      loop();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, onFrame]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && onCapture) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      {error ? (
        <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
          />
          {onCapture && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-20">
              <Button onClick={handleCapture} className="rounded-full w-16 h-16 flex items-center justify-center !p-0 border-4 border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20">
                <CameraIcon className="w-8 h-8 text-white" />
              </Button>
            </div>
          )}
          {label && (
             <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white/80 border border-white/10 z-20">
               {label}
             </div>
          )}
        </>
      )}
    </div>
  );
};

export default Camera;