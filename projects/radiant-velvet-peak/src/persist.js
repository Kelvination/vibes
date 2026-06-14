// Wall Hugger — localStorage persistence + map export/import codecs (PRD §6.3).

// keys keep the original "wallrush" prefix so existing saves survive the rename
const SETTINGS_KEY = 'wallrush.settings';
const MAPS_KEY = 'wallrush.maps';
const REC_PREFIX = 'wallrush.rec.';

export function loadSettings() {
  try {
    return { audio: true, ghost: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch { return { audio: true, ghost: true }; }
}
export function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

// one-shot UI flags (e.g. "has the player seen the void tip / coach card yet")
const FLAG_PREFIX = 'wallrush.flag.';
export function getFlag(name) { try { return localStorage.getItem(FLAG_PREFIX + name) === '1'; } catch { return false; } }
export function setFlag(name) { try { localStorage.setItem(FLAG_PREFIX + name, '1'); } catch { /* ignore */ } }

export function listCustomMaps() {
  try { return JSON.parse(localStorage.getItem(MAPS_KEY) || '[]'); } catch { return []; }
}
export function saveCustomMap(map) {
  const maps = listCustomMaps();
  const i = maps.findIndex((m) => m.key === map.key);
  if (i >= 0) maps[i] = map; else maps.push(map);
  localStorage.setItem(MAPS_KEY, JSON.stringify(maps));
}
export function deleteCustomMap(key) {
  localStorage.setItem(MAPS_KEY, JSON.stringify(listCustomMaps().filter((m) => m.key !== key)));
  localStorage.removeItem(REC_PREFIX + key);
}

export function getRecord(mapKey) {
  try { return JSON.parse(localStorage.getItem(REC_PREFIX + mapKey) || 'null'); } catch { return null; }
}
export function setRecord(mapKey, rec) {
  try { localStorage.setItem(REC_PREFIX + mapKey, JSON.stringify(rec)); }
  catch { // ghost can be large; retry without it
    try { localStorage.setItem(REC_PREFIX + mapKey, JSON.stringify({ ...rec, ghost: null })); } catch { /* full */ }
  }
}

// ---- shareable map strings: WR1.<base64(gzip(json))>, fallback WR0.<base64(json)> ----

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function exportMapString(map) {
  const payload = JSON.stringify({
    name: map.name, authorTime: map.authorTime || null, placements: map.placements,
  });
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return 'WR1.' + bytesToB64(buf);
  }
  return 'WR0.' + bytesToB64(new TextEncoder().encode(payload));
}

export async function importMapString(str) {
  str = str.trim();
  let json;
  if (str.startsWith('WR1.')) {
    const stream = new Blob([b64ToBytes(str.slice(4))]).stream().pipeThrough(new DecompressionStream('gzip'));
    json = await new Response(stream).text();
  } else if (str.startsWith('WR0.')) {
    json = new TextDecoder().decode(b64ToBytes(str.slice(4)));
  } else {
    json = str; // allow raw .wallrush.json contents
  }
  const data = JSON.parse(json);
  if (!Array.isArray(data.placements)) throw new Error('Not a Wall Hugger map');
  return {
    key: 'custom:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: String(data.name || 'Imported map').slice(0, 40),
    authorTime: typeof data.authorTime === 'number' ? data.authorTime : null,
    placements: data.placements.map((p) => ({
      id: String(p.id), x: p.x | 0, z: p.z | 0, rot: p.rot & 3,
      ...(p.zn ? { zn: p.zn.map((v) => (v ? 1 : 0)) } : {}),
    })),
  };
}

export function downloadMapFile(map, str) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([str], { type: 'text/plain' }));
  a.download = `${(map.name || 'map').replace(/[^\w-]+/g, '_')}.wallrush.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}
