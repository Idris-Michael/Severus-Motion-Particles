import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Particles from './components/Particles';
import Background from './components/Background';
import HandTracker from './components/HandTracker';
import Controls from './components/UI/Controls';
import VirtualBoard from './components/UI/VirtualBoard';
import { ShapeType, HandData } from './types';

// Gentle ambient space track
const AUDIO_URL = "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3";

const App: React.FC = () => {
  // Default to a calming shape and cool color
  const [shape, setShape] = useState<ShapeType>('water');
  const [color, setColor] = useState<string>('#60a5fa'); // Soft Blue
  const [particleSize, setParticleSize] = useState<number>(0.25); // Slightly larger, softer particles
  const [kidsStepIndex, setKidsStepIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(AUDIO_URL);
      audio.loop = true;
      audio.volume = 0.4; // Lower volume for calm
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      const ContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new ContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioRef.current?.play().catch(e => console.error(e));
    }
  };

  const handDataRef = useRef<HandData>([]);

  const handleHandUpdate = (data: HandData) => {
    handDataRef.current = data;
  };

  const handleShapeChange = (newShape: ShapeType) => {
    setShape(newShape);
    setKidsStepIndex(0);
    setResetKey(prev => prev + 1); // Soft reset
  };

  return (
    <div className="relative w-full h-screen bg-[#050508] overflow-hidden selection:bg-none">

      <Canvas
        camera={{ position: [0, 0, 14], fov: 55 }} // Further back, narrower FOV for less distortion
        dpr={[1, 1.5]} // Limit pixel ratio for consistent performance
        gl={{ antialias: false, alpha: false, powerPreference: "default" }}
      >
        <color attach="background" args={['#050508']} />

        <Suspense fallback={null}>
          <Background />
          <Particles
            shape={shape}
            color={color}
            size={particleSize}
            handDataRef={handDataRef}
            analyserRef={analyserRef}
            onIndexChange={setKidsStepIndex}
            resetKey={resetKey}
          />
        </Suspense>

        <EffectComposer disableNormalPass>
          {/* Reduced bloom intensity for epilepsy safety */}
          <Bloom luminanceThreshold={0.3} mipmapBlur intensity={0.6} radius={0.8} />
          {/* Heavier vignette to focus eye on center */}
          <Vignette eskil={false} offset={0.3} darkness={1.2} />
        </EffectComposer>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.2} // Very slow manual rotation
          autoRotate={true}
          autoRotateSpeed={0.2} // Very slow gentle drift
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>

      <HandTracker
        onHandUpdate={handleHandUpdate}
        gestureThresholds={{ openRatio: 2.0, closedRatio: 1.0 }} // More forgiving gesture detection
      />

      <VirtualBoard mode={shape} currentIndex={kidsStepIndex} />

      <Controls
        onShapeChange={handleShapeChange}
        onToggleAudio={toggleAudio}
        isPlaying={isPlaying}
        currentShape={shape}
      />
    </div>
  );
};

export default App;