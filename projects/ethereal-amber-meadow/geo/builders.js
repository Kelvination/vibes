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
    case 'cube': {
      // verticesX/Y/Z are vertex counts; Three.js wants segment counts (vertices - 1)
      const segX = Math.max(1, (geoData.verticesX || 2) - 1);
      const segY = Math.max(1, (geoData.verticesY || 2) - 1);
      const segZ = Math.max(1, (geoData.verticesZ || 2) - 1);
      geometry = new THREE.BoxGeometry(
        geoData.sizeX || 1, geoData.sizeY || 1, geoData.sizeZ || 1,
        segX, segY, segZ
      );
      break;
    }

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
        geoData.vertices || 16,
        geoData.sideSegments || 1,
        geoData.fillType === 'none' // openEnded
      );
      break;

    case 'cone':
      geometry = new THREE.CylinderGeometry(
        geoData.radius2 ?? 0,
        geoData.radius1 || 1,
        geoData.depth || 2,
        geoData.vertices || 16,
        geoData.sideSegments || 1,
        geoData.fillType === 'none' // openEnded
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
      const pts = [];

      if (geoData.source) {
        const sourceGeo = buildGeometry(geoData.source);
        if (sourceGeo) {
          const posAttr = sourceGeo.getAttribute('position');
          const mode = geoData.mode || 'vertices';
          const getIdx = sourceGeo.index
            ? (i) => sourceGeo.index.getX(i)
            : (i) => i;
          const triCount = sourceGeo.index
            ? Math.floor(sourceGeo.index.count / 3)
            : Math.floor(posAttr.count / 3);

          if (mode === 'vertices') {
            // Deduplicate vertex positions
            const seen = new Set();
            for (let i = 0; i < posAttr.count; i++) {
              const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
              const key = x.toFixed(5) + ',' + y.toFixed(5) + ',' + z.toFixed(5);
              if (!seen.has(key)) {
                seen.add(key);
                pts.push(x, y, z);
              }
            }
          } else if (mode === 'faces') {
            // Face center positions
            for (let f = 0; f < triCount; f++) {
              const a = getIdx(f * 3), b = getIdx(f * 3 + 1), c = getIdx(f * 3 + 2);
              pts.push(
                (posAttr.getX(a) + posAttr.getX(b) + posAttr.getX(c)) / 3,
                (posAttr.getY(a) + posAttr.getY(b) + posAttr.getY(c)) / 3,
                (posAttr.getZ(a) + posAttr.getZ(b) + posAttr.getZ(c)) / 3,
              );
            }
          } else if (mode === 'edges') {
            // Edge midpoints (deduplicated)
            const seen = new Set();
            const addEdge = (ai, bi) => {
              const mx = ((posAttr.getX(ai) + posAttr.getX(bi)) / 2).toFixed(5);
              const my = ((posAttr.getY(ai) + posAttr.getY(bi)) / 2).toFixed(5);
              const mz = ((posAttr.getZ(ai) + posAttr.getZ(bi)) / 2).toFixed(5);
              const key = mx + ',' + my + ',' + mz;
              if (!seen.has(key)) {
                seen.add(key);
                pts.push(+mx, +my, +mz);
              }
            };
            for (let f = 0; f < triCount; f++) {
              const a = getIdx(f * 3), b = getIdx(f * 3 + 1), c = getIdx(f * 3 + 2);
              addEdge(a, b);
              addEdge(b, c);
              addEdge(c, a);
            }
          } else if (mode === 'corners') {
            // All face corner positions (includes duplicates at shared vertices)
            const count = sourceGeo.index ? sourceGeo.index.count : posAttr.count;
            for (let i = 0; i < count; i++) {
              const vi = getIdx(i);
              pts.push(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi));
            }
          } else if (mode === 'random' || mode === 'poisson') {
            // Scatter random points on mesh faces weighted by triangle area
            const areas = [];
            let totalArea = 0;
            for (let f = 0; f < triCount; f++) {
              const a = getIdx(f * 3), b = getIdx(f * 3 + 1), c = getIdx(f * 3 + 2);
              const abx = posAttr.getX(b) - posAttr.getX(a);
              const aby = posAttr.getY(b) - posAttr.getY(a);
              const abz = posAttr.getZ(b) - posAttr.getZ(a);
              const acx = posAttr.getX(c) - posAttr.getX(a);
              const acy = posAttr.getY(c) - posAttr.getY(a);
              const acz = posAttr.getZ(c) - posAttr.getZ(a);
              const nx = aby * acz - abz * acy;
              const ny = abz * acx - abx * acz;
              const nz = abx * acy - aby * acx;
              totalArea += Math.sqrt(nx * nx + ny * ny + nz * nz) * 0.5;
              areas.push(totalArea);
            }

            const density = geoData.density || 1;
            const numPoints = Math.min(500, Math.max(1, Math.round(density * totalArea * 10)));
            const seed = geoData.seed || 0;

            for (let i = 0; i < numPoints; i++) {
              const s = seed * 1000 + i;
              const r = seededRandom(s) * totalArea;
              let triIdx = 0;
              for (let f = 0; f < triCount; f++) {
                if (areas[f] >= r) { triIdx = f; break; }
              }
              let u = seededRandom(s + 7777);
              let v = seededRandom(s + 13333);
              if (u + v > 1) { u = 1 - u; v = 1 - v; }
              const w = 1 - u - v;
              const a = getIdx(triIdx * 3), b = getIdx(triIdx * 3 + 1), c = getIdx(triIdx * 3 + 2);
              pts.push(
                posAttr.getX(a) * w + posAttr.getX(b) * u + posAttr.getX(c) * v,
                posAttr.getY(a) * w + posAttr.getY(b) * u + posAttr.getY(c) * v,
                posAttr.getZ(a) * w + posAttr.getZ(b) * u + posAttr.getZ(c) * v,
              );
            }
          }

          sourceGeo.dispose();
        }
      }

      // Fallback: random scattered points when no source mesh is available
      if (pts.length === 0) {
        const numPoints = Math.min(200, Math.round((geoData.density || 1) * 10));
        const seed = geoData.seed || 0;
        for (let i = 0; i < numPoints; i++) {
          const s = seed * 1000 + i;
          const theta = seededRandom(s) * Math.PI * 2;
          const phi = Math.acos(2 * seededRandom(s + 7777) - 1);
          const r = Math.cbrt(seededRandom(s + 13333));
          pts.push(
            Math.sin(phi) * Math.cos(theta) * r,
            Math.sin(phi) * Math.sin(theta) * r,
            Math.cos(phi) * r
          );
        }
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
      // Build the source instance geometry and clone it at actual point locations
      const pts = geoData.points;
      const inst = geoData.instance;
      if (!pts || !inst) return null;

      const instanceGeo = buildGeometry(inst);
      if (!instanceGeo) return null;

      // Build the points geometry to get actual positions
      const pointsGeo = buildGeometry(pts);
      if (!pointsGeo) { instanceGeo.dispose(); return null; }

      const posAttr = pointsGeo.getAttribute('position');
      if (!posAttr || posAttr.count === 0) { pointsGeo.dispose(); instanceGeo.dispose(); return null; }

      const merged = [];
      const sc = geoData.scale || { x: 1, y: 1, z: 1 };

      for (let i = 0; i < posAttr.count; i++) {
        const px = posAttr.getX(i);
        const py = posAttr.getY(i);
        const pz = posAttr.getZ(i);

        const clone = instanceGeo.clone();
        clone.scale(sc.x, sc.y, sc.z);
        clone.translate(px, py, pz);
        merged.push(clone);
      }

      pointsGeo.dispose();

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

  // Apply subdivision (flat or smooth)
  if (geoData.subdivide > 0 || geoData.subdivisionSurface > 0) {
    const levels = geoData.subdivisionSurface || geoData.subdivide || 0;
    const smooth = !!geoData.subdivisionSurface;
    geometry = subdivideGeometry(geometry, Math.min(levels, 4), smooth);
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
 * Subdivide a BufferGeometry using Loop subdivision.
 * Each triangle is split into 4 sub-triangles. If smooth is true,
 * original vertex positions are adjusted (Loop's averaging rule).
 *
 * @param {THREE.BufferGeometry} inputGeo
 * @param {number} levels - Number of subdivision iterations
 * @param {boolean} smooth - Apply position smoothing (true = subdivision surface)
 * @returns {THREE.BufferGeometry}
 */
function subdivideGeometry(inputGeo, levels, smooth) {
  if (levels <= 0) return inputGeo;

  // Ensure we have an indexed geometry to work with
  let geo = inputGeo.index ? inputGeo : inputGeo.toNonIndexed();
  if (!geo.index) {
    // Build trivial index for non-indexed geometry
    const count = geo.getAttribute('position').count;
    const indices = [];
    for (let i = 0; i < count; i++) indices.push(i);
    geo.setIndex(indices);
  }

  for (let iter = 0; iter < levels; iter++) {
    const posAttr = geo.getAttribute('position');
    const indexArr = geo.index.array;
    const triCount = Math.floor(indexArr.length / 3);

    // Collect positions
    const positions = [];
    for (let i = 0; i < posAttr.count; i++) {
      positions.push([posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)]);
    }
    const origVertCount = positions.length;

    // Build edge → midpoint-vertex-index map
    const edgeMidMap = new Map();     // "min,max" → new vertex index
    const edgeToFaces = new Map();    // "min,max" → [triIdx, ...]
    const vertEdges = new Map();      // vertIdx → Set of "min,max" edge keys

    const getEdgeKey = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);

    // First pass: identify edges and create midpoints
    for (let f = 0; f < triCount; f++) {
      const a = indexArr[f * 3], b = indexArr[f * 3 + 1], c = indexArr[f * 3 + 2];
      for (const [v0, v1] of [[a, b], [b, c], [a, c]]) {
        const key = getEdgeKey(v0, v1);
        if (!edgeMidMap.has(key)) {
          // Create midpoint vertex
          const midIdx = positions.length;
          positions.push([
            (positions[v0][0] + positions[v1][0]) / 2,
            (positions[v0][1] + positions[v1][1]) / 2,
            (positions[v0][2] + positions[v1][2]) / 2,
          ]);
          edgeMidMap.set(key, midIdx);
          edgeToFaces.set(key, []);
        }
        edgeToFaces.get(key).push(f);

        if (!vertEdges.has(v0)) vertEdges.set(v0, new Set());
        if (!vertEdges.has(v1)) vertEdges.set(v1, new Set());
        vertEdges.get(v0).add(key);
        vertEdges.get(v1).add(key);
      }
    }

    // Smooth: adjust edge midpoints and original vertices (Loop subdivision rules)
    if (smooth) {
      // Adjust edge midpoints: for interior edges, use 3/8*(v0+v1) + 1/8*(v2+v3)
      // where v2,v3 are the opposite vertices of the two adjacent triangles
      for (const [key, midIdx] of edgeMidMap) {
        const [sv0, sv1] = key.split(',').map(Number);
        const faces = edgeToFaces.get(key);
        if (faces.length === 2) {
          // Interior edge: find opposite vertices
          const oppVerts = [];
          for (const fi of faces) {
            const fa = indexArr[fi * 3], fb = indexArr[fi * 3 + 1], fc = indexArr[fi * 3 + 2];
            for (const v of [fa, fb, fc]) {
              if (v !== sv0 && v !== sv1) { oppVerts.push(v); break; }
            }
          }
          if (oppVerts.length === 2) {
            positions[midIdx] = [
              (positions[sv0][0] + positions[sv1][0]) * 3 / 8 + (positions[oppVerts[0]][0] + positions[oppVerts[1]][0]) / 8,
              (positions[sv0][1] + positions[sv1][1]) * 3 / 8 + (positions[oppVerts[0]][1] + positions[oppVerts[1]][1]) / 8,
              (positions[sv0][2] + positions[sv1][2]) * 3 / 8 + (positions[oppVerts[0]][2] + positions[oppVerts[1]][2]) / 8,
            ];
          }
        }
        // Boundary edges keep simple midpoint (already set)
      }

      // Adjust original vertices using Loop's vertex rule
      const newPositions = positions.map(p => [...p]); // copy
      for (let vi = 0; vi < origVertCount; vi++) {
        const edges = vertEdges.get(vi);
        if (!edges) continue;
        const n = edges.size; // valence
        if (n < 3) continue;

        // Loop's beta: 1/n * (5/8 - (3/8 + 1/4*cos(2*PI/n))^2)
        const beta = n === 3
          ? 3 / 16
          : (1 / n) * (5 / 8 - Math.pow(3 / 8 + (1 / 4) * Math.cos(2 * Math.PI / n), 2));

        // Gather neighbor vertices (the other end of each edge)
        let nx = 0, ny = 0, nz = 0;
        for (const eKey of edges) {
          const [ev0, ev1] = eKey.split(',').map(Number);
          const neighbor = ev0 === vi ? ev1 : ev0;
          nx += positions[neighbor][0];
          ny += positions[neighbor][1];
          nz += positions[neighbor][2];
        }

        const w = 1 - n * beta;
        newPositions[vi] = [
          w * positions[vi][0] + beta * nx,
          w * positions[vi][1] + beta * ny,
          w * positions[vi][2] + beta * nz,
        ];
      }

      // Apply smoothed positions to original vertices only
      for (let vi = 0; vi < origVertCount; vi++) {
        positions[vi] = newPositions[vi];
      }
    }

    // Build new triangles: each original triangle → 4 sub-triangles
    const newIndices = [];
    for (let f = 0; f < triCount; f++) {
      const a = indexArr[f * 3], b = indexArr[f * 3 + 1], c = indexArr[f * 3 + 2];
      const mab = edgeMidMap.get(getEdgeKey(a, b));
      const mbc = edgeMidMap.get(getEdgeKey(b, c));
      const mac = edgeMidMap.get(getEdgeKey(a, c));

      // 4 sub-triangles
      newIndices.push(a, mab, mac);
      newIndices.push(mab, b, mbc);
      newIndices.push(mac, mbc, c);
      newIndices.push(mab, mbc, mac);
    }

    // Build new geometry
    const flatPositions = new Float32Array(positions.length * 3);
    for (let i = 0; i < positions.length; i++) {
      flatPositions[i * 3] = positions[i][0];
      flatPositions[i * 3 + 1] = positions[i][1];
      flatPositions[i * 3 + 2] = positions[i][2];
    }

    geo.dispose();
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(flatPositions, 3));
    geo.setIndex(newIndices);
    geo.computeVertexNormals();
  }

  inputGeo.dispose();
  return geo;
}

