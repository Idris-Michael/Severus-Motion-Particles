
import React from 'react';
import clsx from 'clsx';
import { ShapeType } from '../../types';

interface VirtualBoardProps {
  mode: ShapeType;
  currentIndex: number;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const VirtualBoard: React.FC<VirtualBoardProps> = ({ mode, currentIndex }) => {
  // --- LEARNING MODE (Spelling - Magic Reveal) ---
  if (mode === 'spelling') {
    const currentItem = ALPHABET[currentIndex] || 'A';

    return (
        <div className="absolute bottom-8 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
        
        {/* Instruction Overlay */}
        <div className="mb-8 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse">
             <span className="text-xl md:text-2xl font-black text-pink-300 font-[Orbitron] uppercase tracking-widest">WIPE THE FOG!</span>
        </div>

        {/* The Board Grid */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl max-w-[90vw] overflow-hidden">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {ALPHABET.map((item, idx) => (
                    <div 
                    key={item}
                    className={clsx(
                        "w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-xl text-sm md:text-xl font-bold transition-all duration-500 font-[Orbitron]",
                        idx === currentIndex 
                        ? "bg-pink-500 text-white scale-125 shadow-[0_0_20px_rgba(236,72,153,0.5)] z-10"
                        : idx < currentIndex
                        ? "bg-pink-900/40 text-pink-200/40 border border-pink-500/20" 
                        : "bg-transparent text-white/10 border border-white/5"
                    )}
                    >
                    {item}
                    </div>
                ))}
            </div>
        </div>
        </div>
    );
  }

  // --- LEARNING MODE (Counting - Balloon Pop) ---
  if (mode === 'counting') {
    // currentIndex here comes from the parent as 1-5 (we mapped index+1)
    return (
        <div className="absolute top-8 left-0 right-0 z-40 flex justify-center pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)] flex flex-col items-center">
                 <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">BALLOON POP</span>
                 <div className="flex items-center gap-4">
                     <span className="text-6xl font-black text-white font-[Orbitron]">{currentIndex}</span>
                 </div>
                 <div className="mt-2 text-[12px] font-bold text-yellow-100 animate-pulse">TOUCH BALLOONS TO POP!</div>
             </div>
        </div>
    );
  }

  // --- GAME MODE: SNAKE ---
  if (mode === 'snake') {
      return (
        <div className="absolute top-8 left-0 right-0 z-40 flex justify-center pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)] flex flex-col items-center">
                 <span className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">SCORE</span>
                 <span className="text-5xl font-black text-white font-[Orbitron]">{currentIndex}</span>
                 <div className="mt-2 text-[10px] text-white/50">COLLECT GLOWING PARTICLES</div>
             </div>
        </div>
      );
  }

  // --- GAME MODE: MEMORY ---
  if (mode === 'memory') {
      return (
        <div className="absolute top-8 left-0 right-0 z-40 flex justify-center pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] flex flex-col items-center">
                 <span className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">BRAIN SEQUENCE</span>
                 <span className="text-5xl font-black text-white font-[Orbitron]">LVL {currentIndex + 1}</span>
                 <div className="mt-2 text-[10px] text-white/50">WATCH COLORS • REPEAT SEQUENCE</div>
             </div>
        </div>
      );
  }

  // --- GAME MODE: TIC TAC TOE ---
  if (mode === 'tictactoe') {
      // currentIndex 0 = Player Turn, 1 = AI Turn, 2 = Win, 3 = Lose, 4 = Draw
      const statusText = currentIndex === 0 ? "YOUR TURN" 
                       : currentIndex === 1 ? "AI THINKING..." 
                       : currentIndex === 2 ? "YOU WIN!" 
                       : currentIndex === 3 ? "GAME OVER"
                       : "DRAW";
      
      const statusColor = currentIndex === 2 ? "text-green-400"
                        : currentIndex === 3 ? "text-red-400"
                        : "text-white";

      return (
        <div className="absolute top-8 left-0 right-0 z-40 flex justify-center pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col items-center">
                 <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">TIC TAC TOE</span>
                 <span className={clsx("text-4xl font-black font-[Orbitron]", statusColor)}>{statusText}</span>
                 <div className="mt-2 text-[10px] text-white/50">HOVER TO SELECT • FIST TO PLACE</div>
             </div>
        </div>
      );
  }

  // --- STANDARD TOPOLOGIES ---
  const standardModes: Record<string, { title: string, subtitle: string, color: string }> = {
    hearts: { title: 'LOVE FIELD', subtitle: 'SPREAD FINGERS TO REPEL', color: 'text-red-400' },
    flowers: { title: 'NATURE BLOOM', subtitle: 'MOVE GENTLY TO FLOW', color: 'text-emerald-400' },
    saturn: { title: 'COSMIC RINGS', subtitle: 'CLOSE FIST TO COLLAPSE', color: 'text-cyan-400' },
    fireworks: { title: 'FESTIVE SPARKS', subtitle: 'EXPLOSIVE REACTIONS', color: 'text-yellow-400' },
    fireball: { title: 'RASENGAN', subtitle: 'CLOSE FIST TO CHARGE', color: 'text-orange-400' },
    lightning: { title: 'CHIDORI', subtitle: 'HIGH VOLTAGE GRIP', color: 'text-blue-400' },
    wind: { title: 'AERO VORTEX', subtitle: 'LIFT HAND TO RISE', color: 'text-slate-300' },
    water: { title: 'HYDRO SPHERE', subtitle: 'CLOSE TO CONTAIN', color: 'text-blue-500' },
  };

  if (standardModes[mode]) {
      const info = standardModes[mode];
      return (
        <div className="absolute top-8 left-0 right-0 z-40 flex justify-center pointer-events-none animate-fade-in-down">
             <div className="bg-black/60 backdrop-blur-md px-10 py-5 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center">
                 <div className="flex items-center gap-2 mb-2">
                    <div className={clsx("w-2 h-2 rounded-full animate-pulse", info.color.replace('text-', 'bg-'))}></div>
                    <span className={clsx("text-xs font-bold uppercase tracking-[0.2em]", info.color)}>CURRENT TOPOLOGY</span>
                    <div className={clsx("w-2 h-2 rounded-full animate-pulse", info.color.replace('text-', 'bg-'))}></div>
                 </div>
                 <span className="text-4xl md:text-5xl font-black text-white font-[Orbitron] drop-shadow-lg text-center">{info.title}</span>
                 <div className="mt-3 text-[10px] md:text-xs text-white/60 tracking-widest font-mono border-t border-white/10 pt-2 w-full text-center">
                    {info.subtitle}
                 </div>
             </div>
        </div>
      );
  }

  return null;
};

export default VirtualBoard;
