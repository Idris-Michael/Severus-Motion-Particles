
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { SystemState } from '../types';
import clsx from 'clsx';
import { ScanFace, AlertCircle, Camera } from 'lucide-react';

interface HandManagerProps {
  systemRef: React.MutableRefObject<SystemState>;
}

const HandManager: React.FC<HandManagerProps> = ({ systemRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const frameId = useRef<number>(0);
  const [status, setStatus] = useState<'initializing' | 'active' | 'error' | 'idle'>('initializing');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const stopCamera = useCallback(() => {
    if (frameId.current) cancelAnimationFrame(frameId.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('initializing');
    setErrorMsg('');
    stopCamera();

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
      );

      // Re-create landmarker if needed, or reuse if valid
      if (!landmarkerRef.current) {
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: { ideal: 30 } } 
      });
      
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          
          // Wait for data before starting loop
          videoRef.current.onloadeddata = () => {
              setStatus('active');
              loop();
          };
      }
    } catch (err: any) {
      console.error("Camera init failed:", err);
      setStatus('error');
      setErrorMsg(err.name === 'NotAllowedError' ? 'PERMISSION DENIED' : 'CAM ERROR');
    }
  }, [stopCamera]);

  const loop = () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    
    // Safety check if video is actually ready
    if (videoRef.current.readyState >= 2) {
      const startTimeMs = performance.now();
      const result = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      systemRef.current.hands = [];

      if (result.landmarks) {
         result.landmarks.forEach(landmarks => {
           const palmX = (landmarks[0].x + landmarks[9].x) / 2;
           const palmY = (landmarks[0].y + landmarks[9].y) / 2;
           
           const thumb = landmarks[4];
           const index = landmarks[8];
           const distance = Math.sqrt(
             Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
           );
           
           const rawForce = Math.max(0, Math.min(1, (0.15 - distance) / 0.12));
           const x = (palmX - 0.5) * -2; 
           const y = -(palmY - 0.5) * 2;

           systemRef.current.hands.push({
             x, 
             y, 
             active: true, 
             force: rawForce
           });
         });
      }
    }

    frameId.current = requestAnimationFrame(loop);
  };

  // Initial auto-start
  useEffect(() => {
    startCamera();
    return () => {
        stopCamera();
        landmarkerRef.current?.close();
        landmarkerRef.current = null;
    };
  }, [startCamera, stopCamera]);

  return (
    <div className={clsx(
        "fixed bottom-6 right-6 w-48 h-36 rounded-lg overflow-hidden border transition-all duration-500 z-50",
        status === 'active' ? "border-green-500/30 bg-black/50 opacity-100 hover:opacity-100" : "border-red-500/30 bg-black opacity-90"
    )}>
        {/* Loading / Error / Idle States */}
        {status !== 'active' && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-white/50 p-4 bg-black/80 z-10">
                {status === 'initializing' && <ScanFace className="animate-pulse text-blue-400" size={24} />}
                {status === 'error' && (
                    <button 
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 group hover:text-white transition-colors"
                    >
                        <div className="p-2 rounded-full bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 group-hover:border-red-500/50 transition-all">
                            <Camera size={20} className="text-red-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-mono text-center leading-tight">
                            {errorMsg || 'ENABLE INPUT'}
                        </span>
                    </button>
                )}
                {status === 'initializing' && (
                    <span className="text-[10px] uppercase tracking-widest font-mono">INIT SENSORS</span>
                )}
            </div>
        )}

        {/* Video Feed */}
        <video 
            ref={videoRef} 
            className={clsx(
                "w-full h-full object-cover transform -scale-x-100 transition-opacity duration-1000",
                status === 'active' ? "opacity-60" : "opacity-0"
            )}
            playsInline 
            muted 
        />
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <div className={clsx("w-1.5 h-1.5 rounded-full", status === 'active' ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <span className="text-[8px] font-bold text-white/80 tracking-widest">
                    OPTICAL INPUT
                </span>
            </div>
            
            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
        </div>
    </div>
  );
};

export default HandManager;
