import * as THREE from 'three';

const COUNT = 6000;

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

export const generatePositions = (type: string): Float32Array => {
  const positions = new Float32Array(COUNT * 3);
  const v = new THREE.Vector3();

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;

    if (type === 'hearts') {
      // Heart curve
      // x = 16sin^3(t)
      // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      // z = varied depth
      const t = Math.random() * Math.PI * 2;
      const scale = 0.3;
      
      // Add some noise to fill the volume
      const r = Math.random(); 
      const spread = 1 - Math.pow(r, 4); // Concentrate near edges but fill center slightly
      
      v.x = (16 * Math.pow(Math.sin(t), 3)) * scale * (0.8 + 0.2 * Math.random());
      v.y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale * (0.8 + 0.2 * Math.random());
      v.z = (Math.random() - 0.5) * 4 * spread;
    } 
    else if (type === 'flowers') {
      // Phyllotaxis / Rose curve hybrid
      const n = i;
      const c = 0.15;
      const r = c * Math.sqrt(n);
      const theta = n * 137.508; // Golden angle
      
      // Add wave to z for flower petals depth
      const petalMod = Math.sin(theta * 0.1) * 2;
      
      v.x = r * Math.cos(theta);
      v.y = r * Math.sin(theta);
      v.z = petalMod + (Math.random() - 0.5);
    } 
    else if (type === 'saturn') {
      if (i < COUNT * 0.3) {
        // Planet body
        const p = getRandomPointInSphere(3);
        v.copy(p);
      } else {
        // Rings
        const angle = Math.random() * Math.PI * 2;
        const minRadius = 4;
        const maxRadius = 8;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        v.x = Math.cos(angle) * radius;
        v.z = Math.sin(angle) * radius;
        v.y = (Math.random() - 0.5) * 0.2; // Thin ring
        
        // Tilt the system
        v.applyAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), 0.5);
      }
    } 
    else if (type === 'fireworks') {
      // Explosion bursts
      const burstCount = 6;
      const burstIndex = i % burstCount;
      const perBurst = COUNT / burstCount;
      
      // Center of this burst
      const angle = (burstIndex / burstCount) * Math.PI * 2;
      const radiusOffset = 4;
      const cx = Math.cos(angle) * radiusOffset;
      const cy = Math.sin(angle) * radiusOffset * 0.5;
      
      const p = getRandomPointInSphere(2.5);
      v.set(cx + p.x, cy + p.y, p.z);
    }
    else {
        v.set(0,0,0);
    }

    positions[i3] = v.x;
    positions[i3 + 1] = v.y;
    positions[i3 + 2] = v.z;
  }

  return positions;
};
