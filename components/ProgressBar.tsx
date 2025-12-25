
import React from 'react';
import { Progress, Chip } from '@heroui/react';
import { GameState } from '../types.ts';

interface ProgressBarProps {
  gameState: GameState;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ gameState }) => {
  const { startPrice, currentPrice, alphaStats, betaStats } = gameState;
  
  // Prevent division by zero if startPrice is not yet set
  const effectiveStartPrice = startPrice || currentPrice || 1;
  const deltaPct = ((currentPrice - effectiveStartPrice) / effectiveStartPrice) * 100;
  const sensitivity = 500;
  
  let shift = 0;
  if (alphaStats.stance !== betaStats.stance) {
    shift = deltaPct * sensitivity;
  } else {
    const convictionDiff = alphaStats.conviction - betaStats.conviction;
    shift = convictionDiff + (deltaPct * sensitivity);
  }

  const clampedShift = Math.max(-48, Math.min(48, shift || 0));
  const position = 50 - clampedShift;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Alpha Territory</span>
          <Chip size="sm" variant="dot" color="primary" className="h-4 border-none text-[8px] font-bold p-0">{alphaStats.stance}</Chip>
        </div>
        <div className="flex flex-col items-center">
           <span className={`text-xs font-black tracking-tighter ${deltaPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
             {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(4)}%
           </span>
           <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Volatility Delta</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Beta Territory</span>
          <Chip size="sm" variant="dot" color="secondary" className="h-4 border-none text-[8px] font-bold p-0">{betaStats.stance}</Chip>
        </div>
      </div>

      <div className="relative h-12 flex items-center">
        {/* BACKGROUND TRACK */}
        <div className="absolute inset-x-0 h-1.5 bg-slate-900 border border-slate-800 rounded-full" />
        
        {/* CENTER MARKER */}
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-800 z-10" />

        {/* INDICATOR */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20"
          style={{ left: `${position}%` }}
        >
          <div className="relative -translate-x-1/2">
            <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] border-4 border-slate-950 flex items-center justify-center animate-pulse" />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2">
              <div className="w-0.5 h-2 bg-white/30" />
            </div>
          </div>
        </div>

        {/* WINNING GRADIENTS */}
        <div className="absolute inset-x-0 h-1.5 flex overflow-hidden rounded-full opacity-30">
          <div className="flex-1 bg-gradient-to-r from-blue-600 to-transparent" />
          <div className="flex-1 bg-gradient-to-l from-purple-600 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
