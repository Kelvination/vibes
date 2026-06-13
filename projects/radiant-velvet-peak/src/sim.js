// Wall Hugger — fixed-step deterministic simulation (PRD §4, §5, §7).
// Pure JS, no DOM/THREE. 100 Hz; identical inputs -> identical runs.

import { TUNING, ratingFor, zoneAward } from './tuning.js';

const TAU = Math.PI * 2;

function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

function closestOnSeg(px, pz, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z;
  const len2 = abx * abx + abz * abz;
  let t = len2 > 0 ? ((px - a.x) * abx + (pz - a.z) * abz) / len2 : 0;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  return { x: a.x + abx * t, z: a.z + abz * t, t };
}

// Distance from point to polyline + whether nearest point is clamped at an end.
function polylineDist(px, pz, pts) {
  let best = Infinity, bestEnd = false;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = closestOnSeg(px, pz, pts[i], pts[i + 1]);
    const d = Math.hypot(px - c.x, pz - c.z);
    if (d < best) {
      best = d;
      bestEnd = (i === 0 && c.t <= 0) || (i === pts.length - 2 && c.t >= 1);
    }
  }
  return { dist: best, atEnd: bestEnd };
}

// Zone pass states
export const Z_ARMED = 0, Z_TRACKING = 1, Z_PAID = 2, Z_VOID = 3;

export function createRace(track, opts = {}) {
  const start = track.start;
  const h = start.dir * Math.PI / 2;
  return {
    track,
    t: TUNING,
    tick: 0,                 // race ticks since GO
    phase: 'countdown',
    countdown: opts.skipCountdown ? 0 : TUNING.countdownTicks,
    car: {
      x: start.x, z: start.z, h,
      vx: 0, vz: 0, yaw: 0, steer: 0,
      speed: 0, vF: 0, vL: 0,
      surface: 'asphalt', sliding: false, contact: false,
    },
    ers: 0,
    ersToggle: false,
    zones: track.zones.map(() => ({ state: Z_ARMED, minDist: Infinity, minSpeed: 0 })),
    cpHit: track.cps.map(() => false),
    cpCount: 0,
    splits: [],              // race time (ticks) at each cp collection
    snapshot: null,          // respawn snapshot at last cp crossing (PRD §7)
    finished: false,
    finalTicks: 0,
    ghost: [],               // [x,z,h] every other tick, for PB ghost playback
    events: [],              // drained by UI/audio each frame
    zoneLive: { active: false, closeness: 0 }, // HUD proximity feedback
  };
}

function takeSnapshot(rs, spawn) {
  rs.snapshot = {
    spawn: { ...spawn },
    ers: rs.ers,
    zones: rs.zones.map((z) => ({ ...z })),
    cpHit: rs.cpHit.slice(),
    cpCount: rs.cpCount,
  };
}

export function respawn(rs) {
  if (rs.finished) return;
  const c = rs.car;
  let spawn, snap = rs.snapshot;
  if (snap) {
    spawn = snap.spawn;
    rs.ers = snap.ers;
    rs.zones = snap.zones.map((z) => ({ ...z }));
    rs.cpHit = snap.cpHit.slice();
    rs.cpCount = snap.cpCount;
  } else {
    spawn = { ...rs.track.start };
    rs.ers = 0;
    rs.zones = rs.track.zones.map(() => ({ state: Z_ARMED, minDist: Infinity, minSpeed: 0 }));
    rs.cpHit = rs.track.cps.map(() => false);
    rs.cpCount = 0;
  }
  c.x = spawn.x; c.z = spawn.z; c.h = spawn.dir * Math.PI / 2;
  c.vx = 0; c.vz = 0; c.yaw = 0; c.steer = 0;
  rs.ersToggle = false;
  rs.events.push({ type: 'respawn' });
}

