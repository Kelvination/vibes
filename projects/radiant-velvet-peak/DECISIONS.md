# Wall Hugger — Decision Log

A running record of intentional gameplay / UX / design decisions so they don't
get silently reverted by later work. **If you change one of these, update the
entry here (and add new ones).** Newest first.

## Camera
- **Chase camera follows the car's heading, smoothly damped** (back ~10.5, height
  5.2, lookAt ~7 ahead, `k = 1 - exp(-dt*7)`). This is the intended feel — keep
  the damping so it tracks turns without whipping. Do NOT make it a fully
  world-fixed/non-rotating camera, and do NOT remove the smoothing (a hard
  heading-lock with no damping is the nauseating version that got reverted).
  (`render.js` `updateChase` / `snapCamera`, chase branch.) Hood cam is
  first-person and uses heading directly.

## ERS
- **ERS is PASSIVE, not a deploy button.** The stored bar continuously scales
  power + top speed and bleeds off over time; there is NO hold/toggle deploy and
  NO on-screen ERS button. Wall-hugging banks the bar; it auto-applies. Do not
  reintroduce active/deploy ERS. (`sim.js` step(): `ersPassivePower`,
  `ersPassiveTop`, `ersDecay`; HUD shows live `+X%`.)

## Handling
- **Slide-recovery assist** ramps in only at large sideslip (>~26°): restores
  steering lock for counter-steer + adds a restoring yaw moment, so 45–90° slides
  are catchable instead of looping. ~0 in normal driving. (`sim.js`,
  `counterSteerBoost` / `assistMinSlip` / `assistFullSlip` / `assistYaw`.)
- **Collision + zone scoring use a 2-circle capsule** matching the visible
  chassis (radius 0.95, offset ±1.15), and collide at the wall's inner face
  (`+wallHalf`). Hug-zone distance is measured from the closest point on the car
  body (capsule), not its center.
- **Boosters are intentionally mild** (`boostAccel` ~13). Don't crank them back up.

## Visuals
- **Skid marks**: lay rubber past a low lateral-slip threshold with hysteresis
  (continuous, not dashed). The skid mesh has `frustumCulled = false` (its
  vertices are rewritten in place; culling on the stale bounding sphere made the
  whole trail pop in/out). Cleared on restart/respawn.
- **Car mesh** is a low wedge-nosed sports prototype (splitter, canopy, dorsal
  stripe, rear wing, twin exhausts, wider rear wheels). No ERS exhaust glow.

## Tracks / editor
- **Curves come in 3 radii** (curve1/2/3). The grid is primarily 90°-based;
  corner variety + chicanes/hairpins/esses provide flow. Campaign maps must close
  (asserted in `campaign.js`); author times come from `tools/measure.mjs`.
- **Diagonal / 45° pieces** (`Diagonal` category: `diag`, `diag_l`, `diag_r`,
  `dirt_diag`) are built from a *centerline polyline* via `centerlineGeo` /
  `centerlineSurf` / `roadEdges` (offset walls + distance-based surface). They run
  corner-to-corner so adjacent diagonals' offset walls meet exactly at the shared
  cell corner. Add new straight-ish roads this way rather than hand-rolling walls.
  Diagonals carry no auto racing-line zones (no `curveK`).
- **Editor works on touch**: one-finger pan, pinch zoom, centre crosshair +
  on-screen tools (Place/Erase/Rot/Z1-3/undo-redo). A stray tap must never
  place/delete. Desktop mouse/keyboard editing unchanged.
- **Block selection on touch is a folder modal**, not a bottom strip: the
  `▦` button (bottom-left) opens `#editor-blockmodal`, a per-category accordion
  (`buildBlockModal`). Desktop keeps the left sidebar palette. Both are kept in
  sync by `select()`.
- **Map settings (Laps) live in a modal** (`#editor-settings`, ⚙ button), not
  inline in the toolbar — the inline number box looked wrong on mobile. Laps is
  stored on `map.laps`, carried through export/import; changing it clears the
  author time.
- **Start direction is shown in the editor** as a green ground arrow on the Start
  / Start-Finish blocks, drawn in the block's local +Z frame so it rotates with
  the block (`render.js` `startArrow()`, gated by `showGuides` so it's editor-only
  — never in a race). Spawn dir 0 = local +Z = the car's forward at the line.
- **Start / Finish combo block** (`startfinish`): one block that is both the spawn
  and a finish line (`straightGeo({ trigger:'finish', spawn:true })`). The car
  spawns ON the line, so the finish only counts once the car has driven clear of
  it (`sim.js` `finishArmed`) — don't remove that gate or lap 1 self-completes.
  `validate()` counts it as both a Start and a Finish.
- **Lap count is editor-authored** (`editor-laps` toolbar input, 1–99, stored as
  `map.laps`, carried through export/import). Changing it clears the author time
  (run length changed). Campaign maps keep their own `laps`.

## Mobile UI
- Keep the driving view uncluttered: no track-description popups over the track,
  trimmed top-right HUD, CSS-drawn (non-text) control glyphs, `touchstart`
  preventDefault to suppress the iOS long-press magnifier, and per-pointer touch
  tracking so buttons never stick.

## Dev tools
- F2 / Settings "Dev Tuning Panel": sectioned sliders + number boxes for every
  TUNING value (incl. per-surface), with "Copy JSON" export. Dev-only.
</content>
