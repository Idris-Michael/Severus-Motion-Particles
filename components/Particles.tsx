import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generatePositions, generateTextPositions } from '../utils/shapes';
import { ShapeType, HandData } from '../types';

// --- SAFETY & PHYSICS CONSTANTS ---
const PARTICLE_COUNT = 6000;

// High damping = moving through molasses/water. Very safe and calm.
const DAMPING = 0.96; 
// Lower speed limit to prevent sudden jarring movements
const MAX_VELOCITY = 0.25; 
// Gentle return force
const RETURN_STRENGTH = 0.005; 

// Game State Constants
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MEMORY_ZONES = [
  { id: 0, color: '#ef4444', pos: { x: -4, y: 3 } },   // Red (Top Left)
  { id: 1, color: '#3b82f6', pos: { x: 4, y: 3 } },    // Blue (Top Right)
  { id: 2, color: '#22c55e', pos: { x: -4, y: -3 } },  // Green (Bottom Left)
  { id: 3, color: '#eab308', pos: { x: 4, y: -3 } }    // Yellow (Bottom Right)
];

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  size: number;
  handDataRef: React.MutableRefObject<HandData>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  onIndexChange?: (index: number) => void;
  resetKey?: number;
}

const Particles: React.FC<ParticlesProps> = ({ shape, color, size, handDataRef, analyserRef, onIndexChange, resetKey }) => {
  const { viewport } = useThree();
  
  // Refs
  const pointsRef = useRef<THREE.Points>(null);
  
  // Physics Data
  const targetPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const velocitiesRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const originalPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  
  // Visual State
  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  
  // Audio Data
  const audioDataArray = useMemo(() => new Uint8Array(32), []);

  // Game Logic State
  const gameState = useRef({
      snake: {
          head: new THREE.Vector3(0,0,0),
          dir: new THREE.Vector3(1,0,0),
          trail: [] as THREE.Vector3[],
          score: 0,
          food: new THREE.Vector3(3,3,0)
      },
      kids: {
          index: 0,
          revealed: new Float32Array(PARTICLE_COUNT).fill(0),
          popped: [false, false, false, false, false],
          transitionTimer: 0
      },
      memory: {
          activeZone: -1,
          timer: 0
      },
      tictactoe: {
          board: Array(9).fill(null) as (string|null)[],
          turn: 'PLAYER' as 'PLAYER'|'AI',
          selectionIndex: -1,
          lastMoveTime: 0,
          winner: null as string|null
      }
  });

  // Sound Engine (Gentle Tones)
  const sfxCtx = useRef<AudioContext | null>(null);
  const playTone = useCallback((freq: number) => {
      try {
        if (!sfxCtx.current) sfxCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = sfxCtx.current;
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Sine waves are softer and less harsh than square/sawtooth
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Gentle envelope (fade in/out) to avoid clicking
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    let newTargets: Float32Array;

    if (!['snake', 'tictactoe', 'memory', 'spelling', 'counting'].includes(shape)) {
         newTargets = generatePositions(shape);
    } 
    else if (shape === 'spelling') {
        newTargets = generateTextPositions(ALPHABET[0]);
        gameState.current.kids.index = 0;
        gameState.current.kids.revealed.fill(0);
        if(onIndexChange) onIndexChange(0);
    }
    else if (shape === 'counting') {
        newTargets = new Float32Array(PARTICLE_COUNT * 3);
        gameState.current.kids.index = 0;
        gameState.current.kids.popped.fill(false);
        if(onIndexChange) onIndexChange(1);
    }
    else {
        newTargets = new Float32Array(PARTICLE_COUNT * 3);
        // Reset Game States
        gameState.current.snake = { head: new THREE.Vector3(), dir: new THREE.Vector3(1,0,0), trail: [], score: 0, food: new THREE.Vector3(4,4,0) };
        gameState.current.tictactoe = { board: Array(9).fill(null), turn: 'PLAYER', selectionIndex: -1, lastMoveTime: 0, winner: null };
        if(onIndexChange) onIndexChange(0);
    }

    targetPositionsRef.current = newTargets;
    // Store original targets for "Return to Shape" logic
    originalPositionsRef.current.set(newTargets);
    
    // Slow down existing particles rather than stopping them instantly
    // This creates a morphing effect
    for(let i=0; i<velocitiesRef.current.length; i++) {
        velocitiesRef.current[i] *= 0.5;
    }

  }, [shape, resetKey]);

  // --- PHYSICS LOOP ---
  useFrame((state, delta) => {
    // Limit delta to ensure physics don't explode on lag spikes
    const dt = Math.min(delta, 0.04);
    const time = state.clock.elapsedTime;
    
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const targets = targetPositionsRef.current;
    
    // Audio Analysis (Subtle influence)
    let audioForce = 0;
    if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(audioDataArray);
        // Very subtle bass influence
        audioForce = (audioDataArray[2] / 255.0) * 0.15; 
    }

    // Hand Inputs
    const rawHands = handDataRef.current;
    const hands = rawHands.map(h => ({
        x: (h.x * (viewport.width / 2)),
        y: (h.y * (viewport.height / 2)),
        tension: h.tension,
        id: h.id
    }));
    
    const isTwoHands = hands.length === 2;

    // --- MODE SPECIFIC LOGIC ---
    // (Condensed for readability, logic focuses on smooth transitions)
    if (shape === 'snake') {
        const s = gameState.current.snake;
        // Smooth snake movement (Lissajous curve if idle)
        let targetX = s.head.x, targetY = s.head.y;
        if (hands.length > 0) {
            targetX += (hands[0].x - s.head.x) * dt * 2;
            targetY += (hands[0].y - s.head.y) * dt * 2;
        } else {
            targetX = Math.sin(time * 0.5) * 4;
            targetY = Math.cos(time * 0.3) * 3;
        }
        s.head.set(targetX, targetY, 0);
        
        // Trail logic
        if (time % 0.05 < dt) {
            s.trail.unshift(s.head.clone());
            if (s.trail.length > 50 + s.score * 5) s.trail.pop();
        }
        // Eat food
        if (s.head.distanceTo(s.food) < 1.5) {
            s.score++;
            s.food.set((Math.random()-0.5)*8, (Math.random()-0.5)*6, 0);
            playTone(440); // Gentle A4
            if(onIndexChange) onIndexChange(s.score);
        }
    }
    
    // --- MAIN PARTICLE LOOP ---
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const px = positions[i3];
        const py = positions[i3+1];
        const pz = positions[i3+2];
        
        // 1. DETERMINE TARGET
        let tx = targets[i3];
        let ty = targets[i3+1];
        let tz = targets[i3+2];

        // Dynamic targets for modes
        if (shape === 'snake') {
            const s = gameState.current.snake;
            if (i < 200) { tx = s.food.x; ty = s.food.y; }
            else if (s.trail.length > 0) {
                // Map particles to trail
                const trailIdx = Math.floor(((i-200)/(PARTICLE_COUNT-200)) * s.trail.length);
                const pt = s.trail[trailIdx] || s.head;
                tx = pt.x; ty = pt.y;
            } else { tx = s.head.x; ty = s.head.y; }
            
            // Add volume to snake body
            tx += (Math.random()-0.5) * 0.5;
            ty += (Math.random()-0.5) * 0.5;
        }
        else if (shape === 'counting') {
            // Floating balloons
            const k = gameState.current.kids;
            const count = (k.index % 5) + 1;
            const bGroup = Math.floor(i / (PARTICLE_COUNT/count));
            
            if (!k.popped[bGroup]) {
                const bx = (bGroup - (count-1)/2) * 3;
                const by = Math.sin(time*0.5 + bGroup)*0.5;
                // Sphere math
                const r = 1.2; const u = (i*0.01)%1; const v = (i*0.03)%1;
                const theta = 2*Math.PI*u; const phi = Math.acos(2*v-1);
                tx = bx + r*Math.sin(phi)*Math.cos(theta);
                ty = by + r*Math.sin(phi)*Math.sin(theta);
                tz = r*Math.cos(phi);

                // Pop detection
                if (hands.some(h => (h.x-bx)**2 + (h.y-by)**2 < 1.5)) {
                    k.popped[bGroup] = true;
                    playTone(300 + bGroup*50);
                    // Check level complete
                    if (k.popped.slice(0, count).every(p=>p) && k.transitionTimer === 0) {
                        k.transitionTimer = time;
                    }
                }
            } else {
                // Float away if popped
                ty += 10; 
            }
        }

        // 2. APPLY FORCES
        // Gentle Spring to Target
        let fx = (tx - px) * RETURN_STRENGTH;
        let fy = (ty - py) * RETURN_STRENGTH;
        let fz = (tz - pz) * RETURN_STRENGTH;

        // 3. FLUID NOISE (The "Space" Feel)
        // Adds a continuous, slow swirling motion to everything
        const noiseScale = 0.5;
        const noiseTime = time * 0.2;
        // Simple trigonometric pseudo-noise for performance/smoothness
        const nx = Math.sin(py * noiseScale + noiseTime) * Math.cos(pz * noiseScale + noiseTime);
        const ny = Math.sin(pz * noiseScale + noiseTime) * Math.cos(px * noiseScale + noiseTime);
        const nz = Math.sin(px * noiseScale + noiseTime) * Math.cos(py * noiseScale + noiseTime);
        
        fx += nx * 0.003; 
        fy += ny * 0.003; 
        fz += nz * 0.003;

        // 4. HAND INTERACTION (Fluid Displacement)
        if (hands.length === 0) {
            // Idle: Gentle attraction to center to keep scene composed
            fx -= px * 0.001;
            fy -= py * 0.001;
            fz -= pz * 0.001;
        } else {
            for (const h of hands) {
                const dx = h.x - px;
                const dy = h.y - py;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);
                
                // Smooth interaction radius (larger than before, softer falloff)
                if (dist < 5.0) {
                    const influence = (1 - dist/5.0); // Linear falloff 0 to 1
                    const softFactor = influence * influence; // Quadratic for smoother edge
                    
                    if (h.tension > 0.8) {
                        // Closed Fist: Gravity Well (Pull)
                        // Very gentle pull
                        fx += dx * 0.01 * softFactor;
                        fy += dy * 0.01 * softFactor;
                    } else {
                        // Open Hand: Flow Deflector (Push/Swirl)
                        // Push away gently
                        fx -= dx * 0.02 * softFactor;
                        fy -= dy * 0.02 * softFactor;
                        
                        // Add curl (vortex) around the hand
                        fx += -dy * 0.03 * softFactor;
                        fy += dx * 0.03 * softFactor;
                    }
                }
            }
        }

        // Special: Lightning (Energy Stream) Mode
        if (shape === 'lightning' && isTwoHands) {
             const h1 = hands[0]; const h2 = hands[1];
             // Calculate point on line segment
             const l2 = (h1.x-h2.x)**2 + (h1.y-h2.y)**2;
             if (l2 > 0) {
                 const t = Math.max(0, Math.min(1, ((px-h1.x)*(h2.x-h1.x) + (py-h1.y)*(h2.y-h1.y)) / l2));
                 const cx = h1.x + t * (h2.x - h1.x);
                 const cy = h1.y + t * (h2.y - h1.y);
                 
                 // Gentle attraction to the stream
                 const distToStream = Math.sqrt((px-cx)**2 + (py-cy)**2);
                 if (distToStream < 3.0) {
                     fx += (cx - px) * 0.02;
                     fy += (cy - py) * 0.02;
                     // Flow ALONG the stream
                     fx += (h2.x - h1.x) * 0.01;
                     fy += (h2.y - h1.y) * 0.01;
                 }
             }
        }

        // 5. INTEGRATION (Euler)
        // Add Audio Energy
        if (audioForce > 0) {
            fx += (Math.random()-0.5) * audioForce;
            fy += (Math.random()-0.5) * audioForce;
        }

        velocitiesRef.current[i3]   += fx;
        velocitiesRef.current[i3+1] += fy;
        velocitiesRef.current[i3+2] += fz;

        // Apply Heavy Damping (Fluid friction)
        velocitiesRef.current[i3]   *= DAMPING;
        velocitiesRef.current[i3+1] *= DAMPING;
        velocitiesRef.current[i3+2] *= DAMPING;

        // Velocity Cap (Safety)
        const vSq = velocitiesRef.current[i3]**2 + velocitiesRef.current[i3+1]**2 + velocitiesRef.current[i3+2]**2;
        if (vSq > MAX_VELOCITY * MAX_VELOCITY) {
             const scale = MAX_VELOCITY / Math.sqrt(vSq);
             velocitiesRef.current[i3] *= scale;
             velocitiesRef.current[i3+1] *= scale;
             velocitiesRef.current[i3+2] *= scale;
        }

        // Update Position
        positions[i3]   += velocitiesRef.current[i3] * dt * 60; // Scaling for 60fps baseline
        positions[i3+1] += velocitiesRef.current[i3+1] * dt * 60;
        positions[i3+2] += velocitiesRef.current[i3+2] * dt * 60;
    }

    // --- GAME STATE TRANSITIONS ---
    // Kids Mode Transition
    if (shape === 'counting') {
        const k = gameState.current.kids;
        if (k.transitionTimer > 0 && time - k.transitionTimer > 2.0) {
            k.index++;
            k.popped.fill(false);
            k.transitionTimer = 0;
            if (onIndexChange) onIndexChange((k.index % 5) + 1);
        }
    }
    // Spelling Reveal
    if (shape === 'spelling') {
        const revealed = gameState.current.kids.revealed;
        // Optimization: check every 10th particle to save CPU
        for(let i=0; i<PARTICLE_COUNT; i+=10) {
            if (revealed[i] === 0) {
                 const i3 = i*3;
                 for (const h of hands) {
                     if ((h.x - positions[i3])**2 + (h.y - positions[i3+1])**2 < 2.5) {
                         revealed[i] = 1; // Mark as revealed
                     }
                 }
            }
        }
    }
    // Tic Tac Toe
    if (shape === 'tictactoe' && hands.length > 0) {
        const ttt = gameState.current.tictactoe;
        if (ttt.turn === 'PLAYER' && !ttt.winner) {
            // Grid logic
            const h = hands[0];
            let col = h.x < -1.5 ? 0 : h.x > 1.5 ? 2 : 1;
            let row = h.y > 1.5 ? 0 : h.y < -1.5 ? 2 : 1;
            const idx = row*3 + col;
            ttt.selectionIndex = idx;
            
            if (h.tension > 0.9 && ttt.board[idx] === null && time - ttt.lastMoveTime > 1.0) {
                ttt.board[idx] = 'X';
                ttt.lastMoveTime = time;
                playTone(300);
                ttt.turn = 'AI';
            }
        } else if (ttt.turn === 'AI' && !ttt.winner && time - ttt.lastMoveTime > 1.5) {
            const empty = ttt.board.map((v,i) => v===null?i:-1).filter(i=>i!==-1);
            if (empty.length > 0) {
                ttt.board[empty[Math.floor(Math.random()*empty.length)]] = 'O';
                playTone(200);
                ttt.turn = 'PLAYER';
                ttt.lastMoveTime = time;
            }
        }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // --- COLOR UPDATE LOOP (Gradient & Interaction) ---
    const colorAttr = pointsRef.current.geometry.attributes.color;
    if (colorAttr) {
        const _base = new THREE.Color(color);
        const _white = new THREE.Color(1,1,1);
        
        for(let i=0; i<PARTICLE_COUNT; i++) {
             const i3 = i*3;
             let c = _base;
             
             // Mode Colors
             if (shape === 'snake') {
                 if (i < 200) c = new THREE.Color('#fbbf24'); // Head (Gold)
                 else c = new THREE.Color('#10b981'); // Body (Emerald)
             }
             else if (shape === 'counting') {
                 // Pastel Balloons
                 const count = (gameState.current.kids.index % 5) + 1;
                 const bGroup = Math.floor(i / (PARTICLE_COUNT/count));
                 c = new THREE.Color().setHSL(bGroup * 0.2, 0.7, 0.6);
             }
             else if (shape === 'tictactoe') {
                 if (i >= 500) {
                     const cell = (i-500)%9;
                     if (gameState.current.tictactoe.board[cell] === 'X') c = new THREE.Color('#f472b6'); // Soft Pink
                     else if (gameState.current.tictactoe.board[cell] === 'O') c = new THREE.Color('#60a5fa'); // Soft Blue
                     else if (gameState.current.tictactoe.selectionIndex === cell) c = _white; // Highlight
                     else c = _base.clone().multiplyScalar(0.2); // Dim
                 }
             }
             else if (shape === 'spelling') {
                 if (gameState.current.kids.revealed[i] > 0) c = _white;
                 else c = _base.clone().multiplyScalar(0.1); // Hidden in fog
             }
             else if (shape === 'memory') {
                 const zone = i % 4;
                 c = new THREE.Color(MEMORY_ZONES[zone].color);
                 if (gameState.current.memory.activeZone !== zone) c.multiplyScalar(0.3);
             }
             
             // Depth fade (fog effect)
             // Particles further back are dimmer
             const depth = positions[i3+2];
             let opacity = Math.max(0.2, 1.0 - (depth + 5) / 10);
             
             // Apply color
             colors[i3] = c.r * opacity;
             colors[i3+1] = c.g * opacity;
             colors[i3+2] = c.b * opacity;
        }
        colorAttr.needsUpdate = true;
    }

  });

  // Soft Particle Texture
  const texture = useMemo(() => {
     const c = document.createElement('canvas'); c.width = 32; c.height = 32;
     const ctx = c.getContext('2d');
     if (ctx) {
         // Soft glow gradient, no hard edges
         const g = ctx.createRadialGradient(16,16,0, 16,16,16);
         g.addColorStop(0, 'rgba(255,255,255,1)'); 
         g.addColorStop(0.4, 'rgba(255,255,255,0.2)');
         g.addColorStop(1, 'rgba(0,0,0,0)');
         ctx.fillStyle = g; ctx.fillRect(0,0,32,32);
     }
     return new THREE.CanvasTexture(c);
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={new Float32Array(PARTICLE_COUNT * 3)} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
          map={texture} 
          vertexColors 
          size={size} 
          sizeAttenuation 
          transparent 
          opacity={0.9} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
      />
    </points>
  );
};

export default Particles;