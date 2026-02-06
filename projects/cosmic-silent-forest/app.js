import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ╔══════════════════════════════════════════════════════╗
// ║                  TERRAIN STUDIO                      ║
// ╚══════════════════════════════════════════════════════╝

// ============ DOM REFERENCES ============
const $ = id => document.getElementById(id);
const container = $('canvas-container');
const loadingEl = $('loading');
const loadingText = $('loading-text');
const statusEl = $('status');
const generateBtn = $('generate');
const generateProcBtn = $('generate-proc');
const randomizeProcBtn = $('randomize-proc');

const latInput = $('lat');
const lngInput = $('lng');
const rangeInput = $('range');
const densityInput = $('density');
const exagInput = $('exaggeration');
const colorSchemeSelect = $('colorScheme');
const wireframeCheckbox = $('wireframe');
const flatShadingCheckbox = $('flatShading');
const apiSourceSelect = $('apiSource');
const analysisMode = $('analysis-mode');
const contourIntervalInput = $('contour-interval');
const showWaterCheckbox = $('show-water');
const showFogCheckbox = $('show-fog');
const waterLevelInput = $('water-level');
const sunAngleInput = $('sun-angle');
const sunHeightInput = $('sun-height');
const flySpeedInput = $('fly-speed');

const searchInput = $('search-input');
const searchBtn = $('search-btn');
const searchResults = $('search-results');

const procSeedInput = $('proc-seed');
const procSizeInput = $('proc-size');
const procOctavesInput = $('proc-octaves');
const procFreqInput = $('proc-freq');
const procLacInput = $('proc-lac');
const procPersInput = $('proc-pers');
const procTypeSelect = $('proc-type');

const hudCoords = $('hud-coords');
const hudElev = $('hud-elev');
const hudSlope = $('hud-slope');

const debugPanel = $('debug-panel');
const debugContent = $('debug-content');
const profilePanel = $('profile-panel');
const profileCanvas = $('profile-canvas');
const helpModal = $('help-modal');

// ============ LABEL SYNCS ============
const syncLabel = (input, spanId, transform) => {
  const span = $(spanId);
  if (!span) return;
  input.addEventListener('input', () => {
    span.textContent = transform ? transform(input.value) : input.value;
  });
};

syncLabel(rangeInput, 'range-val');
syncLabel(densityInput, 'density-val');
syncLabel(exagInput, 'exag-val');
syncLabel(waterLevelInput, 'water-val');
syncLabel(sunAngleInput, 'sun-val');
syncLabel(sunHeightInput, 'sun-height-val');
syncLabel(flySpeedInput, 'fly-speed-val');
syncLabel(contourIntervalInput, 'contour-val');
syncLabel(procSizeInput, 'proc-size-val');
syncLabel(procOctavesInput, 'proc-octaves-val');
syncLabel(procFreqInput, 'proc-freq-val');
syncLabel(procLacInput, 'proc-lac-val');
syncLabel(procPersInput, 'proc-pers-val');

procSeedInput.addEventListener('input', () => $('seed-val').textContent = procSeedInput.value);

// ============ DEBUG LOGGING ============
let debugLog = [];
function debugAppend(msg) {
  const ts = new Date().toLocaleTimeString();
  debugLog.push(`[${ts}] ${msg}`);
  debugContent.textContent = debugLog.join('\n');
  debugContent.scrollTop = debugContent.scrollHeight;
}
function showDebug() { debugPanel.classList.remove('hidden'); }

$('debug-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(debugLog.join('\n')).then(() => {
    $('debug-copy').textContent = 'Copied!';
    setTimeout(() => $('debug-copy').textContent = 'Copy', 1500);
  }).catch(() => {});
});
$('debug-close').addEventListener('click', () => debugPanel.classList.add('hidden'));

// ============ PANEL COLLAPSE ============
document.querySelectorAll('.panel-header').forEach(header => {
  header.addEventListener('click', () => {
    const panelId = 'panel-' + header.dataset.panel;
    const body = $(panelId);
    if (body) {
      body.classList.toggle('collapsed');
      header.classList.toggle('collapsed');
    }
  });
});

// ============ SOURCE TAB SWITCHING ============
document.querySelectorAll('.source-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const source = tab.dataset.source;
    $('source-realworld').classList.toggle('hidden', source !== 'realworld');
    $('source-procedural').classList.toggle('hidden', source !== 'procedural');
  });
});

// ============ THREE.JS SETUP ============
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(
  60, container.clientWidth / container.clientHeight, 0.1, 20000
);
camera.position.set(0, 300, 400);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true, // needed for screenshot
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 10;
controls.maxDistance = 5000;

// ============ LIGHTING ============
const ambientLight = new THREE.AmbientLight(0x404070, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
sunLight.position.set(200, 400, 200);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 2000;
sunLight.shadow.camera.left = -500;
sunLight.shadow.camera.right = 500;
sunLight.shadow.camera.top = 500;
sunLight.shadow.camera.bottom = -500;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x8888cc, 0.3);
fillLight.position.set(-200, 200, -100);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x362907, 0.3);
scene.add(hemiLight);

// ============ SKY ============
function createSky() {
  const skyGeo = new THREE.SphereGeometry(8000, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0a1628) },
      bottomColor: { value: new THREE.Color(0x1a2a4a) },
      offset: { value: 20 },
      exponent: { value: 0.4 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  return new THREE.Mesh(skyGeo, skyMat);
}

const sky = createSky();
scene.add(sky);

// ============ WATER ============
let waterMesh = null;
const WATER_SIZE = 600;

function createWater() {
  if (waterMesh) {
    scene.remove(waterMesh);
    waterMesh.geometry.dispose();
    waterMesh.material.dispose();
  }

  const geo = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, 80, 80);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      waterColor: { value: new THREE.Color(0x006994) },
      deepColor: { value: new THREE.Color(0x001a33) },
      opacity: { value: 0.82 },
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.x * 0.05 + time * 1.5) * 0.8
                   + sin(pos.z * 0.07 + time * 1.2) * 0.6
                   + sin((pos.x + pos.z) * 0.03 + time * 0.8) * 1.2;
        pos.y += wave;
        vWave = wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 waterColor;
      uniform vec3 deepColor;
      uniform float opacity;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        float depth = smoothstep(-2.0, 2.0, vWave);
        vec3 col = mix(deepColor, waterColor, depth);
        col += vec3(0.05, 0.1, 0.15) * (vWave + 1.0) * 0.3;
        // Specular shimmer
        float spec = pow(max(depth, 0.0), 8.0) * 0.3;
        col += vec3(spec);
        gl_FragColor = vec4(col, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.renderOrder = 1;
  scene.add(waterMesh);
  return waterMesh;
}

