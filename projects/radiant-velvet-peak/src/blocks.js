// Wall Hugger — block catalog + track compiler (PRD §6).
// Pure JS, no DOM/THREE: also runs headless in Node for map validation.

export const S = 16;        // cell size (m)
export const MARGIN = 2;    // wall inset from cell edge
export const GRID = 48;     // grid cells per side
export const ROAD_HALF = (S - 2 * MARGIN) / 2;

export const DIRV = [
  { x: 0, z: 1 },  // 0: +Z (north)
  { x: 1, z: 0 },  // 1: +X (east)
  { x: 0, z: -1 }, // 2: -Z (south)
  { x: -1, z: 0 }, // 3: -X (west)
];

// ---- rotation helpers (r * 90° such that local +Z maps to DIRV[r]) ----

export function rotPt(p, r, w, h) { // w,h: local footprint size in meters
  switch (r & 3) {
    case 0: return { x: p.x, z: p.z };
    case 1: return { x: p.z, z: w - p.x };
    case 2: return { x: w - p.x, z: h - p.z };
    default: return { x: h - p.z, z: p.x };
  }
}

export function invRotPt(q, r, w, h) {
  switch (r & 3) {
    case 0: return { x: q.x, z: q.z };
    case 1: return { x: w - q.z, z: q.x };
    case 2: return { x: w - q.x, z: h - q.z };
    default: return { x: q.z, z: h - q.x };
  }
}

export function rotCell(c, r, W, H) { // cell coords within W×H footprint
  switch (r & 3) {
    case 0: return { x: c.x, z: c.z };
    case 1: return { x: c.z, z: W - 1 - c.x };
    case 2: return { x: W - 1 - c.x, z: H - 1 - c.z };
    default: return { x: H - 1 - c.z, z: c.x };
  }
}

export function placedDims(r, W, H) { return (r & 1) ? [H, W] : [W, H]; }

// ---- geometry helpers ----

function arcPts(cx, cz, rad, a0, a1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push({ x: cx + rad * Math.cos(a), z: cz + rad * Math.sin(a) });
  }
  return pts;
}

function polyToWalls(pts, zone) {
  const walls = [];
  for (let i = 0; i < pts.length - 1; i++) {
    walls.push({ a: pts[i], b: pts[i + 1], zone });
  }
  return walls;
}

// ---- block geometry builders ----

// Racing-line zone weights: the apex is the main zone; entry/exit approach
// zones (injected onto flanking blocks by the compiler) pay less each.
const APEX_MULT = 1.5;
const APPROACH_MULT = 0.7;
const APPROACH_FRAC = 0.75; // fraction of a flanking block's wall covered

// hints: [{ side: 'L'|'R', z0, z1, mult }] — zone intervals injected onto a
// straight's side walls by planRacingLine() for corners it flanks.
function straightGeo({ surface = 'asphalt', trigger = null, spawn = false, hug = false } = {}) {
  return (p, hints = []) => {
    const walls = [];
    const zones = [];
    const zn = p.zn || [1, 1, 1];
    const sideX = { L: MARGIN, R: S - MARGIN };
    ['L', 'R'].forEach((side, si) => {
      const x = sideX[side];
      const ivs = [];
      if (hug && zn[si]) ivs.push({ z0: 0, z1: S, mult: 1 });
      else for (const hg of hints) if (hg.side === side) ivs.push({ z0: hg.z0, z1: hg.z1, mult: hg.mult });
      ivs.sort((a, b) => a.z0 - b.z0);
      let z = 0;
      for (const iv of ivs) {
        if (iv.z0 > z) walls.push({ a: { x, z }, b: { x, z: iv.z0 }, zone: -1 });
        const pts = [{ x, z: iv.z0 }, { x, z: iv.z1 }];
        zones.push({ slot: si, pts, mult: iv.mult });
        walls.push({ a: pts[0], b: pts[1], zone: zones.length - 1 });
        z = iv.z1;
      }
      if (z < S) walls.push({ a: { x, z }, b: { x, z: S }, zone: -1 });
    });
    return {
      walls, zones,
      trigger: trigger ? { kind: trigger, a: { x: MARGIN, z: S / 2 }, b: { x: S - MARGIN, z: S / 2 } } : null,
      spawn: spawn ? { x: S / 2, z: S / 2, dir: 0 } : null,
      line: [{ x: S / 2, z: 0 }, { x: S / 2, z: S }],
    };
  };
}

