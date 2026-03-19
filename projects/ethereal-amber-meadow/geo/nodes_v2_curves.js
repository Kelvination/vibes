/**
 * geo/nodes_v2_curves.js - Curve operation nodes (resample, sample, curve to mesh).
 */

import { SocketType } from '../core/registry.js';
import { GeometrySet, MeshComponent, CurveComponent, DOMAIN } from '../core/geometry.js';
import { isField, resolveField, resolveScalar } from '../core/field.js';

// ── Vector Helpers ──────────────────────────────────────────────────────────

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function vecSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vecAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

// ── Frenet Frame ────────────────────────────────────────────────────────────

function computeFrenetFrame(tangent, prevNormal) {
  // tangent is normalized
  // Compute normal perpendicular to tangent
  let normal;
  if (prevNormal) {
    // Parallel transport: project previous normal onto plane perpendicular to new tangent
    const dot = prevNormal.x * tangent.x + prevNormal.y * tangent.y + prevNormal.z * tangent.z;
    normal = {
      x: prevNormal.x - dot * tangent.x,
      y: prevNormal.y - dot * tangent.y,
      z: prevNormal.z - dot * tangent.z,
    };
  } else {
    // Initial normal: cross tangent with up, or right if tangent is up
    const up = Math.abs(tangent.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    normal = cross(tangent, up);
  }
  const len = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2) || 1;
  normal.x /= len; normal.y /= len; normal.z /= len;
  const binormal = cross(tangent, normal);
  return { normal, binormal };
}

// ── Registration ────────────────────────────────────────────────────────────