// ============ FOG ============
function updateFog(enabled) {
  if (enabled) {
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0006);
  } else {
    scene.fog = null;
  }
}

// ============ RESIZE ============
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// ============ STATE ============
let currentMesh = null;
let currentElevationData = null;
let currentDensity = 0;
let currentMinElev = 0;
let currentMaxElev = 1;
let currentLocations = null; // lat/lng for each point
let contourLines = null;
let profileMode = false;
let profilePoints = [];
let profileMarkers = [];
let flyThroughActive = false;
let flyThroughTime = 0;
let activeAbortController = null;

// Raycaster for hover/click
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ============ COLOR SCHEMES ============
const colorSchemes = {
  terrain(t) {
    if (t < 0.15) return new THREE.Color().lerpColors(new THREE.Color(0x1a5c1a), new THREE.Color(0x3d9b3d), t / 0.15);
    if (t < 0.4) return new THREE.Color().lerpColors(new THREE.Color(0x3d9b3d), new THREE.Color(0x7a8c3f), (t - 0.15) / 0.25);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0x7a8c3f), new THREE.Color(0x8B7355), (t - 0.4) / 0.2);
    if (t < 0.8) return new THREE.Color().lerpColors(new THREE.Color(0x8B7355), new THREE.Color(0x9a9a9a), (t - 0.6) / 0.2);
    return new THREE.Color().lerpColors(new THREE.Color(0x9a9a9a), new THREE.Color(0xffffff), (t - 0.8) / 0.2);
  },
  satellite(t) {
    if (t < 0.1) return new THREE.Color().lerpColors(new THREE.Color(0x2d4a1e), new THREE.Color(0x3e6b2a), t / 0.1);
    if (t < 0.3) return new THREE.Color().lerpColors(new THREE.Color(0x3e6b2a), new THREE.Color(0x6b8a3e), (t - 0.1) / 0.2);
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x6b8a3e), new THREE.Color(0x9e8b62), (t - 0.3) / 0.2);
    if (t < 0.7) return new THREE.Color().lerpColors(new THREE.Color(0x9e8b62), new THREE.Color(0x7a6e5c), (t - 0.5) / 0.2);
    if (t < 0.85) return new THREE.Color().lerpColors(new THREE.Color(0x7a6e5c), new THREE.Color(0xb0a89a), (t - 0.7) / 0.15);
    return new THREE.Color().lerpColors(new THREE.Color(0xb0a89a), new THREE.Color(0xf0ece6), (t - 0.85) / 0.15);
  },
  ocean(t) {
    if (t < 0.2) return new THREE.Color().lerpColors(new THREE.Color(0x000822), new THREE.Color(0x001a4d), t / 0.2);
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x001a4d), new THREE.Color(0x0066aa), (t - 0.2) / 0.3);
    if (t < 0.75) return new THREE.Color().lerpColors(new THREE.Color(0x0066aa), new THREE.Color(0x00bbcc), (t - 0.5) / 0.25);
    return new THREE.Color().lerpColors(new THREE.Color(0x00bbcc), new THREE.Color(0xe8ffff), (t - 0.75) / 0.25);
  },
  heat(t) {
    if (t < 0.25) return new THREE.Color().lerpColors(new THREE.Color(0x100010), new THREE.Color(0x880000), t / 0.25);
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x880000), new THREE.Color(0xdd4400), (t - 0.25) / 0.25);
    if (t < 0.75) return new THREE.Color().lerpColors(new THREE.Color(0xdd4400), new THREE.Color(0xffaa00), (t - 0.5) / 0.25);
    return new THREE.Color().lerpColors(new THREE.Color(0xffaa00), new THREE.Color(0xffffcc), (t - 0.75) / 0.25);
  },
  topographic(t) {
    // Classic topo map colors
    if (t < 0.1) return new THREE.Color(0x004d00);
    if (t < 0.2) return new THREE.Color(0x1a8c1a);
    if (t < 0.3) return new THREE.Color(0x66cc33);
    if (t < 0.4) return new THREE.Color(0xccdd44);
    if (t < 0.5) return new THREE.Color(0xeebb33);
    if (t < 0.6) return new THREE.Color(0xdd8833);
    if (t < 0.7) return new THREE.Color(0xcc6633);
    if (t < 0.8) return new THREE.Color(0x995533);
    if (t < 0.9) return new THREE.Color(0x886655);
    return new THREE.Color(0xffffff);
  },
  arctic(t) {
    if (t < 0.3) return new THREE.Color().lerpColors(new THREE.Color(0x1a2a3a), new THREE.Color(0x4a6a8a), t / 0.3);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0x4a6a8a), new THREE.Color(0x8ab4d4), (t - 0.3) / 0.3);
    if (t < 0.8) return new THREE.Color().lerpColors(new THREE.Color(0x8ab4d4), new THREE.Color(0xd4e8f4), (t - 0.6) / 0.2);
    return new THREE.Color().lerpColors(new THREE.Color(0xd4e8f4), new THREE.Color(0xffffff), (t - 0.8) / 0.2);
  },
  volcanic(t) {
    if (t < 0.2) return new THREE.Color().lerpColors(new THREE.Color(0x1a0a00), new THREE.Color(0x4a1a00), t / 0.2);
    if (t < 0.4) return new THREE.Color().lerpColors(new THREE.Color(0x4a1a00), new THREE.Color(0x882200), (t - 0.2) / 0.2);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0x882200), new THREE.Color(0xcc4400), (t - 0.4) / 0.2);
    if (t < 0.8) return new THREE.Color().lerpColors(new THREE.Color(0xcc4400), new THREE.Color(0xff6600), (t - 0.6) / 0.2);
    return new THREE.Color().lerpColors(new THREE.Color(0xff6600), new THREE.Color(0xffcc44), (t - 0.8) / 0.2);
  },
  neon(t) {
    if (t < 0.2) return new THREE.Color().lerpColors(new THREE.Color(0x0a001a), new THREE.Color(0x3300aa), t / 0.2);
    if (t < 0.4) return new THREE.Color().lerpColors(new THREE.Color(0x3300aa), new THREE.Color(0x00ccff), (t - 0.2) / 0.2);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0x00ccff), new THREE.Color(0x00ff88), (t - 0.4) / 0.2);
    if (t < 0.8) return new THREE.Color().lerpColors(new THREE.Color(0x00ff88), new THREE.Color(0xffff00), (t - 0.6) / 0.2);
    return new THREE.Color().lerpColors(new THREE.Color(0xffff00), new THREE.Color(0xff00ff), (t - 0.8) / 0.2);
  },
  sunset(t) {
    if (t < 0.2) return new THREE.Color().lerpColors(new THREE.Color(0x1a0a2e), new THREE.Color(0x4a1a5e), t / 0.2);
    if (t < 0.4) return new THREE.Color().lerpColors(new THREE.Color(0x4a1a5e), new THREE.Color(0xcc3366), (t - 0.2) / 0.2);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0xcc3366), new THREE.Color(0xff6633), (t - 0.4) / 0.2);
    if (t < 0.8) return new THREE.Color().lerpColors(new THREE.Color(0xff6633), new THREE.Color(0xffaa33), (t - 0.6) / 0.2);
    return new THREE.Color().lerpColors(new THREE.Color(0xffaa33), new THREE.Color(0xffeecc), (t - 0.8) / 0.2);
  },
  grayscale(t) {
    const v = Math.floor(t * 255);
    return new THREE.Color(`rgb(${v},${v},${v})`);
  }
};

