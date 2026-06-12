# WallRush — Product Requirements Document

**Status:** Draft v1.0
**Date:** 2026-06-12
**Project folder:** `projects/wallrush/`

---

## 1. Overview

WallRush is a browser-based arcade time-trial racing game inspired by Trackmania 2020. Players race a single car against the clock on user-built tracks, chasing the fastest possible time. There are no opponents on track, no collisions with other players, and no items — just you, the track, and the timer.

The signature twist: **hugging designated wall zones charges an ERS-style energy reserve**. Marked wall segments at corner entries, apexes, and exits reward driving millimeters from the wall — but actually touching it gives nothing and costs speed. The player can deploy stored energy at any time (hold or toggle) for a general power increase — not a turbo spike, but a sustained engine boost similar to ERS deployment in Formula 1. This creates a constant risk/reward tension: the closer you dare, the more you gain, and contact ruins it.

### Vision statement

> "The fastest line *almost* touches the wall."

In Trackmania, the optimal line avoids walls. In WallRush, the optimal line *flirts* with them. Every map becomes a question of how close the player dares to get for energy.

### Goals

1. Driving that *feels* like Trackmania: snappy, readable, skill-expressive arcade handling with speed-dependent understeer and controllable brake-rotation.
2. A block-based map builder in the spirit of Trackmania's editor: snap-to-grid placement of roads, curves, ramps, jumps, loops, and wallride pieces.
3. The wall-proximity ERS mechanic as a first-class system that reshapes racing lines.
4. Zero-install: runs in a modern desktop browser, deployable as a static site on Vercel.

### Non-goals (v1)

- Real-time multiplayer (ghosts and shared leaderboard times stand in for it).
- Mobile/touch support.
- Realistic simulation physics (tire models, suspension, damage).
- Car customization/skins.
- Server-side accounts or anti-cheat. Times are stored locally; map sharing is via exported codes/files.

---

## 2. Target audience & platform

- **Audience:** Trackmania players, time-attack/speedrun enthusiasts, players who enjoy "one more run" skill games.
- **Platform:** Desktop browsers (Chrome, Firefox, Edge, Safari), keyboard input required, gamepad optional (nice-to-have).
- **Performance target:** 60 FPS on integrated graphics for tracks up to ~500 blocks; physics fixed-step independent of render rate.

---

## 3. Core game loop

```
Pick map → Countdown (3-2-1) → Drive for fastest time
  ↳ Pass all checkpoints → Cross finish → Time recorded
  ↳ Instant retry (Backspace/Del) at any moment, zero loading
  ↳ Beat medal thresholds (Bronze/Silver/Gold/Author)
  ↳ Race your ghost → shave milliseconds → repeat
```

Instant restart is sacred. From keypress to "car at start line, timer armed" must be < 100 ms. The entire game is built around frictionless retry.

---

## 4. Driving model

The car is an arcade physics body, not a wheel-by-wheel simulation. This is how Trackmania achieves its feel: deterministic, exaggerated, and fully readable. All physics run on a **fixed timestep (e.g. 100 Hz)** so that identical inputs always produce identical runs (enables ghosts and replays).

### 4.1 Base handling

| Property | Behavior |
|---|---|
| Acceleration | Strong at low speed, tapering toward top speed (asymptotic curve). |
| Top speed | Soft cap from drag; surfaces and ERS modify effective power. |
| Steering | Maps input to a target yaw rate; the car turns crisply at low speed. |
| Grip | Lateral velocity is bled off each tick ("grip force"), giving the planted, on-rails feel at moderate speed. |
| Braking | Strong decelerator; also a handling tool (see 4.3). |
| Reverse | Allowed at low speed for recovering from stalls against walls. |

### 4.2 Speed-sensitive understeer (required)

At higher speeds the car must *resist turning*:

- Maximum yaw rate scales **down** with speed: `maxYawRate(v) = baseYaw * (1 / (1 + k * v))` (curve tuned in playtesting; the shape matters more than the formula).
- Additionally, lateral grip is finite: above a speed threshold, commanded turns produce gentle outward slide (the front "washes out") rather than full rotation, so the car drifts wide of the intended arc.
- Effect: full-speed corners require either braking, lifting off, or accepting a wide line — exactly the TM2020 dynamic where you cannot just hold full throttle + full steer through everything.

Tuning requirement: understeer must be **progressive and predictable**. The player should be able to feel the front start to push and modulate it, never a binary "grip / no grip" cliff.

