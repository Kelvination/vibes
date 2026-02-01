import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// DOM elements
const container = document.getElementById('canvas-container');
const loadingEl = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');
const statusEl = document.getElementById('status');
const generateBtn = document.getElementById('generate');

const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const rangeInput = document.getElementById('range');
const densityInput = document.getElementById('density');
const exagInput = document.getElementById('exaggeration');
const colorSchemeSelect = document.getElementById('colorScheme');
const wireframeCheckbox = document.getElementById('wireframe');

const rangeVal = document.getElementById('range-val');
const densityVal = document.getElementById('density-val');
const exagVal = document.getElementById('exag-val');

const debugPanel = document.getElementById('debug-panel');
const debugContent = document.getElementById('debug-content');
const debugCopyBtn = document.getElementById('debug-copy');
const debugCloseBtn = document.getElementById('debug-close');

// Debug log
let debugLog = [];
function debugAppend(msg) {
  const ts = new Date().toLocaleTimeString();
  debugLog.push(`[${ts}] ${msg}`);
  debugContent.textContent = debugLog.join('\n');
  debugContent.scrollTop = debugContent.scrollHeight;
}

function showDebug() {
  debugPanel.classList.remove('hidden');
}

debugCopyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(debugLog.join('\n')).then(() => {
    debugCopyBtn.textContent = 'Copied!';
    setTimeout(() => debugCopyBtn.textContent = 'Copy', 1500);
  }).catch(() => {
    // Fallback for older browsers / no clipboard API
    const ta = document.createElement('textarea');
    ta.value = debugLog.join('\n');
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    debugCopyBtn.textContent = 'Copied!';
    setTimeout(() => debugCopyBtn.textContent = 'Copy', 1500);
  });
});

debugCloseBtn.addEventListener('click', () => {
  debugPanel.classList.add('hidden');
});

// Sync slider labels
rangeInput.addEventListener('input', () => rangeVal.textContent = rangeInput.value);
densityInput.addEventListener('input', () => densityVal.textContent = densityInput.value);
exagInput.addEventListener('input', () => {
  exagVal.textContent = exagInput.value;
  if (currentMesh) updateExaggeration();
});
colorSchemeSelect.addEventListener('change', () => { if (currentMesh) recolor(); });
wireframeCheckbox.addEventListener('change', () => {
  if (currentMesh) currentMesh.material.wireframe = wireframeCheckbox.checked;
});

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(
  60,
  container.clientWidth / container.clientHeight,
  0.1,
  10000
);
camera.position.set(0, 300, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.1;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(200, 400, 200);
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0x8888cc, 0.3);
dirLight2.position.set(-200, 200, -100);
scene.add(dirLight2);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// State
let currentMesh = null;
let currentElevationData = null;
let currentMinElev = 0;
let currentMaxElev = 1;

// Color schemes
const colorSchemes = {
  terrain(t) {
    if (t < 0.2) return new THREE.Color().lerpColors(new THREE.Color(0x1a6b1a), new THREE.Color(0x3d9b3d), t / 0.2);
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x3d9b3d), new THREE.Color(0x8B7355), (t - 0.2) / 0.3);
    if (t < 0.8) return new THREE.Color().lerpColors(new THREE.Color(0x8B7355), new THREE.Color(0xa0a0a0), (t - 0.5) / 0.3);
    return new THREE.Color().lerpColors(new THREE.Color(0xa0a0a0), new THREE.Color(0xffffff), (t - 0.8) / 0.2);
  },
  ocean(t) {
    if (t < 0.3) return new THREE.Color().lerpColors(new THREE.Color(0x001133), new THREE.Color(0x0044aa), t / 0.3);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0x0044aa), new THREE.Color(0x00aacc), (t - 0.3) / 0.3);
    return new THREE.Color().lerpColors(new THREE.Color(0x00aacc), new THREE.Color(0xeeffff), (t - 0.6) / 0.4);
  },
  heat(t) {
    if (t < 0.33) return new THREE.Color().lerpColors(new THREE.Color(0x000000), new THREE.Color(0xcc0000), t / 0.33);
    if (t < 0.66) return new THREE.Color().lerpColors(new THREE.Color(0xcc0000), new THREE.Color(0xff8800), (t - 0.33) / 0.33);
    return new THREE.Color().lerpColors(new THREE.Color(0xff8800), new THREE.Color(0xffff00), (t - 0.66) / 0.34);
  },
  grayscale(t) {
    const v = Math.floor(t * 255);
    return new THREE.Color(`rgb(${v},${v},${v})`);
  }
};

