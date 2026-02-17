
import React, { useEffect, useRef, useState } from 'react';
import { AudioData } from '../types';
import { Mic, MicOff } from 'lucide-react';

interface AudioAnalyzerProps {
  onAudioUpdate: (data: AudioData) => void;
}

const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onAudioUpdate }) => {
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number>(0);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      setIsActive(true);
      analyze();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const analyze = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const data = dataArrayRef.current;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const intensity = sum / (data.length * 255);

    // Band analysis
    const bassCount = Math.floor(data.length * 0.1);
    const midCount = Math.floor(data.length * 0.4);
    
    let bass = 0;
    for (let i = 0; i < bassCount; i++) bass += data[i];
    bass = bass / (bassCount * 255);

    let mid = 0;
    for (let i = bassCount; i < bassCount + midCount; i++) mid += data[i];
    mid = mid / (midCount * 255);

    let treble = 0;
    for (let i = bassCount + midCount; i < data.length; i++) treble += data[i];
    treble = treble / ((data.length - (bassCount + midCount)) * 255);

    onAudioUpdate({
      intensity,
      bass,
      mid,
      treble,
      frequencies: data
    });

    animationRef.current = requestAnimationFrame(analyze);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-40 z-50 flex items-center">
      <button
        onClick={isActive ? undefined : startAudio}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
          isActive 
            ? "bg-green-500/20 border-green-500/50 text-green-400 cursor-default" 
            : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white"
        }`}
      >
        {isActive ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
        {isActive ? "Audio Active" : "Enable Audio"}
      </button>
      
      {isActive && (
        <div className="ml-3 flex gap-[2px] items-end h-4">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-current opacity-60 rounded-full transition-all duration-75"
              style={{ 
                height: `${Math.random() * 100}%`,
                color: 'inherit'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioAnalyzer;
