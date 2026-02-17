
import React, { useState } from 'react';
import { ShapeType } from '../../types';
import { Palette, Atom, Heart, Flower, Zap, Move, Info, Maximize2, Minimize2, ChevronDown, ChevronUp, Flame, Wind, Droplets, Sparkles, Volume2, Music, Layers, Baby, Type, Calculator, BrainCircuit, Gamepad2, Grid3x3, Ghost, Eraser, MousePointerClick, Sliders } from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  particleSize: number;
  setParticleSize: (s: number) => void;
  isPlaying: boolean;
  toggleAudio: () => void;
}

const SHAPES: { id: ShapeType; label: string; icon: React.ReactNode }[] = [
  { id: 'hearts', label: 'Love', icon: <Heart size={16} /> },
  { id: 'flowers', label: 'Nature', icon: <Flower size={16} /> },
  { id: 'saturn', label: 'Cosmos', icon: <Atom size={16} /> },
  { id: 'fireworks', label: 'Festive', icon: <Sparkles size={16} /> },
  { id: 'fireball', label: 'Fireball', icon: <Flame size={16} /> },
  { id: 'lightning', label: 'Thunder', icon: <Zap size={16} /> },
  { id: 'wind', label: 'Tornado', icon: <Wind size={16} /> },
  { id: 'water', label: 'Vortex', icon: <Droplets size={16} /> },
];

const KIDS_MODES: { id: ShapeType; label: string; icon: React.ReactNode }[] = [
    { id: 'spelling', label: 'Magic Reveal', icon: <Eraser size={16} /> },
    { id: 'counting', label: 'Balloon Pop', icon: <MousePointerClick size={16} /> },
];

