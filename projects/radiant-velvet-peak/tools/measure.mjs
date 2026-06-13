// Headless validation + author-time measurement for campaign maps.
// Run: node tools/measure.mjs
// Compiles each map, checks closure/overlaps, audits each corner's
// racing-line hug zones (entry/apex/exit), then drives it with a simple
// centerline autopilot through the real sim. Author time = bot time * 0.92.

import { compile, validate } from '../src/blocks.js';
import { createRace, step, ticksToMs, fmtTime } from '../src/sim.js';
import { CAMPAIGN } from '../src/campaign.js';
import { TUNING } from '../src/tuning.js';

function wrap(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// radius of the circle through three points (Infinity if ~collinear)
function circumRadius(A, B, C) {
  const a = Math.hypot(B.x - C.x, B.z - C.z);
  const b = Math.hypot(A.x - C.x, A.z - C.z);
  const c = Math.hypot(A.x - B.x, A.z - B.z);
  const area = Math.abs((B.x - A.x) * (C.z - A.z) - (C.x - A.x) * (B.z - A.z)) / 2;
  if (area < 1e-4) return Infinity;
  return (a * b * c) / (4 * area);
}

// Pure-pursuit autopilot with a curvature-aware speed controller. The
// centerline (track.line) is one lap of waypoints; for multi-lap races we
// index it modulo its length so the bot keeps looping until rs.finished.
function runBot(track, laps = 1, maxTicks = 180000) {
  const rs = createRace(track, { skipCountdown: true, laps });
  const wps = track.line;
  const n = wps.length;
  const wp = (i) => wps[((i % n) + n) % n];
  let idx = 0, stall = 0, jam = 0, recover = 0;
  for (let i = 0; i < maxTicks; i++) {
    const c = rs.car;
    // advance to the next waypoint still ahead of us within the lookahead radius
    let guard = 0;
    while (guard++ < n && Math.hypot(wp(idx).x - c.x, wp(idx).z - c.z) < 8 + 0.4 * c.speed) idx++;
    const t = wp(idx);
    const desired = Math.atan2(t.x - c.x, t.z - c.z);
    const err = wrap(desired - c.h);

    // Speed profile: scan ahead, find each corner's safe speed from its
    // curvature (v = sqrt(aLat * R)) and the max speed now from which we can
    // still brake down to it in the remaining distance. Fast on straights,
    // late braking into corners — i.e. a believable racing line.
    const aBrake = 11;            // bot's planned braking decel (m/s^2)
    let targetSpeed = 46;
    let dist = Math.hypot(wp(idx).x - c.x, wp(idx).z - c.z);
    for (let d = 0; d < 26; d++) {
      const w0 = wp(idx + d - 1), w1 = wp(idx + d), w2 = wp(idx + d + 1);
      if (d > 0) dist += Math.hypot(w1.x - w0.x, w1.z - w0.z);
      const R = circumRadius(w0, w1, w2);
      const gf = track.surfaceAt(w1.x, w1.z);
      const aLat = TUNING.baseMu * (gf === 'dirt' ? 0.42 : gf === 'grass' ? 0.55 : 1) * TUNING.gravity * 0.82;
      const vSafe = Math.sqrt(aLat * Math.min(R, 1e4));
      const vAllow = Math.sqrt(vSafe * vSafe + 2 * aBrake * dist);
      if (vAllow < targetSpeed) targetSpeed = vAllow;
    }

    let input;
    if (recover > 0) {
      // reverse out of a wall and turn the nose back toward the racing line
      recover--;
      input = { throttle: false, brake: true, steer: Math.sign(err) || 1, deploy: false };
    } else {
      if (c.speed < 1.8 && rs.phase === 'racing') jam++; else jam = 0;
      if (jam > 90) { recover = 130; jam = 0; idx = Math.max(0, idx - 2); }
      const steer = Math.max(-1, Math.min(1, err * 2.4));
      const brake = c.speed > targetSpeed + 1.5 || Math.abs(err) > 1.2;
      input = { throttle: !brake && c.speed < targetSpeed, brake, steer, deploy: rs.ers > 30 && targetSpeed > 38 && !brake };
    }
    step(rs, input);
    rs.events.length = 0;
    if (rs.finished) return { ok: true, ms: ticksToMs(rs.finalTicks) };
    if (c.speed < 1.0 && rs.phase === 'racing') {
      if (++stall > 1500) return { ok: false, why: `stalled at (${c.x.toFixed(1)},${c.z.toFixed(1)}) wp ${idx % n}/${n} lap ${rs.lap}/${rs.totalLaps}` };
    } else stall = 0;
  }
  return { ok: false, why: `timeout (wp ${idx % n}/${n} lap ${rs.lap}/${rs.totalLaps})` };
}

let fail = 0;
for (const m of CAMPAIGN) {
  let placements;
  try { placements = m.build(); } catch (e) { console.log(`${m.id} BUILD FAIL: ${e.message}`); fail++; continue; }
  const errs = validate(placements);
  const track = compile(placements);
  if (errs.length || track.error) { console.log(`${m.id} INVALID: ${errs.join('; ')} ${track.error || ''}`); fail++; continue; }
  const res = runBot(track, m.laps || 1);
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