// Color preview bar
function updateColorPreview() {
  const scheme = colorSchemeSelect.value;
  const fn = colorSchemes[scheme];
  const stops = [];
  for (let i = 0; i <= 10; i++) {
    const c = fn(i / 10);
    stops.push('#' + c.getHexString());
  }
  $('color-preview').style.background = `linear-gradient(90deg, ${stops.join(', ')})`;
}
updateColorPreview();
colorSchemeSelect.addEventListener('change', () => {
  updateColorPreview();
  if (currentMesh) recolor();
});

// ============ UTILITIES ============
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  if (signal) {
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  }
});

// ============ PERLIN NOISE (Improved) ============
class PerlinNoise {
  constructor(seed = 42) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    // Fisher-Yates shuffle with seed
    let s = seed;
    const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return a + t * (b - a); }

  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);

    const p = this.p;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    return this.lerp(
      this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u),
      this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u),
      v
    );
  }

  fbm(x, y, octaves, lacunarity, persistence) {
    let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return value / maxValue;
  }
}

// ============ PROCEDURAL TERRAIN GENERATION ============
function generateProceduralTerrain() {
  const seed = parseInt(procSeedInput.value) || 42;
  const size = parseInt(procSizeInput.value) || 100;
  const octaves = parseInt(procOctavesInput.value) || 6;
  const freq = parseFloat(procFreqInput.value) || 2.0;
  const lac = parseFloat(procLacInput.value) || 2.0;
  const pers = parseFloat(procPersInput.value) || 0.5;
  const type = procTypeSelect.value;

  const perlin = new PerlinNoise(seed);
  const elevations = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const nx = col / size * freq;
      const ny = row / size * freq;

      let h;
      switch (type) {
        case 'mountains':
          h = perlin.fbm(nx, ny, octaves, lac, pers);
          h = Math.pow(Math.abs(h), 0.8) * Math.sign(h); // sharper peaks
          h = (h + 1) * 0.5; // normalize to 0-1
          h *= 4000; // scale to meters
          break;

        case 'islands': {
          h = perlin.fbm(nx, ny, octaves, lac, pers);
          const cx = col / size - 0.5;
          const cy = row / size - 0.5;
          const dist = Math.sqrt(cx * cx + cy * cy) * 2;
          const mask = Math.max(0, 1 - dist * dist * 2);
          h = ((h + 1) * 0.5) * mask;
          h *= 2000;
          break;
        }
        case 'ridges':
          h = perlin.fbm(nx, ny, octaves, lac, pers);
          h = 1 - Math.abs(h); // ridge noise
          h = h * h; // sharpen ridges
          h *= 3500;
          break;

        case 'plateaus':
          h = perlin.fbm(nx, ny, octaves, lac, pers);
          h = (h + 1) * 0.5;
          h = Math.round(h * 5) / 5; // quantize to plateau levels
          h *= 3000;
          break;

        case 'canyons':
          h = perlin.fbm(nx, ny, octaves, lac, pers);
          h = (h + 1) * 0.5;
          // Create canyon cuts
          const canyon = perlin.fbm(nx * 0.5, ny * 0.5, 3, 2.0, 0.5);
          const canyonMask = Math.abs(canyon) < 0.15 ? 0.2 : 1.0;
          h *= canyonMask * 3000;
          break;

        default:
          h = ((perlin.fbm(nx, ny, octaves, lac, pers) + 1) * 0.5) * 3000;
      }

      elevations.push(h);
    }
  }

  currentLocations = null; // procedural has no real locations
  buildTerrain(elevations, size);
  updateStats();
  statusEl.textContent = `Procedural: ${type} | Seed ${seed} | ${size}x${size} grid`;
  debugAppend(`Procedural terrain generated: ${type}, seed=${seed}, ${size}x${size}`);
}

// ============ FETCH HELPERS ============
async function fetchWithRetry(url, opts, batchNum, totalBatches, apiName, signal, maxRetries = 6) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    signal?.throwIfAborted();
    let resp;
    try {
      resp = await fetch(url, { ...opts, signal });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') throw fetchErr;
      debugAppend(`[${apiName}] FETCH ERROR (batch ${batchNum}, attempt ${attempt + 1}): ${fetchErr.message}`);
      if (attempt === maxRetries) throw fetchErr;
      const wait = 2000 * (attempt + 1);
      debugAppend(`Retrying in ${wait / 1000}s...`);
      await sleep(wait, signal);
      continue;
    }
    if (resp.status === 429) {
      if (attempt === maxRetries) throw new Error(`429 after ${maxRetries + 1} attempts`);
      debugAppend(`[${apiName}] 429 rate limited (batch ${batchNum}, attempt ${attempt + 1}). Waiting 65s...`);
      for (let s = 65; s > 0; s--) {
        signal?.throwIfAborted();
        loadingText.textContent = `Rate limited. Resuming in ${s}s... (batch ${batchNum}/${totalBatches})`;
        await sleep(1000, signal);
      }
      continue;
    }
    return resp;
  }
}

// ============ ELEVATION API PROVIDERS ============
async function fetchOpenMeteo(locations, onProgress, signal) {
  const BATCH_SIZE = 100, DELAY = 4000;
  const results = [];
  const totalBatches = Math.ceil(locations.length / BATCH_SIZE);
  debugAppend(`[Open-Meteo] ${locations.length} points, ${totalBatches} batches`);

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    signal?.throwIfAborted();
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = locations.slice(i, i + BATCH_SIZE);
    const lats = batch.map(l => l.lat.toFixed(4)).join(',');
    const lngs = batch.map(l => l.lng.toFixed(4)).join(',');
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

    debugAppend(`[Open-Meteo] Batch ${batchNum}/${totalBatches}`);
    onProgress(batchNum, totalBatches);

    const resp = await fetchWithRetry(url, {}, batchNum, totalBatches, 'Open-Meteo', signal);
    const bodyText = await resp.text();
    if (!resp.ok) throw new Error(`Open-Meteo ${resp.status}: ${bodyText.substring(0, 200)}`);
    const data = JSON.parse(bodyText);
    if (!data.elevation) throw new Error('Open-Meteo returned no elevation data');
    results.push(...data.elevation);
    debugAppend(`[Open-Meteo] Batch ${batchNum} OK`);

    if (i + BATCH_SIZE < locations.length) await sleep(DELAY, signal);
  }
  return results;
}

