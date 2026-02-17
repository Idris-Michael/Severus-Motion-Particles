
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { HandData, HandPoint } from '../types';

/**
 * Simple 1D Kalman Filter
 * Used to smooth out noisy signal data (jitter) from the webcam detection
 * while maintaining responsiveness (low latency).
 */
class SimpleKalmanFilter {
  private x: number; // State estimate
  private p: number; // Estimation error covariance
  private q: number; // Process noise covariance (sensitivity to change)
  private r: number; // Measurement noise covariance (expected jitter)
  private k: number; // Kalman gain

  constructor(initialValue: number = 0, q: number = 0.1, r: number = 0.1) {
    this.x = initialValue;
    this.p = 1.0; 
    this.q = q; // Higher = follows movement faster (more jitter)
    this.r = r; // Higher = suppresses jitter more (more lag)
    this.k = 0;
  }

  public update(measurement: number): number {
    // 1. Prediction update
    this.p = this.p + this.q;

    // 2. Measurement update
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;

    return this.x;
  }

  public setState(value: number) {
    this.x = value;
    this.p = 1.0; // Reset uncertainty
  }
}

interface HandFilters {
  x: SimpleKalmanFilter;
  y: SimpleKalmanFilter;
  z: SimpleKalmanFilter;
  tension: SimpleKalmanFilter;
}

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
  gestureThresholds?: {
    openRatio: number;   // Ratio relative to palm size for Open Hand (Tension 0)
    closedRatio: number; // Ratio relative to palm size for Closed Fist (Tension 1)
  };
}