// ── Geometry Analysis Helpers ────────────────────────────────────────────────

/**
 * Compute the world-space bounding box of a geometry descriptor.
 * Returns { min: {x,y,z}, max: {x,y,z} } or null.
 */
export function computeBounds(geoData) {
  if (!geoData) return null;
  const items = Array.isArray(geoData) ? geoData : [geoData];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const item of items) {
    if (!item) continue;
    const geo = buildGeometry(item);
    if (!geo) continue;

    geo.computeBoundingBox();
    const bb = geo.boundingBox;

    if (item.transforms && item.transforms.length > 0) {
      const mesh = new THREE.Mesh(geo);
      for (const t of item.transforms) {
        if (t.translate) { mesh.position.x += t.translate.x || 0; mesh.position.y += t.translate.y || 0; mesh.position.z += t.translate.z || 0; }
        if (t.rotate) { mesh.rotation.x += t.rotate.x || 0; mesh.rotation.y += t.rotate.y || 0; mesh.rotation.z += t.rotate.z || 0; }
        if (t.scale) { mesh.scale.x *= t.scale.x || 1; mesh.scale.y *= t.scale.y || 1; mesh.scale.z *= t.scale.z || 1; }
      }
      mesh.updateMatrixWorld(true);
      const corners = [
        new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z), new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z),
        new THREE.Vector3(bb.min.x, bb.max.y, bb.min.z), new THREE.Vector3(bb.min.x, bb.max.y, bb.max.z),
        new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z), new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z),
        new THREE.Vector3(bb.max.x, bb.max.y, bb.min.z), new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z),
      ];
      for (const c of corners) {
        c.applyMatrix4(mesh.matrixWorld);
        minX = Math.min(minX, c.x); minY = Math.min(minY, c.y); minZ = Math.min(minZ, c.z);
        maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y); maxZ = Math.max(maxZ, c.z);
      }
    } else {
      minX = Math.min(minX, bb.min.x); minY = Math.min(minY, bb.min.y); minZ = Math.min(minZ, bb.min.z);
      maxX = Math.max(maxX, bb.max.x); maxY = Math.max(maxY, bb.max.y); maxZ = Math.max(maxZ, bb.max.z);
    }
    geo.dispose();
  }

  if (minX === Infinity) return null;
  return { min: { x: minX, y: minY, z: minZ }, max: { x: maxX, y: maxY, z: maxZ } };
}

