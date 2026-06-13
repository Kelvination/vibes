// WallRush — Three.js presentation layer (PRD §8). Low-poly, high readability.

import * as THREE from 'three';
import { S, MARGIN, GRID, BLOCKS } from './blocks.js';
import { Z_ARMED, Z_TRACKING, Z_PAID, Z_VOID } from './sim.js';

const COL = {
  sky: 0x141d2e, fog: 0x141d2e, ground: 0x1d2b22,
  asphalt: 0x3c4250, dirt: 0x8a5a2b, boost: 0xe8c020,
  wall: 0x9aa3b2, wallTop: 0xb8c0cc,
  cp: 0x2e7fff, finishA: 0xffffff, finishB: 0x111111, startStrip: 0x40d080,
  zoneArmed: 0x18e0ff, zonePaid: 0x2a6a78, zoneVoid: 0x7a1c1c,
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

    this.camMode = 'chase';
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.time = 0;
    this.resize();
  }

  makeCar(color, opacity) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity });
    const dark = new THREE.MeshLambertMaterial({ color: 0x14181f, transparent: opacity < 1, opacity });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 4.2), mat);
    body.position.y = 0.55;
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.7), dark);
    cabin.position.set(0, 1.05, -0.35);
    g.add(cabin);
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 10);
    for (const [x, z] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
      const w = new THREE.Mesh(wheelGeo, dark);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.38, z);
      g.add(w);
    }
    // ERS exhaust glow (PRD §8.1)
    const glow = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 2.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x40c8ff, transparent: true, opacity: 0.75 })
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.set(0, 0.55, -3.0);
    glow.visible = false;
    g.add(glow);
    g.userData.glow = glow;
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

    // hug-zone emissive ribbons (PRD §5.4 visual language)
    for (const z of track.zones) {
      const mat = new THREE.MeshBasicMaterial({ color: COL.zoneArmed, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
      this.zoneMats.push(mat);
      for (const off of [0.3, -0.3]) g.add(this.ribbon(z.pts, off, mat));
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
      case 'curve1': case 'curve2': case 'dirt_curve': {
        const k = p.id === 'curve2' ? 2 : 1;
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
      if (st === Z_ARMED) {
        mat.color.setHex(COL.zoneArmed);
        mat.opacity = 0.55 + 0.35 * Math.sin(t * 4 + i);
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

  updateCar(group, x, z, h, deploying) {
    group.position.set(x, 0, z);
    group.rotation.y = h;
    if (group.userData.glow) group.userData.glow.visible = !!deploying;
  }

  updateSparks(car, live) {
    const mat = this.sparks.material;
    if (!live.active) { mat.opacity = Math.max(0, mat.opacity - 0.1); return; }
    mat.opacity = 0.5 + 0.5 * live.closeness;
    mat.size = 0.3 + live.closeness * 0.5;
    for (let i = 0; i < 36; i++) {
      this.sparkPos[i * 3] = car.x + (Math.random() - 0.5) * 3.4;
      this.sparkPos[i * 3 + 1] = Math.random() * 1.3;
      this.sparkPos[i * 3 + 2] = car.z + (Math.random() - 0.5) * 3.4;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  snapCamera(car) {
    const fx = Math.sin(car.h), fz = Math.cos(car.h);
    this.camPos.set(car.x - fx * 11, 5.2, car.z - fz * 11);
    this.camLook.set(car.x + fx * 6, 1.2, car.z + fz * 6);
  }

  updateChase(car, speed, deploying, dt) {
    const fx = Math.sin(car.h), fz = Math.cos(car.h);
    if (this.camMode === 'hood') {
      this.camera.position.set(car.x + fx * 0.6, 1.25, car.z + fz * 0.6);
      this.camera.lookAt(car.x + fx * 30, 0.9, car.z + fz * 30);
      this.camera.fov = 78 + Math.min(speed, 70) * 0.18 + (deploying ? 4 : 0);
    } else {
      const back = 10.5 + Math.min(speed, 70) * 0.05;
      const tx = car.x - fx * back, tz = car.z - fz * back;
      const k = 1 - Math.exp(-dt * 7);
      this.camPos.x += (tx - this.camPos.x) * k;
      this.camPos.z += (tz - this.camPos.z) * k;
      this.camPos.y += (5.2 - this.camPos.y) * k;
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(car.x + fx * 7, 1.1, car.z + fz * 7);
      this.camera.fov = 70 + Math.min(speed, 70) * 0.22 + (deploying ? 5 : 0);
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