// Helper: sleep ms
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Fetch a single batch with retry on 429
async function fetchBatchWithRetry(url, batchNum, totalBatches, maxRetries = 4) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let resp;
    try {
      resp = await fetch(url);
    } catch (fetchErr) {
      debugAppend(`FETCH ERROR (batch ${batchNum}, attempt ${attempt + 1}): ${fetchErr.message}`);
      if (attempt === maxRetries) {
        showDebug();
        throw new Error(`Network error on batch ${batchNum}: ${fetchErr.message}`);
      }
      const wait = 2000 * (attempt + 1);
      debugAppend(`Retrying in ${wait}ms...`);
      loadingText.textContent = `Rate limited, waiting ${wait / 1000}s...`;
      await sleep(wait);
      continue;
    }

    const bodyText = await resp.text();

    if (resp.status === 429) {
      const wait = 3000 * (attempt + 1);
      debugAppend(`429 rate limited (batch ${batchNum}, attempt ${attempt + 1}). Waiting ${wait}ms...`);
      loadingText.textContent = `Rate limited, retrying in ${wait / 1000}s... (batch ${batchNum}/${totalBatches})`;
      if (attempt === maxRetries) {
        debugAppend(`Response body: ${bodyText.substring(0, 300)}`);
        showDebug();
        throw new Error(`Rate limited after ${maxRetries + 1} attempts on batch ${batchNum}. See debug panel.`);
      }
      await sleep(wait);
      continue;
    }

    if (!resp.ok) {
      debugAppend(`HTTP ${resp.status} ${resp.statusText} (batch ${batchNum})`);
      debugAppend(`Response body: ${bodyText.substring(0, 500)}`);
      debugAppend(`Request URL (first 300 chars): ${url.substring(0, 300)}...`);
      showDebug();
      throw new Error(`API returned ${resp.status} on batch ${batchNum}. See debug panel.`);
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (parseErr) {
      debugAppend(`JSON PARSE ERROR (batch ${batchNum}): ${parseErr.message}`);
      debugAppend(`Raw response: ${bodyText.substring(0, 500)}`);
      showDebug();
      throw new Error(`Invalid JSON on batch ${batchNum}. See debug panel.`);
    }

    if (data.elevation) {
      return data.elevation;
    } else {
      debugAppend(`NO ELEVATION DATA (batch ${batchNum})`);
      debugAppend(`Response keys: ${Object.keys(data).join(', ')}`);
      debugAppend(`Full response: ${bodyText.substring(0, 500)}`);
      showDebug();
      throw new Error(`No elevation data in batch ${batchNum}. See debug panel.`);
    }
  }
}