/**
 * Count domain sizes (points, edges, faces, etc.) of a geometry descriptor.
 */
export function computeDomainSize(geoData) {
  if (!geoData) return { points: 0, edges: 0, faces: 0, faceCorners: 0, splines: 0, instances: 0 };
  const items = Array.isArray(geoData) ? geoData : [geoData];
  let totalPoints = 0, totalEdges = 0, totalFaces = 0, totalCorners = 0;
  let totalSplines = 0, totalInstances = 0;

  for (const item of items) {
    if (!item) continue;
    if (item.isInstance) { totalInstances++; continue; }

    const isCurve = ['curve_circle', 'curve_line', 'spiral', 'curve_arc', 'curve_star'].includes(item.type);
    if (isCurve) {
      totalSplines++;
      const geo = buildGeometry(item);
      if (geo) { totalPoints += geo.getAttribute('position')?.count || 0; geo.dispose(); }
      continue;
    }

    const geo = buildGeometry(item);
    if (!geo) continue;
    const posAttr = geo.getAttribute('position');
    const vertCount = posAttr ? posAttr.count : 0;
    totalPoints += vertCount;

    if (geo.index) {
      const idxCount = geo.index.count;
      totalFaces += Math.floor(idxCount / 3);
      totalCorners += idxCount;
      const edgeSet = new Set();
      for (let i = 0; i < idxCount; i += 3) {
        const a = geo.index.getX(i), b = geo.index.getX(i + 1), c = geo.index.getX(i + 2);
        edgeSet.add(Math.min(a, b) + ',' + Math.max(a, b));
        edgeSet.add(Math.min(b, c) + ',' + Math.max(b, c));
        edgeSet.add(Math.min(a, c) + ',' + Math.max(a, c));
      }
      totalEdges += edgeSet.size;
    } else {
      totalFaces += Math.floor(vertCount / 3);
      totalCorners += vertCount;
      totalEdges += vertCount; // each 3 verts → 3 edges
    }
    geo.dispose();
  }

  return { points: totalPoints, edges: totalEdges, faces: totalFaces, faceCorners: totalCorners, splines: totalSplines, instances: totalInstances };
}