async function fetchOpenTopoData(locations, onProgress, signal) {
  const BATCH_SIZE = 100, DELAY = 1100;
  const results = [];
  const totalBatches = Math.ceil(locations.length / BATCH_SIZE);
  debugAppend(`[OpenTopoData] ${locations.length} points, ${totalBatches} batches`);

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    signal?.throwIfAborted();
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = locations.slice(i, i + BATCH_SIZE);
    const locsParam = batch.map(l => `${l.lat.toFixed(4)},${l.lng.toFixed(4)}`).join('|');
    const url = `https://api.opentopodata.org/v1/srtm90m`;
    const formBody = new URLSearchParams();
    formBody.set('locations', locsParam);

    debugAppend(`[OpenTopoData] Batch ${batchNum}/${totalBatches}`);
    onProgress(batchNum, totalBatches);

    const resp = await fetchWithRetry(url, { method: 'POST', body: formBody }, batchNum, totalBatches, 'OpenTopoData', signal);
    const bodyText = await resp.text();
    if (!resp.ok) throw new Error(`OpenTopoData ${resp.status}: ${bodyText.substring(0, 200)}`);
    const data = JSON.parse(bodyText);
    if (data.status !== 'OK' || !data.results) throw new Error(`OpenTopoData bad status`);

    results.push(...data.results.map(r => r.elevation ?? 0));
    debugAppend(`[OpenTopoData] Batch ${batchNum} OK`);

    if (i + BATCH_SIZE < locations.length) await sleep(DELAY, signal);
  }
  return results;
}

async function fetchElevations(locations, signal) {
  debugAppend(`Total points: ${locations.length}`);
  const onProgress = (batch, total) => {
    loadingText.textContent = `Fetching elevations... batch ${batch}/${total}`;
  };

  const apiChoice = apiSourceSelect.value;
  const providers = [];
  if (apiChoice === 'opentopodata') providers.push({ name: 'OpenTopoData', fn: fetchOpenTopoData });
  else if (apiChoice === 'openmeteo') providers.push({ name: 'Open-Meteo', fn: fetchOpenMeteo });
  else {
    providers.push({ name: 'Open-Meteo', fn: fetchOpenMeteo });
    providers.push({ name: 'OpenTopoData', fn: fetchOpenTopoData });
  }

  for (let i = 0; i < providers.length; i++) {
    signal?.throwIfAborted();
    const { name, fn } = providers[i];
    try {
      debugAppend(`Trying ${name}...`);
      const results = await fn(locations, onProgress, signal);
      debugAppend(`${name} complete: ${results.length} points`);
      return results;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      debugAppend(`${name} failed: ${err.message}`);
      if (i < providers.length - 1) debugAppend('Falling back...');
    }
  }
  showDebug();
  throw new Error('All elevation APIs failed. See debug panel.');
}

// ============ GRID GENERATION ============
function generateGrid(lat, lng, rangeKm, density) {
  const locations = [];
  const latRange = rangeKm / 111;
  const lngRange = rangeKm / (111 * Math.cos(lat * Math.PI / 180));
  const latStep = (latRange * 2) / (density - 1);
  const lngStep = (lngRange * 2) / (density - 1);

  for (let row = 0; row < density; row++) {
    for (let col = 0; col < density; col++) {
      locations.push({
        lat: lat - latRange + row * latStep,
        lng: lng - lngRange + col * lngStep
      });
    }
  }
  return locations;
}

// ============ TERRAIN MESH BUILDING ============
function buildTerrain(elevations, density) {
  // Remove old mesh
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
    currentMesh = null;
  }
  removeContourLines();

  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const elevRange = maxElev - minElev || 1;

  currentMinElev = minElev;
  currentMaxElev = maxElev;
  currentElevationData = elevations;
  currentDensity = density;

  const exag = parseFloat(exagInput.value);
  const scheme = colorSchemeSelect.value;

  const size = 500;
  const geometry = new THREE.PlaneGeometry(size, size, density - 1, density - 1);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    const elev = elevations[i];
    const normalized = (elev - minElev) / elevRange;
    positions.setY(i, normalized * 100 * exag);

    const color = colorSchemes[scheme](normalized);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    wireframe: wireframeCheckbox.checked,
    side: THREE.DoubleSide,
    shininess: 15,
    flatShading: flatShadingCheckbox.checked,
  });

  currentMesh = new THREE.Mesh(geometry, material);
  currentMesh.castShadow = true;
  currentMesh.receiveShadow = true;
  scene.add(currentMesh);

  // Water
  updateWater();

  // Reset camera
  const center = new THREE.Vector3(0, (100 * exag) / 2, 0);
  controls.target.copy(center);
  camera.position.set(0, 200 * exag, 350);
  controls.update();

  // Apply analysis overlay if active
  applyAnalysisOverlay();
}

// ============ UPDATE HELPERS ============
function updateExaggeration() {
  if (!currentElevationData || !currentMesh) return;
  const exag = parseFloat(exagInput.value);
  const elevRange = currentMaxElev - currentMinElev || 1;
  const positions = currentMesh.geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const normalized = (currentElevationData[i] - currentMinElev) / elevRange;
    positions.setY(i, normalized * 100 * exag);
  }
  positions.needsUpdate = true;
  currentMesh.geometry.computeVertexNormals();
  updateWater();
}

function recolor() {
  if (!currentElevationData || !currentMesh) return;
  const mode = analysisMode.value;
  if (mode !== 'none') { applyAnalysisOverlay(); return; }

  const scheme = colorSchemeSelect.value;
  const elevRange = currentMaxElev - currentMinElev || 1;
  const colors = currentMesh.geometry.attributes.color;

  for (let i = 0; i < colors.count; i++) {
    const normalized = (currentElevationData[i] - currentMinElev) / elevRange;
    const color = colorSchemes[scheme](normalized);
    colors.setXYZ(i, color.r, color.g, color.b);
  }
  colors.needsUpdate = true;
}

// ============ SUN POSITION ============
function updateSunPosition() {
  const angle = parseFloat(sunAngleInput.value) * Math.PI / 180;
  const height = parseFloat(sunHeightInput.value) * Math.PI / 180;
  const dist = 600;
  sunLight.position.set(
    Math.cos(angle) * Math.cos(height) * dist,
    Math.sin(height) * dist,
    Math.sin(angle) * Math.cos(height) * dist
  );
}

sunAngleInput.addEventListener('input', updateSunPosition);
sunHeightInput.addEventListener('input', updateSunPosition);

