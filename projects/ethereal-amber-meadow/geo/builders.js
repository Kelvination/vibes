/**
 * geo/builders.js - Build Three.js geometries from geometry data descriptors.
 *
 * THREE is available as a global (loaded via CDN script tag before modules).
 */

import { seededRandom } from '../core/utils.js';

/**
 * Build a Three.js BufferGeometry from a geometry data descriptor.
 * Handles all primitive types, curves, booleans, and instancing,
 * plus post-processing (extrude, scaleElements).
 *
 * @param {object} geoData - Geometry descriptor produced by the node evaluator.
 * @returns {THREE.BufferGeometry|null}
 */
export function buildGeometry(geoData) {
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

    case 'mesh_circle': {
      const verts = geoData.vertices || 32;
      const r = geoData.radius || 1;
      const fill = geoData.fillType || 'ngon';
      if (fill === 'none') {
        // Just the edge ring
        const pts = [];
        for (let i = 0; i <= verts; i++) {
          const angle = (i / verts) * Math.PI * 2;
          pts.push(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      } else {
        geometry = new THREE.CircleGeometry(r, verts);
        // CircleGeometry is XY, rotate to XZ
        geometry.rotateX(-Math.PI / 2);
      }
      break;
    }

    case 'curve_arc': {
      const res = geoData.resolution || 16;
      const r = geoData.radius || 1;
      const startA = geoData.startAngle || 0;
      const sweepA = geoData.sweepAngle || (315 * Math.PI / 180);
      const pts = [];
      for (let i = 0; i <= res; i++) {
        const t = i / res;
        const angle = startA + t * sweepA;
        pts.push(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      }
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      break;
    }

    case 'curve_star': {
      const numPts = geoData.points || 5;
      const innerR = geoData.innerRadius || 0.5;
      const outerR = geoData.outerRadius || 1;
      const twist = geoData.twist || 0;
      const pts = [];
      const totalVerts = numPts * 2;
      for (let i = 0; i <= totalVerts; i++) {
        const angle = (i / totalVerts) * Math.PI * 2;
        const isOuter = i % 2 === 0;
        const r = isOuter ? outerR : innerR;
        const a = isOuter ? angle : angle + twist;
        pts.push(Math.cos(a) * r, 0, Math.sin(a) * r);
      }
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      break;
    }

    case 'boolean': {
      // Build mesh A (we can't do true CSG without a library, so show both)
      const a = geoData.meshA;
      if (!a) return null;
      geometry = buildGeometry(a);
      // TODO: Could integrate a CSG library for real booleans
      break;
    }

    case 'instance_on_points': {
      // Build the source instance geometry and clone it at point locations
      const pts = geoData.points;
      const inst = geoData.instance;
      if (!pts || !inst) return null;

      const instanceGeo = buildGeometry(inst);
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

/**
 * Build a complete Three.js mesh (geometry + material + transforms) from geo data.
 * Returns { mesh, verts, faces } or null.
 *
 * @param {object} geoData - Geometry descriptor produced by the node evaluator.
 * @param {boolean} [wireframeMode=false] - Whether to render in wireframe mode.
 * @returns {{ mesh: THREE.Object3D, verts: number, faces: number }|null}
 */
export function buildMesh(geoData, wireframeMode = false) {
  let geometry = buildGeometry(geoData);
  if (!geometry) return null;

  const isWireframeOnly = geoData.wireframeOnly;
  const isPoints = geoData.type === 'points';
  const isCurve = geoData.type === 'curve_circle' || geoData.type === 'curve_line' || geoData.type === 'spiral' || geoData.type === 'curve_arc' || geoData.type === 'curve_star';
  const isUnfilledCircle = geoData.type === 'mesh_circle' && geoData.fillType === 'none';

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
  } else if (isCurve || isUnfilledCircle) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffab40, linewidth: 2 });
    mesh = new THREE.LineLoop(geometry, lineMaterial);
  } else {
    const mat = geoData.material;
    const material = new THREE.MeshStandardMaterial({
      color: mat?.color || (isWireframeOnly ? 0x4fc3f7 : 0x6688cc),
      metalness: mat?.metallic ?? 0.1,
      roughness: mat?.roughness ?? 0.6,
      flatShading: !geoData.smooth,
      wireframe: wireframeMode || isWireframeOnly,
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
