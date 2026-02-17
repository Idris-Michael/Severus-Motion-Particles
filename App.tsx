
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { SystemState, ShapeMode } from './types';
import Swarm from './components/Swarm';
import Interface from './components/Interface';
import HandManager from './managers/HandManager';
import AudioManager from './managers/AudioManager';
import Background from './components/Background';

const App: React.FC = () => {
  const [mode, setMode] = useState<ShapeMode>('vortex');
  const [color, setColor] = useState('#06b6d4');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [particleSize, setParticleSize] = useState(0.12);
  const [menuOpen, setMenuOpen] = useState(true);

  // Global Mutable State
  const systemRef = useRef<SystemState>({
    hands: [],
    audio: { level: 0, bass: 0, high: 0 },
    mouse: { x: 0, y: 0, active: false, force: 0 },
    particleSize: 0.12
  });

  useEffect(() => {
    systemRef.current.particleSize = particleSize;
  }, [particleSize]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      systemRef.current.mouse.x = x;
      systemRef.current.mouse.y = y;
      systemRef.current.mouse.active = true;
    };
    
    const handleDown = () => { 
      systemRef.current.mouse.force = 1; 
      setMenuOpen(false); // Auto-close menu on interaction
    };
    const handleUp = () => { systemRef.current.mouse.force = 0; };
    const handleLeave = () => { systemRef.current.mouse.active = false; };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020202]">
      
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 15], fov: 45 }}
        gl={{ antialias: false, alpha: false, stencil: false }}
        onPointerDown={() => setMenuOpen(false)} // Handle touch/pointer events on canvas
      >
        <color attach="background" args={['#010101']} />
        
        <Swarm systemRef={systemRef} mode={mode} color={color} />
        <Background />
        
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} radius={0.5} />
          <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
        </EffectComposer>

        <OrbitControls enableZoom={true} enablePan={false} rotateSpeed={0.4} maxPolarAngle={Math.PI} minPolarAngle={0} />
      </Canvas>

      <HandManager systemRef={systemRef} />
      <AudioManager systemRef={systemRef} enabled={audioEnabled} />

      <Interface 
        mode={mode} setMode={setMode}
        color={color} setColor={setColor}
        audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled}
        particleSize={particleSize} setParticleSize={setParticleSize}
        menuOpen={menuOpen} setMenuOpen={setMenuOpen}
      />
    </div>
  );
};

export default App;