// ============ WATER SYSTEM ============
function updateWater() {
  if (!showWaterCheckbox.checked || !currentElevationData) {
    if (waterMesh) { scene.remove(waterMesh); waterMesh.geometry.dispose(); waterMesh.material.dispose(); waterMesh = null; }
    return;
  }

  if (!waterMesh) createWater();

  const waterPct = parseInt(waterLevelInput.value) / 100;
  const exag = parseFloat(exagInput.value);
  const elevRange = currentMaxElev - currentMinElev || 1;
  const waterElev = waterPct * 100 * exag;
  waterMesh.position.y = waterElev;
}

showWaterCheckbox.addEventListener('change', updateWater);
waterLevelInput.addEventListener('input', updateWater);
showFogCheckbox.addEventListener('change', () => updateFog(showFogCheckbox.checked));

// ============ LIVE VISUAL UPDATES ============
exagInput.addEventListener('input', () => {
  if (currentMesh) updateExaggeration();
});
wireframeCheckbox.addEventListener('change', () => {
  if (currentMesh) currentMesh.material.wireframe = wireframeCheckbox.checked;
});
flatShadingCheckbox.addEventListener('change', () => {
  if (currentMesh) {
    currentMesh.material.flatShading = flatShadingCheckbox.checked;
    currentMesh.material.needsUpdate = true;
  }
});

// ============ ANALYSIS OVERLAYS ============
function computeSlopes() {
  if (!currentElevationData) return null;
  const d = currentDensity;
  const slopes = new Float32Array(d * d);
  const elevRange = currentMaxElev - currentMinElev || 1;

  for (let row = 0; row < d; row++) {
    for (let col = 0; col < d; col++) {
      const idx = row * d + col;
      const left = col > 0 ? currentElevationData[idx - 1] : currentElevationData[idx];
      const right = col < d - 1 ? currentElevationData[idx + 1] : currentElevationData[idx];
      const up = row > 0 ? currentElevationData[idx - d] : currentElevationData[idx];
      const down = row < d - 1 ? currentElevationData[idx + d] : currentElevationData[idx];

      const dx = (right - left) / 2;
      const dy = (down - up) / 2;
      slopes[idx] = Math.atan(Math.sqrt(dx * dx + dy * dy) / (elevRange / d * 2)) * 180 / Math.PI;
    }
  }
  return slopes;
}

function computeAspects() {
  if (!currentElevationData) return null;
  const d = currentDensity;
  const aspects = new Float32Array(d * d);

  for (let row = 0; row < d; row++) {
    for (let col = 0; col < d; col++) {
      const idx = row * d + col;
      const left = col > 0 ? currentElevationData[idx - 1] : currentElevationData[idx];
      const right = col < d - 1 ? currentElevationData[idx + 1] : currentElevationData[idx];
      const up = row > 0 ? currentElevationData[idx - d] : currentElevationData[idx];
      const down = row < d - 1 ? currentElevationData[idx + d] : currentElevationData[idx];

      aspects[idx] = (Math.atan2(down - up, right - left) + Math.PI) / (2 * Math.PI); // 0-1
    }
  }
  return aspects;
}

function removeContourLines() {
  if (contourLines) {
    scene.remove(contourLines);
    contourLines.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    contourLines = null;
  }
}

function buildContourLines() {
  removeContourLines();
  if (!currentElevationData || !currentMesh) return;

  const d = currentDensity;
  const interval = parseInt(contourIntervalInput.value);
  const exag = parseFloat(exagInput.value);
  const elevRange = currentMaxElev - currentMinElev || 1;
  const size = 500;
  const step = size / (d - 1);
  const group = new THREE.Group();

  const contourElevs = [];
  for (let e = Math.ceil(currentMinElev / interval) * interval; e <= currentMaxElev; e += interval) {
    contourElevs.push(e);
  }

  for (const ce of contourElevs) {
    const points = [];
    for (let row = 0; row < d - 1; row++) {
      for (let col = 0; col < d - 1; col++) {
        const idx = row * d + col;
        const corners = [
          { e: currentElevationData[idx], x: col, z: row },
          { e: currentElevationData[idx + 1], x: col + 1, z: row },
          { e: currentElevationData[idx + d + 1], x: col + 1, z: row + 1 },
          { e: currentElevationData[idx + d], x: col, z: row + 1 },
        ];

        // March squares for this cell
        for (let edge = 0; edge < 4; edge++) {
          const a = corners[edge];
          const b = corners[(edge + 1) % 4];
          if ((a.e - ce) * (b.e - ce) < 0) {
            const t = (ce - a.e) / (b.e - a.e);
            const x = (a.x + t * (b.x - a.x)) * step - size / 2;
            const z = (a.z + t * (b.z - a.z)) * step - size / 2;
            const y = ((ce - currentMinElev) / elevRange) * 100 * exag + 0.5;
            points.push(new THREE.Vector3(x, y, z));
          }
        }
      }
    }

    if (points.length > 1) {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, opacity: 0.6, transparent: true });
      group.add(new THREE.Points(geo, mat));
    }
  }

  contourLines = group;
  scene.add(contourLines);
}

function applyAnalysisOverlay() {
  const mode = analysisMode.value;
  $('contour-interval-ctrl').style.display = mode === 'contour' ? '' : 'none';

  removeContourLines();

  if (!currentMesh || !currentElevationData) return;

  if (mode === 'none') {
    recolor();
    return;
  }

  const colors = currentMesh.geometry.attributes.color;

  if (mode === 'slope') {
    const slopes = computeSlopes();
    for (let i = 0; i < colors.count; i++) {
      const s = Math.min(slopes[i] / 60, 1); // normalize to 60 degrees max
      // Green (flat) -> Yellow -> Red (steep)
      const color = new THREE.Color().setHSL(0.33 - s * 0.33, 0.9, 0.3 + s * 0.3);
      colors.setXYZ(i, color.r, color.g, color.b);
    }
    colors.needsUpdate = true;
  }

  if (mode === 'aspect') {
    const aspects = computeAspects();
    for (let i = 0; i < colors.count; i++) {
      const color = new THREE.Color().setHSL(aspects[i], 0.8, 0.5);
      colors.setXYZ(i, color.r, color.g, color.b);
    }
    colors.needsUpdate = true;
  }

  if (mode === 'contour') {
    recolor(); // base colors
    buildContourLines();
  }
}

analysisMode.addEventListener('change', applyAnalysisOverlay);
contourIntervalInput.addEventListener('input', () => {
  if (analysisMode.value === 'contour') buildContourLines();
});

