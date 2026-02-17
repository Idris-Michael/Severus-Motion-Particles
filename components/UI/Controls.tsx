
import React from 'react';
import { ShapeMode } from '../../types';
import { Palette, Atom, Heart, Flower, Zap } from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  currentShape: ShapeMode;
  setShape: (s: ShapeMode) => void;
  currentColor: string;
  setColor: (c: string) => void;
}

const SHAPES: { id: ShapeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'love', label: 'Love', icon: <Heart size={16} /> },
  { id: 'nature', label: 'Nature', icon: <Flower size={16} /> },
  { id: 'cosmos', label: 'Cosmos', icon: <Atom size={16} /> },
  { id: 'festive', label: 'Energy', icon: <Zap size={16} /> },
];

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
];

const Controls: React.FC<ControlsProps> = ({ currentShape, setShape, currentColor, setColor }) => {
  return (
    <div className="absolute top-8 right-8 z-50 flex flex-col gap-6 w-64">
      {/* Main Glass Panel */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl animate-fade-in-down">
        
        <div className="mb-6">
          <h2 className="text-white/90 text-sm font-bold uppercase tracking-widest mb-4 font-[Orbitron]">
            System Mode
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {SHAPES.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setShape(shape.id)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  currentShape === shape.id
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/20"
                    : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                {shape.icon}
                <span>{shape.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 text-white/90 text-sm font-bold uppercase tracking-widest font-[Orbitron]">
            <Palette size={14} />
            <span>Emission Color</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setColor(color)}
                className={clsx(
                  "w-8 h-8 rounded-full border transition-all duration-300 transform hover:scale-110",
                  currentColor === color
                    ? "border-white shadow-[0_0_10px_currentColor] scale-110"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
                style={{ backgroundColor: color, color: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-black/30 backdrop-blur-sm border border-white/5 p-4 rounded-xl">
        <h3 className="text-white/70 text-xs font-semibold uppercase mb-2">Instructions</h3>
        <ul className="text-white/40 text-xs space-y-1">
          <li>• Show hand to attract particles</li>
          <li>• Close fist to compress & charge</li>
          <li>• Open hand to release & relax</li>
        </ul>
      </div>
    </div>
  );
};

export default Controls;
