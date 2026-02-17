
export type ShapeMode = 
  | 'love' | 'nature' | 'cosmos' | 'festive' 
  | 'fireball' | 'thunder' | 'tornado' | 'vortex'
  | 'magic_reveal' | 'balloon_pop'
  | 'snake' | 'tic_tac_toe' | 'memory';

export interface InteractionPoint {
  x: number; // Viewport coordinates -1 to 1
  y: number; // Viewport coordinates -1 to 1
  active: boolean;
  force: number; // 0 to 1 (tension/pinch)
}

export interface AudioMetrics {
  level: number; 
  bass: number; 
  high: number; 
}

export interface SystemState {
  hands: InteractionPoint[];
  audio: AudioMetrics;
  mouse: InteractionPoint;
  particleSize: number;
}

export interface HandData {
  present: boolean;
  tension: number;
  x: number;
  y: number;
}

export interface AudioData {
  intensity: number;
  bass: number;
  mid: number;
  treble: number;
  frequencies: Uint8Array;
}