// ============ STATS ============
function updateStats() {
  if (!currentElevationData) return;
  const box = $('stats-box');
  box.classList.remove('hidden');

  const mean = currentElevationData.reduce((a, b) => a + b, 0) / currentElevationData.length;

  $('stat-min').textContent = currentMinElev.toFixed(0) + 'm';
  $('stat-max').textContent = currentMaxElev.toFixed(0) + 'm';
  $('stat-range').textContent = (currentMaxElev - currentMinElev).toFixed(0) + 'm';
  $('stat-mean').textContent = mean.toFixed(0) + 'm';
  $('stat-points').textContent = currentElevationData.length.toLocaleString();
}

// ============ GEOCODING (Search) ============
let searchTimeout = null;

async function searchPlace(query) {
  if (!query.trim()) { searchResults.classList.add('hidden'); return; }

  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await resp.json();

    if (!data.length) {
      searchResults.innerHTML = '<div class="search-result-item"><span class="sr-name">No results found</span></div>';
      searchResults.classList.remove('hidden');
      return;
    }

    searchResults.innerHTML = data.map(r => `
      <div class="search-result-item" data-lat="${r.lat}" data-lng="${r.lon}">
        <div class="sr-name">${r.display_name.split(',').slice(0, 2).join(', ')}</div>
        <div class="sr-detail">${parseFloat(r.lat).toFixed(4)}, ${parseFloat(r.lon).toFixed(4)}</div>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        latInput.value = lat.toFixed(2);
        lngInput.value = lng.toFixed(2);
        searchResults.classList.add('hidden');
        searchInput.value = item.querySelector('.sr-name').textContent;

        // Switch to real world mode
        document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-source="realworld"]').classList.add('active');
        $('source-realworld').classList.remove('hidden');
        $('source-procedural').classList.add('hidden');

        generate();
      });
    });

    searchResults.classList.remove('hidden');
  } catch (err) {
    debugAppend(`Geocoding error: ${err.message}`);
  }
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchPlace(searchInput.value), 400);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchPlace(searchInput.value);
  }
});

searchBtn.addEventListener('click', () => searchPlace(searchInput.value));

// Close search results on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#topbar-search')) {
    searchResults.classList.add('hidden');
  }
});

// ============ ELEVATION PROFILE ============
$('btn-profile').addEventListener('click', () => {
  if (!currentMesh) { statusEl.textContent = 'Generate terrain first'; return; }
  profileMode = true;
  profilePoints = [];
  clearProfileMarkers();
  document.body.classList.add('profile-mode');
  $('profile-hint').classList.remove('hidden');
  statusEl.textContent = 'Click two points on the terrain to draw a profile line';
});

$('profile-close').addEventListener('click', () => {
  profilePanel.classList.add('hidden');
  clearProfileMarkers();
});

function clearProfileMarkers() {
  profileMarkers.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  profileMarkers = [];
}

function addProfileMarker(point) {
  const geo = new THREE.SphereGeometry(3, 12, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  const marker = new THREE.Mesh(geo, mat);
  marker.position.copy(point);
  scene.add(marker);
  profileMarkers.push(marker);
}

function drawElevationProfile(p1, p2) {
  if (!currentElevationData || !currentMesh) return;

  const canvas = profileCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 200;

  // Sample along the line
  const samples = 200;
  const elevs = [];
  const positions = currentMesh.geometry.attributes.position;
  const d = currentDensity;
  const size = 500;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = p1.x + t * (p2.x - p1.x);
    const z = p1.z + t * (p2.z - p1.z);

    // Convert to grid coordinates
    const col = ((x + size / 2) / size) * (d - 1);
    const row = ((z + size / 2) / size) * (d - 1);

    const c = Math.min(Math.max(Math.floor(col), 0), d - 2);
    const r = Math.min(Math.max(Math.floor(row), 0), d - 2);
    const fc = col - c;
    const fr = row - r;

    // Bilinear interpolation
    const e00 = currentElevationData[r * d + c];
    const e10 = currentElevationData[r * d + c + 1];
    const e01 = currentElevationData[(r + 1) * d + c];
    const e11 = currentElevationData[(r + 1) * d + c + 1];
    const elev = e00 * (1 - fc) * (1 - fr) + e10 * fc * (1 - fr) + e01 * (1 - fc) * fr + e11 * fc * fr;
    elevs.push(elev);
  }

  const minE = Math.min(...elevs);
  const maxE = Math.max(...elevs);
  const rangeE = maxE - minE || 1;
  const pad = 40;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;

  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + w, y); ctx.stroke();
  }

  // Elevation fill
  ctx.beginPath();
  ctx.moveTo(pad, pad + h);
  for (let i = 0; i <= samples; i++) {
    const x = pad + (i / samples) * w;
    const y = pad + h - ((elevs[i] - minE) / rangeE) * h;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(pad + w, pad + h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad, 0, pad + h);
  grad.addColorStop(0, 'rgba(78, 205, 196, 0.4)');
  grad.addColorStop(1, 'rgba(78, 205, 196, 0.05)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Elevation line
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    const x = pad + (i / samples) * w;
    const y = pad + h - ((elevs[i] - minE) / rangeE) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#4ecdc4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#8890a8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${maxE.toFixed(0)}m`, pad - 4, pad + 4);
  ctx.fillText(`${minE.toFixed(0)}m`, pad - 4, pad + h + 4);
  ctx.fillText(`${((maxE + minE) / 2).toFixed(0)}m`, pad - 4, pad + h / 2 + 4);

  // Distance estimate
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const dist3d = Math.sqrt(dx * dx + dz * dz);
  ctx.textAlign = 'center';
  ctx.fillText('0', pad, pad + h + 16);
  ctx.fillText(`~${(dist3d / 500 * parseFloat(rangeInput.value) * 2).toFixed(1)} km`, pad + w, pad + h + 16);

  profilePanel.classList.remove('hidden');
}

// ============ HOVER / CLICK RAYCASTING ============
function onMouseMove(event) {
  if (!currentMesh) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(currentMesh);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const face = intersects[0].face;

    // Find closest grid point
    const d = currentDensity;
    const size = 500;
    const col = Math.round(((point.x + size / 2) / size) * (d - 1));
    const row = Math.round(((point.z + size / 2) / size) * (d - 1));
    const idx = Math.min(Math.max(row * d + col, 0), currentElevationData.length - 1);
    const elev = currentElevationData[idx];

    hudElev.textContent = `${elev.toFixed(1)}m`;

    if (currentLocations && currentLocations[idx]) {
      hudCoords.textContent = `${currentLocations[idx].lat.toFixed(4)}, ${currentLocations[idx].lng.toFixed(4)}`;
    } else {
      hudCoords.textContent = `Grid [${col}, ${row}]`;
    }

    // Compute local slope
    const left = col > 0 ? currentElevationData[idx - 1] : elev;
    const right = col < d - 1 ? currentElevationData[idx + 1] : elev;
    const up = row > 0 ? currentElevationData[idx - d] : elev;
    const down = row < d - 1 ? currentElevationData[idx + d] : elev;
    const slopeDeg = Math.atan(Math.sqrt(
      Math.pow(right - left, 2) + Math.pow(down - up, 2)
    ) / 2) * 180 / Math.PI;
    hudSlope.textContent = `${slopeDeg.toFixed(1)} deg`;
  } else {
    hudCoords.textContent = '--';
    hudElev.textContent = '--';
    hudSlope.textContent = '--';
  }
}