// Quarter-turn curve, radius k cells. Local: enters at z=0 edge moving +Z,
// exits at x=k*S edge moving +X. Arc center at (k*S, 0).
// Hug zones follow the racing line (outside-inside-outside): the APEX zone —
// the main one — sits mid-arc on the INNER wall; entry/exit zones live on the
// outer walls of the flanking blocks (injected by planRacingLine in compile).
const APEX_RANGE = [0.30, 0.70];

function curveGeo(k) {
  return (p) => {
    const cx = k * S, cz = 0;
    const rIn = (k - 1) * S + MARGIN;
    const rOut = k * S - MARGIN;
    const A0 = Math.PI, A1 = Math.PI / 2; // entry angle -> exit angle
    const ang = (t) => A0 + (A1 - A0) * t;
    const nSeg = 7 * k;
    const walls = [];
    const zones = [];
    const zn = p.zn || [1, 1, 1];
    // outer wall: plain — the racing line cuts away from it mid-corner
    walls.push(...polyToWalls(arcPts(cx, cz, rOut, A0, A1, nSeg), -1));
    // inner wall: the apex hug zone, centered on the corner
    if (rIn > 0.5) {
      if (zn[1]) {
        const [t0, t1] = APEX_RANGE;
        walls.push(...polyToWalls(arcPts(cx, cz, rIn, A0, ang(t0), 2 * k), -1));
        const apexPts = arcPts(cx, cz, rIn, ang(t0), ang(t1), 3 * k);
        zones.push({ slot: 1, pts: apexPts, mult: APEX_MULT });
        walls.push(...polyToWalls(apexPts, zones.length - 1));
        walls.push(...polyToWalls(arcPts(cx, cz, rIn, ang(t1), A1, 2 * k), -1));
      } else {
        walls.push(...polyToWalls(arcPts(cx, cz, rIn, A0, A1, nSeg), -1));
      }
    }
    return {
      walls, zones, trigger: null, spawn: null,
      line: arcPts(cx, cz, (rIn + rOut) / 2, A0, A1, 8 * k),
    };
  };
}

function curveSurf(k, surface) {
  return (x, z) => {
    const dx = x - k * S, dz = z;
    const rad = Math.hypot(dx, dz);
    const rIn = (k - 1) * S + MARGIN, rOut = k * S - MARGIN;
    if (rad >= rIn - 0.5 && rad <= rOut + 0.5 && dx <= 0.5 && dz >= -0.5) return surface;
    return 'grass';
  };
}

function wallGeo(hug) {
  return () => {
    const a = { x: S / 2, z: 1 }, b = { x: S / 2, z: S - 1 };
    if (!hug) return { walls: [{ a, b, zone: -1 }], zones: [], trigger: null, spawn: null, line: null };
    return {
      walls: [{ a, b, zone: 0 }],
      zones: [{ slot: 0, pts: [a, b] }],
      trigger: null, spawn: null, line: null,
    };
  };
}

const roadSurf = (surface) => (x) => (x >= MARGIN && x <= S - MARGIN) ? surface : 'grass';
const boostSurf = (x, z) => {
  if (x < MARGIN || x > S - MARGIN) return 'grass';
  return (z > S * 0.2 && z < S * 0.8) ? 'boost' : 'asphalt';
};

const CONN_STRAIGHT = { fwd: { inCell: { x: 0, z: 0 }, inDir: 0, outCell: { x: 0, z: 0 }, outDir: 0 } };
const connCurve = (k) => ({
  fwd: { inCell: { x: 0, z: 0 }, inDir: 0, outCell: { x: k - 1, z: k - 1 }, outDir: 1 },
  rev: { inCell: { x: k - 1, z: k - 1 }, inDir: 3, outCell: { x: 0, z: 0 }, outDir: 2 },
});

// ---- catalog ----