/**
 * Compute the length of a curve and its point count.
 */
export function computeCurveLength(geoData) {
  if (!geoData) return { length: 0, pointCount: 0 };
  const item = Array.isArray(geoData) ? geoData[0] : geoData;
  if (!item) return { length: 0, pointCount: 0 };

  // Fast path for known curve types
  if (item.type === 'curve_circle') {
    const r = item.radius || 1;
    return { length: 2 * Math.PI * r, pointCount: (item.resolution || 16) + 1 };
  }
  if (item.type === 'curve_line') {
    const s = item.start || { x: 0, y: 0, z: 0 }, e = item.end || { x: 0, y: 0, z: 1 };
    const dx = e.x - s.x, dy = e.y - s.y, dz = e.z - s.z;
    return { length: Math.sqrt(dx * dx + dy * dy + dz * dz), pointCount: 2 };
  }
  if (item.type === 'curve_arc') {
    const r = item.radius || 1, sweep = item.sweepAngle || (315 * Math.PI / 180);
    return { length: Math.abs(r * sweep), pointCount: (item.resolution || 16) + 1 };
  }

  // General: build and sum segment lengths
  const geo = buildGeometry(item);
  if (!geo) return { length: 0, pointCount: 0 };
  const posAttr = geo.getAttribute('position');
  if (!posAttr || posAttr.count < 2) { const pc = posAttr ? posAttr.count : 0; geo.dispose(); return { length: 0, pointCount: pc }; }

  let length = 0;
  for (let i = 1; i < posAttr.count; i++) {
    const dx = posAttr.getX(i) - posAttr.getX(i - 1);
    const dy = posAttr.getY(i) - posAttr.getY(i - 1);
    const dz = posAttr.getZ(i) - posAttr.getZ(i - 1);
    length += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const pointCount = posAttr.count;
  geo.dispose();
  return { length, pointCount };
}

/**
 * Find the closest point on geometry to a source position.
 */
export function computeClosestPoint(geoData, sourcePos) {
  if (!geoData) return { position: { x: 0, y: 0, z: 0 }, distance: 0 };
  const items = Array.isArray(geoData) ? geoData : [geoData];
  let closestPos = { x: 0, y: 0, z: 0 };
  let closestDist = Infinity;
  const sx = sourcePos?.x || 0, sy = sourcePos?.y || 0, sz = sourcePos?.z || 0;

  for (const item of items) {
    if (!item) continue;
    const geo = buildGeometry(item);
    if (!geo) continue;
    const posAttr = geo.getAttribute('position');
    if (!posAttr) { geo.dispose(); continue; }

    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i), py = posAttr.getY(i), pz = posAttr.getZ(i);
      const dx = px - sx, dy = py - sy, dz = pz - sz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < closestDist) {
        closestDist = dist;
        closestPos = { x: px, y: py, z: pz };
      }
    }
    geo.dispose();
  }

  return { position: closestPos, distance: closestDist === Infinity ? 0 : closestDist };
}