function onCanvasClick(event) {
  if (!profileMode || !currentMesh) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(currentMesh);

  if (intersects.length > 0) {
    profilePoints.push(intersects[0].point.clone());
    addProfileMarker(intersects[0].point);

    if (profilePoints.length === 2) {
      profileMode = false;
      document.body.classList.remove('profile-mode');
      $('profile-hint').classList.add('hidden');
      drawElevationProfile(profilePoints[0], profilePoints[1]);

      // Draw line between markers
      const lineGeo = new THREE.BufferGeometry().setFromPoints(profilePoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      profileMarkers.push(line);
    }
  }
}

renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('click', onCanvasClick);

// ============ EXPORT FUNCTIONS ============
$('export-png').addEventListener('click', () => exportScreenshot());
$('btn-screenshot').addEventListener('click', () => exportScreenshot());

function exportScreenshot() {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = 'terrain-studio.png';
  link.href = renderer.domElement.toDataURL('image/png');
  link.click();
  statusEl.textContent = 'Screenshot saved!';
}

$('export-heightmap').addEventListener('click', () => {
  if (!currentElevationData) { statusEl.textContent = 'Generate terrain first'; return; }
  const d = currentDensity;
  const canvas = document.createElement('canvas');
  canvas.width = d;
  canvas.height = d;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(d, d);
  const elevRange = currentMaxElev - currentMinElev || 1;

  for (let i = 0; i < currentElevationData.length; i++) {
    const normalized = (currentElevationData[i] - currentMinElev) / elevRange;
    const v = Math.floor(normalized * 255);
    // Flip Y for image coordinates
    const row = Math.floor(i / d);
    const col = i % d;
    const imgIdx = ((d - 1 - row) * d + col) * 4;
    imgData.data[imgIdx] = v;
    imgData.data[imgIdx + 1] = v;
    imgData.data[imgIdx + 2] = v;
    imgData.data[imgIdx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  const link = document.createElement('a');
  link.download = 'heightmap.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  statusEl.textContent = 'Heightmap exported!';
});

$('export-stl').addEventListener('click', () => {
  if (!currentMesh) { statusEl.textContent = 'Generate terrain first'; return; }
  statusEl.textContent = 'Generating STL...';

  // Generate binary STL
  const geometry = currentMesh.geometry;
  const positions = geometry.attributes.position;
  const index = geometry.index;

  let numTriangles;
  if (index) {
    numTriangles = index.count / 3;
  } else {
    numTriangles = positions.count / 3;
  }

  const bufferSize = 84 + numTriangles * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // Header (80 bytes)
  for (let i = 0; i < 80; i++) view.setUint8(i, 0);
  view.setUint32(80, numTriangles, true);

  let offset = 84;
  const tempVec = new THREE.Vector3();

  for (let i = 0; i < numTriangles; i++) {
    let ai, bi, ci;
    if (index) {
      ai = index.getX(i * 3);
      bi = index.getX(i * 3 + 1);
      ci = index.getX(i * 3 + 2);
    } else {
      ai = i * 3; bi = i * 3 + 1; ci = i * 3 + 2;
    }

    const ax = positions.getX(ai), ay = positions.getY(ai), az = positions.getZ(ai);
    const bx = positions.getX(bi), by = positions.getY(bi), bz = positions.getZ(bi);
    const cx = positions.getX(ci), cy = positions.getY(ci), cz = positions.getZ(ci);

    // Compute normal
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

    view.setFloat32(offset, nx / len, true); offset += 4;
    view.setFloat32(offset, ny / len, true); offset += 4;
    view.setFloat32(offset, nz / len, true); offset += 4;

    view.setFloat32(offset, ax, true); offset += 4;
    view.setFloat32(offset, ay, true); offset += 4;
    view.setFloat32(offset, az, true); offset += 4;
    view.setFloat32(offset, bx, true); offset += 4;
    view.setFloat32(offset, by, true); offset += 4;
    view.setFloat32(offset, bz, true); offset += 4;
    view.setFloat32(offset, cx, true); offset += 4;
    view.setFloat32(offset, cy, true); offset += 4;
    view.setFloat32(offset, cz, true); offset += 4;

    view.setUint16(offset, 0, true); offset += 2;
  }

  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.download = 'terrain.stl';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  statusEl.textContent = 'STL exported for 3D printing!';
});

$('export-raw').addEventListener('click', () => {
  if (!currentElevationData) { statusEl.textContent = 'Generate terrain first'; return; }

  const data = {
    density: currentDensity,
    minElevation: currentMinElev,
    maxElevation: currentMaxElev,
    elevations: Array.from(currentElevationData),
    locations: currentLocations,
    metadata: {
      lat: parseFloat(latInput.value),
      lng: parseFloat(lngInput.value),
      rangeKm: parseFloat(rangeInput.value),
      exportedAt: new Date().toISOString(),
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'terrain-data.json';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  statusEl.textContent = 'Raw data exported!';
});

// ============ CAMERA VIEWS ============
function animateCamera(targetPos, targetLookAt, duration = 1000) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  function update() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

    camera.position.lerpVectors(startPos, targetPos, ease);
    controls.target.lerpVectors(startTarget, targetLookAt, ease);
    controls.update();

    if (t < 1) requestAnimationFrame(update);
  }
  update();
}

$('btn-top-view').addEventListener('click', () => {
  const exag = parseFloat(exagInput.value);
  animateCamera(
    new THREE.Vector3(0, 600 * exag, 0.1),
    new THREE.Vector3(0, 0, 0)
  );
});

$('btn-side-view').addEventListener('click', () => {
  const exag = parseFloat(exagInput.value);
  animateCamera(
    new THREE.Vector3(0, 50 * exag, 500),
    new THREE.Vector3(0, 50 * exag, 0)
  );
});

$('btn-angle-view').addEventListener('click', () => {
  const exag = parseFloat(exagInput.value);
  animateCamera(
    new THREE.Vector3(300, 250 * exag, 300),
    new THREE.Vector3(0, 50 * exag, 0)
  );
});

// ============ FLY THROUGH ============
$('btn-flythrough').addEventListener('click', toggleFlyThrough);

function toggleFlyThrough() {
  flyThroughActive = !flyThroughActive;
  $('btn-flythrough').textContent = flyThroughActive ? 'Stop Flying' : 'Fly Through';
  if (flyThroughActive) flyThroughTime = 0;
}

function updateFlyThrough(delta) {
  if (!flyThroughActive || !currentMesh) return;

  const speed = parseFloat(flySpeedInput.value);
  flyThroughTime += delta * speed * 0.3;

  const radius = 350;
  const height = parseFloat(exagInput.value) * 150;

  camera.position.set(
    Math.cos(flyThroughTime) * radius,
    height + Math.sin(flyThroughTime * 0.5) * 50,
    Math.sin(flyThroughTime) * radius
  );
  controls.target.set(0, height * 0.3, 0);
  controls.update();
}

// ============ MAIN GENERATE (Real World) ============
async function generate() {
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  const rangeKm = parseFloat(rangeInput.value);
  const density = parseInt(densityInput.value);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    statusEl.textContent = 'Invalid coordinates.';
    return;
  }

  if (activeAbortController) {
    activeAbortController.abort();
    debugAppend('Cancelled previous request.');
  }
  const abortController = new AbortController();
  activeAbortController = abortController;
  const signal = abortController.signal;

  loadingEl.classList.remove('hidden');
  generateBtn.disabled = true;
  statusEl.textContent = '';
  debugLog = [];
  debugAppend(`Generate: lat=${lat}, lng=${lng}, range=${rangeKm}km, density=${density}`);

  try {
    loadingText.textContent = 'Generating coordinate grid...';
    const locations = generateGrid(lat, lng, rangeKm, density);
    currentLocations = locations;
    debugAppend(`Grid: ${locations.length} points (${density}x${density})`);

    const elevations = await fetchElevations(locations, signal);
    signal.throwIfAborted();

    loadingText.textContent = 'Building terrain mesh...';
    await new Promise(r => requestAnimationFrame(r));

    buildTerrain(elevations, density);
    updateStats();
    debugAppend('Terrain built successfully.');
    statusEl.textContent = `Elevation: ${currentMinElev.toFixed(0)}m - ${currentMaxElev.toFixed(0)}m | ${density}x${density} grid`;
  } catch (err) {
    if (err.name === 'AbortError') { debugAppend('Cancelled.'); return; }
    statusEl.textContent = `Error: ${err.message}`;
    debugAppend(`FATAL: ${err.message}`);
    showDebug();
    console.error(err);
  } finally {
    if (activeAbortController === abortController) activeAbortController = null;
    loadingEl.classList.add('hidden');
    generateBtn.disabled = false;
  }
}

// ============ EVENT LISTENERS ============
generateBtn.addEventListener('click', generate);
generateProcBtn.addEventListener('click', generateProceduralTerrain);

randomizeProcBtn.addEventListener('click', () => {
  procSeedInput.value = Math.floor(Math.random() * 99999);
  $('seed-val').textContent = procSeedInput.value;
  generateProceduralTerrain();
});

$('loading-cancel').addEventListener('click', () => {
  if (activeAbortController) activeAbortController.abort();
});

// Presets
document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    latInput.value = btn.dataset.lat;
    lngInput.value = btn.dataset.lng;
    rangeInput.value = btn.dataset.range;
    $('range-val').textContent = btn.dataset.range;

    // Switch to real world
    document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-source="realworld"]').classList.add('active');
    $('source-realworld').classList.remove('hidden');
    $('source-procedural').classList.add('hidden');

    generate();
  });
});

