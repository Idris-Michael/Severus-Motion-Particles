
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SystemState, ShapeMode } from '../types';
import { generateShapePositions } from '../utils/geometry';

interface SwarmProps {
  systemRef: React.MutableRefObject<SystemState>;
  mode: ShapeMode;
  color: string;
}

const Swarm: React.FC<SwarmProps> = ({ systemRef, mode, color }) => {
  const count = 10000;
  const pointsRef = useRef<THREE.Points>(null);
  const targetPositions = useMemo(() => generateShapePositions(mode), [mode]);
  
  // Game State Refs
  const balloonState = useRef({ popped: false, timer: 0 });

  const positions = useMemo(() => new Float32Array(count * 3), []);
  const velocities = useMemo(() => new Float32Array(count * 3), []);
  
  // Reset game states on mode change
  useEffect(() => {
    balloonState.current = { popped: false, timer: 0 };
  }, [mode]);

  useMemo(() => {
    for(let i=0; i<targetPositions.length; i++) positions[i] = targetPositions[i];
  }, [targetPositions]);

  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const dt = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;
    const { hands, audio, mouse, particleSize } = systemRef.current;
    
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    
    const excitation = audio.level * 5; 
    const highTension = hands.reduce((acc, h) => Math.max(acc, h.force), 0);
    
    // Balloon Logic
    if (mode === 'balloon_pop') {
       if (balloonState.current.popped) {
           balloonState.current.timer += dt;
           if (balloonState.current.timer > 3.0) {
               balloonState.current.popped = false; // Reset
               balloonState.current.timer = 0;
           }
       } else {
           // Check for pop
           const pinch = hands.find(h => h.active && h.force > 0.8);
           if (pinch) {
               const px = pinch.x * (viewport.width/2);
               const py = pinch.y * (viewport.height/2);
               // Check if inside balloon radius roughly
               if (Math.sqrt(px*px + py*py) < 3.0) {
                   balloonState.current.popped = true;
               }
           }
       }
    }

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      let tx = targetPositions[i3];
      let ty = targetPositions[i3 + 1];
      let tz = targetPositions[i3 + 2];

      let px = positions[i3];
      let py = positions[i3 + 1];
      let pz = positions[i3 + 2];

      let vx = velocities[i3];
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      // --- 1. TARGET BEHAVIOR ---
      let stiffness = 2.5;

      if (mode === 'magic_reveal') {
         // Particles are noise unless hand is near
         let revealed = false;
         for(const h of hands) {
             if (!h.active) continue;
             const hx = h.x * (viewport.width/2);
             const hy = h.y * (viewport.height/2);
             const d = Math.sqrt((hx-tx)**2 + (hy-ty)**2); 
             if (d < 5.0) revealed = true;
         }
         
         if (!revealed) {
             // Wander as noise
             tx = Math.sin(time + i) * 10;
             ty = Math.cos(time * 0.5 + i) * 10;
             tz = Math.sin(time * 0.3 + i) * 5;
             stiffness = 0.5;
         } else {
             stiffness = 4.0;
         }
      }
      else if (mode === 'balloon_pop') {
          if (balloonState.current.popped) {
              stiffness = 0;
              // Gravity and explosion
              vy -= 9.8 * dt; 
              vx += (Math.random() - 0.5) * 20 * dt;
              vz += (Math.random() - 0.5) * 20 * dt;
          } else {
              stiffness = 3.0; // Tight sphere
          }
      }
      else if (mode === 'memory') {
         // Check flip
         const cardIdx = i % 12;
         const col = cardIdx % 4;
         const row = Math.floor(cardIdx / 4);
         const cx = (col - 1.5) * 3.5;
         const cy = (row - 1) * 3.5;
         
         // Interaction check for flip/spin
         for(const h of hands) {
            if(h.active) {
                const hx = h.x * (viewport.width/2);
                const hy = h.y * (viewport.height/2);
                if (Math.abs(hx - cx) < 1.5 && Math.abs(hy - cy) < 1.5) {
                    const angle = time * 5;
                    const lx = tx - cx;
                    tx = cx + lx * Math.cos(angle);
                    tz = lx * Math.sin(angle);
                }
            }
         }
      }

      vx += (tx - px) * stiffness * dt;
      vy += (ty - py) * stiffness * dt;
      vz += (tz - pz) * stiffness * dt;

      // --- 2. SPECIFIC PHYSICS ---
      if (mode === 'vortex' || mode === 'tornado') {
        const dist = Math.sqrt(px*px + pz*pz) + 0.1;
        const spinSpeed = (4.0 + highTension * 12) * dt;
        vx -= pz * spinSpeed / dist;
        vz += px * spinSpeed / dist;
      } 
      else if (mode === 'thunder') {
        const jitter = (0.2 + highTension * 3.0 + excitation);
        vx += (Math.random() - 0.5) * jitter;
        vy += (Math.random() - 0.5) * jitter;
        vz += (Math.random() - 0.5) * jitter;
      }
      else if (mode === 'snake' && hands.length > 0) {
          const head = hands[0];
          const hX = head.x * (viewport.width / 2);
          const hY = head.y * (viewport.height / 2);
          const idxFactor = i / count;
          // Trail logic override: Head is tight, tail drags
          const lerpT = Math.pow(1 - idxFactor, 4); 
          vx += (hX - px) * lerpT * 10 * dt;
          vy += (hY - py) * lerpT * 10 * dt;
      }

      // --- 3. HAND INTERACTIONS ---
      const interactors = [...hands];
      if (mouse.active) interactors.push(mouse);

      for (const inter of interactors) {
        if (!inter.active) continue;
        
        // Skip repulsion for specific modes
        if (mode === 'balloon_pop') continue; 
        if (mode === 'magic_reveal') continue;
        
        const ix = inter.x * (viewport.width / 2);
        const iy = inter.y * (viewport.height / 2);

        const dx = ix - px;
        const dy = iy - py;
        const dz = 0 - pz;
        const distSq = dx*dx + dy*dy + dz*dz;
        
        if (distSq < 60) { 
          const dist = Math.sqrt(distSq);
          let f = (inter.force > 0.5) ? -60 : 20; 
          
          if (mode === 'tic_tac_toe') {
              f = 40; // Attract strongly to highlight cell
          }

          const influence = (f * dt) / (dist + 0.5);
          vx += dx * influence;
          vy += dy * influence;
          vz += dz * influence;
        }
      }

      // --- 4. INTEGRATION ---
      const damping = mode === 'thunder' ? 0.6 : 0.92;
      vx *= damping; vy *= damping; vz *= damping;
      px += vx * dt; py += vy * dt; pz += vz * dt;

      positions[i3] = px; positions[i3 + 1] = py; positions[i3 + 2] = pz;
      velocities[i3] = vx; velocities[i3 + 1] = vy; velocities[i3 + 2] = vz;
    }

    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y += dt * 0.02;
    if (pointsRef.current.material instanceof THREE.PointsMaterial) {
        pointsRef.current.material.size = particleSize * (1 + excitation * 0.5);
    }
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={texture} sizeAttenuation={true} color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

export default Swarm;