/**
 * Perform a raycast against geometry. Returns hit info.
 */
export function performRaycast(geoData, sourcePos, rayDir, rayLength) {
  const noHit = { isHit: false, hitPos: { x: 0, y: 0, z: 0 }, hitNormal: { x: 0, y: 1, z: 0 }, hitDist: 0 };
  if (!geoData) return noHit;

  const items = Array.isArray(geoData) ? geoData : [geoData];
  const origin = new THREE.Vector3(sourcePos?.x || 0, sourcePos?.y || 0, sourcePos?.z || 0);
  const direction = new THREE.Vector3(rayDir?.x || 0, rayDir?.y || 0, rayDir?.z || -1).normalize();
  const raycaster = new THREE.Raycaster(origin, direction, 0, rayLength || 100);
  let closestHit = null;

  for (const item of items) {
    if (!item) continue;
    const geo = buildGeometry(item);
    if (!geo) continue;
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    if (item.transforms) {
      for (const t of item.transforms) {
        if (t.translate) { mesh.position.x += t.translate.x || 0; mesh.position.y += t.translate.y || 0; mesh.position.z += t.translate.z || 0; }
        if (t.rotate) { mesh.rotation.x += t.rotate.x || 0; mesh.rotation.y += t.rotate.y || 0; mesh.rotation.z += t.rotate.z || 0; }
        if (t.scale) { mesh.scale.x *= t.scale.x || 1; mesh.scale.y *= t.scale.y || 1; mesh.scale.z *= t.scale.z || 1; }
      }
      mesh.updateMatrixWorld(true);
    }

    const hits = raycaster.intersectObject(mesh);
    if (hits.length > 0 && (!closestHit || hits[0].distance < closestHit.distance)) {
      closestHit = hits[0];
    }
    geo.dispose();
  }

  if (!closestHit) return noHit;
  return {
    isHit: true,
    hitPos: { x: closestHit.point.x, y: closestHit.point.y, z: closestHit.point.z },
    hitNormal: closestHit.face
      ? { x: closestHit.face.normal.x, y: closestHit.face.normal.y, z: closestHit.face.normal.z }
      : { x: 0, y: 1, z: 0 },
    hitDist: closestHit.distance,
  };
}