export const BLOCKS = {
  road:       { id: 'road',       name: 'Road',            cat: 'Road',    W: 1, H: 1, geo: straightGeo(), surf: roadSurf('asphalt'), conn: CONN_STRAIGHT },
  road_hug:   { id: 'road_hug',   name: 'Hug Road',        cat: 'Road',    W: 1, H: 1, geo: straightGeo({ hug: true }), surf: roadSurf('asphalt'), conn: CONN_STRAIGHT, zoneSlots: ['Left', 'Right'] },
  curve1:     { id: 'curve1',     name: 'Curve 1',         cat: 'Road',    W: 1, H: 1, geo: curveGeo(1), surf: curveSurf(1, 'asphalt'), conn: connCurve(1), zoneSlots: ['Entry', 'Apex', 'Exit'], curveK: 1 },
  curve2:     { id: 'curve2',     name: 'Curve 2',         cat: 'Road',    W: 2, H: 2, geo: curveGeo(2), surf: curveSurf(2, 'asphalt'), conn: connCurve(2), zoneSlots: ['Entry', 'Apex', 'Exit'], curveK: 2 },
  dirt:       { id: 'dirt',       name: 'Dirt Road',       cat: 'Dirt',    W: 1, H: 1, geo: straightGeo({ surface: 'dirt' }), surf: roadSurf('dirt'), conn: CONN_STRAIGHT, dirt: true },
  dirt_curve: { id: 'dirt_curve', name: 'Dirt Curve',      cat: 'Dirt',    W: 1, H: 1, geo: curveGeo(1), surf: curveSurf(1, 'dirt'), conn: connCurve(1), zoneSlots: ['Entry', 'Apex', 'Exit'], curveK: 1, dirt: true },
  start:      { id: 'start',      name: 'Start',           cat: 'Special', W: 1, H: 1, geo: straightGeo({ spawn: true }), surf: roadSurf('asphalt'), conn: CONN_STRAIGHT },
  checkpoint: { id: 'checkpoint', name: 'Checkpoint',      cat: 'Special', W: 1, H: 1, geo: straightGeo({ trigger: 'cp', spawn: true }), surf: roadSurf('asphalt'), conn: CONN_STRAIGHT },
  finish:     { id: 'finish',     name: 'Finish',          cat: 'Special', W: 1, H: 1, geo: straightGeo({ trigger: 'finish' }), surf: roadSurf('asphalt'), conn: CONN_STRAIGHT },
  booster:    { id: 'booster',    name: 'Booster',         cat: 'Special', W: 1, H: 1, geo: straightGeo(), surf: boostSurf, conn: CONN_STRAIGHT },
  wall:       { id: 'wall',       name: 'Wall',            cat: 'Walls',   W: 1, H: 1, geo: wallGeo(false), surf: () => 'grass' },
  hugwall:    { id: 'hugwall',    name: 'Hug-Zone Wall',   cat: 'Walls',   W: 1, H: 1, geo: wallGeo(true), surf: () => 'grass', zoneSlots: ['Face'] },
};

export const CATEGORIES = ['Road', 'Dirt', 'Special', 'Walls'];

// ---- track compiler ----

const HASH = S; // spatial hash bucket size

function hashKey(x, z) { return `${Math.floor(x / HASH)},${Math.floor(z / HASH)}`; }

function insertSeg(map, idx, a, b) {
  const x0 = Math.floor((Math.min(a.x, b.x) - 4) / HASH), x1 = Math.floor((Math.max(a.x, b.x) + 4) / HASH);
  const z0 = Math.floor((Math.min(a.z, b.z) - 4) / HASH), z1 = Math.floor((Math.max(a.z, b.z) + 4) / HASH);
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
    const k = `${i},${j}`;
    if (!map.has(k)) map.set(k, []);
    const arr = map.get(k);
    if (arr[arr.length - 1] !== idx) arr.push(idx);
  }
}

// Blocks that may receive injected entry/exit approach zones when they flank
// a corner. road_hug is excluded — it already carries its own full-wall zones.
const APPROACH_BLOCKS = new Set(['road', 'start', 'checkpoint', 'finish', 'booster', 'dirt']);

function quadBez(a, c, b, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, z: u * u * a.z + 2 * u * t * c.z + t * t * b.z });
  }
  return pts;
}

