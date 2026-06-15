// Wall Hugger — Three.js presentation layer (PRD §8). Low-poly, high readability.

import * as THREE from 'three';
import { S, MARGIN, GRID, BLOCKS } from './blocks.js';
import { Z_ARMED, Z_TRACKING, Z_PAID, Z_VOID } from './sim.js';

const COL = {
  sky: 0x141d2e, fog: 0x141d2e, ground: 0x1d2b22,
  asphalt: 0x3c4250, dirt: 0x8a5a2b, boost: 0xe8c020,
  wall: 0x9aa3b2, wallTop: 0xb8c0cc,
  cp: 0x2e7fff, finishA: 0xffffff, finishB: 0x111111, startStrip: 0x40d080,
  zoneArmed: 0x18e0ff, zoneApex: 0x7cff4a, zonePaid: 0x2a6a78, zoneVoid: 0x7a1c1c,
  car: 0xff4633, ghost: 0x18e0ff,
};

function checkerTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 16;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
    g.fillStyle = (i + j) % 2 ? '#101010' : '#f5f5f5';
    g.fillRect(i * 8, j * 8, 8, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  return t;
}

export class Renderer3D {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COL.sky);
    this.scene.fog = new THREE.Fog(COL.fog, 180, 520);
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.1, 1200);

    this.scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x32281e, 1.05));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.1);
    sun.position.set(120, 220, 80);
    this.scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID * S * 3, GRID * S * 3),
      new THREE.MeshLambertMaterial({ color: COL.ground })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(GRID * S / 2, -0.05, GRID * S / 2);
    this.scene.add(ground);

    this.grid = new THREE.GridHelper(GRID * S, GRID, 0x3a4a5c, 0x26303e);
    this.grid.position.set(GRID * S / 2, 0.02, GRID * S / 2);
    this.grid.visible = false;
    this.scene.add(this.grid);

    this.trackGroup = null;
    this.zoneMats = [];
    this.showGuides = false; // editor-only racing-line preview
    this.checker = checkerTexture();

    this.car = this.makeCar(COL.car, 1);
    this.scene.add(this.car);
    this.ghost = this.makeCar(COL.ghost, 0.35);
    this.ghost.visible = false;
    this.scene.add(this.ghost);

    // charge sparks while in a zone (render-only, never touches the sim)
    const sparkGeo = new THREE.BufferGeometry();
    this.sparkPos = new Float32Array(36 * 3);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
    this.sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: COL.zoneArmed, size: 0.45, transparent: true, opacity: 0,
    }));
    this.scene.add(this.sparks);

    // skid marks: a fixed pool of dark quads written as a ring buffer. Each
    // sliding wheel lays one quad per frame connecting its last ground spot to
    // the current one; the oldest marks are overwritten once the pool fills.
    this.skidMax = 6000;                       // quads (≈ a long trail)
    const skidPos = new Float32Array(this.skidMax * 4 * 3);
    const skidIdx = new Uint16Array(this.skidMax * 6);
    for (let i = 0; i < this.skidMax; i++) {
      const b = i * 4, o = i * 6;
      skidIdx[o] = b; skidIdx[o + 1] = b + 1; skidIdx[o + 2] = b + 2;
      skidIdx[o + 3] = b; skidIdx[o + 4] = b + 2; skidIdx[o + 5] = b + 3;
    }
    const skidGeo = new THREE.BufferGeometry();
    skidGeo.setAttribute('position', new THREE.BufferAttribute(skidPos, 3));
    skidGeo.setIndex(new THREE.BufferAttribute(skidIdx, 1));
    skidGeo.setDrawRange(0, 0);
    this.skidPos = skidPos;
    this.skidMesh = new THREE.Mesh(skidGeo, new THREE.MeshBasicMaterial({
      color: 0x0a0c10, transparent: true, opacity: 0.4,
      depthWrite: false, side: THREE.DoubleSide,
    }));
    this.skidMesh.renderOrder = 1;
    // We rewrite vertices in place without recomputing the bounding volume, so
    // disable culling — otherwise the whole mesh pops in/out depending on
    // whether its stale (origin) bounding sphere is in the frustum.
    this.skidMesh.frustumCulled = false;
    this.scene.add(this.skidMesh);
    this.skidWrite = 0;        // next quad slot
    this.skidCount = 0;        // quads written so far (caps at skidMax)
    this.skidActive = false;   // hysteresis latch so the trail doesn't dash
    // local (x, z) wheel anchors mirroring makeCar(); +z is forward
    this.skidWheels = [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]];
    this.skidPrev = this.skidWheels.map(() => null); // last ground point / wheel

    this.camMode = 'chase';
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.time = 0;
    this.resize();
  }

  makeCar(color, opacity) {
    const g = new THREE.Group();
    const tr = opacity < 1;
    const mat = new THREE.MeshLambertMaterial({ color, transparent: tr, opacity });
    const dark = new THREE.MeshLambertMaterial({ color: 0x14181f, transparent: tr, opacity });
    const glass = new THREE.MeshLambertMaterial({ color: 0x0a0e16, transparent: tr, opacity });
    const accent = new THREE.MeshLambertMaterial({
      color: new THREE.Color(color).offsetHSL(0, 0.05, 0.14), transparent: tr, opacity,
    });
    const add = (parent, geo, m, x, y, z, ry = 0) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      if (ry) mesh.rotation.y = ry;
      parent.add(mesh);
      return mesh;
    };

    // Sprung mass — a low, wedge-nosed sports prototype. Tilts with the
    // suspension; the wheels stay planted so the body visibly rolls and dives.
    const chassis = new THREE.Group();
    g.add(chassis);
    // low wide hull + raised engine/cockpit deck
    add(chassis, new THREE.BoxGeometry(1.78, 0.42, 4.0), mat, 0, 0.40, -0.1);
    add(chassis, new THREE.BoxGeometry(1.62, 0.34, 2.0), mat, 0, 0.66, -0.5);
    // wedge nose (lower at the tip) + front splitter
    add(chassis, new THREE.BoxGeometry(1.5, 0.26, 1.5), mat, 0, 0.30, 1.55);
    add(chassis, new THREE.BoxGeometry(1.86, 0.07, 0.5), dark, 0, 0.17, 2.15);
    // canopy / cockpit glass, tapered toward the tail
    add(chassis, new THREE.BoxGeometry(1.14, 0.40, 1.5), glass, 0, 0.98, -0.05);
    add(chassis, new THREE.BoxGeometry(0.9, 0.30, 0.9), glass, 0, 1.16, 0.2);
    // dorsal accent stripe + rear haunches
    add(chassis, new THREE.BoxGeometry(0.34, 0.06, 3.0), accent, 0, 0.86, -0.3);
    add(chassis, new THREE.BoxGeometry(1.8, 0.40, 1.2), mat, 0, 0.5, -1.5);
    // side skirts
    add(chassis, new THREE.BoxGeometry(0.16, 0.18, 2.4), dark, -0.92, 0.28, -0.1);
    add(chassis, new THREE.BoxGeometry(0.16, 0.18, 2.4), dark, 0.92, 0.28, -0.1);
    // rear wing on two pylons
    add(chassis, new THREE.BoxGeometry(0.1, 0.36, 0.16), dark, -0.6, 0.96, -1.95);
    add(chassis, new THREE.BoxGeometry(0.1, 0.36, 0.16), dark, 0.6, 0.96, -1.95);
    add(chassis, new THREE.BoxGeometry(1.84, 0.08, 0.52), accent, 0, 1.18, -2.0);
    // twin exhaust tips
    add(chassis, new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), dark, -0.35, 0.4, -2.05).rotation.x = Math.PI / 2;
    add(chassis, new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), dark, 0.35, 0.4, -2.05).rotation.x = Math.PI / 2;

    // wheels — low-profile, rears wider/taller for a planted stance
    const frontGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.34, 12);
    const rearGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.46, 12);
    const frontWheels = [];
    for (const [x, z, front] of [[-0.95, 1.35, true], [0.95, 1.35, true], [-0.95, -1.35, false], [0.95, -1.35, false]]) {
      const pivot = new THREE.Group();        // steers (front) about vertical
      pivot.position.set(x, front ? 0.4 : 0.45, z);
      const w = new THREE.Mesh(front ? frontGeo : rearGeo, dark);
      w.rotation.z = Math.PI / 2;
      pivot.add(w);
      // wheel hub accent
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), accent);
      hub.rotation.z = Math.PI / 2;
      pivot.add(hub);
      g.add(pivot);
      if (front) frontWheels.push(pivot);
    }

    g.userData.chassis = chassis;
    g.userData.frontWheels = frontWheels;
    return g;
  }

  // ---- track building ----

  clearTrack() {
    if (this.trackGroup) {
      this.scene.remove(this.trackGroup);
      this.trackGroup.traverse((o) => { o.geometry?.dispose?.(); });
      this.trackGroup = null;
    }
    this.zoneMats = [];
  }

  buildTrack(track) {
    this.clearTrack();
    const g = new THREE.Group();

    for (const p of track.placements) g.add(this.buildSurfaceGroup(p));

    // walls (world segments)
    const wallMat = new THREE.MeshLambertMaterial({ color: COL.wall });
    for (const w of track.walls) {
      g.add(this.wallBox(w.a, w.b, wallMat));
    }

    // hug-zone emissive ribbons (PRD §5.4 visual language). Apex zones (the
    // high-payout 1.5× ones) glow a hotter colour so the best target reads at
    // a glance vs. the cooler entry/exit approach zones.
    this.zoneMults = [];
    for (const z of track.zones) {
      const mat = new THREE.MeshBasicMaterial({ color: COL.zoneArmed, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
      this.zoneMats.push(mat);
      this.zoneMults.push(z.mult || 1);
      for (const off of [0.3, -0.3]) g.add(this.ribbon(z.pts, off, mat));
    }

    // ideal racing-line guides (shown in the editor so zone placement can be
    // checked against the line they reward: outside -> apex -> outside)
    if (track.guides?.length && this.showGuides) {
      const guideMat = new THREE.LineBasicMaterial({ color: 0x45e07a, transparent: true, opacity: 0.85 });
      for (const pts of track.guides) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0.18, p.z)));
        g.add(new THREE.Line(geo, guideMat));
      }
    }

    this.scene.add(g);
    this.trackGroup = g;
    return g;
  }

  wallBox(a, b, mat) {
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.25, len + 0.18), mat);
    m.position.set((a.x + b.x) / 2, 0.62, (a.z + b.z) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    return m;
  }

  ribbon(pts, offset, mat) {
    const n = pts.length;
    const verts = new Float32Array(n * 2 * 3);
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      const dx = p1.x - p0.x, dz = p1.z - p0.z;
      const l = Math.hypot(dx, dz) || 1;
      const nx = dz / l, nz = -dx / l;
      const x = pts[i].x + nx * offset, z = pts[i].z + nz * offset;
      verts.set([x, 0.12, z, x, 1.32, z], i * 6);
    }
    const idx = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(idx);
    return new THREE.Mesh(geo, mat);
  }

  buildSurfaceGroup(p) {
    const def = BLOCKS[p.id];
    const r = p.rot & 3;
    const w = def.W * S, h = def.H * S;
    const G = new THREE.Group();
    G.position.set(p.x * S, 0, p.z * S);
    const I = new THREE.Group();
    I.rotation.y = r * Math.PI / 2;
    const T = [[0, 0], [0, w], [w, h], [h, 0]][r];
    I.position.set(T[0], 0, T[1]);
    // Children of I are authored in local block coords, but THREE applies
    // I's rotation to children directly; we want placed = R(local) + T,
    // and THREE gives placed = R(local) + I.position — matches rotPt().
    G.add(I);

    const flat = (wd, ln, color, x, z, y = 0.06, tex = null) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(wd, ln),
        tex ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshLambertMaterial({ color })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      I.add(m);
      return m;
    };

    const roadW = S - 2 * MARGIN;
    switch (p.id) {
      case 'road': case 'road_hug':
        flat(roadW, S, COL.asphalt, S / 2, S / 2); break;
      case 'dirt':
        flat(roadW, S, COL.dirt, S / 2, S / 2); break;
      case 'start':
        flat(roadW, S, COL.asphalt, S / 2, S / 2);
        flat(roadW, 1.8, COL.startStrip, S / 2, S / 2, 0.08);
        break;
      case 'checkpoint':
        flat(roadW, S, COL.asphalt, S / 2, S / 2);
        flat(roadW, 1.8, COL.cp, S / 2, S / 2, 0.08);
        break;
      case 'finish':
        flat(roadW, S, COL.asphalt, S / 2, S / 2);
        flat(roadW, 3, null, S / 2, S / 2, 0.08, this.checker);
        break;
      case 'booster': {
        flat(roadW, S, COL.asphalt, S / 2, S / 2);
        flat(roadW * 0.7, S * 0.6, COL.boost, S / 2, S / 2, 0.08);
        break;
      }
      case 'curve1': case 'curve2': case 'curve3': case 'dirt_curve': {
        const k = def.curveK || 1;
        const rIn = (k - 1) * S + MARGIN, rOut = k * S - MARGIN;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(rIn, rOut, 14 * k, 1, -Math.PI, Math.PI / 2),
          new THREE.MeshLambertMaterial({ color: p.id === 'dirt_curve' ? COL.dirt : COL.asphalt })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(k * S, 0.06, 0);
        I.add(ring);
        break;
      }
      // wall / hugwall: no surface; wall boxes come from compiled track
    }
    return G;
  }

  // Preview mesh for the editor (surfaces + local walls, semi-transparent handled by caller)
  buildPreview(p) {
    const def = BLOCKS[p.id];
    const G = this.buildSurfaceGroup(p);
    const geo = def.geo(p);
    const r = p.rot & 3, w = def.W * S, h = def.H * S;
    const wallMat = new THREE.MeshLambertMaterial({ color: COL.wall, transparent: true, opacity: 0.6 });
    // walls are added in placed coords relative to the anchor
    const I = new THREE.Group();
    G.add(I);
    for (const seg of geo.walls) {
      const a = this.rotLocal(seg.a, r, w, h), b = this.rotLocal(seg.b, r, w, h);
      I.add(this.wallBox(a, b, wallMat));
    }
    return G;
  }

  rotLocal(p, r, w, h) {
    switch (r & 3) {
      case 0: return { x: p.x, z: p.z };
      case 1: return { x: p.z, z: w - p.x };
      case 2: return { x: w - p.x, z: h - p.z };
      default: return { x: h - p.z, z: p.x };
    }
  }

  // ---- per-frame updates ----

  updateZones(zoneStates, liveCloseness) {
    const t = this.time;
    for (let i = 0; i < this.zoneMats.length; i++) {
      const mat = this.zoneMats[i];
      const st = zoneStates ? zoneStates[i].state : Z_ARMED;
      const apex = (this.zoneMults?.[i] || 1) > 1.2;
      if (st === Z_ARMED) {
        mat.color.setHex(apex ? COL.zoneApex : COL.zoneArmed);
        mat.opacity = (apex ? 0.62 : 0.5) + 0.35 * Math.sin(t * 4 + i);
      } else if (st === Z_TRACKING) {
        mat.color.setHex(0x9ff8ff);
        mat.opacity = 0.85 + 0.15 * Math.sin(t * 18);
      } else if (st === Z_PAID) {
        mat.color.setHex(COL.zonePaid);
        mat.opacity = 0.5;
      } else {
        mat.color.setHex(COL.zoneVoid);
        mat.opacity = 0.6;
      }
    }
  }

  updateCar(group, x, z, h, deploying, lean) {
    group.position.set(x, 0, z);
    group.rotation.y = h;
    const ch = group.userData.chassis;
    if (ch) {
      ch.rotation.x = lean ? lean.pitch : 0;
      ch.rotation.z = lean ? lean.roll : 0;
      ch.position.y = lean ? lean.heave : 0;
    }
    const fw = group.userData.frontWheels;
    if (fw) { const s = lean ? lean.steer : 0; fw[0].rotation.y = s; fw[1].rotation.y = s; }
    // ERS exhaust glow: visible only while deploying, pulsing for life
    const glow = group.userData.glow;
    if (glow) {
      glow.visible = !!deploying;
      if (deploying) {
        const pulse = 0.85 + 0.15 * Math.sin(this.time * 28);
        glow.scale.set(pulse, pulse, 1 + 0.25 * Math.sin(this.time * 22));
        glow.material.opacity = 0.6 + 0.25 * Math.sin(this.time * 24);
      }
    }
  }

  // one-shot extra spark pop when the car first enters a hug zone
  sparkBurst() { this._burst = 1; }

  // accumulate camera trauma from a wall impact (decays in updateChase)
  addShake(impact) { this.shake = Math.min(1, (this.shake || 0) + 0.18 + impact * 0.045); }

  updateSparks(car, live) {
    const mat = this.sparks.material;
    this._burst = (this._burst || 0) * 0.85;
    if (!live.active && this._burst < 0.02) { mat.opacity = Math.max(0, mat.opacity - 0.1); return; }
    mat.opacity = Math.min(1, 0.5 + 0.5 * live.closeness + this._burst);
    mat.size = 0.3 + live.closeness * 0.5 + this._burst * 0.6;
    for (let i = 0; i < 36; i++) {
      this.sparkPos[i * 3] = car.x + (Math.random() - 0.5) * 3.4;
      this.sparkPos[i * 3 + 1] = Math.random() * 1.3;
      this.sparkPos[i * 3 + 2] = car.z + (Math.random() - 0.5) * 3.4;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  // Lay rubber under sliding wheels. `car` carries the sim state (vL lateral
  // speed, sliding flag, speed); pass null to pause + break the trail (e.g.
  // during the countdown or on respawn) so no quad bridges the gap.
  updateSkids(x, z, h, car) {
    const SKID_SLIP = 1.0, HALF_W = 0.17, MIN_STEP = 0.04;
    const slip = car ? Math.abs(car.vL) : 0;
    // Hysteresis: latch on past the threshold, latch off only well below it, so
    // a tire hovering near the limit lays one continuous mark, not dashes.
    if (!car || car.speed < 2.5) this.skidActive = false;
    else if (this.skidActive) this.skidActive = slip > SKID_SLIP * 0.5 || car.sliding;
    else this.skidActive = slip > SKID_SLIP || car.sliding;
    const skidding = this.skidActive;
    const ch = Math.cos(h), sh = Math.sin(h);
    let dirty = false;
    for (let wi = 0; wi < this.skidWheels.length; wi++) {
      if (!skidding) { this.skidPrev[wi] = null; continue; }
      const [lx, lz] = this.skidWheels[wi];
      const wx = x + lx * ch + lz * sh;
      const wz = z - lx * sh + lz * ch;
      const prev = this.skidPrev[wi];
      if (prev) {
        const dx = wx - prev.x, dz = wz - prev.z;
        const len = Math.hypot(dx, dz);
        if (len >= MIN_STEP) {
          const px = (-dz / len) * HALF_W, pz = (dx / len) * HALF_W;
          const b = this.skidWrite * 12, p = this.skidPos;
          p[b]      = prev.x + px; p[b + 1]  = 0.07; p[b + 2]  = prev.z + pz;
          p[b + 3]  = prev.x - px; p[b + 4]  = 0.07; p[b + 5]  = prev.z - pz;
          p[b + 6]  = wx - px;     p[b + 7]  = 0.07; p[b + 8]  = wz - pz;
          p[b + 9]  = wx + px;     p[b + 10] = 0.07; p[b + 11] = wz + pz;
          this.skidWrite = (this.skidWrite + 1) % this.skidMax;
          this.skidCount = Math.min(this.skidCount + 1, this.skidMax);
          dirty = true;
          this.skidPrev[wi] = { x: wx, z: wz };
        }
      } else {
        this.skidPrev[wi] = { x: wx, z: wz };
      }
    }
    if (dirty) {
      this.skidMesh.geometry.attributes.position.needsUpdate = true;
      this.skidMesh.geometry.setDrawRange(0, this.skidCount * 6);
    }
  }

  clearSkids() {
    this.skidWrite = 0;
    this.skidCount = 0;
    this.skidActive = false;
    this.skidPrev = this.skidWheels.map(() => null);
    this.skidMesh.geometry.setDrawRange(0, 0);
  }

  snapCamera(car) {
    const fx = Math.sin(car.h), fz = Math.cos(car.h);
    this.camPos.set(car.x - fx * 11, 5.2, car.z - fz * 11);
    this.camLook.set(car.x + fx * 6, 1.2, car.z + fz * 6);
  }

  updateChase(car, speed, deploying, dt) {
    const fx = Math.sin(car.h), fz = Math.cos(car.h);
    const rx = Math.cos(car.h), rz = -Math.sin(car.h);   // car's right vector
    const yaw = car.yaw || 0;
    const kick = deploying ? 5 : 0;                       // ERS FOV punch
    // decaying impact shake -> small random camera jitter
    this.shake = (this.shake || 0) * Math.exp(-dt * 6);
    const sh = this.shake;
    const jx = (Math.random() - 0.5) * sh * 1.4;
    const jy = (Math.random() - 0.5) * sh * 1.0;
    if (this.camMode === 'hood') {
      this.camera.position.set(car.x + fx * 0.6 + jx, 1.25 + jy, car.z + fz * 0.6);
      this.camera.lookAt(car.x + fx * 30, 0.9, car.z + fz * 30);
      this.camera.fov = 78 + Math.min(speed, 70) * 0.18 + kick;
    } else {
      const back = 10.5 + Math.min(speed, 70) * 0.05;
      const tx = car.x - fx * back, tz = car.z - fz * back;
      const k = 1 - Math.exp(-dt * 7);
      this.camPos.x += (tx - this.camPos.x) * k;
      this.camPos.z += (tz - this.camPos.z) * k;
      this.camPos.y += (5.2 - this.camPos.y) * k;
      this.camera.position.set(this.camPos.x + jx, this.camPos.y + jy, this.camPos.z);
      // look ahead AND lead into the corner by yaw rate, so the apex you're
      // aiming for stays in frame instead of the outside wall
      const lead = Math.max(-6, Math.min(6, yaw * 9));
      this.camera.lookAt(car.x + fx * 7 + rx * lead, 1.1, car.z + fz * 7 + rz * lead);
      this.camera.fov = 70 + Math.min(speed, 70) * 0.22 + kick;
    }
    this.camera.updateProjectionMatrix();
  }

  setOrbit(target, yaw, pitch, dist) {
    const cx = target.x + dist * Math.cos(pitch) * Math.sin(yaw);
    const cz = target.z + dist * Math.cos(pitch) * Math.cos(yaw);
    this.camera.position.set(cx, target.y + dist * Math.sin(pitch), cz);
    this.camera.lookAt(target.x, target.y, target.z);
    this.camera.fov = 55;
    this.camera.updateProjectionMatrix();
  }

  makeHoverPlane() {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(S, S),
      new THREE.MeshBasicMaterial({ color: 0x18e0ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  resize() {
    const w = innerWidth, ht = innerHeight;
    this.renderer.setSize(w, ht);
    this.camera.aspect = w / ht;
    this.camera.updateProjectionMatrix();
  }

  render(dt) {
    this.time += dt;
    this.renderer.render(this.scene, this.camera);
  }
}
