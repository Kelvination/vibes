/**
 * Three.js 3D viewport for previewing geometry node output.
 */
class Viewport3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.meshes = [];
    this.wireframeMode = false;
    this.autoRotate = false;
    this.orbitAngle = 0;
    this.orbitPhi = 0.6;
    this.orbitDist = 5;
    this.orbitTarget = { x: 0, y: 0, z: 0 };
    this.isActive = false;

    // Touch orbit state
    this.lastTouch = null;
    this.lastPinchDist = null;

    this._init();
  }

  _init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this._updateCamera();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 6);
    this.scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x4fc3f7, 0.3);
    dirLight2.position.set(-3, 2, -4);
    this.scene.add(dirLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x2d3a55, 0x1e2a45);
    this.scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(1);
    this.scene.add(axesHelper);

    // Events
    this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this._onTouchEnd(), { passive: false });
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.isActive) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.isActive = true;
    this.resize();
    this._animate();
  }

  stop() {
    this.isActive = false;
  }

  _animate() {
    if (!this.isActive) return;
    requestAnimationFrame(() => this._animate());
    this.renderer.render(this.scene, this.camera);
  }

  _updateCamera() {
    const x = this.orbitTarget.x + this.orbitDist * Math.sin(this.orbitAngle) * Math.cos(this.orbitPhi);
    const y = this.orbitTarget.y + this.orbitDist * Math.sin(this.orbitPhi);
    const z = this.orbitTarget.z + this.orbitDist * Math.cos(this.orbitAngle) * Math.cos(this.orbitPhi);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.orbitTarget.x, this.orbitTarget.y, this.orbitTarget.z);
  }

  resetCamera() {
    this.orbitAngle = 0.6;
    this.orbitPhi = 0.5;
    this.orbitDist = 5;
    this.orbitTarget = { x: 0, y: 0, z: 0 };
    this._updateCamera();
  }

  toggleWireframe() {
    this.wireframeMode = !this.wireframeMode;
    for (const mesh of this.meshes) {
      if (mesh.material) {
        mesh.material.wireframe = this.wireframeMode;
      }
    }
    return this.wireframeMode;
  }

  // ===== Touch/mouse orbit controls =====
  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.lastPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    } else if (e.touches.length === 1) {
      this.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (this.lastPinchDist) {
        const scale = this.lastPinchDist / dist;
        this.orbitDist = Math.max(1, Math.min(30, this.orbitDist * scale));
        this._updateCamera();
      }
      this.lastPinchDist = dist;
    } else if (e.touches.length === 1 && this.lastTouch) {
      const dx = e.touches[0].clientX - this.lastTouch.x;
      const dy = e.touches[0].clientY - this.lastTouch.y;
      this.orbitAngle -= dx * 0.01;
      this.orbitPhi = Math.max(-1.5, Math.min(1.5, this.orbitPhi + dy * 0.01));
      this._updateCamera();
      this.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  _onTouchEnd() {
    this.lastTouch = null;
    this.lastPinchDist = null;
  }

  _onMouseDown(e) {
    const onMove = (ev) => {
      this.orbitAngle -= ev.movementX * 0.01;
      this.orbitPhi = Math.max(-1.5, Math.min(1.5, this.orbitPhi + ev.movementY * 0.01));
      this._updateCamera();
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  _onWheel(e) {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    this.orbitDist = Math.max(1, Math.min(30, this.orbitDist * scale));
    this._updateCamera();
  }

  // ===== Build geometry from evaluation results =====
  updateGeometry(geometries) {
    // Remove old meshes
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    }
    this.meshes = [];

    if (!geometries || geometries.length === 0) return { verts: 0, faces: 0 };

    let totalVerts = 0;
    let totalFaces = 0;

    for (const geo of geometries) {
      if (!geo) continue;
      const result = this._buildMesh(geo);
      if (result) {
        this.scene.add(result.mesh);
        this.meshes.push(result.mesh);
        totalVerts += result.verts;
        totalFaces += result.faces;
      }
    }

    return { verts: totalVerts, faces: totalFaces };
  }

  _buildMesh(geoData) {
    let geometry = this._buildGeometry(geoData);
    if (!geometry) return null;

    const isWireframeOnly = geoData.wireframeOnly;
    const isPoints = geoData.type === 'points';
    const isCurve = geoData.type === 'curve_circle' || geoData.type === 'curve_line' || geoData.type === 'spiral';

    // Apply flipFaces
    if (geoData.flipFaces && geometry.index) {
      const idx = geometry.index.array;
      for (let i = 0; i < idx.length; i += 3) {
        const tmp = idx[i + 1];
        idx[i + 1] = idx[i + 2];
        idx[i + 2] = tmp;
      }
      geometry.index.needsUpdate = true;
    }

    let mesh;

    if (isPoints) {
      const pointsMaterial = new THREE.PointsMaterial({
        color: 0x69f0ae,
        size: 0.08,
        sizeAttenuation: true,
      });
      mesh = new THREE.Points(geometry, pointsMaterial);
    } else if (isCurve) {
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffab40, linewidth: 2 });
      mesh = new THREE.LineLoop(geometry, lineMaterial);
    } else {
      const material = new THREE.MeshStandardMaterial({
        color: isWireframeOnly ? 0x4fc3f7 : 0x6688cc,
        metalness: 0.1,
        roughness: 0.6,
        flatShading: !geoData.smooth,
        wireframe: this.wireframeMode || isWireframeOnly,
        side: THREE.DoubleSide,
        transparent: isWireframeOnly,
        opacity: isWireframeOnly ? 0.4 : 1,
      });
      mesh = new THREE.Mesh(geometry, material);
    }

    // Apply transforms
    if (geoData.transforms) {
      for (const t of geoData.transforms) {
        if (t.translate) {
          mesh.position.x += t.translate.x || 0;
          mesh.position.y += t.translate.y || 0;
          mesh.position.z += t.translate.z || 0;
        }
        if (t.rotate) {
          mesh.rotation.x += t.rotate.x || 0;
          mesh.rotation.y += t.rotate.y || 0;
          mesh.rotation.z += t.rotate.z || 0;
        }
        if (t.scale) {
          mesh.scale.x *= t.scale.x || 1;
          mesh.scale.y *= t.scale.y || 1;
          mesh.scale.z *= t.scale.z || 1;
        }
      }
    }

    // Apply set position as translation (simplified)
    if (geoData.setPosition) {
      const off = geoData.setPosition.offset;
      if (off) {
        mesh.position.x += off.x || 0;
        mesh.position.y += off.y || 0;
        mesh.position.z += off.z || 0;
      }
    }

    const verts = geometry.getAttribute('position')?.count || 0;
    const indexCount = geometry.index ? geometry.index.count : verts;
    const faces = Math.floor(indexCount / 3);

    return { mesh, verts, faces };
  }

  _buildGeometry(geoData) {
    let geometry;

    switch (geoData.type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(
          geoData.sizeX || 1, geoData.sizeY || 1, geoData.sizeZ || 1
        );
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(
          geoData.radius || 1,
          geoData.segments || 16,
          geoData.rings || 8
        );
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          geoData.radius || 1,
          geoData.radius || 1,
          geoData.depth || 2,
          geoData.vertices || 16
        );
        break;

      case 'cone':
        geometry = new THREE.CylinderGeometry(
          geoData.radius2 ?? 0,
          geoData.radius1 || 1,
          geoData.depth || 2,
          geoData.vertices || 16
        );
        break;

      case 'torus':
        geometry = new THREE.TorusGeometry(
          geoData.majorRadius || 1,
          geoData.minorRadius || 0.3,
          geoData.minorSegments || 12,
          geoData.majorSegments || 24
        );
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(
          geoData.sizeX || 2,
          geoData.sizeY || 2,
          geoData.subdX || 1,
          geoData.subdY || 1
        );
        break;

      case 'icosphere':
        geometry = new THREE.IcosahedronGeometry(
          geoData.radius || 1,
          geoData.detail || 1
        );
        break;

      case 'line': {
        const pts = [];
        const count = Math.max(2, geoData.count || 10);
        const s = geoData.start || { x: 0, y: 0, z: 0 };
        const e = geoData.end || { x: 0, y: 0, z: 1 };
        for (let i = 0; i < count; i++) {
          const t = count > 1 ? i / (count - 1) : 0;
          pts.push(s.x + (e.x - s.x) * t, s.y + (e.y - s.y) * t, s.z + (e.z - s.z) * t);
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        break;
      }

      case 'points': {
        // Generate scattered points on a unit surface
        const numPoints = Math.min(200, Math.round(geoData.density * 10));
        const pts = [];
        const seed = geoData.seed || 0;
        for (let i = 0; i < numPoints; i++) {
          const s = seed * 1000 + i;
          const theta = seededRandom(s) * Math.PI * 2;
          const phi = Math.acos(2 * seededRandom(s + 7777) - 1);
          const r = Math.cbrt(seededRandom(s + 13333));
          pts.push(Math.sin(phi) * Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r, Math.cos(phi) * r);
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        break;
      }

      case 'curve_circle': {
        const res = geoData.resolution || 16;
        const r = geoData.radius || 1;
        const pts = [];
        for (let i = 0; i <= res; i++) {
          const angle = (i / res) * Math.PI * 2;
          pts.push(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        break;
      }

      case 'curve_line': {
        const s = geoData.start || { x: 0, y: 0, z: 0 };
        const e = geoData.end || { x: 0, y: 0, z: 1 };
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([s.x, s.y, s.z, e.x, e.y, e.z], 3));
        break;
      }

      case 'curve_to_mesh': {
        // Build a tube along the curve with the profile shape
        const curveData = geoData.curve;
        if (!curveData) return null;

        if (curveData.type === 'curve_circle' || curveData.type === 'spiral') {
          // Build a tube along the curve
          const profile = geoData.profile;
          const profileRadius = profile?.radius || 0.1;
          const res = curveData.resolution || 16;
          const tubeSeg = 8;

          // Generate curve points
          const curvePts = [];
          if (curveData.type === 'curve_circle') {
            const r = curveData.radius || 1;
            for (let i = 0; i <= res; i++) {
              const angle = (i / res) * Math.PI * 2;
              curvePts.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
            }
          } else {
            // Spiral
            for (let i = 0; i <= res; i++) {
              const t = i / res;
              const angle = t * curveData.turns * Math.PI * 2;
              const r = curveData.startRadius + (curveData.endRadius - curveData.startRadius) * t;
              const y = t * curveData.height;
              curvePts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
            }
          }

          const path = new THREE.CatmullRomCurve3(curvePts, curveData.type === 'curve_circle');
          geometry = new THREE.TubeGeometry(path, res, profileRadius, tubeSeg, curveData.type === 'curve_circle');
        } else {
          // For a curve line, make a thin cylinder
          const s = curveData.start || { x: 0, y: 0, z: 0 };
          const e = curveData.end || { x: 0, y: 0, z: 1 };
          const profile = geoData.profile;
          const profileRadius = profile?.radius || 0.05;
          const start = new THREE.Vector3(s.x, s.y, s.z);
          const end = new THREE.Vector3(e.x, e.y, e.z);
          const path = new THREE.LineCurve3(start, end);
          geometry = new THREE.TubeGeometry(path, 1, profileRadius, 8, false);
        }
        break;
      }

      case 'fill_curve': {
        // Create a flat disc or shape from curve
        const curveData = geoData.curve;
        if (curveData && curveData.type === 'curve_circle') {
          geometry = new THREE.CircleGeometry(curveData.radius || 1, curveData.resolution || 16);
        } else {
          geometry = new THREE.CircleGeometry(1, 16);
        }
        break;
      }

      case 'spiral': {
        const res = geoData.resolution || 64;
        const pts = [];
        for (let i = 0; i <= res; i++) {
          const t = i / res;
          const angle = t * geoData.turns * Math.PI * 2;
          const r = geoData.startRadius + (geoData.endRadius - geoData.startRadius) * t;
          const y = t * geoData.height;
          pts.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        break;
      }

      case 'boolean': {
        // Build mesh A (we can't do true CSG without a library, so show both)
        const a = geoData.meshA;
        if (!a) return null;
        geometry = this._buildGeometry(a);
        // TODO: Could integrate a CSG library for real booleans
        break;
      }

      case 'instance_on_points': {
        // Build the source instance geometry and clone it at point locations
        const pts = geoData.points;
        const inst = geoData.instance;
        if (!pts || !inst) return null;

        const instanceGeo = this._buildGeometry(inst);
        if (!instanceGeo) return null;

        // Generate points
        const numPts = Math.min(50, Math.round((pts.density || 1) * 10));
        const seed = pts.seed || 0;
        const merged = [];

        for (let i = 0; i < numPts; i++) {
          const s = seed * 1000 + i;
          const theta = seededRandom(s) * Math.PI * 2;
          const phi = Math.acos(2 * seededRandom(s + 7777) - 1);
          const r = Math.cbrt(seededRandom(s + 13333));
          const px = Math.sin(phi) * Math.cos(theta) * r;
          const py = Math.sin(phi) * Math.sin(theta) * r;
          const pz = Math.cos(phi) * r;

          const clone = instanceGeo.clone();
          clone.translate(px, py, pz);
          const sc = geoData.scale || { x: 1, y: 1, z: 1 };
          clone.scale(sc.x, sc.y, sc.z);
          merged.push(clone);
        }

        if (merged.length === 0) return instanceGeo;

        // Merge all geometries
        const positions = [];
        const normals = [];
        const indices = [];
        let vertOffset = 0;

        for (const g of merged) {
          const pos = g.getAttribute('position');
          const norm = g.getAttribute('normal');
          const idx = g.index;

          for (let j = 0; j < pos.count; j++) {
            positions.push(pos.getX(j), pos.getY(j), pos.getZ(j));
            if (norm) normals.push(norm.getX(j), norm.getY(j), norm.getZ(j));
          }

          if (idx) {
            for (let j = 0; j < idx.count; j++) {
              indices.push(idx.getX(j) + vertOffset);
            }
          }

          vertOffset += pos.count;
          g.dispose();
        }

        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        if (normals.length > 0) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        if (indices.length > 0) geometry.setIndex(indices);
        if (normals.length === 0) geometry.computeVertexNormals();

        instanceGeo.dispose();
        break;
      }

      default:
        return null;
    }

    // Apply extrude by scaling geometry
    if (geoData.extrude) {
      const offset = geoData.extrude.offset || 0;
      if (offset !== 0) {
        geometry.scale(1 + Math.abs(offset) * 0.5, 1 + Math.abs(offset) * 0.5, 1 + Math.abs(offset) * 0.5);
      }
    }

    // Apply scale elements
    if (geoData.scaleElements) {
      const s = geoData.scaleElements.scale;
      geometry.scale(s, s, s);
    }

    return geometry;
  }
}
