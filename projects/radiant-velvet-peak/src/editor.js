// WallRush — block-based grid map editor (PRD §6).
// Place / rotate / delete / undo / test / save — the v1 cut.

import { S, GRID, BLOCKS, CATEGORIES, rotCell, placedDims, compile, validate } from './blocks.js';

const $ = (id) => document.getElementById(id);

export class Editor {
  constructor(renderer, callbacks) {
    this.r = renderer;
    this.cb = callbacks; // { onTest(map), onExit(), onSave(map), setStatus(msg) }
    this.placements = [];
    this.undoStack = [];
    this.redoStack = [];
    this.sel = 'road';
    this.rot = 0;
    this.hover = null;     // {x,z} cell
    this.mapKey = null;
    this.authorTime = null;
    this.cam = { x: GRID * S / 2, z: GRID * S / 2, yaw: 0, pitch: 1.05, dist: 220 };
    this.preview = null;
    this.active = false;
    this.occ = new Map();
    this.buildPalette();
    this.bindPointer();
  }

  buildPalette() {
    const pal = $('editor-palette');
    pal.innerHTML = '';
    for (const cat of CATEGORIES) {
      const h = document.createElement('div');
      h.className = 'pal-cat';
      h.textContent = cat;
      pal.appendChild(h);
      for (const id in BLOCKS) {
        if (BLOCKS[id].cat !== cat) continue;
        const b = document.createElement('button');
        b.className = 'pal-block';
        b.dataset.block = id;
        b.textContent = BLOCKS[id].name;
        b.onclick = () => this.select(id);
        pal.appendChild(b);
      }
    }
    this.select('road');
  }

  select(id) {
    this.sel = id;
    document.querySelectorAll('.pal-block').forEach((b) => b.classList.toggle('sel', b.dataset.block === id));
    this.rebuildPreview();
    const def = BLOCKS[id];
    this.cb.setStatus(`${def.name} — click to place, R rotate, right-click delete` +
      (def.zoneSlots ? `, hover placed block + 1/2/3 to toggle zones (${def.zoneSlots.join('/')})` : ''));
  }

  enter(map) {
    this.active = true;
    if (map) {
      this.placements = map.placements.map((p) => ({ ...p }));
      this.mapKey = map.key;
      this.authorTime = map.authorTime || null;
      $('editor-name').value = map.name || '';
    } else {
      this.placements = [];
      this.mapKey = null;
      this.authorTime = null;
      $('editor-name').value = '';
    }
    this.undoStack = [];
    this.redoStack = [];
    this.r.grid.visible = true;
    this.r.car.visible = false;
    this.r.ghost.visible = false;
    this.rebuildTrack();
    this.rebuildPreview();
    this.updateAuthorLabel();
  }

  exit() {
    this.active = false;
    this.r.grid.visible = false;
    this.r.car.visible = true;
    if (this.preview) { this.r.scene.remove(this.preview); this.preview = null; }
  }

  currentMap() {
    return {
      key: this.mapKey || ('custom:' + Date.now().toString(36)),
      name: $('editor-name').value.trim() || 'Untitled map',
      authorTime: this.authorTime,
      placements: this.placements.map((p) => ({ ...p })),
    };
  }

  updateAuthorLabel() {
    $('editor-author').textContent = this.authorTime
      ? `author time set ✓`
      : 'no author time — finish a Test run to set it';
  }

  setAuthorTime(ms) {
    this.authorTime = ms;
    this.updateAuthorLabel();
  }

  // ---- edits ----

