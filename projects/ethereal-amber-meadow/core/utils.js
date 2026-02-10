/**
 * core/utils.js - Shared math utilities (noise, PRNG, interpolation).
 */

// Seeded PRNG (mulberry32)
export function seededRandom(seed) {
  let t = (seed + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// 3D hash
export function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function smoothstep(t) { return t * t * (3 - 2 * t); }
export function clampVal(v, mn, mx) { return Math.min(Math.max(v, mn), mx); }

export function valueNoise3D(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = smoothstep(x - ix), fy = smoothstep(y - iy), fz = smoothstep(z - iz);
  return lerp(
    lerp(
      lerp(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx),
      lerp(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
    lerp(
      lerp(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx),
      lerp(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}

export function fbmNoise3D(x, y, z, octaves, roughness) {
  let val = 0, amp = 1, freq = 1, maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    val += valueNoise3D(x * freq, y * freq, z * freq) * amp;
    maxVal += amp;
    amp *= roughness;
    freq *= 2;
  }
  return val / maxVal;
}

// Geometry data helpers
export function cloneGeo(geo) {
  return JSON.parse(JSON.stringify(geo));
}

export function geoToArray(geo) {
  if (!geo) return [];
  return Array.isArray(geo) ? geo : [geo];
}

export function mapGeo(geo, fn) {
  if (!geo) return null;
  if (Array.isArray(geo)) return geo.map(g => fn(cloneGeo(g)));
  return fn(cloneGeo(geo));
}

// Voronoi helper (used by both geo and shader texture nodes)
export function voronoi3D(sx, sy, sz, randomness, feature) {
  const ix = Math.floor(sx), iy = Math.floor(sy), iz = Math.floor(sz);
  let minDist = 999, minDist2 = 999;
  let closestPt = { x: 0, y: 0, z: 0 };

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cx = ix + dx, cy = iy + dy, cz = iz + dz;
        const px = cx + hash3(cx, cy, cz) * randomness;
        const py = cy + hash3(cx + 73, cy + 157, cz + 31) * randomness;
        const pz = cz + hash3(cx + 139, cy + 29, cz + 97) * randomness;
        const ddx = sx - px, ddy = sy - py, ddz = sz - pz;
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
        if (d < minDist) {
          minDist2 = minDist;
          minDist = d;
          closestPt = { x: px, y: py, z: pz };
        } else if (d < minDist2) {
          minDist2 = d;
        }
      }
    }
  }

  let dist;
  switch (feature) {
    case 'f1': dist = minDist; break;
    case 'f2': dist = minDist2; break;
    case 'smooth_f1': dist = minDist * 0.7 + minDist2 * 0.3; break;
    default: dist = minDist;
  }

  const col = {
    x: hash3(Math.floor(closestPt.x * 100), Math.floor(closestPt.y * 100), 0),
    y: hash3(Math.floor(closestPt.x * 100), 0, Math.floor(closestPt.z * 100)),
    z: hash3(0, Math.floor(closestPt.y * 100), Math.floor(closestPt.z * 100)),
  };
  return { dist, col };
}