/**
 * Sample vertex position at a specific index from geometry.
 */
export function sampleAtIndex(geoData, index) {
  if (!geoData) return null;
  const item = Array.isArray(geoData) ? geoData[0] : geoData;
  if (!item) return null;
  const geo = buildGeometry(item);
  if (!geo) return null;
  const posAttr = geo.getAttribute('position');
  if (!posAttr) { geo.dispose(); return null; }
  const idx = Math.max(0, Math.min(index, posAttr.count - 1));
  const result = {
    position: { x: posAttr.getX(idx), y: posAttr.getY(idx), z: posAttr.getZ(idx) },
    count: posAttr.count,
  };
  geo.dispose();
  return result;
}

/**
 * Compute mesh topology analysis (edge angles, face areas, neighbor counts).
 * Returns aggregate (average) values.
 */
export function computeMeshAnalysis(geoData) {
  if (!geoData) return null;
  const item = Array.isArray(geoData) ? geoData[0] : geoData;
  if (!item) return null;
  const geo = buildGeometry(item);
  if (!geo) return null;
  const posAttr = geo.getAttribute('position');
  if (!posAttr) { geo.dispose(); return null; }

  const result = {
    vertexCount: posAttr.count,
    faceCount: 0, edgeCount: 0,
    avgFaceArea: 1.0,
    avgEdgeAngle: Math.PI,
    avgEdgeNeighborFaces: 2,
    avgVertexNeighborVerts: 4, avgVertexNeighborFaces: 4,
    avgFaceNeighborFaces: 3,
  };

  if (!geo.index) {
    result.faceCount = Math.floor(posAttr.count / 3);
    result.edgeCount = result.faceCount * 3;
    let totalArea = 0;
    for (let f = 0; f < result.faceCount; f++) {
      const ai = f * 3, bi = f * 3 + 1, ci = f * 3 + 2;
      const abx = posAttr.getX(bi) - posAttr.getX(ai), aby = posAttr.getY(bi) - posAttr.getY(ai), abz = posAttr.getZ(bi) - posAttr.getZ(ai);
      const acx = posAttr.getX(ci) - posAttr.getX(ai), acy = posAttr.getY(ci) - posAttr.getY(ai), acz = posAttr.getZ(ci) - posAttr.getZ(ai);
      const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
      totalArea += Math.sqrt(nx * nx + ny * ny + nz * nz) * 0.5;
    }
    result.avgFaceArea = result.faceCount > 0 ? totalArea / result.faceCount : 1.0;
    geo.dispose();
    return result;
  }

  const idxCount = geo.index.count;
  const triCount = Math.floor(idxCount / 3);
  result.faceCount = triCount;

  // Compute per-face normals and areas
  let totalArea = 0;
  const faceNormals = [];
  for (let f = 0; f < triCount; f++) {
    const a = geo.index.getX(f * 3), b = geo.index.getX(f * 3 + 1), c = geo.index.getX(f * 3 + 2);
    const abx = posAttr.getX(b) - posAttr.getX(a), aby = posAttr.getY(b) - posAttr.getY(a), abz = posAttr.getZ(b) - posAttr.getZ(a);
    const acx = posAttr.getX(c) - posAttr.getX(a), acy = posAttr.getY(c) - posAttr.getY(a), acz = posAttr.getZ(c) - posAttr.getZ(a);
    const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    totalArea += len * 0.5;
    faceNormals.push(len > 0 ? { x: nx / len, y: ny / len, z: nz / len } : { x: 0, y: 1, z: 0 });
  }
  result.avgFaceArea = triCount > 0 ? totalArea / triCount : 1.0;

  // Build edge map: edge → [face indices]
  const edgeMap = new Map();
  for (let f = 0; f < triCount; f++) {
    const a = geo.index.getX(f * 3), b = geo.index.getX(f * 3 + 1), c = geo.index.getX(f * 3 + 2);
    for (const [v0, v1] of [[a, b], [b, c], [a, c]]) {
      const key = Math.min(v0, v1) + ',' + Math.max(v0, v1);
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key).push(f);
    }
  }
  result.edgeCount = edgeMap.size;

  // Average edge dihedral angle
  let totalAngle = 0, angleCount = 0;
  let totalEdgeFaces = 0;
  for (const faces of edgeMap.values()) {
    totalEdgeFaces += faces.length;
    if (faces.length === 2) {
      const n1 = faceNormals[faces[0]], n2 = faceNormals[faces[1]];
      const dot = n1.x * n2.x + n1.y * n2.y + n1.z * n2.z;
      totalAngle += Math.acos(Math.max(-1, Math.min(1, dot)));
      angleCount++;
    }
  }
  result.avgEdgeAngle = angleCount > 0 ? totalAngle / angleCount : Math.PI;
  result.avgEdgeNeighborFaces = edgeMap.size > 0 ? totalEdgeFaces / edgeMap.size : 2;

  // Vertex neighbor counts
  const vertNeighborVerts = new Map();
  const vertNeighborFaces = new Map();
  for (let f = 0; f < triCount; f++) {
    const a = geo.index.getX(f * 3), b = geo.index.getX(f * 3 + 1), c = geo.index.getX(f * 3 + 2);
    for (const v of [a, b, c]) {
      if (!vertNeighborFaces.has(v)) vertNeighborFaces.set(v, new Set());
      vertNeighborFaces.get(v).add(f);
      if (!vertNeighborVerts.has(v)) vertNeighborVerts.set(v, new Set());
    }
    vertNeighborVerts.get(a).add(b); vertNeighborVerts.get(a).add(c);
    vertNeighborVerts.get(b).add(a); vertNeighborVerts.get(b).add(c);
    vertNeighborVerts.get(c).add(a); vertNeighborVerts.get(c).add(b);
  }
  let tvn = 0, tvf = 0;
  for (const s of vertNeighborVerts.values()) tvn += s.size;
  for (const s of vertNeighborFaces.values()) tvf += s.size;
  const vc = vertNeighborVerts.size || 1;
  result.avgVertexNeighborVerts = Math.round(tvn / vc);
  result.avgVertexNeighborFaces = Math.round(tvf / vc);

  // Face adjacency (faces sharing an edge)
  const faceAdj = new Map();
  for (const faces of edgeMap.values()) {
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        if (!faceAdj.has(faces[i])) faceAdj.set(faces[i], new Set());
        if (!faceAdj.has(faces[j])) faceAdj.set(faces[j], new Set());
        faceAdj.get(faces[i]).add(faces[j]);
        faceAdj.get(faces[j]).add(faces[i]);
      }
    }
  }
  let tfn = 0;
  for (const s of faceAdj.values()) tfn += s.size;
  result.avgFaceNeighborFaces = faceAdj.size > 0 ? Math.round(tfn / faceAdj.size) : 0;

  geo.dispose();
  return result;
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