// Fetch elevation data from Open-Meteo API
async function fetchElevations(locations) {
  // Large batches = fewer requests = less chance of rate limiting
  const BATCH_SIZE = 200;
  const DELAY_BETWEEN_BATCHES = 500; // ms delay between batches to avoid 429
  const results = [];
  const totalBatches = Math.ceil(locations.length / BATCH_SIZE);

  debugAppend(`Total points: ${locations.length}, batches: ${totalBatches}, batch size: ${BATCH_SIZE}`);
  debugAppend(`Lat range: ${locations[0].lat.toFixed(4)} to ${locations[locations.length - 1].lat.toFixed(4)}`);
  debugAppend(`Lng range: ${locations[0].lng.toFixed(4)} to ${locations[locations.length - 1].lng.toFixed(4)}`);

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = locations.slice(i, i + BATCH_SIZE);
    const lats = batch.map(l => l.lat.toFixed(4)).join(',');
    const lngs = batch.map(l => l.lng.toFixed(4)).join(',');

    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

    debugAppend(`Batch ${batchNum}/${totalBatches}: ${batch.length} points, URL length: ${url.length}`);
    loadingText.textContent = `Fetching elevations... batch ${batchNum}/${totalBatches}`;

    const elevations = await fetchBatchWithRetry(url, batchNum, totalBatches);
    results.push(...elevations);
    debugAppend(`Batch ${batchNum} OK: ${elevations.length} elevations, sample: [${elevations.slice(0, 3).join(', ')}...]`);

    // Delay between batches to stay under rate limit
    if (i + BATCH_SIZE < locations.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  debugAppend(`All batches complete. Total elevations: ${results.length}`);
  return results;
}

// Generate grid of lat/lng points
function generateGrid(lat, lng, rangeKm, density) {
  const locations = [];
  // 1 degree latitude ~= 111km
  const latRange = rangeKm / 111;
  // 1 degree longitude varies by latitude
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

// Build terrain mesh
function buildTerrain(elevations, density) {
  // Remove old mesh
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
    currentMesh = null;
  }

  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const elevRange = maxElev - minElev || 1;

  currentMinElev = minElev;
  currentMaxElev = maxElev;
  currentElevationData = elevations;

  const exag = parseFloat(exagInput.value);
  const scheme = colorSchemeSelect.value;

  // Geometry
  const size = 500;
  const geometry = new THREE.PlaneGeometry(size, size, density - 1, density - 1);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    const elev = elevations[i];
    const normalized = (elev - minElev) / elevRange;
    const height = normalized * 100 * exag;
    positions.setY(i, height);

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
    shininess: 10,
    flatShading: false,
  });

  currentMesh = new THREE.Mesh(geometry, material);
  scene.add(currentMesh);

  // Reset camera to nice view
  const center = new THREE.Vector3(0, (100 * exag) / 2, 0);
  controls.target.copy(center);
  camera.position.set(0, 200 * exag, 350);
  controls.update();

  statusEl.textContent = `Elevation: ${minElev.toFixed(0)}m - ${maxElev.toFixed(0)}m | ${density}x${density} grid`;
}

// Update vertical exaggeration without refetching
function updateExaggeration() {
  if (!currentElevationData) return;
  const density = Math.sqrt(currentElevationData.length);
  const exag = parseFloat(exagInput.value);
  const elevRange = currentMaxElev - currentMinElev || 1;

  const positions = currentMesh.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const elev = currentElevationData[i];
    const normalized = (elev - currentMinElev) / elevRange;
    positions.setY(i, normalized * 100 * exag);
  }
  positions.needsUpdate = true;
  currentMesh.geometry.computeVertexNormals();
}

// Recolor without refetching
function recolor() {
  if (!currentElevationData || !currentMesh) return;
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

// Main generate handler
async function generate() {
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  const rangeKm = parseFloat(rangeInput.value);
  const density = parseInt(densityInput.value);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    statusEl.textContent = 'Invalid coordinates.';
    return;
  }

  loadingEl.classList.remove('hidden');
  generateBtn.disabled = true;
  statusEl.textContent = '';

  // Reset debug log
  debugLog = [];
  debugAppend(`Generate: lat=${lat}, lng=${lng}, range=${rangeKm}km, density=${density}`);

  try {
    loadingText.textContent = 'Generating coordinate grid...';
    const locations = generateGrid(lat, lng, rangeKm, density);
    debugAppend(`Grid generated: ${locations.length} points (${density}x${density})`);

    const elevations = await fetchElevations(locations);

    loadingText.textContent = 'Building terrain mesh...';
    await new Promise(r => requestAnimationFrame(r));

    buildTerrain(elevations, density);
    debugAppend(`Terrain built successfully.`);
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    debugAppend(`FATAL: ${err.message}`);
    debugAppend(`Stack: ${err.stack}`);
    showDebug();
    console.error(err);
  } finally {
    loadingEl.classList.add('hidden');
    generateBtn.disabled = false;
  }
}

// Event listeners
generateBtn.addEventListener('click', generate);

document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    latInput.value = btn.dataset.lat;
    lngInput.value = btn.dataset.lng;
    rangeInput.value = btn.dataset.range;
    rangeVal.textContent = btn.dataset.range;
    generate();
  });
});

// Render loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Auto-generate on load with default Swiss Alps
generate();
