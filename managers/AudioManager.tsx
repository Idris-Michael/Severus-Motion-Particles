
import React, { useEffect, useRef } from 'react';
import { SystemState } from '../types';

interface AudioManagerProps {
  systemRef: React.MutableRefObject<SystemState>;
  enabled: boolean;
}

const AudioManager: React.FC<AudioManagerProps> = ({ systemRef, enabled }) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const frameRef = useRef<number>(0);
  const bufferRef = useRef<Uint8Array>(new Uint8Array(0));

  useEffect(() => {
    if (!enabled) {
      if (ctxRef.current?.state === 'running') ctxRef.current.suspend();
      return;
    }

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = ctxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        sourceRef.current = ctxRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        
        bufferRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
        
        loop();
      } catch (err) {
        console.error("Audio init failed", err);
      }
    };

    const loop = () => {
      if (!analyserRef.current || !ctxRef.current) return;
      
      analyserRef.current.getByteFrequencyData(bufferRef.current);
      
      // Calculate bands
      const data = bufferRef.current;
      const len = data.length;
      
      // Bass (Lower 10%)
      let bassSum = 0;
      const bassLen = Math.floor(len * 0.1);
      for(let i=0; i<bassLen; i++) bassSum += data[i];
      
      // High (Upper 50%)
      let highSum = 0;
      const highStart = Math.floor(len * 0.5);
      for(let i=highStart; i<len; i++) highSum += data[i];

      // Total level
      let totalSum = 0;
      for(let i=0; i<len; i++) totalSum += data[i];

      systemRef.current.audio = {
        level: (totalSum / len) / 255,
        bass: (bassSum / bassLen) / 255,
        high: (highSum / (len - highStart)) / 255
      };

      frameRef.current = requestAnimationFrame(loop);
    };

    init();

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, [enabled]);

  return null;
};

export default AudioManager;