### 4.3 Brake-induced rotation (required)

Braking interacts with existing rotation, modeled on TM's brake-drift and the "locked rear" behavior in F1 — but deliberately tamed so it's always controllable:

- **If the car has angular momentum** (already yawing from a steering input) **and the player brakes**, rear grip is reduced and the existing rotation is *amplified*: the back steps out and the car rotates further into the turn.
- **If the car is traveling straight** (negligible yaw rate), braking is stable and just slows the car — no random snap oversteer.
- The amplification scales with current yaw rate and speed, and is capped so the car never spins past the player's ability to catch it with counter-steer. Releasing the brake restores rear grip and the slide recovers.
- While rotating under braking, forward speed bleeds faster (scrubbing), so brake-drifting is a *line* tool, not a speed exploit.

This gives the classic TM technique: tap brake mid-corner to tighten the line / rotate the nose, then get back on throttle. Counter-steering during the slide must meaningfully fight the rotation.

### 4.4 Air control

- Small pitch/yaw authority while airborne (TM-style) to line up landings.
- Landing alignment matters: landing with wheels aligned to velocity preserves speed; landing sideways scrubs speed hard.

### 4.5 Surfaces (v1 set)

| Surface | Effect |
|---|---|
| Asphalt (default) | Full grip. |
| Dirt | Lower grip, lower top speed, easier rotation. |
| Booster pad | Track-placed forced acceleration (separate from ERS). |
| Wallride surface | Drivable when entered with sufficient speed; gravity reorients to surface normal. |

### 4.6 Determinism & tuning

- Fixed-timestep simulation, input recorded per tick → replays/ghosts are input playback.
- All handling constants live in a single tunable config object (`physics.ts` / `tuning.json`) so feel iteration is fast. Expect the bulk of development time to go here; **the game lives or dies on §4.2 and §4.3 feeling right.**

---

## 5. Wall Energy System (ERS) — the signature mechanic

### 5.1 Charging: designated wall-hug zones, proximity only — contact gives nothing

Charging does **not** happen along arbitrary walls. It happens only inside **designated wall-hug zones**: visually marked wall segments placed at the **entry, apex, and exit of corners** (and wherever the map builder adds them — see §5.4). This makes the mechanic legible — the track itself tells you where the risk/reward moments are — and lets corner shape dictate which phases apply (a tightening corner might have apex + exit zones only; a fast kink might be apex-only).

- While the car is alongside a hug zone, the game measures the distance from the car's side to the zone's wall surface (side shape-casts each tick).
- **Inside the charge band** (e.g. < 1.5 car-widths from the zone wall), energy accumulates. Charge rate scales with:
  - **Proximity** — closer = faster charge, maxing out when nearly scraping.
  - **Speed** — charging requires meaningful speed (no parking next to a wall to farm energy; below a speed floor, charge rate is ~0).
- **Touching the wall gives no charge.** On contact, charging stops immediately and stays suspended for a short lockout (~0.3–0.5 s, tuned) so scrape-flicker can't cheat the rule, and contact friction costs speed as normal. Accumulated reserve is kept — contact wastes the opportunity, it doesn't drain the bank. The skill expression is a clean millimeter near-miss at speed; the wall is purely a penalty, never a crutch.
- Energy stores in a reserve with a fixed cap (e.g. 0–100). HUD shows it as a gauge.

### 5.2 Deployment: ERS, not turbo

- **Activation:** player choice of **hold** (deploys while held) or **toggle** (press to enable, press to disable) — selectable in settings; both must be supported.
- **Effect:** while deploying, engine power is increased by a flat multiplier (e.g. +20–30% power) and top speed cap raises modestly. It is a *sustained shove*, not an impulse: no instant velocity injection, no screen-shake kick. Think F1 ERS overtake mode.
- **Drain:** energy drains at a constant rate while active (target: a full bar lasts roughly 4–6 seconds of continuous deployment; tuned in testing).
- Deploying with an empty reserve does nothing (no penalty, just inert).
- ERS works on any surface and mid-air (mid-air deploy gives slight forward push only — tuning decision, may be disabled if it breaks jumps).

### 5.3 Design intent & balance

