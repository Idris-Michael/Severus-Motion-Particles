
import * as THREE from 'three';
import { ShapeMode } from '../types';

const COUNT = 10000;

export const generateShapePositions = (mode: ShapeMode): Float32Array => {
  const positions = new Float32Array(COUNT * 3);
  const temp = new THREE.Vector3();

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;

    if (mode === 'love') {
      const t = Math.random() * Math.PI * 2;
      temp.x = 16 * Math.pow(Math.sin(t), 3);
      temp.y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      temp.z = (Math.random() - 0.5) * 5;
      temp.multiplyScalar(0.3);
    } 
    else if (mode === 'nature') {
      const n = i;
      const r = 0.2 * Math.sqrt(n);
      const theta = n * 137.5;
      temp.x = r * Math.cos(theta);
      temp.y = r * Math.sin(theta);
      temp.z = Math.sin(r * 0.5) * 2;
    }
    else if (mode === 'cosmos' || mode === 'vortex') {
      const radius = Math.random() * 8;
      const spin = radius * 3.5;
      const angle = Math.random() * Math.PI * 2;
      temp.x = Math.cos(angle + spin) * radius;
      temp.z = Math.sin(angle + spin) * radius;
      temp.y = (Math.random() - 0.5) * (1 - radius/8) * 4;
    }
    else if (mode === 'festive') {
      const burst = Math.floor(i / (COUNT / 5));
      const angle = (burst / 5) * Math.PI * 2;
      const dist = Math.random() * 4;
      const p = new THREE.Vector3().setFromSphericalCoords(dist, Math.random() * Math.PI, Math.random() * Math.PI * 2);
      temp.set(Math.cos(angle) * 6 + p.x, Math.sin(angle) * 6 + p.y, p.z);
    }
    else if (mode === 'fireball' || mode === 'tornado') {
      const theta = Math.random() * Math.PI * 2;
      const h = (Math.random() - 0.5) * 10;
      const r = mode === 'tornado' ? (h + 5) * 0.6 : 4;
      temp.x = Math.cos(theta) * r;
      temp.y = h;
      temp.z = Math.sin(theta) * r;
    }
    else if (mode === 'thunder') {
      temp.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 2);
    }
    else if (mode === 'magic_reveal') {
      // Hidden Cube
      const s = 3.5;
      temp.set((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2).normalize().multiplyScalar(s);
      // Project to cube surface
      const x = temp.x, y = temp.y, z = temp.z;
      const max = Math.max(Math.abs(x), Math.max(Math.abs(y), Math.abs(z)));
      temp.multiplyScalar(s / max);
    }
    else if (mode === 'balloon_pop') {
       // Dense Sphere
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos((Math.random() * 2) - 1);
       const r = 2.5;
       temp.setFromSphericalCoords(r, phi, theta);
    }
    else if (mode === 'tic_tac_toe') {
      // Grid Lines with volume
      const r = Math.random();
      if (r < 0.5) {
         // Vertical lines
         const line = Math.floor(Math.random() * 2); // 0 or 1
         temp.x = line === 0 ? -2 : 2;
         temp.y = (Math.random() - 0.5) * 10;
         temp.z = 0;
      } else {
         // Horizontal lines
         const line = Math.floor(Math.random() * 2);
         temp.y = line === 0 ? -2 : 2;
         temp.x = (Math.random() - 0.5) * 10;
         temp.z = 0;
      }
      temp.z += (Math.random() - 0.5) * 0.5;
    }
    else if (mode === 'memory') {
      // 4x3 Grid of cards
      const cardIdx = i % 12;
      const col = cardIdx % 4;
      const row = Math.floor(cardIdx / 4);
      // Card centers: Cols: -4.5, -1.5, 1.5, 4.5 | Rows: -3, 0, 3
      const cx = (col - 1.5) * 3.5;
      const cy = (row - 1) * 3.5;
      const w = 1.2;
      const h = 1.5;
      temp.x = cx + (Math.random() - 0.5) * 2 * w;
      temp.y = cy + (Math.random() - 0.5) * 2 * h;
      temp.z = 0;
    }
    else if (mode === 'snake') {
      const segment = i / COUNT;
      temp.set(segment * 20 - 10, Math.sin(segment * 10) * 2, 0);
    }
    else {
      // Default Sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      temp.setFromSphericalCoords(5, phi, theta);
    }

    positions[i3] = temp.x;
    positions[i3 + 1] = temp.y;
    positions[i3 + 2] = temp.z;
  }
  return positions;
};
