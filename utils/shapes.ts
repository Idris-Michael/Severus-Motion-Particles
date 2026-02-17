
import * as THREE from 'three';

const COUNT = 6000;

// Helper: Random point inside a sphere of radius r
const getRandomPointInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper: Random point on surface of a sphere
const getRandomPointOnSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
};

// Reusable canvas for text sampling
let textCanvas: HTMLCanvasElement | null = null;
let textCtx: CanvasRenderingContext2D | null = null;

export const generateTextPositions = (text: string): Float32Array => {
  if (!textCanvas) {
    textCanvas = document.createElement('canvas');
    textCanvas.width = 256;
    textCanvas.height = 256;
    textCtx = textCanvas.getContext('2d', { willReadFrequently: true });
  }

  const positions = new Float32Array(COUNT * 3);
  
  if (textCtx && textCanvas) {
    textCtx.clearRect(0, 0, 256, 256);
    textCtx.fillStyle = 'white';
    textCtx.font = 'bold 180px "Orbitron", sans-serif'; 
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText(text, 128, 128);

    const imageData = textCtx.getImageData(0, 0, 256, 256);
    const data = imageData.data;
    const pixels: {x: number, y: number}[] = [];

    // Collect all valid pixels with randomized density
    for (let y = 0; y < 256; y += 2) {
      for (let x = 0; x < 256; x += 2) {
        const i = (y * 256 + x) * 4;
        if (data[i + 3] > 128) {
           // Map 0-256 to roughly -5 to 5 world space
           const px = (x - 128) / 128 * 5; 
           const py = -(y - 128) / 128 * 5;
           pixels.push({ x: px, y: py });
        }
      }
    }

    // Fill particles
    for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        
        if (pixels.length > 0) {
            const p = pixels[i % pixels.length];
            // Add jitter for volume
            positions[i3] = p.x + (Math.random() - 0.5) * 0.15;
            positions[i3 + 1] = p.y + (Math.random() - 0.5) * 0.15;
            positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
        } else {
            // Fallback if no pixels
            const p = getRandomPointInSphere(2);
            positions[i3] = p.x;
            positions[i3 + 1] = p.y;
            positions[i3 + 2] = p.z;
        }
    }
  }

  return positions;
};

export const generatePositions = (type: string): Float32Array => {
  // Handle text modes via specialized function
  if (type === 'spelling') return generateTextPositions('A');
  if (type === 'counting') return generateTextPositions('1');

  const positions = new Float32Array(COUNT * 3);
  const v = new THREE.Vector3();

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    
    // Default reset
    v.set(0, 0, 0);

    if (type === 'hearts') {
      // 3D Heart Formula
      // x = 16sin^3(t)
      // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      // z = varied depth
      const t = Math.random() * Math.PI * 2;
      const r = Math.random(); 
      const spread = (1 - Math.pow(r, 6)); // Denser core
      const scale = 0.25;
      
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      v.x = hx * scale;
      v.y = hy * scale;
      // Add volume based on how close to center
      v.z = (Math.random() - 0.5) * 3 * spread;
      
      // Randomize slightly for "cloud" look
      v.add(getRandomPointInSphere(0.2));
    } 
    else if (type === 'flowers') {
      // Fibonacci Phyllotaxis
      // r = c * sqrt(n), theta = n * 137.5
      const n = i;
      const c = 0.1;
      const r = c * Math.sqrt(n);
      const theta = n * 137.508 * (Math.PI / 180);
      
      // Convert polar to cartesian
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      
      // Petal modulation (5 petals)
      const petal = Math.sin(theta * 5);
      const z = Math.pow(r, 2) * 0.1 * petal; // Cup/Curve shape

      if (r < 6) {
          v.set(x, y, z);
      } else {
          // Recycle extra points to center
          v.copy(getRandomPointInSphere(1));
      }
    } 
    else if (type === 'saturn') {
      const ratio = 0.4; // 40% planet, 60% rings
      if (i < COUNT * ratio) {
        // Planet Body
        v.copy(getRandomPointOnSphere(2.5));
        // Add some volume
        v.multiplyScalar(0.9 + Math.random() * 0.2);
      } else {
        // Rings
        const angle = Math.random() * Math.PI * 2;
        const minRadius = 3.5;
        const maxRadius = 7.0;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        v.x = Math.cos(angle) * radius;
        v.z = Math.sin(angle) * radius;
        v.y = (Math.random() - 0.5) * 0.1; // Thin rings
        
        // Tilt
        v.applyAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), 0.4);
      }
    } 
    else if (type === 'fireworks') {
       // Sphere burst
       v.copy(getRandomPointOnSphere(Math.random() * 6));
       // Concentrate some lines
       if (i % 20 === 0) {
           v.normalize().multiplyScalar(Math.random() * 8);
       }
    }
    else if (type === 'fireball') {
      // Swirling Sphere
      const r = 3 + Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      v.x = r * Math.sin(phi) * Math.cos(theta);
      v.y = r * Math.sin(phi) * Math.sin(theta);
      v.z = r * Math.cos(phi);
      
      // Twist coordinates for visual effect in static form
      const twist = v.y * 0.5;
      const tx = v.x * Math.cos(twist) - v.z * Math.sin(twist);
      const tz = v.x * Math.sin(twist) + v.z * Math.cos(twist);
      v.x = tx; v.z = tz;
    }
    else if (type === 'lightning') {
      // Vertical bolts
      const boltCount = 5;
      const boltIdx = i % boltCount;
      const t = Math.random(); // 0 to 1 position down the bolt
      
      const startX = (boltIdx - 2) * 3;
      const y = 6 - t * 12;
      
      // Jagged line
      const jaggedX = (Math.random() - 0.5) * 1.5;
      const jaggedZ = (Math.random() - 0.5) * 1.5;
      
      v.set(startX + jaggedX, y, jaggedZ);
    }
    else if (type === 'wind') {
      // Funnel / Tornado
      const t = Math.random(); // 0 (bottom) to 1 (top)
      const h = -5 + t * 10;
      const radius = 0.5 + t * 4; // Wider at top
      const angle = t * 20 + Math.random() * Math.PI * 2;
      
      v.x = Math.cos(angle) * radius;
      v.z = Math.sin(angle) * radius;
      v.y = h;
    }
    else if (type === 'water') {
      // Wave Plane
      const x = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 6;
      // Sine wave surface
      const y = Math.sin(x * 0.8) * Math.cos(z * 0.8) * 1.5;
      
      v.set(x, y, z);
    }
    else {
        // Fallback Sphere
        v.copy(getRandomPointInSphere(5));
    }

    positions[i3] = v.x;
    positions[i3 + 1] = v.y;
    positions[i3 + 2] = v.z;
  }

  return positions;
};
