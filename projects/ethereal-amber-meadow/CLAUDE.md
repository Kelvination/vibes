# ethereal-amber-meadow — Bakery Princess

This folder is the **Bakery Princess** game (a touch-first web game designed by
a child). It was previously a Blender geometry-nodes editor; that project was
intentionally replaced here at the owner's request.

## What it is
A single self-contained `index.html` (HTML5 Canvas + Web Audio, no build step,
no dependencies). See `README.md` for the full gameplay description.

## Source of truth
The game's mechanics come from the PRD written by the designer (the owner's
daughter). The specific numbers and moments are the heart of the game and must
be preserved:
- **99 cookie sacks**, **5 cakes**, **3 icing lines per cake**.
- Rainbow-with-chocolate-chips "ready" signal; over-tapping burns the batch
  (silly puff of smoke, not a game-over).
- The swing + icing, the stairs with the giant cookie, the princess finale.

## Rules for changes
- Keep it **joyful, colorful, and forgiving**. No harsh fail states, big tap
  targets, minimal reading.
- Must keep working on **mobile portrait** and desktop; touch + mouse both
  supported; always `preventDefault()` on touch so the page can't scroll/zoom.
- Prefer keeping everything in the single `index.html` so it deploys as a static
  site with no build.
