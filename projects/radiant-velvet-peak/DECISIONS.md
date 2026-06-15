# Wall Hugger — Decision Log

A running record of intentional gameplay / UX / design decisions so they don't
get silently reverted by later work. **If you change one of these, update the
entry here (and add new ones).** Newest first.

## Camera
- **Chase camera is world-fixed orientation, not heading-locked.** It follows
  the car's position but always looks down +Z; it must NOT rotate/orbit with the
  car's heading. The old heading-locked orbit cam caused motion sickness on
  twisty tracks. (`render.js` `updateChase` / `snapCamera`, chase branch.)
  Hood cam still uses heading (first-person, expected).

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
- **Curves come in 3 radii** (curve1/2/3). The grid is 90°-based; corner variety
  + chicanes/hairpins/esses provide flow. Campaign maps must close (asserted in
  `campaign.js`); author times come from `tools/measure.mjs`.
- **Editor works on touch**: one-finger pan, pinch zoom, centre crosshair +
  on-screen tools (Place/Erase/Rot/Z1-3/undo-redo). A stray tap must never
  place/delete. Desktop mouse/keyboard editing unchanged.

## Mobile UI
- Keep the driving view uncluttered: no track-description popups over the track,
  trimmed top-right HUD, CSS-drawn (non-text) control glyphs, `touchstart`
  preventDefault to suppress the iOS long-press magnifier, and per-pointer touch
  tracking so buttons never stick.

## Dev tools
- F2 / Settings "Dev Tuning Panel": sectioned sliders + number boxes for every
  TUNING value (incl. per-surface), with "Copy JSON" export. Dev-only.
</content>