const GAME_MODES: { id: ShapeType; label: string; icon: React.ReactNode }[] = [
    { id: 'snake', label: 'Snake', icon: <Ghost size={16} /> },
    { id: 'tictactoe', label: 'Tic-Tac-Toe', icon: <Grid3x3 size={16} /> },
    { id: 'memory', label: 'Memory', icon: <BrainCircuit size={16} /> },
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

const Controls: React.FC<ControlsProps> = ({ currentShape, setShape, currentColor, setColor, particleSize, setParticleSize, isPlaying, toggleAudio }) => {
  const [isOpen, setIsOpen] = useState(true);

  const getGestureContent = () => {
    switch (currentShape) {
      case 'snake':
        return [
           { icon: <Move size={16} />, title: "Guide Snake", desc: "Move hand to steer. Collect glowing food." }
        ];
      case 'memory':
        return [
           { icon: <BrainCircuit size={16} />, title: "Watch Sequence", desc: "Memorize the flashing colors." },
           { icon: <Minimize2 size={16} />, title: "Repeat", desc: "Move hand to color zone and CLOSE FIST to select." }
        ];
      case 'tictactoe':
        return [
           { icon: <Move size={16} />, title: "Hover", desc: "Move hand to highlight a grid cell." },
           { icon: <Minimize2 size={16} />, title: "Place X", desc: "Close fist to mark your spot." }
        ];
      case 'counting': // Balloon Pop
        return [
          { icon: <MousePointerClick size={16} />, title: "Touch to Pop", desc: "Reach out and touch the floating balloons to count them." },
          { icon: <Sparkles size={16} />, title: "Clear Level", desc: "Pop all balloons to move to the next number." }
        ];
      case 'spelling': // Magic Reveal
        return [
          { icon: <Eraser size={16} />, title: "Wipe Fog", desc: "Wave your hands over the 'fog' to reveal the hidden letter." },
          { icon: <Sparkles size={16} />, title: "Find Shape", desc: "Reveal most of the shape to unlock the next letter." }
        ];
      case 'fireball':
        return [
          { icon: <Minimize2 size={16} />, title: "Charge Rasengan", desc: "Close fist to compress particles into a high-speed spinning sphere." },
          { icon: <Maximize2 size={16} />, title: "Heat Release", desc: "Open hand to expand the thermal energy outward." }
        ];
      case 'lightning':
        return [
          { icon: <Zap size={16} />, title: "Chidori Strike", desc: "Close fist to concentrate high-voltage electrical arcs." },
          { icon: <Move size={16} />, title: "Static Field", desc: "Open hand creates a loose, jittery electrical field." }
        ];
      case 'water':
        return [
          { icon: <Droplets size={16} />, title: "Water Prison", desc: "Close fist to trap particles in a dense hydro-sphere." },
          { icon: <Wind size={16} />, title: "Tidal Ripple", desc: "Open hand sends sine-wave ripples through the liquid field." }
        ];
      case 'wind':
        return [
          { icon: <Wind size={16} />, title: "Vortex Lift", desc: "Close fist to generate a powerful upward tornado." },
          { icon: <Move size={16} />, title: "Gust", desc: "Open hand to direct air currents gently." }
        ];
      default:
        return [
          { icon: <Maximize2 size={16} />, title: "Repel Field", desc: "Open your hand wide to push particles away and create voids." },
          { icon: <Minimize2 size={16} />, title: "Gravity Core", desc: "Close your fist to generate a black hole that pulls particles in." },
          { icon: <Move size={16} />, title: "Flow Control", desc: "Move your hand gently to steer the particle stream." }
        ];
    }
  };

  const guides = getGestureContent();

  return (
    <div className="absolute top-6 right-6 z-50 flex flex-col gap-4 w-72">
      {/* Main Glass Panel */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
        
        {/* Header / Toggle */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 text-white/90">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
             <span className="text-sm font-bold uppercase tracking-widest font-[Orbitron]">Control Deck</span>
          </div>
          {isOpen ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
        </div>

        {/* Content */}
        <div className={clsx("transition-all duration-500 ease-in-out overflow-hidden custom-scrollbar", isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0")}>
          <div className="p-5 pt-0 space-y-6 overflow-y-auto max-h-[70vh]">
            
            {/* Shape Selector */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 block">Field Topology</label>
              <div className="grid grid-cols-2 gap-2">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => setShape(shape.id)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 group",
                      currentShape === shape.id
                        ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20"
                        : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span className={clsx("transition-transform duration-300", currentShape === shape.id ? "scale-110" : "group-hover:scale-110")}>
                      {shape.icon}
                    </span>
                    <span>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kids Mode Selector */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2">
                 <Baby size={12} /> Learning (3+)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KIDS_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setShape(mode.id)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 group",
                      currentShape === mode.id
                        ? "bg-pink-500/20 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.2)] border border-pink-500/30"
                        : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span className={clsx("transition-transform duration-300", currentShape === mode.id ? "scale-110" : "group-hover:scale-110")}>
                      {mode.icon}
                    </span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Games Selector */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2">
                 <Gamepad2 size={12} /> Arcade & Brain
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setShape(mode.id)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase transition-all duration-300 group",
                      currentShape === mode.id
                        ? "bg-green-500/20 text-green-200 shadow-[0_0_20px_rgba(34,197,94,0.2)] border border-green-500/30"
                        : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span className={clsx("transition-transform duration-300", currentShape === mode.id ? "scale-110" : "group-hover:scale-110")}>
                      {mode.icon}
                    </span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Palette size={12} /> Emission Spectrum
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setColor(color)}
                    className={clsx(
                      "w-6 h-6 rounded-full border transition-all duration-300 transform hover:scale-110 focus:outline-none",
                      currentColor === color
                        ? "border-white shadow-[0_0_12px_currentColor] scale-125 ring-2 ring-white/20"
                        : "border-transparent opacity-40 hover:opacity-100"
                    )}
                    style={{ backgroundColor: color, color: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Particle Size Slider */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Layers size={12} /> Particle Size
              </label>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] text-white/30 font-mono">FINE</span>
                 <input
                    type="range"
                    min="0.05"
                    max="0.4"
                    step="0.01"
                    value={particleSize}
                    onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                 />
                 <span className="text-[10px] text-white/30 font-mono">BOLD</span>
              </div>
            </div>

            {/* Audio Toggle */}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Music size={12} /> Sonic Atmosphere
              </label>
              <button
                onClick={toggleAudio}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase transition-all duration-300 border",
                  isPlaying
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="flex items-center gap-2">
                  <Volume2 size={14} className={isPlaying ? "animate-pulse" : ""} />
                  {isPlaying ? "Deep Space (Playing)" : "Deep Space (Muted)"}
                </span>
                {isPlaying && (
                  <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 h-full bg-purple-400 animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
                    <div className="w-0.5 h-2/3 bg-purple-400 animate-[bounce_1s_infinite]" style={{ animationDelay: '200ms' }} />
                    <div className="w-0.5 h-3/4 bg-purple-400 animate-[bounce_1s_infinite]" style={{ animationDelay: '100ms' }} />
                  </div>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
      
      {/* Dynamic Gesture Guide Panel */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-xl animate-fade-in-up delay-200">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
           <Info size={14} className="text-cyan-400"/>
           <h3 className="text-white/90 text-xs font-bold uppercase tracking-widest">
             {['fireball', 'lightning', 'water', 'wind'].includes(currentShape) ? 'Ability Guide' : 
              ['spelling', 'counting'].includes(currentShape) ? 'How to Play' : 
              ['snake', 'tictactoe', 'memory'].includes(currentShape) ? 'Game Rules' : 'Gesture Guide'}
           </h3>
        </div>
        
        <div className="space-y-4">
          {guides.map((guide, idx) => (
            <div key={idx} className="flex items-start gap-3 group">
              <div className={clsx(
                "p-2 rounded-lg bg-white/5 text-white/80 transition-colors",
                currentShape === 'fireball' ? "group-hover:bg-orange-500/20 group-hover:text-orange-400" :
                currentShape === 'lightning' ? "group-hover:bg-yellow-500/20 group-hover:text-yellow-400" :
                currentShape === 'water' ? "group-hover:bg-blue-500/20 group-hover:text-blue-400" :
                ['spelling', 'counting'].includes(currentShape) ? "group-hover:bg-pink-500/20 group-hover:text-pink-400" :
                ['snake', 'tictactoe', 'memory'].includes(currentShape) ? "group-hover:bg-green-500/20 group-hover:text-green-400" :
                "group-hover:bg-cyan-500/20 group-hover:text-cyan-400"
              )}>
                {guide.icon}
              </div>
              <div>
                <strong className="text-white/90 text-xs block mb-0.5 font-bold">{guide.title}</strong>
                <p className="text-[10px] text-white/50 leading-tight">{guide.desc}</p>
              </div>
            </div>
          ))}
          
          <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-white/30 font-mono text-center uppercase">
            Interact via Webcam • Mirrored Input
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
