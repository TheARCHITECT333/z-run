# Z‑Run

A mobile, real‑world zombie‑survival running game. Your phone's GPS is your character — walk or run through real streets to reach the extraction point before the horde catches you. Built on real OpenStreetMap road data, so zombies chase you along actual roads and lose you behind real buildings.

## How it works

- **Goal.** Reach the extraction point and get within 50 m to win. One touch from a zombie ends the run.
- **Move.** Your real GPS position moves you on a live map. A clock tracks how long you survive.
- **Threat.** Zombies hunt by sight and by sound. Break line of sight behind buildings to shake them. Different types behave differently — sprinters close fast, screamers drag the whole horde onto you, others stalk relentlessly.
- **Modes.** *Quick deploy* drops a random extraction point at a chosen radius; *Plan route* lets you pick your own destination on the map. Bigger radius = longer run and more hostiles.

## Tech

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5
- Tailwind CSS v4
- Leaflet + react‑leaflet for the map
- OpenStreetMap roads via the Overpass API (road‑snapped movement + line‑of‑sight occlusion)

## Project layout

```
app/                     Next.js app router (layout, page, global styles)
components/Map/           Game container + Leaflet map
components/UI/            Menus, HUD, win/lose screens
config/ZombieTraits.ts   Zombie types and their stats
hooks/geo.ts             Distance, road fetching, spawning, pathfinding
hooks/useZombieAI.ts     Per-frame zombie AI loop (chase / search / scream)
hooks/useGeolocation.ts  GPS watch + smoothing
hooks/ai.ts              Bearing / movement / line-of-sight helpers
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For real GPS play, open it on a phone over HTTPS (geolocation requires a secure context).

### Debug mode

`components/Map/GameComponent.tsx` has `ENABLE_DEBUG_MODE` near the top. While `true`, an on‑screen joystick replaces real GPS so you can test on a desktop. Set it to `false` for real‑world GPS play.

## Build

```bash
pnpm run build
pnpm start
```
