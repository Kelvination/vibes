// Headless validation + author-time measurement for campaign maps.
// Run: node tools/measure.mjs
// Compiles each map, checks closure/overlaps, audits each corner's
// racing-line hug zones (entry/apex/exit), then drives it with a simple
// centerline autopilot through the real sim. Author time = bot time * 0.92.

import { compile, validate } from '../src/blocks.js';
import { createRace, step, ticksToMs, fmtTime } from '../src/sim.js';
import { CAMPAIGN } from '../src/campaign.js';

function wrap(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function runBot(track, maxTicks = 60000) {
  const rs = createRace(track, { skipCountdown: true });
  const wps = track.line;
  let idx = 0, stall = 0;
  for (let i = 0; i < maxTicks; i++) {
    const c = rs.car;
    while (idx < wps.length - 1 && Math.hypot(wps[idx].x - c.x, wps[idx].z - c.z) < 9 + 0.42 * c.speed) idx++;
    const t = wps[idx];
    const desired = Math.atan2(t.x - c.x, t.z - c.z);
    const err = wrap(desired - c.h);
    const t2 = wps[Math.min(idx + 5, wps.length - 1)];
    const err2 = wrap(Math.atan2(t2.x - c.x, t2.z - c.z) - c.h);
    const steer = Math.max(-1, Math.min(1, err * 2.8));
    const brake = (c.speed > 16 && Math.abs(err2) > 0.55) || (c.speed > 9 && Math.abs(err) > 0.95);
    const deploy = rs.ers > 25 && Math.abs(err) < 0.06 && !brake;
    step(rs, { throttle: !brake, brake, steer, deploy });
    rs.events.length = 0;
    if (rs.finished) return { ok: true, ms: ticksToMs(rs.finalTicks), idx, wps: wps.length };
    if (c.speed < 1.5 && rs.phase === 'racing') { if (++stall > 400) return { ok: false, why: `stalled at (${c.x.toFixed(1)},${c.z.toFixed(1)}) wp ${idx}/${wps.length}` }; }
    else stall = 0;
  }
  return { ok: false, why: `timeout (reached wp ${idx}/${wps.length})` };
}

let fail = 0;
for (const m of CAMPAIGN) {
  let placements;
  try { placements = m.build(); } catch (e) { console.log(`${m.id} BUILD FAIL: ${e.message}`); fail++; continue; }
  const errs = validate(placements);
  const track = compile(placements);
  if (errs.length || track.error) { console.log(`${m.id} INVALID: ${errs.join('; ')} ${track.error || ''}`); fail++; continue; }
  const res = runBot(track);
  if (!res.ok) { console.log(`${m.id} ${m.name}: BOT FAIL — ${res.why}`); fail++; continue; }
  const author = Math.round(res.ms * 0.92);
  const full = track.corners.filter((c) => c.entry && c.apex && c.exit).length;
  console.log(`${m.id} ${m.name}: bot ${fmtTime(res.ms)}  -> authorTime: ${author} (gold ${fmtTime(author * 1.06)}, silver ${fmtTime(author * 1.2)}, bronze ${fmtTime(author * 1.5)})  blocks=${placements.length} zones=${track.zones.length} cps=${track.cps.length}`);
  console.log(`   racing line: ${full}/${track.corners.length} corners with full entry+apex+exit zone set` +
    track.corners.filter((c) => !(c.entry && c.apex && c.exit))
      .map((c) => `\n   - block ${c.block} (${placements[c.block].id} @ ${placements[c.block].x},${placements[c.block].z}): ${['entry', 'apex', 'exit'].filter((k2) => !c[k2]).join('/')} missing`)
      .join(''));
}
process.exit(fail ? 1 : 0);
