'use client';

export type GameState = 'IDLE' | 'LOADING' | 'RUNNING' | 'WON' | 'GAME_OVER';

interface Props {
  gameState: GameState;
  distanceToTarget: number; // in meters
  onStart: (distanceKm: number) => void;
  onReset: () => void;
}

export default function GameOverlay({ gameState, distanceToTarget, onStart, onReset }: Props) {
    if (gameState === 'IDLE') {
        return (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1">
                <h1 className="text-4xl font-black italic text-red-600 uppercase tracking-tighter">Z-RUN</h1>
                <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Select Extraction Distance</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
                {[0.5, 1, 3, 5].map((km) => (
                <button
                    key={km}
                    onClick={() => onStart(km)}
                    className="w-full py-5 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold text-white active:bg-red-600 active:border-red-500 active:scale-95 transition-all flex items-center justify-between px-6 shadow-lg"
                >
                    <span className="text-xl italic">{km} KM</span>
                    <span className="text-[10px] text-zinc-600 font-mono border border-zinc-800 px-2 py-1 rounded bg-zinc-950 uppercase">
                    {km > 2 ? 'Hard' : 'Std'}
                    </span>
                </button>
                ))}
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

    // 3. WON SCREEN
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
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-red-900/90 backdrop-blur-md p-6 text-white animate-in zoom-in duration-100">
            <div className="text-center space-y-6">
            <div className="text-7xl drop-shadow-md animate-pulse">🧟</div>
            <div>
                <h1 className="text-6xl font-black uppercase tracking-tighter italic text-red-100">Infected</h1>
                <p className="font-mono text-red-200 mt-2 tracking-widest uppercase text-sm">Signal Lost</p>
            </div>
            <button 
                onClick={onReset}
                className="px-12 py-5 bg-zinc-900 border border-red-500/50 text-red-500 font-black rounded-full shadow-2xl active:scale-95 transition-transform text-lg"
            >
                RETRY
            </button>
            </div>
        </div>
        );
    }

    // RUNNING HUD
    return (
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
    );
}