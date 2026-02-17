
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generatePositions } from '../utils/shapes';
// Fix: Changed ShapeType to ShapeMode as defined in types.ts
import { ShapeMode, HandData, AudioData } from '../types';

interface ParticlesProps {
  // Fix: Use ShapeMode instead of ShapeType
  shape: ShapeMode;
  color: string;
  handsDataRef: React.MutableRefObject<HandData[]>;
  audioDataRef: React.MutableRefObject<AudioData>;
}

const Particles: React.FC<ParticlesProps> = ({ shape, color, handsDataRef, audioDataRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const count = 6000;
  
  const targetPositions = useMemo(() => generatePositions(shape), [shape]);
  const currentPositions = useMemo(() => new Float32Array(targetPositions), [targetPositions]);
  const velocities = useMemo(() => new Float32Array(count * 3), [count]);

  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const hands = handsDataRef.current;
    const audio = audioDataRef.current;
    const time = state.clock.getElapsedTime();
    
    // Audio Influence
    materialRef.current.size = 0.12 + (audio.intensity * 0.3);
    materialRef.current.opacity = 0.6 + (audio.intensity * 0.4);

    const bassKick = audio.bass * 5.0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      let tx = targetPositions[i3];
      let ty = targetPositions[i3+1];
      let tz = targetPositions[i3+2];
      
      const distFromCenter = Math.sqrt(tx*tx + ty*ty + tz*tz);
      const pulseFactor = 1.0 + (audio.