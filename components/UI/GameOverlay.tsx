'use client';

import { useState } from 'react';
export type GameState = 'IDLE' | 'MODE_SELECT' | 'SELECTING' | 'LOADING' | 'RUNNING' | 'WON' | 'GAME_OVER';

interface Props {
  gameState: GameState;
  distanceToTarget: number;
  onSelectMode: (mode: 'RANDOM' | 'CUSTOM') => void;
  onSelectRadius: (km: number) => void;
  onConfirmTarget: () => void;
  onCancelSelection: () => void;
  onReset: () => void; // Quit
  onRestart: () => void; // Quick Restart
  tempTargetDistance?: number;
}

export default function GameOverlay({ 
  gameState, 
  distanceToTarget, 
  onSelectMode,
  onSelectRadius, 
  onConfirmTarget, 
  onCancelSelection,
  onReset,
  onRestart,
  tempTargetDistance 
}: Props) {
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleQuit = () => {
    setIsMenuOpen(false);
    onReset();
  };

  const handleRestart = () => {
    setIsMenuOpen(false);
    onRestart();
  };

  if (gameState === 'IDLE') {
    return (
      <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-black italic text-red-600 uppercase tracking-tighter drop-shadow-lg">Z-RUN</h1>
            <p className="text-zinc-500 text-xs font-mono tracking-[0.3em] uppercase">Survival Protocol</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => onSelectMode('RANDOM')}
              className="w-full py-6 bg-red-700 hover:bg-red-600 border-2 border-red-500 rounded-xl font-black text-white text-xl tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all flex flex-col items-center gap-1"
            >
              <span>QUICK DEPLOY</span>
              <span className="text-[10px] font-mono text-red-200 opacity-70 font-normal">RANDOM EXTRACTION POINT</span>
            </button>

            <button
              onClick={() => onSelectMode('CUSTOM')}
              className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 rounded-xl font-bold text-zinc-300 text-lg tracking-wider active:scale-95 transition-all flex flex-col items-center gap-1"
            >
              <span>PLAN ROUTE</span>
              <span className="text-[10px] font-mono text-zinc-500 font-normal">CUSTOM SAFE ZONE</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'MODE_SELECT') {
    return (
      <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md p-6 animate-in slide-in-from-right-8 duration-300">
        <div className="w-full max-w-sm">
          <button 
            onClick={onReset}
            className="mb-8 text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-mono uppercase tracking-wider"
          >
            ← Back
          </button>

          <h2 className="text-3xl font-black text-white uppercase italic mb-1">Sector Size</h2>
          <p className="text-zinc-500 text-xs mb-8">Choose operational distance.</p>
          
          <div className="grid grid-cols-1 gap-3">
            {[0.5, 1, 3, 5].map((km) => (
              <button
                key={km}
                onClick={() => onSelectRadius(km)}
                className="w-full py-5 bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-white active:bg-red-600 active:border-red-500 active:scale-95 transition-all flex items-center justify-between px-6 shadow-lg group"
              >
                <span className="text-xl italic group-hover:text-red-500 transition-colors">{km} KM</span>
                <span className="text-[10px] text-zinc-600 font-mono border border-zinc-800 px-2 py-1 rounded bg-zinc-950 uppercase group-hover:border-red-900 group-hover:text-red-500">
                  {km > 2 ? 'Hard' : 'Std'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'SELECTING') {
    return (
      <div className="absolute inset-0 z-[1500] pointer-events-none flex flex-col justify-between p-6">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-4 rounded-xl text-center shadow-2xl pointer-events-auto animate-in slide-in-from-top-4">
          <h3 className="text-white font-bold uppercase tracking-wider text-sm text-red-500">Target Selection</h3>
          <p className="text-zinc-400 text-xs mt-1">Tap map to place Extraction Point.</p>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto pb-8">
          {tempTargetDistance !== undefined && (
             <div className="text-center mb-2 animate-in fade-in">
                <span className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-mono border border-white/10 shadow-lg">
                  Distance: {(tempTargetDistance / 1000).toFixed(2)} km
                </span>
             </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={onCancelSelection}
              className="flex-1 py-4 bg-zinc-800 text-zinc-300 font-bold rounded-xl active:scale-95 transition-transform"
            >
              CANCEL
            </button>
            <button 
              onClick={onConfirmTarget}
              disabled={!tempTargetDistance}
              className={`flex-[2] py-4 font-black rounded-xl shadow-lg transition-all ${
                tempTargetDistance 
                ? 'bg-red-600 text-white active:scale-95 hover:bg-red-500' 
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
              }`}
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if (gameState === 'LOADING') {
    return (
      <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-black italic text-red-500 uppercase tracking-widest">Scanning Sector</h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-2">Fetching Road Data...</p>
        </div>
      </div>
    );
  }

    // WON SCREEN
    if (gameState === 'WON') {
    return (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black overflow-hidden font-mono">
        <div className="absolute inset-0 bg-white animate-crt-turn-on pointer-events-none z-50"></div>

        <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0 mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[15px] w-full animate-scanline pointer-events-none z-10"></div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,black_100%)] z-10 pointer-events-none"></div>

        <div className="relative z-20 flex flex-col items-center w-full max-w-sm px-6 space-y-8 animate-fade-in-delayed">
            
            <div className="w-full flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">
            <span className="animate-pulse text-green-500">● LIVE FEED</span>
            <span>CAM_04 [EXTRACT]</span>
            </div>

            <div className="relative">
            <div className="text-8xl animate-glitch-icon opacity-80 filter blur-[0.5px]">🚁</div>
            <div className="absolute inset-0 text-7xl text-red-500 opacity-30 animate-glitch-icon translate-x-[2px]" style={{animationDelay: '0.1s'}}>🚁</div>
            <div className="absolute inset-0 text-7xl text-blue-500 opacity-30 animate-glitch-icon -translate-x-[2px]" style={{animationDelay: '0.2s'}}>🚁</div>
            </div>

            <div className="text-center space-y-2">
            <h2 className="text-xs text-zinc-400 tracking-[0.4em] uppercase">Status Confirmed</h2>
            <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter leading-none mix-blend-screen drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                Surv<span className="text-zinc-600 inline-block animate-pulse">i</span>vor
            </h1>
            <div className="inline-block bg-green-900/30 border border-green-500/30 px-3 py-1 rounded text-green-400 text-xs font-bold uppercase tracking-widest mt-2 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                Extraction Complete
            </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/50 p-4 border-l-2 border-zinc-700">
            <div className="uppercase">Pulse:</div>
            <div className="text-right text-red-500 animate-pulse">160 BPM</div>
            <div className="uppercase">Fuel:</div>
            <div className="text-right text-yellow-500">LOW RESERVES</div>
            <div className="uppercase">Horde:</div>
            <div className="text-right text-zinc-100">LEFT BEHIND</div>
            </div>

            <button 
            onClick={onReset}
            className="group relative w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-lg overflow-hidden transition-all active:scale-95"
            >
            <div className="absolute inset-0 bg-zinc-300 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
                Replay Scenario <span className="text-xs">▶</span>
            </span>
            </button>

        </div>
        </div>
        );
    }
  
// GAME OVER SCREEN
if (gameState === 'GAME_OVER') {
  return (
    <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-black/95 overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black/60 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        
        <div className="mb-6 text-red-600 animate-pulse opacity-80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-1 mb-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 italic skew-x-[-10deg] drop-shadow-[0_5px_5px_rgba(220,38,38,0.5)]">
            OVERRUN
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-red-600" />
            <p className="font-mono text-red-500 font-bold tracking-[0.2em] uppercase text-sm">
              Infection Confirmed
            </p>
            <div className="h-[2px] w-12 bg-red-600" />
          </div>
        </div>

        <div className="w-full bg-red-900/10 border-y border-red-900/30 py-4 mb-10 backdrop-blur-sm">
           <p className="font-mono text-xs text-red-400/70 uppercase">
             Connection Terminated... <br/> 
             Vital signs offline.
           </p>
        </div>

        <div className="flex flex-col gap-4 w-full px-4">
          <button 
            onClick={onRestart}
            className="group relative w-full py-4 bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest text-lg clip-path-slant transition-all duration-200 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:-translate-y-1"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Redeploy
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </span>
          </button>
          
          <button 
            onClick={onReset}
            className="w-full py-4 bg-transparent border border-zinc-700 text-zinc-400 hover:text-white hover:border-white hover:bg-zinc-800/50 font-bold uppercase tracking-widest text-sm transition-all duration-200"
          >
            Abort Mission
          </button>
        </div>

      </div>
    </div>
  );
}

  // RUNNING HUD
  return (
    <>
      <div className="absolute top-4 right-6 z-[1500] pointer-events-none">
        <div className="flex flex-col items-end drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            <span className="text-2xl font-black italic text-white tracking-tighter leading-none">
            {Math.round(distanceToTarget)}
            <span className="text-1xl text-zinc-400 ml-1">m</span>
            </span>
            <span className="text-[6px] font-mono text-zinc-400 uppercase tracking-widest pl-1">
            To Extraction
            </span>
        </div>
      </div>

      <div className="absolute top-6 left-6 z-[1500] pointer-events-auto">
        <button 
          onClick={toggleMenu}
          className="w-12 h-12 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-full flex items-center justify-center text-zinc-200 shadow-lg active:scale-95 transition-all hover:bg-zinc-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute inset-0 z-[2500] bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Survivor Profile</h2>
              <button onClick={toggleMenu} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-950 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
                <span className="text-zinc-400 text-xs uppercase font-mono">Status</span>
                <span className="text-green-500 font-bold text-sm uppercase">Active</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
                <span className="text-zinc-400 text-xs uppercase font-mono">Distance Run</span>
                <span className="text-white font-bold text-sm">-- KM</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl flex justify-between items-center border border-zinc-800">
                <span className="text-zinc-400 text-xs uppercase font-mono">Adrenaline</span>
                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-orange-600 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={handleRestart}
                className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-black rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                RESTART MISSION
              </button>
              <button 
                onClick={handleQuit}
                className="w-full py-4 bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-900/50 font-bold rounded-xl active:scale-95 transition-all"
              >
                ABORT MISSION
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}