- Wall-hugging must be a **meaningful but optional** layer: a clean no-ERS lap should still be competitive on maps with few hug zones; map builders control the mechanic's prominence via zone placement.
- Risk/reward calibration: clipping the wall is strictly lose-lose (no charge + lockout + speed scrub), so greedy lines that touch should clearly lose to a slightly wider clean line; a clean near-miss through a full entry-apex-exit zone set should clearly beat ignoring the zones entirely.
- HUD must communicate state instantly: charge gauge, an "in charge zone" indicator (gauge glows / particle ticks along the car's side near the zone wall), a visible "contact lockout" state (gauge briefly greys out on touch — instant feedback that you blew it), and a distinct deploy state (gauge drains, subtle speed-line VFX, engine pitch rises).

### 5.4 Builder interaction

- **Curve blocks ship with built-in hug zones** at entry, apex, and exit (on the outside wall by default). Each zone is **individually toggleable per block** in the editor, because entry/exit zones aren't always applicable — e.g. a corner that opens straight into another corner has no meaningful exit phase, and a chicane's middle has no clean entry. Apex zones are the default-on baseline; entry/exit default on for standalone corners and are the builder's call elsewhere.
- **Free-standing hug-zone wall piece**: a wall segment variant whose face is a charge zone, placeable anywhere (straights, tunnel walls, custom layouts) for builders who want zones outside the standard corner pattern.
- Plain walls and borders never charge — they are only hazards. The marked zones are the entire ERS surface area of a map.
- **Visual language:** hug zones are unmistakably marked — an emissive colored strip along the wall face (e.g. cyan), pulsing gently, brightening as the car gets close. Players should read the racing line's risk/reward at a glance from the track itself.

---

## 6. Map builder

A block-based 3D editor modeled on Trackmania's: the world is a grid; blocks snap to cells; tracks are assembled, not sculpted.

### 6.1 Editor fundamentals

- **Grid:** 3D lattice (e.g. 64×64 footprint × 16 height levels). Block unit ≈ one road segment (32×32×8 m equivalent).
- **Camera:** free-orbit + pan + zoom editor camera; optional first-person fly mode.
- **Placement:** click to place at the highlighted cell, with ghost preview of the selected block; blocks rotate in 90° steps (R key / scroll); raise/lower placement height (PgUp/PgDn or scroll modifier).
- **Removal:** right-click / eraser mode.
- **Selection UI:** block palette organized by category tabs (mirrors TM's inventory), with thumbnails.
- **Undo/redo** (Ctrl+Z / Ctrl+Y), full history within session.
- **Validation before save/publish:** the map must contain exactly one Start, at least one Finish, and the author must drive a complete valid run to set the **Author time** (medals derive from it: Gold = author × 1.06, Silver = × 1.20, Bronze = × 1.50 — tunable).
- **Test mode:** one key (e.g. T) drops you into driving at the start line from inside the editor; Esc returns to editing with cursor where you left it.

### 6.2 Block catalog (v1)

Categories and minimum block set, mirroring TM2020's core inventory:

**Road (asphalt, with side borders — plain walls, no charge):**
- Straight, Curve (1-, 2-, 3-block radius), Diagonal, Chicane — curves include built-in entry/apex/exit hug zones with per-zone editor toggles (§5.4)
- Slope up/down (gentle & steep), Slope-curve combinations
- Banked curve (1-, 2-, 3-block radius) — hug zones as above
- Narrow road variant (walls closer together — higher risk, and tighter quarters for any hug zones placed there)

**Platform (open-edged, no borders — you can fall off):**
- Flat platform, platform slope, platform curve

**Dirt:**
- Dirt straight, dirt curve, dirt slope (uses dirt surface physics)

**Special / signature:**
- Start block, Finish block, Checkpoint block (full-width ring/line)
- Multilap point (v1.5)
- Booster pad (forced acceleration), Slow-motion-free — no gameplay gimmick pads beyond boost in v1
- Jump/ramp (with takeoff lip), Gap-jump landing ramp
- Loop (vertical 360°), Wallride (quarter-pipe / full vertical wall segments)
- Tunnel (enclosed road — walls on both sides *and* ceiling; claustrophobic, low visibility; supports hug-zone wall variants)
- Decorative: pillars/supports auto-generated under elevated blocks (visual only)

**Walls (free-standing):**
- Straight wall segment, wall corner, half-height wall — plain hazard walls, placeable alongside any road/platform
- **Hug-zone wall segment** — the charge-zone variant (§5.4), the builder's tool for placing ERS opportunities anywhere

Each block defines: visual mesh, collision mesh, surface type per face, and which faces (if any) are hug zones, including the per-zone toggle state for curve blocks.

### 6.3 Map persistence & sharing

- **Format:** JSON — grid placements `{blockId, cell, rotation}` + metadata (name, author, author time, medal times).
- **Storage:** browser `localStorage` for the local library; **export/import** as a downloadable `.wallrush.json` file and as a compressed shareable string (base64 of deflated JSON) that fits in a clipboard paste.
- Bundled content: ship 5–8 hand-built campaign maps that teach mechanics progressively (basics → braking-rotation corners → wall-riding for ERS → wallrides/loops → full combined test).

---

## 7. Racing & timing features

- **Timer:** starts on first input after countdown (or on countdown end — TM starts on countdown end; we match TM), millisecond precision, monotonic with the fixed physics clock (never wall-clock).
- **Checkpoints:** must all be collected (any order = no; sequential by trigger, TM-style "all checkpoints" set semantics: each CP counted once, finish only valid when all collected). Checkpoint splits shown vs. personal best delta (+/− in green/red).
- **Respawn:** key to respawn at last checkpoint (standing start, ERS reserve restored to value at CP crossing); full restart key for the start line.
- **Medals:** Author/Gold/Silver/Bronze per map, persisted locally.
- **Personal best & ghosts:** PB per map stored locally (input-recording replay). Race against PB ghost (semi-transparent car, toggleable). Ghost export/import alongside map sharing (stretch: ghost embedded in shareable string).
- **Leaderboard:** local-only in v1 (PB list per map). Online leaderboard is explicitly out of scope for v1 (would require a backend; revisit in v2 — see §11).

---

## 8. Presentation

### 8.1 Visuals
- Low-poly, high-readability aesthetic (TM-like clean geometry, strong color-coding: asphalt grey, dirt orange-brown, boosters yellow, checkpoints blue, finish chequered).
- Distinct visual language for ERS: car side-glow / sparks while charging near walls; subtle speed-lines + exhaust glow while deploying.
- Chase camera (default, slight speed-based FOV widening), plus hood cam. Camera never controlled by mouse during driving.

### 8.2 Audio
- Engine loop pitch-mapped to speed; ERS deploy layer (rising whine); proximity "tick/hum" while in the charge zone (sells the mechanic without looking at the gauge); skid sounds tied to lateral slip (audio cue for understeer/brake-rotation); checkpoint chime, countdown beeps.

### 8.3 HUD (driving)
- Center-bottom: speed (km/h).
- Bottom: ERS gauge with charge-zone glow state.
- Top-center: current time; checkpoint split deltas appear transiently.
- Top-right: PB and medal targets for this map.

---

## 9. Controls (default bindings, rebindable)

| Action | Key | Notes |
|---|---|---|
| Throttle | W / ↑ | |
| Brake / reverse | S / ↓ | Brake-rotation per §4.3; reverse below ~5 km/h |
| Steer | A,D / ←,→ | Digital input, smoothed to analog internally (TM-style) |
| ERS deploy | Shift (hold) / E (toggle) | Both bound by default; settings choose preferred style |
| Respawn at checkpoint | Enter | |
| Restart run | Backspace / Del | Instant, < 100 ms |
| Toggle ghost | G | |
| Camera toggle | C | |
| Editor: test drive | T | |
| Gamepad | analog stick steer, triggers throttle/brake, A = ERS | Nice-to-have, not launch-blocking |

Steering smoothing: digital key input ramps the internal steering value over ~80–150 ms and re-centers on release — this is a big part of why TM keyboard play feels good and is **required**.

---

## 10. Technical approach

| Concern | Decision |
|---|---|
| Language / build | TypeScript + Vite |
| Rendering | Three.js (WebGL) |
| Physics | **Custom arcade physics** on a fixed 100 Hz timestep. No off-the-shelf physics engine for the car — TM-feel and determinism demand bespoke code. Simple swept-shape collision vs. block collision meshes (boxes/convex pieces per block, spatial hash on the grid). |
| Wall proximity | Side shape-casts each tick against hug-zone surfaces (zones registered in the grid spatial hash); distance feeds ERS charge; contact events trigger the charge lockout. |
| Determinism | Fixed timestep, no `Math.random` in sim, inputs sampled per tick; render interpolates between sim states. Ghosts = recorded input streams replayed through the same sim. |
| State/UI | Plain TS + lightweight DOM/CSS HUD; no heavy framework required (small React app acceptable for editor palette if it speeds development). |
| Persistence | `localStorage` (maps, PBs, ghosts, settings) + file export/import. |
| Deployment | Static build in `projects/wallrush/`, auto-deployed to Vercel via existing repo workflow. |

**Architecture sketch:**

```
src/
  sim/        # fixed-step physics: car, collision, surfaces, ERS, checkpoints
  blocks/     # block definitions: meshes, collision, surface/ERS face data
  editor/     # grid editor: placement, palette, undo, validation, test mode
  race/       # timing, medals, ghosts, respawn logic
  render/     # three.js scene, car & track meshes, VFX, cameras
  ui/         # HUD, menus, settings, map library
  persist/    # localStorage + import/export codecs
```

---

## 11. Milestones

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **M1 — Feel prototype** | Car on a flat plane with a few walls + hug-zone pieces; full handling model (§4) incl. understeer + brake-rotation; ERS charge/deploy with contact lockout (§5); debug tuning panel | "It feels like Trackmania" in blind playtest; brake-rotation is controllable; threading hug zones without touching is fun on a bare plane |
| **M2 — Race loop** | Start/CP/finish, timer, instant restart, respawn, medals, PB + ghost, HUD, 2 hand-coded test tracks | Complete time-trial loop, deterministic ghosts verified (replayed input = identical time) |
| **M3 — Map builder** | Grid editor with full v1 block catalog, undo/redo, validation, test mode, save/load/export/import | A non-developer can build, validate, and share a playable map |
| **M4 — Content & polish** | 5–8 campaign maps, audio, VFX, settings (incl. hold/toggle ERS), menus, map library UI | Shippable: new player goes menu → tutorial map → builds own map without instructions |
| **M5 (v2, not committed)** | Online leaderboards + map sharing backend, gamepad polish, multilap, more blocks (ice, grass, half-pipes), ghost sharing | — |

---

## 12. Success criteria

1. **Feel:** players familiar with Trackmania describe the handling as "close to TM" unprompted; brake-rotation and understeer are used deliberately as techniques, not fought as bugs.
2. **Mechanic:** on maps with hug zones, top local times all use them — and replays show distinct near-miss lines through entry/apex/exit zones (the mechanic visibly changed the racing line) with clean, contact-free execution.
3. **Retention loop:** median session includes ≥ 10 restarts on a single map (the "one more run" signal).
4. **Builder:** a playable custom map can be built and shared (export string) in under 10 minutes.
5. **Performance:** 60 FPS / fixed 100 Hz sim maintained on a mid-range laptop with a 500-block map.

---

## 13. Open questions

| # | Question | Current lean |
|---|---|---|
| 1 | Does ERS persist through checkpoint respawn at the *crossing-time* value, or reset to 0? | Restore to value at CP crossing (stored with CP state) — prevents respawn-farming while not punishing crashes twice |
| 2 | Should mid-air ERS deploy give thrust? | Yes, weak — but cut it if it trivializes jump design |
| 3 | Contact lockout duration, and should heavy contact also drain some reserve? | ~0.3–0.5 s lockout; no reserve drain in v1 (contact already costs speed + the missed charge) |
| 3b | Should curve blocks auto-disable entry/exit zones based on adjacent blocks (smart defaults), or leave it fully manual? | Manual toggles in v1 with sensible static defaults; auto-detection is a v2 editor nicety |
| 4 | Timer start: on countdown end (TM) or first input? | Countdown end, matching TM |
| 5 | Map grid size 64³ enough? | Start 64×64×16, make it a map property later |
| 6 | Keyboard-only at launch? | Yes; gamepad if time allows in M4 |

---

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Handling never "feels right" | Fatal | M1 is gated entirely on feel; all constants hot-tunable in a debug panel; copy TM's *behaviors* (steering smoothing, speed-scaled yaw, grip bleed) rather than inventing |
| ERS dominates or is irrelevant | Core mechanic fails | Charge/drain/power constants in tuning config; balance target in §5.3; campaign maps tested with and without ERS |
| Custom physics + collision scope creep | Schedule | Blocks use simple convex collision; no dynamic objects; car is a single rigid body with raycast wheels at most |
| Editor UX too heavy for v1 | Schedule | Cut to: place/rotate/delete/undo/test/save — everything else (copy-paste regions, macroblocks) is v2 |
| Browser perf on big maps | Quality | Grid spatial hash for collision; instanced meshes per block type; frustum culling free via Three.js |
