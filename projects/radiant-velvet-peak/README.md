# WallRush

A browser-based, Trackmania-style time-trial racer with a twist: hugging designated **wall zones** at corner entries, apexes, and exits charges an ERS-style energy reserve you can deploy (hold **Shift** or toggle **E**) for sustained extra engine power. Each zone pays **once per run**, scored by your closest approach at speed — millimeters pay the most. **Touching the wall voids the zone.**

See [PRD.md](./PRD.md) for the full product requirements document.

## What's implemented (v1)

- **Handling model (PRD §4):** fixed 100 Hz deterministic sim, speed-sensitive understeer, controllable brake-induced rotation with counter-steer recovery, steering smoothing, lateral grip bleed, asphalt/dirt/grass/booster surfaces. All constants hot-tunable in the F2 debug panel.
- **Wall Energy System (PRD §5):** one-shot hug zones with closest-approach scoring, speed scaling, contact-void, per-pass ratings (PERFECT/CLOSE/SAFE/VOID), zone state visuals (armed pulse → paid dim → voided red), in-zone HUD meter + charge sparks + proximity hum, sustained ERS deploy (hold/toggle/both, selectable in settings).
- **Race loop (PRD §3, §7):** countdown, ms-precision timer, set-semantics checkpoints with split deltas, checkpoint respawn that restores ERS + zone states from the crossing snapshot, instant restart, Author/Gold/Silver/Bronze medals, local PBs, PB ghost replay.
- **Map editor (PRD §6):** grid placement with rotation and ghost preview, palette, undo/redo, per-zone toggles on curves (hover + 1/2/3), validation, in-editor test drive that sets the author time, save to localStorage, share codes (`WR1.` gzip+base64) and file export.
- **Campaign:** 5 maps teaching mechanics progressively, with author times measured by an autopilot through the actual sim (`tools/measure.mjs`).
- Synthesized audio (engine, ERS whine, proximity ticks, skids, chimes) — no assets.

## Not yet (vs. PRD)

Elevation blocks (ramps, loops, wallrides, slopes), gamepad, multilap, online leaderboards. Tracks are currently flat; the block catalog is the core subset.

## Tech notes

- Zero-build static site: plain ES modules + vendored Three.js (`vendor/`). The PRD suggests TypeScript + Vite; plain modules were chosen so the project deploys as-is on Vercel with no build step. A TS/Vite migration is mechanical if wanted later.
- `src/sim.js`, `src/blocks.js`, `src/campaign.js` are DOM-free and run headless in Node:
  - `node tools/measure.mjs` — validates every campaign map (compiles, loop closes, no overlaps) and drives it with a bot to produce author times.

## Controls

W/↑ throttle · S/↓ brake/reverse · A,D/←,→ steer · Shift hold-deploy · E toggle-deploy · Enter respawn · Backspace restart · G ghost · C camera · F2 tuning panel. Editor: click place, R rotate, right-click delete, 1/2/3 zone toggles, Ctrl+Z/Y, T test, wheel zoom, middle/Shift-drag pan, Q/E rotate.
