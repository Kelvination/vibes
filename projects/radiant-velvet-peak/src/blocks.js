// WallRush — block catalog + track compiler (PRD §6).
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

function straightGeo({ surface = 'asphalt', trigger = null, spawn = false, hug = false } = {}) {
  return (p) => {
    const walls = [];
    const zones = [];
    const L = { a: { x: MARGIN, z: 0 }, b: { x: MARGIN, z: S } };
    const R = { a: { x: S - MARGIN, z: 0 }, b: { x: S - MARGIN, z: S } };
    const zn = p.zn || [1, 1, 1];
    if (hug && zn[0]) {
      zones.push({ slot: 0, pts: [L.a, L.b] });
      walls.push({ ...L, zone: zones.length - 1 });
    } else walls.push({ ...L, zone: -1 });
    if (hug && zn[1]) {
      zones.push({ slot: 1, pts: [R.a, R.b] });
      walls.push({ ...R, zone: zones.length - 1 });
    } else walls.push({ ...R, zone: -1 });
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
// Built-in hug zones on the OUTER wall: entry / apex / exit (PRD §5.4).
const ZONE_RANGES = [[0.05, 0.30], [0.37, 0.63], [0.70, 0.95]];

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
    if (rIn > 0.5) walls.push(...polyToWalls(arcPts(cx, cz, rIn, A0, A1, nSeg), -1));
    const zn = p.zn || [1, 1, 1];
    let t = 0;
    for (let s = 0; s < 3; s++) {
      const [z0, z1] = ZONE_RANGES[s];
      walls.push(...polyToWalls(arcPts(cx, cz, rOut, ang(t), ang(z0), 2), -1));
      const zonePts = arcPts(cx, cz, rOut, ang(z0), ang(z1), 3 * k);
      if (zn[s]) {
        zones.push({ slot: s, pts: zonePts });
        walls.push(...polyToWalls(zonePts, zones.length - 1));
      } else {
        walls.push(...polyToWalls(zonePts, -1));
      }
      t = z1;
    }
    walls.push(...polyToWalls(arcPts(cx, cz, rOut, ang(t), A1, 2), -1));
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
  curve1:     { id: 'curve1',     name: 'Curve 1',         cat: 'Road',    W: 1, H: 1, geo: curveGeo(1), surf: curveSurf(1, 'asphalt'), conn: connCurve(1), zoneSlots: ['Entry', 'Apex', 'Exit'] },
  curve2:     { id: 'curve2',     name: 'Curve 2',         cat: 'Road',    W: 2, H: 2, geo: curveGeo(2), surf: curveSurf(2, 'asphalt'), conn: connCurve(2), zoneSlots: ['Entry', 'Apex', 'Exit'] },
  dirt:       { id: 'dirt',       name: 'Dirt Road',       cat: 'Dirt',    W: 1, H: 1, geo: straightGeo({ surface: 'dirt' }), surf: roadSurf('dirt'), conn: CONN_STRAIGHT, dirt: true },
  dirt_curve: { id: 'dirt_curve', name: 'Dirt Curve',      cat: 'Dirt',    W: 1, H: 1, geo: curveGeo(1), surf: curveSurf(1, 'dirt'), conn: connCurve(1), zoneSlots: ['Entry', 'Apex', 'Exit'], dirt: true },
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

export function compile(placements) {
  const track = {
    walls: [], zones: [], cps: [], finishes: [], start: null,
    wallHash: new Map(), zoneHash: new Map(),
    cellMap: new Map(), placements, line: [],
    error: null,
  };

  for (let pi = 0; pi < placements.length; pi++) {
    const p = placements[pi];
    const def = BLOCKS[p.id];
    if (!def) { track.error = `Unknown block: ${p.id}`; continue; }
    const r = p.rot & 3;
    const w = def.W * S, h = def.H * S;
    const ax = p.x * S, az = p.z * S;
    const tw = (pt) => { const q = rotPt(pt, r, w, h); return { x: ax + q.x, z: az + q.z }; };

    for (let cx = 0; cx < def.W; cx++) for (let cz = 0; cz < def.H; cz++) {
      const c = rotCell({ x: cx, z: cz }, r, def.W, def.H);
      const key = `${p.x + c.x},${p.z + c.z}`;
      if (track.cellMap.has(key)) track.error = `Overlapping blocks at cell ${key}`;
      track.cellMap.set(key, pi);
    }

    const geo = def.geo(p);
    const zoneBase = track.zones.length;
    for (const z of geo.zones) {
      track.zones.push({ pts: z.pts.map(tw), slot: z.slot, block: pi });
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