// Fullscreen
$('btn-fullscreen').addEventListener('click', toggleFullscreen);
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

// Help
$('btn-help').addEventListener('click', () => helpModal.classList.toggle('hidden'));
$('help-close').addEventListener('click', () => helpModal.classList.add('hidden'));
helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) helpModal.classList.add('hidden');
});

// Sidebar toggle
function toggleSidebar() {
  $('sidebar').classList.toggle('collapsed');
  // Resize after animation
  setTimeout(() => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }, 350);
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  // Don't capture when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key.toLowerCase()) {
    case 'g':
      e.preventDefault();
      const activeSource = document.querySelector('.source-tab.active')?.dataset.source;
      if (activeSource === 'procedural') generateProceduralTerrain();
      else generate();
      break;
    case 'r':
      e.preventDefault();
      procSeedInput.value = Math.floor(Math.random() * 99999);
      $('seed-val').textContent = procSeedInput.value;
      generateProceduralTerrain();
      break;
    case 'p':
      e.preventDefault();
      exportScreenshot();
      break;
    case 'f':
      e.preventDefault();
      toggleFullscreen();
      break;
    case 'w':
      e.preventDefault();
      wireframeCheckbox.checked = !wireframeCheckbox.checked;
      if (currentMesh) currentMesh.material.wireframe = wireframeCheckbox.checked;
      break;
    case 'c':
      e.preventDefault();
      const opts = colorSchemeSelect.options;
      colorSchemeSelect.selectedIndex = (colorSchemeSelect.selectedIndex + 1) % opts.length;
      updateColorPreview();
      if (currentMesh) recolor();
      break;
    case '1':
      e.preventDefault();
      $('btn-top-view').click();
      break;
    case '2':
      e.preventDefault();
      $('btn-side-view').click();
      break;
    case '3':
      e.preventDefault();
      $('btn-angle-view').click();
      break;
    case ' ':
      e.preventDefault();
      toggleFlyThrough();
      break;
    case '=':
    case '+':
      e.preventDefault();
      exagInput.value = Math.min(10, parseFloat(exagInput.value) + 0.5);
      $('exag-val').textContent = exagInput.value;
      if (currentMesh) updateExaggeration();
      break;
    case '-':
      e.preventDefault();
      exagInput.value = Math.max(0.5, parseFloat(exagInput.value) - 0.5);
      $('exag-val').textContent = exagInput.value;
      if (currentMesh) updateExaggeration();
      break;
    case 'tab':
      e.preventDefault();
      toggleSidebar();
      break;
    case 'escape':
      profileMode = false;
      document.body.classList.remove('profile-mode');
      $('profile-hint').classList.add('hidden');
      helpModal.classList.add('hidden');
      profilePanel.classList.add('hidden');
      debugPanel.classList.add('hidden');
      break;
    case '?':
      e.preventDefault();
      helpModal.classList.toggle('hidden');
      break;
  }
});

// ============ RENDER LOOP ============
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  // Update water animation
  if (waterMesh && waterMesh.material.uniforms) {
    waterMesh.material.uniforms.time.value += delta;
  }

  // Update fly through
  updateFlyThrough(delta);

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ============ INITIAL STATE ============
updateSunPosition();
updateFog(showFogCheckbox.checked);
debugAppend('Terrain Studio ready. Generate real-world terrain or switch to procedural mode.');
statusEl.textContent = 'Ready. Generate terrain or search for a location.';
