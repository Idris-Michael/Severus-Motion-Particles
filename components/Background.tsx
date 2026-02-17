import React from 'react';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import '../types';

const Background: React.FC = () => {
  // Load a dark, subtle space texture
  const texture = useTexture("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2072&auto=format&fit=crop");

  return (
    <group position={[0, 0, -5]}>
      {/* Background Sphere (Nebula) */}
      {/* Centered loosely around the scene, large enough to encompass camera */}
      <mesh position={[0, 0, 5]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[45, 64, 64]} />
        <meshBasicMaterial 
            map={texture} 
            side={THREE.BackSide} 
            transparent 
            opacity={0.15} 
            color="#888" // Desaturate/Darken the texture
            toneMapped={false}
            depthWrite={false} // Ensure it renders as background
        />
      </mesh>

      <Text
        font="https://fonts.gstatic.com/s/orbitron/v25/yMJRMIlzdpvBhQQL_Qq7dys.woff"
        fontSize={4}
        letterSpacing={0.1}
        color="#222"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.3}
      >
        SEVERUS
        <meshStandardMaterial attach="material" color="#1a1a1a" emissive="#000" metalness={0.8} roughness={0.2} />
      </Text>
      
      {/* Subtle Grid Floor */}
      <gridHelper 
        args={[50, 50, 0x222222, 0x111111]} 
        position={[0, -6, 0]} 
        rotation={[0, 0, 0]} 
      />
      
      {/* Ambient Lighting for text depth */}
      <pointLight position={[10, 10, -5]} intensity={0.5} color="#444" />
    </group>
  );
};

export default Background;