// Racing-line planner: for every corner, place the entry/exit hug zones on the
// OUTSIDE walls of the blocks before and after the turn, so the rewarded line
// is outside -> inside (apex) -> outside. Fills track.corners (audit: does each
// corner have its full zone set?) and track.guides (ideal-line preview for the
// editor). Returns a Map of placement index -> wall-zone hints for straightGeo.
function planRacingLine(placements, track) {
  const hints = new Map();
  for (let pi = 0; pi < placements.length; pi++) {
    const p = placements[pi];
    const def = BLOCKS[p.id];
    if (!def?.curveK) continue;
    const k = def.curveK;
    const r = p.rot & 3, w = def.W * S, h = def.H * S;
    const zn = p.zn || [1, 1, 1];
    const tw = (pt) => { const q = rotPt(pt, r, w, h); return { x: p.x * S + q.x, z: p.z * S + q.z }; };

    // outer-wall point on each connecting edge + the grid cell beyond it
    const ends = [
      { slot: 0, pt: { x: MARGIN, z: 0 }, cell: { x: 0, z: -1 } },              // entry edge
      { slot: 2, pt: { x: k * S, z: k * S - MARGIN }, cell: { x: k, z: k - 1 } }, // exit edge
    ];
    const landed = [false, false];
    ends.forEach((end, ei) => {
      if (!zn[end.slot]) return;
      const c = rotCell(end.cell, r, def.W, def.H);
      const ni = track.cellMap.get(`${p.x + c.x},${p.z + c.z}`);
      if (ni === undefined) return;
      const np = placements[ni];
      if (!APPROACH_BLOCKS.has(np.id)) return;
      // locate the shared outer-wall point in the neighbor's local frame
      const wpt = tw(end.pt);
      const q = invRotPt({ x: wpt.x - np.x * S, z: wpt.z - np.z * S }, np.rot & 3, S, S);
      const side = Math.abs(q.x - MARGIN) < 0.5 ? 'L' : Math.abs(q.x - (S - MARGIN)) < 0.5 ? 'R' : null;
      const atFar = q.z > S - 0.5 ? 1 : q.z < 0.5 ? 0 : null;
      if (side === null || atFar === null) return; // neighbor road not aligned with this corner
      const len = S * APPROACH_FRAC;
      let z0 = atFar ? S - len : 0, z1 = atFar ? S : len;
      const list = hints.get(ni) || [];
      // back-to-back corners share a straight: trim so zones never overlap
      for (const o of list) {
        if (o.side !== side) continue;
        if (atFar) z0 = Math.max(z0, o.z1); else z1 = Math.min(z1, o.z0);
      }
      if (z1 - z0 < 2) return;
      list.push({ side, z0, z1, mult: APPROACH_MULT });
      hints.set(ni, list);
      landed[ei] = true;
    });

    track.corners.push({ block: pi, entry: landed[0], apex: !!(zn[1] && (k - 1) * S + MARGIN > 0.5), exit: landed[1] });

    // ideal-line guide (outside -> apex -> outside) for the editor preview
    const off = 1.6; // car-center clearance from the wall face
    const Aedge = { x: MARGIN + off, z: 0 };
    const Bedge = { x: k * S, z: k * S - MARGIN - off };
    const apexR = (k - 1) * S + MARGIN + off;
    const P = { x: k * S - apexR * Math.SQRT1_2, z: apexR * Math.SQRT1_2 };
    const C = { x: 2 * P.x - (Aedge.x + Bedge.x) / 2, z: 2 * P.z - (Aedge.z + Bedge.z) / 2 };
    const lead = S * APPROACH_FRAC;
    const pts = [];
    if (landed[0]) pts.push({ x: Aedge.x, z: -lead });
    pts.push(...quadBez(Aedge, C, Bedge, 14));
    if (landed[1]) pts.push({ x: Bedge.x + lead, z: Bedge.z });
    track.guides.push(pts.map(tw));
  }
  return hints;
}

