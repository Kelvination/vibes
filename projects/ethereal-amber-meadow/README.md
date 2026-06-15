# 🧁 Bakery Princess

A bright, touch-first web game designed by a kid, for kids. Help a little girl
make treats for the **Cookie and Cake Festival**, then carry a giant cookie up
the stairs and transform into the **Bakery Princess**!

## Play

Open `index.html` in any browser — no build step, no server, no dependencies.
It's a single self-contained file using HTML5 Canvas + the Web Audio API.

- **Mobile:** portrait orientation, big tap targets, touch-friendly.
- **Desktop:** works with mouse too.
- 🔊 Tap the speaker in the top-right to mute/unmute.

## The four stages

1. **Make Cookies** — Tap the candy "beads" around the bowl to grow the batter.
   When it turns **rainbow with chocolate chips**, *stop tapping!* Wait a beat and
   it becomes a sack of cookies. Tap one too many times and it burns (a silly
   puff of smoke) — just that batch restarts. Fill the cart to **99 sacks**.
2. **Make Cakes** — A board shows a **3-line icing pattern**. Swipe white icing
   across each gray row to match it. Rows "lock in" with a sparkle. Decorate
   **5 cakes**.
3. **The Stairs** — Tap to climb the stairs carrying the giant cookie (it also
   auto-climbs so no one gets stuck). Place the cookie on top of the giant cake.
4. **Bakery Princess** — The transformation finale: crown, sparkles, confetti,
   and a fanfare. Then a friendly **Play Again** button.

## Design notes

The numbers (99 cookies, 5 cakes, 3 lines) and the special moments (rainbow
chocolate chips, the cough, the swing, the stairs, the princess) come straight
from the game's young designer and are kept intentionally. Everything favors
**joy and forgiveness** over difficulty — there is no harsh fail state.

## Tech

- Single `index.html`, HTML5 Canvas, synthesized Web Audio sound effects.
- Virtual 720×1280 portrait canvas, letterboxed and scaled to any screen.
- Pointer events (touch + mouse) with `preventDefault()` so the page never
  scrolls or zooms during play.
