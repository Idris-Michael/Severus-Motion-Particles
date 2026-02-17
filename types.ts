
export type ShapeType = 'hearts' | 'flowers' | 'saturn' | 'fireworks' | 'fireball' | 'lightning' | 'wind' | 'water' | 'spelling' | 'counting' | 'snake' | 'tictactoe' | 'memory';

export interface HandPoint {
  id: string; // "Left" or "Right"
  present: boolean;
  tension: number; // 0 to 1 (Open to Closed)
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
  z: number; // Normalized depth (approx -1 to 1, where negative is closer to camera)
}

export type HandData = HandPoint[];

export interface AppState {
  shape: ShapeType;
  color: string;
  setShape: (shape: ShapeType) => void;
  setColor: (color: string) => void;
}
