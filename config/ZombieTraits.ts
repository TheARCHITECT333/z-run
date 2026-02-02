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
    description: "Standard threat. Low speed, average detection.",
    spawnWeight: 50,
    baseSpeed: 3,
    chaseSpeed: 5,
    detectionRange: 1000,
    fov: 90,
    proximityRange: 500,
    turnRate: 150,
    colorClass: "bg-zinc-700",
    arrowColorClass: "border-b-zinc-700",
    image: "https://placehold.co/600x400/27272a/FFF?text=Walker"
  },
  SPRINTER: {
    name: "Sprinter",
    description: "Extreme speed bursts. Vulnerable when exhausted.",
    spawnWeight: 15,
    baseSpeed: 4,
    chaseSpeed: 10, 
    detectionRange: 120,
    fov: 110,
    proximityRange: 50,
    turnRate: 200,
    colorClass: "bg-orange-600",
    arrowColorClass: "border-b-orange-600",
    image: "https://placehold.co/600x400/ea580c/FFF?text=Sprinter"
  },
  ENDURANCE: {
    name: "Endurance",
    description: "Relentless tracker. Hard to shake off once spotted.",
    spawnWeight: 10,
    baseSpeed: 3,
    chaseSpeed: 5, 
    detectionRange: 150,
    fov: 100,
    proximityRange: 50,
    turnRate: 120,
    colorClass: "bg-slate-700",
    arrowColorClass: "border-b-slate-700",
    image: "https://placehold.co/600x400/334155/FFF?text=Endurance"
  },
  BURST: {
    name: "Burst",
    description: "Unpredictable. Alternates between freezing and dashing.",
    spawnWeight: 5,
    baseSpeed: 0,
    chaseSpeed: 10, 
    detectionRange: 90,
    fov: 90,
    proximityRange: 50,
    turnRate: 360, 
    colorClass: "bg-teal-700",
    arrowColorClass: "border-b-teal-700",
    image: "https://placehold.co/600x400/0f766e/FFF?text=Burst"
  },
  SYNC: {
    name: "Sync",
    description: "Quantum locked. Moves only when you move.",
    spawnWeight: 5,
    baseSpeed: 0,
    chaseSpeed: 5,
    detectionRange: 100,
    fov: 360, 
    proximityRange: 50,
    turnRate: 500, 
    colorClass: "bg-indigo-700",
    arrowColorClass: "border-b-indigo-700",
    image: "https://placehold.co/600x400/4338ca/FFF?text=Sync"
  },
  STAGGERER: {
    name: "Staggerer",
    description: "Erratic gait makes speed hard to judge.",
    spawnWeight: 10,
    baseSpeed: 0.5,
    chaseSpeed: 5,
    detectionRange: 90,
    fov: 90,
    proximityRange: 50,
    turnRate: 100,
    colorClass: "bg-purple-700",
    arrowColorClass: "border-b-purple-700",
    image: "https://placehold.co/600x400/7e22ce/FFF?text=Staggerer"
  },
  SCREAMER: {
    name: "Screamer",
    description: "High priority threat. Screams to alert horde within 500m.",
    spawnWeight: 5,
    baseSpeed: 3,
    chaseSpeed: 3,
    detectionRange: 180,
    fov: 160,
    proximityRange: 100,
    turnRate: 80,
    colorClass: "bg-yellow-600",
    arrowColorClass: "border-b-yellow-600",
    image: "https://placehold.co/600x400/ca8a04/FFF?text=Screamer"
  }
};