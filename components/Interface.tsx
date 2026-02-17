
import React from 'react';
import { ShapeMode } from '../types';
import { 
  Heart, Flower, Cloud, Sparkles, 
  Flame, Zap, Wind, RotateCcw, 
  Target, Wand2, 
  Gamepad2, Grid3X3, Brain,
  Mic, MicOff, Info, MoveUpRight, Waves,
  X, Settings2
} from 'lucide-react';
import clsx from 'clsx';

interface InterfaceProps {
  mode: ShapeMode;
  setMode: (m: ShapeMode) => void;
  color: string;
  setColor: (c: string) => void;
  audioEnabled: boolean;
  setAudioEnabled: (e: boolean) => void;
  particleSize: number;
  setParticleSize: (s: number) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const TOPOLOGIES: { id: ShapeMode; label: string; icon: any }[] = [
  { id: 'love', label: 'LOVE', icon: Heart },
  { id: 'nature', label: 'NATURE', icon: Flower },
  { id: 'cosmos', label: 'COSMOS', icon: Cloud },
  { id: 'festive', label: 'FESTIVE', icon: Sparkles },
  { id: 'fireball', label: 'FIREBALL', icon: Flame },
  { id: 'thunder', label: 'THUNDER', icon: Zap },
  { id: 'tornado', label: 'TORNADO', icon: Wind },
  { id: 'vortex', label: 'VORTEX', icon: RotateCcw },
];

const LEARNING: { id: ShapeMode; label: string; icon: any }[] = [
  { id: 'magic_reveal', label: 'MAGIC REVEAL', icon: Wand2 },
  { id: 'balloon_pop', label: 'BALLOON POP', icon: Target },
];

const ARCADE: { id: ShapeMode; label: string; icon: any }[] = [
  { id: 'snake', label: 'SNAKE', icon: MoveUpRight },
  { id: 'tic_tac_toe', label: 'TIC-TAC-TOE', icon: Grid3X3 },
  { id: 'memory', label: 'MEMORY', icon: Brain },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#ffffff', '#444444'];

const Interface: React.FC<InterfaceProps> = ({ 
  mode, setMode, color, setColor, audioEnabled, setAudioEnabled, particleSize, setParticleSize,
  menuOpen, setMenuOpen
}) => {
  const currentLabel = [...TOPOLOGIES, ...LEARNING, ...ARCADE].find(m => m.id === mode)?.label || "TOPOLOGY";

  return (
    <div className="absolute inset-0 pointer-events-none flex font-['Rajdhani'] overflow-hidden">
      
      {/* Central Header - Fades out when menu is open on small screens, or generally stays visible */}
      <div className={clsx(
          "absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-500 z-30",
          menuOpen ? "opacity-30 blur-sm scale-90" : "opacity-100 scale-100"
      )}>
        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold tracking-[0.3em] mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          CURRENT TOPOLOGY
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        </div>
        <div className="glass-panel px-10 py-4 rounded-2xl border-white/5 flex flex-col items-center min-w-[300px]">
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] font-[Syncopate] text-center">
             {currentLabel}
           </h1>
        </div>
      </div>

      {/* Toggle Button / Tab */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className={clsx(
            "pointer-events-auto absolute top-6 z-50 transition-all duration-500 shadow-2xl group flex items-center justify-center",
            menuOpen 
                ? "right-6 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10" 
                : "right-0 w-12 h-10 rounded-l-xl bg-blue-600/10 backdrop-blur-md border border-white/10 border-r-0 text-blue-400 hover:w-14 hover:bg-blue-600/20"
        )}
      >
        {menuOpen ? <X size={24} className="group-hover:rotate-90 transition-transform" /> : <Settings2 size={24} className="group-hover:-rotate-90 transition-transform" />}
      </button>

      {/* Sidebar Overlay */}
      <div 
        className={clsx(
            "pointer-events-auto absolute top-0 right-0 h-full w-full sm:w-[400px] bg-[#030303]/95 backdrop-blur-2xl border-l border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.8)] transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-40 flex flex-col",
            menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="mt-16 pb-20 flex flex-col gap-8">
                
                {/* Menu Header */}
                <div className="border-b border-white/10 pb-6">
                    <h2 className="text-2xl font-black text-white tracking-[0.1em] font-[Syncopate] mb-2">
                        CONTROL DECK
                    </h2>
                    <p className="text-xs text-white/40 font-medium tracking-wider">
                        SYSTEM CONFIGURATION & MODES
                    </p>
                </div>

                {/* Topology Matrix */}
                <section>
                  <h3 className="text-[10px] text-blue-400 font-bold tracking-widest mb-4 flex items-center gap-2">
                    <Grid3X3 size={12} /> FIELD TOPOLOGY
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {TOPOLOGIES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setMode(t.id)}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group relative overflow-hidden",
                          mode === t.id 
                            ? "bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                            : "border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10 hover:text-white/80"
                        )}
                      >
                        <t.icon size={16} className={mode === t.id ? "text-blue-400" : ""} />
                        <span className="text-[11px] font-bold tracking-wider">{t.label}</span>
                        {mode === t.id && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Learning Section */}
                <section>
                  <h3 className="text-[10px] text-purple-400 font-bold tracking-widest mb-4 flex items-center gap-2">
                    <RotateCcw size={12} /> LEARNING MODULES
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {LEARNING.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setMode(t.id)}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left relative",
                          mode === t.id 
                            ? "bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                            : "border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10 hover:text-white/80"
                        )}
                      >
                        <t.icon size={16} className={mode === t.id ? "text-purple-400" : ""} />
                        <span className="text-[11px] font-bold tracking-wider">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Arcade Section */}
                <section>
                  <h3 className="text-[10px] text-green-400 font-bold tracking-widest mb-4 flex items-center gap-2">
                    <Gamepad2 size={12} /> ARCADE & BRAIN
                  </h3>
                  <div className="flex flex-col gap-2">
                    {ARCADE.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setMode(t.id)}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                          mode === t.id 
                            ? "bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                            : "border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10 hover:text-white/80"
                        )}
                      >
                        <t.icon size={16} className={mode === t.id ? "text-green-400" : ""} />
                        <span className="text-[11px] font-bold tracking-wider">{t.label}</span>
                        {mode === t.id && <span className="ml-auto text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold">Active</span>}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Color Spectrum */}
                <section>
                  <h3 className="text-[10px] text-white/40 font-bold tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={12} /> EMISSION SPECTRUM
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={clsx(
                          "w-8 h-8 rounded-full border-2 transition-all relative",
                          color === c ? "border-white scale-110 shadow-[0_0_15px_currentColor]" : "border-white/10 opacity-40 hover:opacity-100 hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </section>

                {/* Particle Size Slider */}
                <section className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] text-white/60 font-bold tracking-widest flex items-center gap-2">
                      <Grid3X3 size={12} /> PARTICLE DENSITY
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] text-white/30 font-bold tracking-wider">FINE</span>
                    <input 
                      type="range" min="0.05" max="0.4" step="0.01" 
                      value={particleSize} 
                      onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                      className="flex-1 accent-white h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                    />
                    <span className="text-[9px] text-white/30 font-bold tracking-wider">BOLD</span>
                  </div>
                </section>

                {/* Audio */}
                <section>
                  <h3 className="text-[10px] text-white/40 font-bold tracking-widest mb-4">SONIC ATMOSPHERE</h3>
                  <button 
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={clsx(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all group",
                      audioEnabled 
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                        : "bg-black/40 border-white/5 text-white/30 hover:border-white/20 hover:text-white/50"
                    )}
                  >
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-[11px] font-bold tracking-widest uppercase">
                            {audioEnabled ? "Microphone Active" : "Microphone Muted"}
                        </span>
                        <span className="text-[9px] opacity-60">
                            {audioEnabled ? "Particles reacting to sound intensity" : "Enable to visualize ambient sound"}
                        </span>
                    </div>
                    {audioEnabled ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
                  </button>
                </section>

                {/* Ability Guide */}
                <section className="border-t border-white/10 pt-8">
                    <div className="bg-gradient-to-br from-white/5 to-transparent p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                        <h4 className="text-[10px] text-white/60 font-bold tracking-[0.2em] flex items-center gap-2 uppercase">
                            <Info size={12} /> Interaction Guide
                        </h4>
                        
                        <div className="flex gap-4 items-start group">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                            <Wind size={14} className="text-blue-400" />
                            </div>
                            <div>
                            <div className="text-[11px] text-white font-bold tracking-wide">Vortex Containment</div>
                            <p className="text-[10px] text-white/40 leading-relaxed mt-1">Close your hand into a fist to generate a gravitational pull, trapping particles.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start border-t border-white/5 pt-4 group">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                            <Waves size={14} className="text-purple-400" />
                            </div>
                            <div>
                            <div className="text-[11px] text-white font-bold tracking-wide">Tidal Ripple</div>
                            <p className="text-[10px] text-white/40 leading-relaxed mt-1">Open your palm and move slowly to send ripples through the particle field.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
      </div>

    </div>
  );
};

export default Interface;
