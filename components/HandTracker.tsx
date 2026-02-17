
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (hands: HandData[]) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let running = true;

    const setupLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2 // Detect both hands
        });
        
        if (running) {
            landmarkerRef.current = landmarker;
            startWebcam();
        }
      } catch (error) {
        console.error("Error loading HandLandmarker:", error);
        setLoading(false);
      }
    };

    setupLandmarker();

    return () => {
        running = false;
        if (landmarkerRef.current) landmarkerRef.current.close();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
      setLoading(false);
    } catch (err) {
      console.error("Webcam access denied or error", err);
      setLoading(false);
    }
  };

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current) return;

    const startTimeMs = performance.now();
    if (videoRef.current.videoWidth > 0) {
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
        
        const hands: HandData[] = [];
        
        if (results.landmarks && results.landmarks.length > 0) {
            results.landmarks.forEach((landmarks) => {
                const wrist = landmarks[0];
                const thumb = landmarks[4];
                const index = landmarks[8];
                const middle = landmarks[12];
                const ring = landmarks[16];
                const pinky = landmarks[20];
                
                const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                const palmSize = dist(wrist, landmarks[5]); 
                const avgTipDist = (dist(wrist, thumb) + dist(wrist, index) + dist(wrist, middle) + dist(wrist, ring) + dist(wrist, pinky)) / 5;
                const ratio = avgTipDist / (palmSize || 1);
                
                let rawTension = 1 - ((ratio - 0.7) / (2.2 - 0.7));
                rawTension = Math.max(0, Math.min(1, rawTension));
                
                const x = (landmarks[9].x - 0.5) * -2;
                const y = -(landmarks[9].y - 0.5) * 2;

                hands.push({
                    present: true,
                    tension: rawTension,
                    x,
                    y
                });
            });
        }
        
        onHandUpdate(hands);
    }
    
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black/50 backdrop-blur-sm transition-opacity opacity-80 hover:opacity-100">
      {loading && <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">Init Camera...</div>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
    </div>
  );
};

export default HandTracker;
