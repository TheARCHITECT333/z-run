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
  hordeSize?: number;
  survivalSeconds?: number;
}

/* ── shared building blocks ───────────────────────────────── */

const btn =
  'w-full rounded-xl py-4 font-bold uppercase tracking-wider text-sm active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed';
const btnPrimary = `${btn} text-white bg-red-600 hover:bg-red-500 shadow-[0_0_30px_-8px_rgba(239,68,68,0.8)]`;
const btnSafe = `${btn} text-zinc-950 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_30px_-8px_rgba(52,211,153,0.8)]`;
const btnGhost = `${btn} text-zinc-300 border border-white/15 hover:bg-white/5 hover:border-white/30`;

const eyebrow = 'font-mono text-[10px] tracking-[0.35em] uppercase text-zinc-500';

function Corners({ tone = 'border-white/25' }: { tone?: string }) {
  const c = `absolute h-3 w-3 ${tone}`;
  return (
    <>
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

// Full-screen menu shell with the radar grid + scanline signature.
function Screen({
  children,
  sweep = 'rgba(239,68,68,0.35)',
}: {
  children: React.ReactNode;
  sweep?: string;
}) {
  return (
    <div className="absolute inset-0 z-[2000] flex flex-col bg-zinc-950 text-white overflow-hidden">
      <div className="radar-grid pointer-events-none absolute inset-0 opacity-70" style={{ '--sweep': sweep } as React.CSSProperties} />
      <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.8)]" />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

// Small tactical radar disc — the signature element, echoes the live map.
function RadarDisc({ sweep, tone }: { sweep: string; tone: string }) {
  return (
    <div className="relative mx-auto h-40 w-40">
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-[18%] rounded-full border border-white/10" />
      <div className="absolute inset-[40%] rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
      <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/10" />
      <div className="radar-sweep absolute inset-0 overflow-hidden rounded-full" style={{ '--sweep': sweep } as React.CSSProperties} />
      <div className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${tone} shadow-[0_0_12px_currentColor]`} />
    </div>
  );
}

function Stat({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">{label}</span>
      <span className={`font-mono text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
}

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function GameOverlay({
  gameState,
  distanceToTarget,
  onSelectMode,
  onSelectRadius,
  onConfirmTarget,
  onCancelSelection,
  onReset,
  onRestart,
  tempTargetDistance,
  hordeSize = 0,
  survivalSeconds = 0,
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleQuit = () => { setIsMenuOpen(false); onReset(); };
  const handleRestart = () => { setIsMenuOpen(false); onRestart(); };

  /* ── IDLE / title ──────────────────────────────────────── */
  if (gameState === 'IDLE') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-10 px-7">
          <p className={`${eyebrow} animate-fade-up`}>Survival Protocol</p>

          <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <RadarDisc sweep="rgba(239,68,68,0.5)" tone="bg-sky-400" />
          </div>

          <div className="animate-fade-up space-y-2 text-center" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-7xl font-black uppercase leading-none tracking-tighter text-white">
              Z<span className="text-red-600">-</span>Run
            </h1>
            <p className="font-mono text-xs tracking-[0.25em] text-zinc-500">
              Outrun the horde. Reach extraction.
            </p>
          </div>
        </div>

        <div className="animate-fade-up space-y-3 px-7 pb-[max(2rem,env(safe-area-inset-bottom))]" style={{ animationDelay: '0.15s' }}>
          <button onClick={() => onSelectMode('RANDOM')} className={btnPrimary}>
            Quick deploy
          </button>
          <button onClick={() => onSelectMode('CUSTOM')} className={btnGhost}>
            Plan route
          </button>

          <details className="group rounded-xl border border-white/10 bg-white/[0.03]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
              How to play
              <span className="text-zinc-600 transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="space-y-3 border-t border-white/10 px-5 py-4 text-xs leading-relaxed text-zinc-400">
              <p><span className="text-white">Goal.</span> Reach the green extraction point before the horde catches you. Get within 50 m to win.</p>
              <p><span className="text-white">Move.</span> Walk in the real world - your phone’s GPS moves you on the map. The clock counts how long you survive.</p>
              <p><span className="text-red-500">Danger.</span> Zombies chase on sight and on sound. Break line of sight behind buildings to lose them. Some sprint, some scream for the whole horde. One touch ends the run.</p>
              <p><span className="text-white">Tip.</span> Bigger sector radius = farther run and more hostiles. Start at 0.5–1 km.</p>
            </div>
          </details>

          <p className="pt-1 text-center font-mono text-[10px] tracking-widest text-zinc-600">
            QUICK = RANDOM EXTRACTION · PLAN = PICK YOUR OWN
          </p>
        </div>
      </Screen>
    );
  }

  /* ── MODE_SELECT / sector radius ───────────────────────── */
  if (gameState === 'MODE_SELECT') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col px-7 pt-[max(2rem,env(safe-area-inset-top))]">
          <button onClick={onReset} className="mb-10 flex items-center gap-2 self-start font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-white">
            ← Back
          </button>

          <p className={eyebrow}>Mission Parameters</p>
          <h2 className="mt-2 mb-1 text-4xl font-black uppercase tracking-tight">Sector radius</h2>
          <p className="mb-8 text-sm text-zinc-500">How far is the extraction point?</p>

          <div className="space-y-3">
            {[0.5, 1, 3, 5].map((km, i) => {
              const horde = Math.floor(km * 40);
              const hard = km > 2;
              return (
                <button
                  key={km}
                  onClick={() => onSelectRadius(km)}
                  className="group relative flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition-all hover:border-red-500/50 hover:bg-red-500/5 active:scale-[0.98] animate-fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <Corners tone="border-white/0 group-hover:border-red-500/40" />
                  <div>
                    <span className="text-2xl font-black">{km}</span>
                    <span className="ml-1 text-sm text-zinc-500">km</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">≈ {horde} hostiles</div>
                    <div className={`font-mono text-[10px] uppercase tracking-widest ${hard ? 'text-red-500' : 'text-emerald-500'}`}>
                      {hard ? 'High threat' : 'Standard'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Screen>
    );
  }

  /* ── SELECTING / place target on map ───────────────────── */
  if (gameState === 'SELECTING') {
    const ready = !!tempTargetDistance;
    return (
      <div className="pointer-events-none absolute inset-0 z-[1500] flex flex-col justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto relative mx-auto w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950/85 px-4 py-3 text-center backdrop-blur-md animate-fade-up">
          <Corners tone="border-amber-400/50" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400">Target selection</p>
          <p className="mt-1 text-xs text-zinc-400">Tap the map to drop your extraction point.</p>
        </div>

        <div className="pointer-events-auto space-y-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {ready && (
            <div className="text-center">
              <span className="inline-block rounded-full border border-white/10 bg-zinc-950/85 px-4 py-1.5 font-mono text-xs text-white backdrop-blur">
                Distance · {(tempTargetDistance! / 1000).toFixed(2)} km
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onCancelSelection} className={`${btnGhost} flex-1`}>Cancel</button>
            <button onClick={onConfirmTarget} disabled={!ready} className={`${btnPrimary} flex-[2]`}>Confirm</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── LOADING ───────────────────────────────────────────── */
  if (gameState === 'LOADING') {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <RadarDisc sweep="rgba(239,68,68,0.6)" tone="bg-red-500" />
          <div className="text-center">
            <h2 className="animate-flicker text-lg font-black uppercase tracking-[0.2em] text-white">Scanning sector</h2>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">Mapping road network…</p>
          </div>
        </div>
      </Screen>
    );
  }

  /* ── WON / extraction complete ─────────────────────────── */
  if (gameState === 'WON') {
    return (
      <Screen sweep="rgba(52,211,153,0.35)">
        <div className="flex flex-1 flex-col items-center justify-center px-7">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live feed
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">CH-04 · EXTRACT</span>
            </div>

            <div className="animate-fade-up text-center">
              <RadarDisc sweep="rgba(52,211,153,0.6)" tone="bg-emerald-400" />
            </div>

            <div className="animate-fade-up space-y-3 text-center" style={{ animationDelay: '0.1s' }}>
              <p className={eyebrow}>Status confirmed</p>
              <h1 className="text-5xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_18px_rgba(52,211,153,0.4)]">
                Survivor
              </h1>
              <span className="inline-block rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Extraction complete
              </span>
            </div>

            <div className="animate-fade-up rounded-xl border border-white/10 bg-white/[0.03] px-5 py-1" style={{ animationDelay: '0.15s' }}>
              <Stat label="Time survived" value={fmtTime(survivalSeconds)} tone="text-emerald-400" />
              <Stat label="Hostiles evaded" value={String(hordeSize)} />
              <Stat label="Outcome" value="Extracted" tone="text-emerald-400" />
            </div>

            <button onClick={onReset} className={`${btnSafe} animate-fade-up`} style={{ animationDelay: '0.2s' }}>
              Play again
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  /* ── GAME_OVER / overrun ───────────────────────────────── */
  if (gameState === 'GAME_OVER') {
    return (
      <Screen sweep="rgba(239,68,68,0.5)">
        <div className="flex flex-1 flex-col items-center justify-center px-7">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex items-center justify-between border-b border-red-900/40 pb-2">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-red-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Signal lost
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">CH-04 · DOWN</span>
            </div>

            <div className="animate-fade-up text-center">
              <RadarDisc sweep="rgba(239,68,68,0.6)" tone="bg-red-500" />
            </div>

            <div className="animate-fade-up space-y-3 text-center" style={{ animationDelay: '0.1s' }}>
              <p className={eyebrow}>Vitals offline</p>
              <h1 className="animate-flicker text-6xl font-black uppercase tracking-tighter text-red-600 drop-shadow-[0_0_18px_rgba(239,68,68,0.5)]">
                Overrun
              </h1>
              <span className="inline-block rounded border border-red-500/40 bg-red-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-red-400">
                Infection confirmed
              </span>
            </div>

            <div className="animate-fade-up rounded-xl border border-white/10 bg-white/[0.03] px-5 py-1" style={{ animationDelay: '0.15s' }}>
              <Stat label="Time survived" value={fmtTime(survivalSeconds)} tone="text-red-400" />
              <Stat label="Horde size" value={String(hordeSize)} />
              <Stat label="Distance left" value={`${Math.round(distanceToTarget)} m`} />
            </div>

            <div className="animate-fade-up space-y-3" style={{ animationDelay: '0.2s' }}>
              <button onClick={onRestart} className={btnPrimary}>Redeploy</button>
              <button onClick={onReset} className={btnGhost}>Abort mission</button>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  /* ── RUNNING / live HUD ────────────────────────────────── */
  return (
    <>
      {/* menu toggle */}
      <div className="pointer-events-auto absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[1500]">
        <button
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-zinc-950/70 text-zinc-200 shadow-lg backdrop-blur-md transition active:scale-95 hover:bg-zinc-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* distance + clock readout */}
      <div className="pointer-events-none absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[1500]">
        <div className="relative rounded-lg border border-white/10 bg-zinc-950/70 px-3.5 py-2 text-right backdrop-blur-md">
          <Corners tone="border-emerald-400/40" />
          <div className="leading-none">
            <span className="font-mono text-2xl font-black text-white">{Math.round(distanceToTarget)}</span>
            <span className="ml-1 text-sm text-zinc-500">m</span>
          </div>
          <div className="mt-1 flex items-center justify-end gap-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            <span className="text-emerald-400">▲ extraction</span>
            <span className="text-zinc-700">·</span>
            <span>{fmtTime(survivalSeconds)}</span>
          </div>
        </div>
      </div>

      {/* pause / status menu */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-[2500] flex items-center justify-center bg-zinc-950/85 p-6 backdrop-blur-lg animate-fade-up">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/90 p-6">
            <Corners tone="border-white/20" />
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-zinc-300">Field status</h2>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close" className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="mb-6 px-1">
              <Stat label="Status" value="In transit" tone="text-emerald-400" />
              <Stat label="Time survived" value={fmtTime(survivalSeconds)} />
              <Stat label="To extraction" value={`${Math.round(distanceToTarget)} m`} />
              <Stat label="Horde size" value={String(hordeSize)} tone="text-red-400" />
            </div>

            <div className="space-y-3">
              <button onClick={() => setIsMenuOpen(false)} className={btnSafe}>Resume</button>
              <button onClick={handleRestart} className={btnGhost}>Restart mission</button>
              <button onClick={handleQuit} className={`${btn} border border-red-900/50 bg-red-900/10 text-red-400 hover:bg-red-900/20`}>
                Abort mission
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
