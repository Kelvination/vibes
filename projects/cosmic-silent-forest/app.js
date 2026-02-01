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

// Fetch elevation data from Open-Meteo API
async function fetchElevations(locations) {
  // Open-Meteo accepts up to ~300 coordinates per request
  const BATCH_SIZE = 250;
  const results = [];

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    const lats = batch.map(l => l.lat.toFixed(6)).join(',');
    const lngs = batch.map(l => l.lng.toFixed(6)).join(',');

    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

    loadingText.textContent = `Fetching elevations... (${Math.min(i + BATCH_SIZE, locations.length)}/${locations.length})`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();

    if (data.elevation) {
      results.push(...data.elevation);
    } else {
      throw new Error('No elevation data returned');
    }
  }

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

  try {
    loadingText.textContent = 'Generating coordinate grid...';
    const locations = generateGrid(lat, lng, rangeKm, density);

    const elevations = await fetchElevations(locations);

    loadingText.textContent = 'Building terrain mesh...';
    await new Promise(r => requestAnimationFrame(r));

    buildTerrain(elevations, density);
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
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