export function registerCurveNodes(registry) {
  // ── Category ────────────────────────────────────────────────────────────
  registry.addCategory('geo', 'CURVE', { name: 'Curve', color: '#FFC107', icon: '〰' });

  // ═══════════════════════════════════════════════════════════════════════════
  // SET CURVE RADIUS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Blender reference: node_geo_set_curve_radius.cc
  //
  // Sets the radius attribute on curve control points. The radius is used by
  // Curve to Mesh to scale the profile at each point, and by other nodes
  // that read the radius attribute.
  //
  // Inputs:
  //   Curve     - source geometry with curve component
  //   Selection - bool field on CURVE_POINT domain (which points to modify)
  //   Radius    - float field (new radius value)
  //
  // Output:
  //   Curve     - modified geometry

  registry.addNode('geo', 'set_curve_radius', {
    label: 'Set Curve Radius',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Selection', type: SocketType.BOOL },
      { name: 'Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { radius: 0.005 },
    props: [
      { key: 'radius', label: 'Radius', type: 'float', min: 0, max: 100, step: 0.001 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Curve'];
      if (!geo || !geo.curve || geo.curve.splineCount === 0) {
        return { outputs: [geo || new GeometrySet()] };
      }

      const result = geo.copy();
      const curve = result.curve;
      const elements = curve.buildElements(DOMAIN.CURVE_POINT);

      // Evaluate selection
      const selectionInput = inputs['Selection'];
      let selection = null;
      if (selectionInput != null) {
        selection = isField(selectionInput)
          ? selectionInput.evaluateAll(elements)
          : new Array(elements.length).fill(!!selectionInput);
      }

      // Evaluate radius field
      const radiusInput = inputs['Radius'] ?? values.radius;
      const radii = isField(radiusInput)
        ? radiusInput.evaluateAll(elements)
        : new Array(elements.length).fill(
            typeof radiusInput === 'number' ? radiusInput : values.radius
          );

      // Apply radius to each control point
      let globalIdx = 0;
      for (const spline of curve.splines) {
        if (!spline.radii) {
          spline.radii = new Array(spline.positions.length).fill(1);
        }
        for (let i = 0; i < spline.positions.length; i++) {
          if (selection && !selection[globalIdx]) {
            globalIdx++;
            continue;
          }
          spline.radii[i] = radii[globalIdx] ?? values.radius;
          globalIdx++;
        }
      }

      return { outputs: [result] };
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SET CURVE TILT
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Blender reference: node_geo_set_curve_tilt.cc
  //
  // Sets the tilt attribute on curve control points. Tilt rotates the curve's
  // normal around the tangent, affecting how profiles are oriented when using
  // Curve to Mesh or when computing the Frenet frame.
  //
  // Inputs:
  //   Curve     - source geometry with curve component
  //   Selection - bool field on CURVE_POINT domain (which points to modify)
  //   Tilt      - float field (tilt angle in radians)
  //
  // Output:
  //   Curve     - modified geometry

  registry.addNode('geo', 'set_curve_tilt', {
    label: 'Set Curve Tilt',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Selection', type: SocketType.BOOL },
      { name: 'Tilt', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { tilt: 0 },
    props: [
      { key: 'tilt', label: 'Tilt', type: 'float', min: -6.28318, max: 6.28318, step: 0.01745 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Curve'];
      if (!geo || !geo.curve || geo.curve.splineCount === 0) {
        return { outputs: [geo || new GeometrySet()] };
      }

      const result = geo.copy();
      const curve = result.curve;
      const elements = curve.buildElements(DOMAIN.CURVE_POINT);

      // Evaluate selection
      const selectionInput = inputs['Selection'];
      let selection = null;
      if (selectionInput != null) {
        selection = isField(selectionInput)
          ? selectionInput.evaluateAll(elements)
          : new Array(elements.length).fill(!!selectionInput);
      }

      // Evaluate tilt field
      const tiltInput = inputs['Tilt'] ?? values.tilt;
      const tilts = isField(tiltInput)
        ? tiltInput.evaluateAll(elements)
        : new Array(elements.length).fill(
            typeof tiltInput === 'number' ? tiltInput : values.tilt
          );

      // Apply tilt to each control point
      let globalIdx = 0;
      for (const spline of curve.splines) {
        if (!spline.tilts) {
          spline.tilts = new Array(spline.positions.length).fill(0);
        }
        for (let i = 0; i < spline.positions.length; i++) {
          if (selection && !selection[globalIdx]) {
            globalIdx++;
            continue;
          }
          spline.tilts[i] = tilts[globalIdx] ?? values.tilt;
          globalIdx++;
        }
      }

      return { outputs: [result] };
    },
  });

  // ── resample_curve ──────────────────────────────────────────────────────
  registry.addNode('geo', 'resample_curve', {
    label: 'Resample Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Count', type: SocketType.INT },
      { name: 'Length', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { mode: 'COUNT', count: 10, length: 0.1 },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['COUNT', 'LENGTH'] },
      { key: 'count', label: 'Count', type: 'int', min: 2, max: 1000, step: 1 },
      { key: 'length', label: 'Length', type: 'float', min: 0.001, max: 100, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Curve'] ?? null;
      if (!geo || !geo.curve) {
        return { outputs: [geo || new GeometrySet()] };
      }

      const mode = values.mode;
      const count = resolveScalar(inputs['Count'] ?? values.count, values.count);
      const desiredLength = resolveScalar(inputs['Length'] ?? values.length, values.length);

      const result = geo.copy();
      const curve = result.curve;

      for (let si = 0; si < curve.splines.length; si++) {
        const spline = curve.splines[si];
        let resampleCount;

        if (mode === 'COUNT') {
          resampleCount = Math.max(2, Math.round(count));
        } else {
          // LENGTH mode: compute spline length, divide by desired length
          const splineLen = curve.splineLength(si, 64);
          resampleCount = Math.max(2, Math.round(splineLen / Math.max(0.001, desiredLength)) + 1);
        }

        // Resample positions
        const newPositions = curve.resampleSpline(si, resampleCount);

        // Build new radii array by interpolating
        const newRadii = new Array(resampleCount);
        const newTilts = new Array(resampleCount);
        for (let i = 0; i < resampleCount; i++) {
          const t = i / (resampleCount - 1);
          newRadii[i] = curve.evaluateSplineRadius(si, t);
          // Interpolate tilts similarly
          if (spline.tilts && spline.tilts.length > 1) {
            const f = t * (spline.tilts.length - 1);
            const idx = Math.min(Math.floor(f), spline.tilts.length - 2);
            const frac = f - idx;
            newTilts[i] = spline.tilts[idx] + (spline.tilts[idx + 1] - spline.tilts[idx]) * frac;
          } else {
            newTilts[i] = spline.tilts ? (spline.tilts[0] || 0) : 0;
          }
        }

        // Replace spline data
        spline.positions = newPositions;
        spline.radii = newRadii;
        spline.tilts = newTilts;
        spline.type = 'POLY'; // Resampled curves become polylines
        spline.handleLeft = null;
        spline.handleRight = null;
      }

      return { outputs: [result] };
    },
  });

  // ── sample_curve ────────────────────────────────────────────────────────
  registry.addNode('geo', 'sample_curve', {
    label: 'Sample Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Factor', type: SocketType.FLOAT },
      { name: 'Length', type: SocketType.FLOAT },
      { name: 'Curve Index', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Position', type: SocketType.VECTOR },
      { name: 'Tangent', type: SocketType.VECTOR },
      { name: 'Normal', type: SocketType.VECTOR },
    ],
    defaults: { mode: 'FACTOR', factor: 0.5, curveIndex: 0 },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['FACTOR', 'LENGTH'] },
      { key: 'factor', label: 'Factor', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'curveIndex', label: 'Curve Index', type: 'int', min: 0, max: 100, step: 1 },
    ],
    evaluate(values, inputs) {
      const zero = { x: 0, y: 0, z: 0 };
      const geo = inputs['Curve'] ?? null;
      if (!geo || !geo.curve || geo.curve.splineCount === 0) {
        return { outputs: [zero, zero, zero] };
      }

      const curve = geo.curve;
      const splineIdx = Math.min(
        resolveScalar(inputs['Curve Index'] ?? values.curveIndex, 0),
        curve.splineCount - 1
      );
      let t;

      if (values.mode === 'FACTOR') {
        const factor = resolveScalar(inputs['Factor'] ?? values.factor, values.factor);
        t = Math.max(0, Math.min(1, factor));
      } else {
        // LENGTH mode
        const desiredLen = resolveScalar(inputs['Length'] ?? 0, 0);
        const totalLen = curve.splineLength(splineIdx, 64);
        t = totalLen > 0 ? Math.max(0, Math.min(1, desiredLen / totalLen)) : 0;
      }

      const position = curve.evaluateSpline(splineIdx, t);
      const tangent = curve.evaluateSplineTangent(splineIdx, t);

      // Normal = cross(tangent, up) normalized (approximate)
      const up = Math.abs(tangent.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      const rawNormal = cross(tangent, up);
      const normalResult = normalize(rawNormal);

      return { outputs: [position, tangent, normalResult] };
    },
  });

  // ── curve_to_mesh ───────────────────────────────────────────────────────
  registry.addNode('geo', 'curve_to_mesh', {
    label: 'Curve to Mesh',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Profile Curve', type: SocketType.GEOMETRY },
      { name: 'Fill Caps', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { fillCaps: false },
    props: [
      { key: 'fillCaps', label: 'Fill Caps', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Curve'] ?? null;
      if (!geo || !geo.curve || geo.curve.splineCount === 0) {
        return { outputs: [new GeometrySet()] };
      }

      const fillCaps = inputs['Fill Caps'] ?? values.fillCaps;
      const profileGeo = inputs['Profile Curve'] ?? null;
      const curve = geo.curve;

      // Get profile points
      let profilePoints = null;
      let profileCyclic = false;
      if (profileGeo && profileGeo.curve && profileGeo.curve.splineCount > 0) {
        const profileSpline = profileGeo.curve.splines[0];
        profilePoints = profileSpline.positions;
        profileCyclic = profileSpline.cyclic || false;
      }

      const mesh = new MeshComponent();
      const hasProfile = profilePoints && profilePoints.length > 1;

      for (let si = 0; si < curve.splines.length; si++) {
        const spline = curve.splines[si];
        const resolution = spline.resolution || 12;
        const sampleCount = Math.max(2, spline.positions.length * resolution);

        if (!hasProfile) {
          // No profile: create a polyline mesh (vertices + edges, no faces)
          const vertOffset = mesh.positions.length;
          for (let i = 0; i < sampleCount; i++) {
            const t = i / (sampleCount - 1);
            const pos = curve.evaluateSpline(si, t);
            mesh.positions.push(pos);
          }
          for (let i = 0; i < sampleCount - 1; i++) {
            mesh.edges.push([vertOffset + i, vertOffset + i + 1]);
          }
          if (spline.cyclic && sampleCount > 2) {
            mesh.edges.push([vertOffset + sampleCount - 1, vertOffset]);
          }
        } else {
          // Sweep profile along curve
          const vertOffset = mesh.positions.length;
          const profileCount = profilePoints.length;
          let prevNormal = null;

          // Build frames and place profile at each sample
          for (let i = 0; i < sampleCount; i++) {
            const t = i / (sampleCount - 1);
            const pos = curve.evaluateSpline(si, t);
            const tang = normalize(curve.evaluateSplineTangent(si, t));
            const radius = curve.evaluateSplineRadius(si, t);

            const frame = computeFrenetFrame(tang, prevNormal);
            prevNormal = frame.normal;

            // Place profile points at this position, oriented by the frame
            for (let j = 0; j < profileCount; j++) {
              const pp = profilePoints[j];
              // Transform profile point by frame: pos + pp.x * normal + pp.y * binormal + pp.z * tangent
              mesh.positions.push({
                x: pos.x + (pp.x * frame.normal.x + pp.y * frame.binormal.x + pp.z * tang.x) * radius,
                y: pos.y + (pp.x * frame.normal.y + pp.y * frame.binormal.y + pp.z * tang.y) * radius,
                z: pos.z + (pp.x * frame.normal.z + pp.y * frame.binormal.z + pp.z * tang.z) * radius,
              });
            }
          }

          // Build quad faces connecting adjacent profile rings
          const ringCount = profileCyclic ? profileCount : profileCount - 1;
          for (let i = 0; i < sampleCount - 1; i++) {
            for (let j = 0; j < ringCount; j++) {
              const nextJ = (j + 1) % profileCount;
              const a = vertOffset + i * profileCount + j;
              const b = vertOffset + i * profileCount + nextJ;
              const c = vertOffset + (i + 1) * profileCount + nextJ;
              const d = vertOffset + (i + 1) * profileCount + j;

              mesh.faceVertCounts.push(4);
              mesh.cornerVerts.push(a, b, c, d);
              // Edges for each quad
              mesh.edges.push([a, b]);
              mesh.edges.push([a, d]);
            }
          }

          // Last ring edges
          for (let j = 0; j < ringCount; j++) {
            const nextJ = (j + 1) % profileCount;
            const a = vertOffset + (sampleCount - 1) * profileCount + j;
            const b = vertOffset + (sampleCount - 1) * profileCount + nextJ;
            mesh.edges.push([a, b]);
          }

          // Handle cyclic main curve: connect last ring to first ring
          if (spline.cyclic && sampleCount > 2) {
            for (let j = 0; j < ringCount; j++) {
              const nextJ = (j + 1) % profileCount;
              const a = vertOffset + (sampleCount - 1) * profileCount + j;
              const b = vertOffset + (sampleCount - 1) * profileCount + nextJ;
              const c = vertOffset + nextJ;
              const d = vertOffset + j;

              mesh.faceVertCounts.push(4);
              mesh.cornerVerts.push(a, b, c, d);
            }
          }

          // Fill Caps: add cap faces at start and end if profile is closed
          if (fillCaps && profileCyclic && !spline.cyclic) {
            // Start cap (reversed winding)
            mesh.faceVertCounts.push(profileCount);
            for (let j = profileCount - 1; j >= 0; j--) {
              mesh.cornerVerts.push(vertOffset + j);
            }

            // End cap
            const endOffset = vertOffset + (sampleCount - 1) * profileCount;
            mesh.faceVertCounts.push(profileCount);
            for (let j = 0; j < profileCount; j++) {
              mesh.cornerVerts.push(endOffset + j);
            }
          }
        }
      }

      const result = new GeometrySet();
      result.mesh = mesh;
      return { outputs: [result] };
    },
  });
}
