export type ZombieType = 'WALKER' | 'SPRINTER' | 'ENDURANCE' | 'BURST' | 'SYNC' | 'STAGGERER' | 'SCREAMER';

export interface ZombieTrait {
  name: string;
  description: string;
  spawnWeight: number;
  baseSpeed: number;
  chaseSpeed: number;
  detectionRange: number;
  fov: number;
  proximityRange: number;
  turnRate: number;
  // Visuals
  colorClass: string;
  arrowColorClass: string;
  image: string;
}

export const ZOMBIE_TRAITS: Record<ZombieType, ZombieTrait> = {
  WALKER: {
    name: "Walker",
    description: "The bulk of the horde. Slow to turn, but it never tires — and there are always more.",
    spawnWeight: 45,
    baseSpeed: 3.5,
    chaseSpeed: 6.5,
    detectionRange: 240,
    fov: 130,
    proximityRange: 70,
    turnRate: 170,
    colorClass: "bg-zinc-700",
    arrowColorClass: "border-b-zinc-700",
    image: "https://placehold.co/600x400/27272a/FFF?text=Walker"
  },
  SPRINTER: {
    name: "Sprinter",
    description: "Closes the gap in seconds. Sprints until exhausted, then keeps coming at a jog.",
    spawnWeight: 16,
    baseSpeed: 4,
    chaseSpeed: 13,
    detectionRange: 200,
    fov: 140,
    proximityRange: 80,
    turnRate: 260,
    colorClass: "bg-orange-600",
    arrowColorClass: "border-b-orange-600",
    image: "https://placehold.co/600x400/ea580c/FFF?text=Sprinter"
  },
  ENDURANCE: {
    name: "Endurance",
    description: "Locks on and does not let go. It will outlast any sprint you have in you.",
    spawnWeight: 12,
    baseSpeed: 4.5,
    chaseSpeed: 7,
    detectionRange: 240,
    fov: 130,
    proximityRange: 80,
    turnRate: 140,
    colorClass: "bg-slate-700",
    arrowColorClass: "border-b-slate-700",
    image: "https://placehold.co/600x400/334155/FFF?text=Endurance"
  },
  BURST: {
    name: "Burst",
    description: "Freezes, then explodes forward. Blink and it has already closed on you.",
    spawnWeight: 7,
    baseSpeed: 0,
    chaseSpeed: 14,
    detectionRange: 170,
    fov: 120,
    proximityRange: 80,
    turnRate: 360,
    colorClass: "bg-teal-700",
    arrowColorClass: "border-b-teal-700",
    image: "https://placehold.co/600x400/0f766e/FFF?text=Burst"
  },
  SYNC: {
    name: "Sync",
    description: "Mirrors your movement. Stand still to stall it — but you can't stand still for long.",
    spawnWeight: 7,
    baseSpeed: 0,
    chaseSpeed: 8,
    detectionRange: 180,
    fov: 360,
    proximityRange: 80,
    turnRate: 500,
    colorClass: "bg-indigo-700",
    arrowColorClass: "border-b-indigo-700",
    image: "https://placehold.co/600x400/4338ca/FFF?text=Sync"
  },
  STAGGERER: {
    name: "Staggerer",
    description: "Lurches unpredictably. Its top speed is far faster than its gait suggests.",
    spawnWeight: 8,
    baseSpeed: 1,
    chaseSpeed: 9,
    detectionRange: 170,
    fov: 120,
    proximityRange: 80,
    turnRate: 120,
    colorClass: "bg-purple-700",
    arrowColorClass: "border-b-purple-700",
    image: "https://placehold.co/600x400/7e22ce/FFF?text=Staggerer"
  },
  SCREAMER: {
    name: "Screamer",
    description: "Won't chase hard — but its scream drags the entire horde down onto your position.",
    spawnWeight: 5,
    baseSpeed: 3.5,
    chaseSpeed: 5,
    detectionRange: 280,
    fov: 220,
    proximityRange: 130,
    turnRate: 100,
    colorClass: "bg-yellow-600",
    arrowColorClass: "border-b-yellow-600",
    image: "https://placehold.co/600x400/ca8a04/FFF?text=Screamer"
  }
};