export function compile(placements) {
  const track = {
    walls: [], zones: [], cps: [], finishes: [], start: null,
    wallHash: new Map(), zoneHash: new Map(),
    cellMap: new Map(), placements, line: [],
    guides: [], corners: [],
    error: null,
  };

  // pass 1: cell occupancy (needed for neighbor lookups in pass 2)
  for (let pi = 0; pi < placements.length; pi++) {
    const p = placements[pi];
    const def = BLOCKS[p.id];
    if (!def) { track.error = `Unknown block: ${p.id}`; continue; }
    for (let cx = 0; cx < def.W; cx++) for (let cz = 0; cz < def.H; cz++) {
      const c = rotCell({ x: cx, z: cz }, p.rot & 3, def.W, def.H);
      const key = `${p.x + c.x},${p.z + c.z}`;
      if (track.cellMap.has(key)) track.error = `Overlapping blocks at cell ${key}`;
      track.cellMap.set(key, pi);
    }
  }

  // pass 2: derive entry/exit approach zones + ideal-line guides from corners
  const lineHints = planRacingLine(placements, track);

  // pass 3: geometry
  for (let pi = 0; pi < placements.length; pi++) {
    const p = placements[pi];
    const def = BLOCKS[p.id];
    if (!def) continue;
    const r = p.rot & 3;
    const w = def.W * S, h = def.H * S;
    const ax = p.x * S, az = p.z * S;
    const tw = (pt) => { const q = rotPt(pt, r, w, h); return { x: ax + q.x, z: az + q.z }; };

    const geo = def.geo(p, lineHints.get(pi) || []);
    const zoneBase = track.zones.length;
    for (const z of geo.zones) {
      track.zones.push({ pts: z.pts.map(tw), slot: z.slot, block: pi, mult: z.mult || 1 });
    }
    for (const wseg of geo.walls) {
      const seg = { a: tw(wseg.a), b: tw(wseg.b), zone: wseg.zone >= 0 ? zoneBase + wseg.zone : -1 };
      const idx = track.walls.length;
      track.walls.push(seg);
      insertSeg(track.wallHash, idx, seg.a, seg.b);
    }
    for (let zi = zoneBase; zi < track.zones.length; zi++) {
      const z = track.zones[zi];
      for (let i = 0; i < z.pts.length - 1; i++) insertSeg(track.zoneHash, zi, z.pts[i], z.pts[i + 1]);
    }
    if (geo.trigger) {
      const trig = { kind: geo.trigger.kind, a: tw(geo.trigger.a), b: tw(geo.trigger.b) };
      if (geo.trigger.kind === 'finish') track.finishes.push(trig);
      else track.cps.push({ ...trig, spawn: geo.spawn ? { ...tw(geo.spawn), dir: (geo.spawn.dir + r) & 3 } : null });
    }
    if (geo.spawn && p.id === 'start') {
      track.start = { ...tw(geo.spawn), dir: (geo.spawn.dir + r) & 3 };
    }
    if (geo.line) track.line.push(...geo.line.map(tw));
  }

  if (!track.start) track.error = track.error || 'Map needs a Start block';
  if (track.finishes.length === 0) track.error = track.error || 'Map needs a Finish block';

  track.surfaceAt = (x, z) => {
    const key = `${Math.floor(x / S)},${Math.floor(z / S)}`;
    const pi = track.cellMap.get(key);
    if (pi === undefined) return 'grass';
    const p = placements[pi];
    const def = BLOCKS[p.id];
    const q = invRotPt({ x: x - p.x * S, z: z - p.z * S }, p.rot & 3, def.W * S, def.H * S);
    return def.surf(q.x, q.z);
  };
  track.nearWalls = (x, z) => track.wallHash.get(hashKey(x, z)) || [];
  track.nearZones = (x, z) => track.zoneHash.get(hashKey(x, z)) || [];
  return track;
}

export function validate(placements) {
  const starts = placements.filter((p) => p.id === 'start').length;
  const finishes = placements.filter((p) => p.id === 'finish').length;
  const errs = [];
  if (starts !== 1) errs.push(`Map must have exactly one Start (has ${starts})`);
  if (finishes < 1) errs.push('Map must have at least one Finish');
  return errs;
}

// ---- PathBuilder: authoring helper that walks the grid (used by campaign maps) ----

export class PathBuilder {
  constructor(x, z, dir) {
    this.head = { x, z };
    this.dir = dir;
    this.list = [];
  }
  place(id, conn, opts = {}) {
    const def = BLOCKS[id];
    const c = conn === 'rev' ? def.conn.rev : def.conn.fwd;
    const r = (this.dir - c.inDir) & 3;
    const inPlaced = rotCell(c.inCell, r, def.W, def.H);
    const anchor = { x: this.head.x - inPlaced.x, z: this.head.z - inPlaced.z };
    this.list.push({ id, x: anchor.x, z: anchor.z, rot: r, ...opts });
    const outPlaced = rotCell(c.outCell, r, def.W, def.H);
    const outDir = (c.outDir + r) & 3;
    this.head = {
      x: anchor.x + outPlaced.x + DIRV[outDir].x,
      z: anchor.z + outPlaced.z + DIRV[outDir].z,
    };
    this.dir = outDir;
    return this;
  }
  s(n = 1, id = 'road', opts) { for (let i = 0; i < n; i++) this.place(id, 'fwd', opts); return this; }
  R(k = 1, opts) { return this.place(k === 2 ? 'curve2' : 'curve1', 'fwd', opts); }
  L(k = 1, opts) { return this.place(k === 2 ? 'curve2' : 'curve1', 'rev', opts); }
  dR(opts) { return this.place('dirt_curve', 'fwd', opts); }
  dL(opts) { return this.place('dirt_curve', 'rev', opts); }
  start() { return this.place('start', 'fwd'); }
  cp() { return this.place('checkpoint', 'fwd'); }
  finish() { return this.place('finish', 'fwd'); }
  boost() { return this.place('booster', 'fwd'); }
  hug(opts) { return this.place('road_hug', 'fwd', opts); }
  dirt(n = 1) { return this.s(n, 'dirt'); }
}