  snapshot() {
    this.undoStack.push(JSON.stringify(this.placements));
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify(this.placements));
    this.placements = JSON.parse(this.undoStack.pop());
    this.afterEdit(false);
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify(this.placements));
    this.placements = JSON.parse(this.redoStack.pop());
    this.afterEdit(false);
  }

  afterEdit(invalidatesAuthor = true) {
    if (invalidatesAuthor) { this.authorTime = null; this.updateAuthorLabel(); }
    this.rebuildTrack();
  }

  rebuildTrack() {
    this.occ = new Map();
    for (let i = 0; i < this.placements.length; i++) {
      for (const c of this.cellsOf(this.placements[i])) this.occ.set(`${c.x},${c.z}`, i);
    }
    const track = compile(this.placements);
    this.r.buildTrack(track);
    this.r.updateZones(null, 0);
  }

  cellsOf(p) {
    const def = BLOCKS[p.id];
    const out = [];
    for (let cx = 0; cx < def.W; cx++) for (let cz = 0; cz < def.H; cz++) {
      const c = rotCell({ x: cx, z: cz }, p.rot & 3, def.W, def.H);
      out.push({ x: p.x + c.x, z: p.z + c.z });
    }
    return out;
  }

  canPlace(p) {
    for (const c of this.cellsOf(p)) {
      if (c.x < 0 || c.z < 0 || c.x >= GRID || c.z >= GRID) return false;
      if (this.occ.has(`${c.x},${c.z}`)) return false;
    }
    return true;
  }

  place() {
    if (!this.hover) return;
    const p = { id: this.sel, x: this.hover.x, z: this.hover.z, rot: this.rot };
    if (BLOCKS[this.sel].zoneSlots) p.zn = BLOCKS[this.sel].zoneSlots.map(() => 1);
    if (!this.canPlace(p)) return;
    this.snapshot();
    this.placements.push(p);
    this.afterEdit();
  }

  erase() {
    if (!this.hover) return;
    const i = this.occ.get(`${this.hover.x},${this.hover.z}`);
    if (i === undefined) return;
    this.snapshot();
    this.placements.splice(i, 1);
    this.afterEdit();
  }

  toggleZone(slot) {
    if (!this.hover) return;
    const i = this.occ.get(`${this.hover.x},${this.hover.z}`);
    if (i === undefined) return;
    const p = this.placements[i];
    const def = BLOCKS[p.id];
    if (!def.zoneSlots || slot >= def.zoneSlots.length) return;
    this.snapshot();
    if (!p.zn) p.zn = def.zoneSlots.map(() => 1);
    p.zn[slot] = p.zn[slot] ? 0 : 1;
    this.cb.setStatus(`${def.name}: ${def.zoneSlots[slot]} zone ${p.zn[slot] ? 'ON' : 'OFF'}`);
    this.afterEdit();
  }

  rotate() {
    this.rot = (this.rot + 1) & 3;
    this.rebuildPreview();
  }

  rebuildPreview() {
    if (!this.active) return;
    if (this.preview) this.r.scene.remove(this.preview);
    const p = { id: this.sel, x: 0, z: 0, rot: this.rot, zn: [1, 1, 1] };
    this.preview = this.r.buildPreview(p);
    this.preview.traverse((o) => {
      if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; }
    });
    this.r.scene.add(this.preview);
    this.preview.visible = false;
  }

  validateMap() {
    const errs = validate(this.placements);
    const track = compile(this.placements);
    if (track.error && !errs.includes(track.error)) errs.push(track.error);
    return errs;
  }

  // ---- pointer & camera ----

  bindPointer() {
    const canvas = this.r.renderer.domElement;
    let panning = false, lastX = 0, lastY = 0;

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        panning = true; lastX = e.clientX; lastY = e.clientY;
        e.preventDefault();
      } else if (e.button === 0) {
        this.place();
      } else if (e.button === 2) {
        this.erase();
      }
    });
    canvas.addEventListener('pointerup', () => { panning = false; });
    canvas.addEventListener('contextmenu', (e) => { if (this.active) e.preventDefault(); });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      if (panning) {
        const k = this.cam.dist / 700;
        const dx = (e.clientX - lastX) * k, dy = (e.clientY - lastY) * k;
        const cy = Math.cos(this.cam.yaw), sy = Math.sin(this.cam.yaw);
        this.cam.x -= dx * cy - dy * sy;
        this.cam.z += dx * sy + dy * cy;
        lastX = e.clientX; lastY = e.clientY;
      }
      this.updateHover(e);
    });
    canvas.addEventListener('wheel', (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.cam.dist = Math.max(40, Math.min(700, this.cam.dist * (e.deltaY > 0 ? 1.12 : 0.89)));
    }, { passive: false });
  }

  updateHover(e) {
    const cam = this.r.camera;
    const ndcX = (e.clientX / innerWidth) * 2 - 1;
    const ndcY = -(e.clientY / innerHeight) * 2 + 1;
    // unproject ray to y=0 plane
    const origin = cam.position;
    const v = { x: ndcX, y: ndcY, z: 0.5 };
    const dir = this._unproject(v, cam);
    dir.x -= origin.x; dir.y -= origin.y; dir.z -= origin.z;
    const len = Math.hypot(dir.x, dir.y, dir.z);
    dir.x /= len; dir.y /= len; dir.z /= len;
    if (Math.abs(dir.y) < 1e-5) { this.hover = null; return; }
    const t = -origin.y / dir.y;
    if (t < 0) { this.hover = null; return; }
    const wx = origin.x + dir.x * t, wz = origin.z + dir.z * t;
    const cx = Math.floor(wx / S), cz = Math.floor(wz / S);
    this.hover = (cx >= 0 && cz >= 0 && cx < GRID && cz < GRID) ? { x: cx, z: cz } : null;
  }

  _unproject(v, cam) {
    // minimal unproject without importing THREE here
    const p = { x: v.x, y: v.y, z: v.z };
    const m = cam.projectionMatrixInverse.elements;
    const w = cam.matrixWorld.elements;
    const apply = (e, p2) => {
      const d = 1 / (e[3] * p2.x + e[7] * p2.y + e[11] * p2.z + e[15]);
      return {
        x: (e[0] * p2.x + e[4] * p2.y + e[8] * p2.z + e[12]) * d,
        y: (e[1] * p2.x + e[5] * p2.y + e[9] * p2.z + e[13]) * d,
        z: (e[2] * p2.x + e[6] * p2.y + e[10] * p2.z + e[14]) * d,
      };
    };
    return apply(w, apply(m, p));
  }

  key(e) {
    if (!this.active) return false;
    const k = e.key.toLowerCase();
    if (k === 'r') { this.rotate(); return true; }
    if (k === 'z' && (e.ctrlKey || e.metaKey)) { this.undo(); return true; }
    if (k === 'y' && (e.ctrlKey || e.metaKey)) { this.redo(); return true; }
    if (k === '1' || k === '2' || k === '3') { this.toggleZone(+k - 1); return true; }
    if (k === 't') {
      const errs = this.validateMap();
      if (errs.length) { this.cb.setStatus('Cannot test: ' + errs.join('; ')); return true; }
      this.cb.onTest(this.currentMap());
      return true;
    }
    if (k === 'q') { this.cam.yaw -= 0.12; return true; }
    if (k === 'e') { this.cam.yaw += 0.12; return true; }
    if (k === 'arrowup' || k === 'w') { this.pan(0, -1); return true; }
    if (k === 'arrowdown' || k === 's') { this.pan(0, 1); return true; }
    if (k === 'arrowleft' || k === 'a') { this.pan(-1, 0); return true; }
    if (k === 'arrowright' || k === 'd') { this.pan(1, 0); return true; }
    return false;
  }

  pan(dx, dy) {
    const k = this.cam.dist * 0.08;
    const cy = Math.cos(this.cam.yaw), sy = Math.sin(this.cam.yaw);
    this.cam.x += (dx * cy - dy * sy) * k;
    this.cam.z += (-dx * sy - dy * cy) * k;
  }

  frame() {
    if (!this.active) return;
    this.r.setOrbit({ x: this.cam.x, y: 0, z: this.cam.z }, this.cam.yaw, this.cam.pitch, this.cam.dist);
    if (this.preview) {
      if (this.hover) {
        this.preview.visible = true;
        this.preview.position.set(this.hover.x * S, 0.05, this.hover.z * S);
        const ok = this.canPlace({ id: this.sel, x: this.hover.x, z: this.hover.z, rot: this.rot });
        this.hoverPlane(ok);
      } else {
        this.preview.visible = false;
        if (this._hoverPlane) this._hoverPlane.visible = false;
      }
    }
  }

  hoverPlane(ok) {
    if (!this._hoverPlane) {
      this._hoverPlane = this.r.makeHoverPlane();
      this.r.scene.add(this._hoverPlane);
    }
    const hp = this._hoverPlane;
    hp.visible = true;
    hp.position.set((this.hover.x + 0.5) * S, 0.04, (this.hover.z + 0.5) * S);
    hp.material.color.setHex(ok ? 0x18e0ff : 0xff4030);
  }
}