// input: { throttle, brake, steer (-1..1 target), deploy }
export function step(rs, input) {
  const t = rs.t, c = rs.car, dt = t.dt;

  if (rs.phase === 'countdown') {
    const prev = rs.countdown;
    rs.countdown--;
    const beepEvery = Math.floor(t.countdownTicks / 3);
    if (prev % beepEvery === 0 && prev > 0) rs.events.push({ type: 'beep', n: Math.round(prev / beepEvery) });
    if (rs.countdown <= 0) {
      rs.phase = 'racing';
      rs.events.push({ type: 'go' });
    }
    return;
  }
  if (rs.phase !== 'racing') return;

  rs.tick++;

  // --- steering smoothing (PRD §9) ---
  const target = Math.max(-1, Math.min(1, input.steer));
  const rate = (target === 0 || target * c.steer < 0) ? t.recenterRate : t.steerRate;
  const dS = target - c.steer;
  const maxD = rate * dt;
  c.steer += Math.max(-maxD, Math.min(maxD, dS));

  // --- frame vectors / decomposition ---
  const fwdX = Math.sin(c.h), fwdZ = Math.cos(c.h);
  const rgtX = Math.cos(c.h), rgtZ = -Math.sin(c.h);
  let vF = c.vx * fwdX + c.vz * fwdZ;
  let vL = c.vx * rgtX + c.vz * rgtZ;
  const speed = Math.hypot(c.vx, c.vz);

  // --- surface ---
  const surfName = rs.track.surfaceAt(c.x, c.z);
  const surf = t.surfaces[surfName] || t.surfaces.asphalt;
  c.surface = surfName;

  // --- ERS deploy (PRD §5.2): sustained power increase ---
  const deploying = input.deploy && rs.ers > 0;
  if (deploying) rs.ers = Math.max(0, rs.ers - t.ersDrain * dt);
  const powerMul = (deploying ? t.ersPowerMul : 1) * surf.power;
  const topSpeed = t.topSpeed * (deploying ? t.ersTopMul : 1) * surf.top;
  rs.deploying = deploying;

  // --- longitudinal forces ---
  if (input.throttle) {
    const head = Math.max(0, 1 - Math.max(0, vF) / topSpeed);
    vF += t.enginePower * head * powerMul * dt;
  }
  const braking = input.brake;
  if (braking) {
    if (vF > t.reverseThresh) vF -= t.brakeDecel * dt;
    else vF = Math.max(vF - t.enginePower * 0.45 * dt, -t.reverseTop * surf.top);
  }
  vF -= (t.rollK * vF + t.dragK * vF * Math.abs(vF) * (vF > topSpeed ? 4 : 1)) * dt;

  if (surfName === 'boost') vF += t.boostAccel * dt;

  // --- yaw: speed-sensitive understeer (PRD §4.2) ---
  const maxYaw = t.baseYaw / (1 + t.yawSpeedK * Math.max(0, vF));
  const targetYaw = c.steer * maxYaw * (vF < 0 ? -1 : 1);
  c.yaw += (targetYaw - c.yaw) * Math.min(1, t.yawResp * dt);

  // --- brake-induced rotation (PRD §4.3) ---
  let gripMul = 1;
  let sliding = false;
  if (braking && Math.abs(c.yaw) > t.brakeRotMinYaw && vF > t.brakeRotMinSpeed) {
    sliding = true;
    const sgn = c.yaw > 0 ? 1 : -1;
    c.yaw += sgn * Math.abs(c.yaw) * t.brakeRotGain * dt;        // amplify existing rotation
    if (Math.abs(c.yaw) > t.brakeRotCap) c.yaw = sgn * t.brakeRotCap; // always catchable
    gripMul = t.brakeRotGripMul;                                  // rear steps out
    vF -= vF * t.brakeRotScrub * Math.abs(c.yaw) * dt;            // scrubbing: line tool, not speed exploit
  }
  c.sliding = sliding;

  // --- lateral grip bleed (planted at moderate speed, washes out at high speed) ---
  const grip = (t.baseGrip / (1 + t.gripSpeedK * speed)) * surf.grip * gripMul;
  vL -= vL * Math.min(1, grip * dt);

  // --- integrate heading & recompose velocity in new frame ---
  c.h = wrapAngle(c.h + c.yaw * dt);
  const nfX = Math.sin(c.h), nfZ = Math.cos(c.h);
  const nrX = Math.cos(c.h), nrZ = -Math.sin(c.h);
  c.vx = nfX * vF + nrX * vL;
  c.vz = nfZ * vF + nrZ * vL;
  c.x += c.vx * dt;
  c.z += c.vz * dt;

  // --- wall collision (circle vs segments via spatial hash) ---
  c.contact = false;
  const near = rs.track.nearWalls(c.x, c.z);
  for (const wi of near) {
    const seg = rs.track.walls[wi];
    const cp = closestOnSeg(c.x, c.z, seg.a, seg.b);
    const dx = c.x - cp.x, dz = c.z - cp.z;
    const d = Math.hypot(dx, dz);
    if (d >= t.carRadius || d < 1e-6) continue;
    const nx = dx / d, nz = dz / d;
    c.x += nx * (t.carRadius - d);
    c.z += nz * (t.carRadius - d);
    const vn = c.vx * nx + c.vz * nz;
    if (vn < 0) {
      c.vx -= nx * vn * (1 + t.wallRestitution);
      c.vz -= nz * vn * (1 + t.wallRestitution);
      const sp = Math.hypot(c.vx, c.vz);
      const scrub = Math.min(0.30, t.wallFrictionK * Math.abs(vn) / Math.max(sp, 5));
      c.vx *= 1 - scrub;
      c.vz *= 1 - scrub;
      c.yaw *= t.wallYawDamp;
    }
    c.contact = true;
    // Contact voids the hug zone — no partial credit (PRD §5.1).
    if (seg.zone >= 0) {
      const zs = rs.zones[seg.zone];
      if (zs.state === Z_ARMED || zs.state === Z_TRACKING) {
        zs.state = Z_VOID;
        rs.events.push({ type: 'zoneVoid', zone: seg.zone });
      }
    }
  }

  // --- hug zones: one-shot awards scored by closest approach (PRD §5.1) ---
  const speedNow = Math.hypot(c.vx, c.vz);
  let liveActive = false, liveClose = 0;
  const nearZ = rs.track.nearZones(c.x, c.z);
  const touched = new Set(nearZ);
  for (let zi = 0; zi < rs.zones.length; zi++) {
    const zs = rs.zones[zi];
    if (zs.state === Z_PAID || zs.state === Z_VOID) continue;
    const isNear = touched.has(zi);
    if (zs.state === Z_ARMED && !isNear) continue;
    const zone = rs.track.zones[zi];
    const { dist, atEnd } = polylineDist(c.x, c.z, zone.pts);
    const faceDist = Math.max(0, dist - t.carHalfWidth);
    if (zs.state === Z_ARMED) {
      if (!atEnd && faceDist < t.zoneBand) {
        zs.state = Z_TRACKING;
        zs.minDist = faceDist;
        zs.minSpeed = speedNow;
        rs.events.push({ type: 'zoneEnter', zone: zi });
      }
    }
    if (zs.state === Z_TRACKING) {
      if (faceDist < zs.minDist) {
        zs.minDist = faceDist;
        zs.minSpeed = speedNow;
      }
      // The pass ends when the car exits the zone's length (PRD open Q3) —
      // weaving sideways doesn't end it; drifting far away eventually does.
      if (atEnd || dist > t.zoneBand * 3.5 || !isNear) {
        zs.state = Z_PAID;
        // apex zones pay more than entry/exit approach zones (zone.mult)
        const award = zoneAward(zs.minDist, zs.minSpeed) * (zone.mult || 1);
        rs.ers = Math.min(t.ersCap, rs.ers + award);
        rs.events.push({ type: 'zoneAward', zone: zi, award, rating: ratingFor(zs.minDist), minDist: zs.minDist });
      } else if (faceDist < t.zoneBand) {
        liveActive = true;
        liveClose = Math.max(liveClose, 1 - faceDist / t.zoneBand);
      }
    }
  }
  rs.zoneLive.active = liveActive;
  rs.zoneLive.closeness = liveClose;

  // --- checkpoints (set semantics: each counted once, finish needs all — PRD §7) ---
  for (let ci = 0; ci < rs.track.cps.length; ci++) {
    if (rs.cpHit[ci]) continue;
    const trig = rs.track.cps[ci];
    const cp = closestOnSeg(c.x, c.z, trig.a, trig.b);
    if (Math.hypot(c.x - cp.x, c.z - cp.z) < 1.8) {
      rs.cpHit[ci] = true;
      rs.cpCount++;
      rs.splits.push(rs.tick);
      if (trig.spawn) takeSnapshot(rs, trig.spawn);
      rs.events.push({ type: 'checkpoint', index: rs.cpCount, total: rs.track.cps.length, ticks: rs.tick });
    }
  }

  // --- finish ---
  if (rs.cpCount === rs.track.cps.length) {
    for (const fin of rs.track.finishes) {
      const cp = closestOnSeg(c.x, c.z, fin.a, fin.b);
      if (Math.hypot(c.x - cp.x, c.z - cp.z) < 1.8) {
        rs.phase = 'finished';
        rs.finished = true;
        rs.finalTicks = rs.tick;
        rs.events.push({ type: 'finish', ticks: rs.tick });
        break;
      }
    }
  }

  // --- derived state for render/HUD + ghost recording ---
  c.vF = vF; c.vL = vL;
  c.speed = speedNow;
  if (rs.tick % 2 === 0 && rs.ghost.length < 3 * 30000) { // cap ~10 min
    rs.ghost.push(Math.round(c.x * 100), Math.round(c.z * 100), Math.round(c.h * 1000));
  }
}

export function ticksToMs(ticks) { return ticks * 10; }

export function fmtTime(ms) {
  if (ms == null || !isFinite(ms)) return '--:--.---';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = Math.floor(ms % 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(r).padStart(3, '0')}`;
}

export function medalFor(ms, map) {
  if (!map.authorTime) return null;
  if (ms <= map.authorTime) return 'author';
  if (ms <= map.authorTime * 1.06) return 'gold';
  if (ms <= map.authorTime * 1.20) return 'silver';
  if (ms <= map.authorTime * 1.50) return 'bronze';
  return null;
}