const HandTracker: React.FC<HandTrackerProps> = ({ 
  onHandUpdate, 
  gestureThresholds = { openRatio: 2.2, closedRatio: 0.85 } 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'tracking' | 'error'>('loading');
  
  // Use refs to track state/props inside the animation loop to avoid stale closures
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const onHandUpdateRef = useRef(onHandUpdate);
  const statusRef = useRef(status);
  const thresholdsRef = useRef(gestureThresholds);
  
  // Store Kalman Filters for each hand (Left/Right)
  const handFiltersRef = useRef<Map<string, HandFilters>>(new Map());

  // Keep refs synchronized with props/state
  useEffect(() => { onHandUpdateRef.current = onHandUpdate; }, [onHandUpdate]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { thresholdsRef.current = gestureThresholds; }, [gestureThresholds]);

  useEffect(() => {
    let mounted = true;

    const setupLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        
        if (!mounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2, // Enable Dual Hand Support
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        if (mounted) {
            landmarkerRef.current = landmarker;
            setStatus('ready');
            startWebcam();
        }
      } catch (error) {
        console.error("Error loading HandLandmarker:", error);
        if (mounted) setStatus('error');
      }
    };

    setupLandmarker();

    return () => {
        mounted = false;
        if (landmarkerRef.current) landmarkerRef.current.close();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user"
          } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
            videoRef.current?.play();
            predictWebcam();
        };
      }
    } catch (err) {
      console.error("Webcam access denied or error", err);
      setStatus('error');
    }
  };

  const predictWebcam = () => {
    // Schedule next frame first to keep loop running
    requestRef.current = requestAnimationFrame(predictWebcam);

    if (!landmarkerRef.current || !videoRef.current) return;

    // Ensure video is playing and has valid dimensions before detecting
    if (videoRef.current.readyState >= 2) { 
        const startTimeMs = performance.now();
        try {
          const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
          
          if (results.landmarks && results.landmarks.length > 0) {
              // Update status if it changed
              if (statusRef.current !== 'tracking') setStatus('tracking');
              
              const activeHands: HandPoint[] = [];
              const { openRatio, closedRatio } = thresholdsRef.current;
              const detectedHandIds = new Set<string>();

              results.landmarks.forEach((landmarks, index) => {
                  // Get handedness (Left/Right)
                  const handedness = results.handedness[index][0].categoryName; 
                  detectedHandIds.add(handedness);

                  const wrist = landmarks[0];
                  const thumb = landmarks[4];
                  const indexFinger = landmarks[8];
                  const middle = landmarks[12];
                  const ring = landmarks[16];
                  const pinky = landmarks[20];
                  
                  const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                  
                  // 1. Calculate Open/Closed Tension
                  const palmSize = dist(wrist, landmarks[5]); 
                  const tipsToWrist = (dist(wrist, thumb) + dist(wrist, indexFinger) + dist(wrist, middle) + dist(wrist, ring) + dist(wrist, pinky)) / 5;
                  
                  // Ratio: High (Open) -> Low (Closed)
                  // Typical Open: > 2.0
                  // Typical Closed: < 1.0
                  const ratio = tipsToWrist / (palmSize || 0.1);
                  
                  // Map ratio to 0-1 tension range
                  // If ratio >= openRatio, Tension = 0
                  // If ratio <= closedRatio, Tension = 1
                  let rawTension = 1 - ((ratio - closedRatio) / (openRatio - closedRatio));
                  rawTension = Math.max(0, Math.min(1, rawTension));
                  
                  // 2. Calculate Position (Mirrored X)
                  // MediaPipe X: 0(Left) -> 1(Right). 
                  // Canvas X: -1(Left) -> 1(Right).
                  const rawX = (landmarks[9].x - 0.5) * -2; 
                  const rawY = -(landmarks[9].y - 0.5) * 2; 

                  // 3. Estimate Z depth based on palm size relative to frame
                  // Larger palm = closer = more negative Z in ThreeJS usually, 
                  // but here we want a normalized value.
                  const rawZ = (palmSize - 0.15) * 10; 

                  // --- KALMAN FILTER SMOOTHING ---
                  let filters = handFiltersRef.current.get(handedness);

                  if (!filters) {
                    // Q: Process Noise (Sensitivity) - Higher = follows movement faster (more jitter)
                    // R: Measurement Noise (Jitter) - Higher = smoother, more lag
                    // Tuned for smoothness during rapid gestures (higher R, moderate Q)
                    filters = {
                      // X/Y: Reduced Q (0.15 -> 0.1) and increased R (0.05 -> 0.1) to smooth out velocity noise
                      x: new SimpleKalmanFilter(rawX, 0.1, 0.1),
                      y: new SimpleKalmanFilter(rawY, 0.1, 0.1),
                      // Z: Significantly reduced Q to stabilize depth flickering
                      z: new SimpleKalmanFilter(rawZ, 0.05, 0.1),
                      // Tension: Kept responsive but filtered
                      tension: new SimpleKalmanFilter(rawTension, 0.2, 0.08) 
                    };
                    handFiltersRef.current.set(handedness, filters);
                  }

                  // Apply Filter
                  const smoothX = filters.x.update(rawX);
                  const smoothY = filters.y.update(rawY);
                  const smoothZ = filters.z.update(rawZ);
                  const smoothTension = filters.tension.update(rawTension);

                  activeHands.push({
                      id: handedness,
                      present: true,
                      tension: smoothTension,
                      x: smoothX,
                      y: smoothY,
                      z: smoothZ
                  });
              });

              // Clean up filters for hands that are no longer detected
              for (const id of handFiltersRef.current.keys()) {
                  if (!detectedHandIds.has(id)) {
                      handFiltersRef.current.delete(id);
                  }
              }

              onHandUpdateRef.current(activeHands);
          } else {
              if (statusRef.current === 'tracking') setStatus('ready');
              // Clear filters if no hands detected for cleaner restart
              handFiltersRef.current.clear();
              onHandUpdateRef.current([]);
          }
        } catch (e) {
          console.warn("Detection failed", e);
        }
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 w-32 h-24 rounded-lg overflow-hidden border-2 transition-colors duration-300 shadow-lg bg-black/50 backdrop-blur-sm ${status === 'tracking' ? 'border-green-500 shadow-green-500/20' : 'border-white/20'}`}>
      
      {/* Loading Overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-[10px] text-white/70 font-mono">INIT AI...</span>
        </div>
      )}

      {/* Error Overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 z-10">
           <span className="text-[10px] text-white font-mono">CAM ERROR</span>
        </div>
      )}

      {/* Mirrored Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />
      
      {/* Status Indicator Dot */}
      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${status === 'tracking' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      
      {/* Debug Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
          <p className="text-[8px] text-white text-center font-mono uppercase">
              {status === 'tracking' ? 'DUAL HAND READY' : status === 'ready' ? 'SHOW HANDS' : status}
          </p>
      </div>
    </div>
  );
};

export default HandTracker;
