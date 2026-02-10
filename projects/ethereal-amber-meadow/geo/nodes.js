/**
 * geo/nodes.js - Registers all geometry node types with the shared registry.
 *
 * Side-effect-only module: import it to populate registry with 'geo' nodes.
 */

import { registry, SocketType } from '../core/registry.js';
import {
  seededRandom, hash3, lerp, smoothstep, clampVal,
  valueNoise3D, fbmNoise3D, voronoi3D,
  cloneGeo, geoToArray, mapGeo,
} from '../core/utils.js';

// ── Categories ──────────────────────────────────────────────────────────────

registry.addCategory('geo', 'INPUT',     { name: 'Input',            color: '#c62828', icon: '\u2192' });
registry.addCategory('geo', 'FIELD',     { name: 'Field',            color: '#ad1457', icon: '\u25CE' });
registry.addCategory('geo', 'MESH',      { name: 'Mesh Primitives',  color: '#2e7d32', icon: '\u25B3' });
registry.addCategory('geo', 'MESH_OPS',  { name: 'Mesh Operations',  color: '#1b5e20', icon: '\u2B21' });
registry.addCategory('geo', 'TRANSFORM', { name: 'Transform',        color: '#1565c0', icon: '\u21BB' });
registry.addCategory('geo', 'GEOMETRY',  { name: 'Geometry',         color: '#00838f', icon: '\u25C8' });
registry.addCategory('geo', 'INSTANCE',  { name: 'Instances',        color: '#00695c', icon: '\u229E' });
registry.addCategory('geo', 'CURVE',     { name: 'Curve',            color: '#827717', icon: '\u223F' });
registry.addCategory('geo', 'MATH',      { name: 'Math',             color: '#6a1b9a', icon: '\u0192' });
registry.addCategory('geo', 'UTILITY',   { name: 'Utility',          color: '#4527a0', icon: '\u2699' });
registry.addCategory('geo', 'TEXTURE',   { name: 'Texture',          color: '#bf360c', icon: '\u25A4' });
registry.addCategory('geo', 'MATERIAL',  { name: 'Material',         color: '#e91e63', icon: '\u25CD' });
registry.addCategory('geo', 'COLOR',     { name: 'Color',            color: '#fbc02d', icon: '\u25D0' });
registry.addCategory('geo', 'OUTPUT',    { name: 'Output',           color: '#e65100', icon: '\u25C9' });

// ── Node types ──────────────────────────────────────────────────────────────

registry.addNodes('geo', {

  // =========================================================================
  // OUTPUT
  // =========================================================================
  'output': {
    label: 'Group Output',
    category: 'OUTPUT',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    outputs: [],
    defaults: {},
    singular: true,
    evaluate(values, inputs) {
      return { outputs: [], geometry: inputs['Geometry'] || null };
    },
  },

  // =========================================================================
  // INPUT NODES
  // =========================================================================
  'value_float': {
    label: 'Value',
    category: 'INPUT',
    inputs: [],
    outputs: [
      { name: 'Value', type: SocketType.FLOAT },
    ],
    defaults: { value: 1.0 },
    props: [
      { key: 'value', label: 'Value', type: 'float', min: -100, max: 100, step: 0.1 },
    ],
    evaluate(values) {
      return { outputs: [parseFloat(values.value) || 0] };
    },
  },

  'value_int': {
    label: 'Integer',
    category: 'INPUT',
    inputs: [],
    outputs: [
      { name: 'Value', type: SocketType.INT },
    ],
    defaults: { value: 4 },
    props: [
      { key: 'value', label: 'Value', type: 'int', min: 0, max: 256, step: 1 },
    ],
    evaluate(values) {
      return { outputs: [Math.round(values.value)] };
    },
  },

  'value_vector': {
    label: 'Vector',
    category: 'INPUT',
    inputs: [],
    outputs: [
      { name: 'Vector', type: SocketType.VECTOR },
    ],
    defaults: { x: 0, y: 0, z: 0 },
    props: [
      { key: 'x', label: 'X', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'y', label: 'Y', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'z', label: 'Z', type: 'float', min: -100, max: 100, step: 0.1 },
    ],
    evaluate(values) {
      return { outputs: [{ x: values.x, y: values.y, z: values.z }] };
    },
  },

  'value_bool': {
    label: 'Boolean',
    category: 'INPUT',
    inputs: [],
    outputs: [
      { name: 'Value', type: SocketType.BOOL },
    ],
    defaults: { value: true },
    props: [
      { key: 'value', label: 'Value', type: 'bool' },
    ],
    evaluate(values) {
      return { outputs: [!!values.value] };
    },
  },

  'random_value': {
    label: 'Random Value',
    category: 'INPUT',
    inputs: [
      { name: 'Min', type: SocketType.FLOAT },
      { name: 'Max', type: SocketType.FLOAT },
      { name: 'Seed', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Value', type: SocketType.FLOAT },
    ],
    defaults: { min: 0, max: 1, seed: 0 },
    props: [
      { key: 'min', label: 'Min', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'max', label: 'Max', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'seed', label: 'Seed', type: 'int', min: 0, max: 9999, step: 1 },
    ],
    evaluate(values, inputs) {
      const mn = inputs['Min'] ?? values.min;
      const mx = inputs['Max'] ?? values.max;
      const seed = inputs['Seed'] ?? values.seed;
      const r = seededRandom(seed);
      return { outputs: [mn + r * (mx - mn)] };
    },
  },

  'scene_time': {
    label: 'Scene Time',
    category: 'INPUT',
    inputs: [],
    outputs: [
      { name: 'Seconds', type: SocketType.FLOAT },
      { name: 'Frame', type: SocketType.INT },
    ],
    defaults: { fps: 24 },
    props: [
      { key: 'fps', label: 'FPS', type: 'int', min: 1, max: 120, step: 1 },
    ],
    evaluate(values) {
      const now = performance.now() / 1000;
      const fps = values.fps || 24;
      return { outputs: [now, Math.floor(now * fps)] };
    },
  },

  // =========================================================================
  // FIELD NODES
  // =========================================================================
  'position': {
    label: 'Position',
    category: 'FIELD',
    inputs: [],
    outputs: [
      { name: 'Position', type: SocketType.VECTOR },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [{ x: 0, y: 0, z: 0, _field: 'position' }] };
    },
  },

  'set_position': {
    label: 'Set Position',
    category: 'FIELD',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Position', type: SocketType.VECTOR },
      { name: 'Offset', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { offsetX: 0, offsetY: 0, offsetZ: 0 },
    props: [
      { key: 'offsetX', label: 'Offset X', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'offsetY', label: 'Offset Y', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'offsetZ', label: 'Offset Z', type: 'float', min: -100, max: 100, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      if (!geo) return { outputs: [null] };
      const pos = inputs['Position'] || null;
      const offset = inputs['Offset'] || { x: values.offsetX, y: values.offsetY, z: values.offsetZ };
      const clone = cloneGeo(geo);
      return { outputs: [mapGeo(clone, g => {
        g.setPosition = {
          position: pos,
          offset: { x: offset.x || values.offsetX, y: offset.y || values.offsetY, z: offset.z || values.offsetZ },
        };
        return g;
      })] };
    },
  },

  'normal': {
    label: 'Normal',
    category: 'FIELD',
    inputs: [],
    outputs: [
      { name: 'Normal', type: SocketType.VECTOR },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [{ x: 0, y: 1, z: 0, _field: 'normal' }] };
    },
  },

  'index': {
    label: 'Index',
    category: 'FIELD',
    inputs: [],
    outputs: [
      { name: 'Index', type: SocketType.INT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [0] };
    },
  },

  'separate_xyz': {
    label: 'Separate XYZ',
    category: 'FIELD',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'X', type: SocketType.FLOAT },
      { name: 'Y', type: SocketType.FLOAT },
      { name: 'Z', type: SocketType.FLOAT },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      return { outputs: [v.x || 0, v.y || 0, v.z || 0] };
    },
  },

  'combine_xyz': {
    label: 'Combine XYZ',
    category: 'FIELD',
    inputs: [
      { name: 'X', type: SocketType.FLOAT },
      { name: 'Y', type: SocketType.FLOAT },
      { name: 'Z', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Vector', type: SocketType.VECTOR },
    ],
    defaults: { x: 0, y: 0, z: 0 },
    props: [
      { key: 'x', label: 'X', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'y', label: 'Y', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'z', label: 'Z', type: 'float', min: -1000, max: 1000, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const x = inputs['X'] ?? values.x;
      const y = inputs['Y'] ?? values.y;
      const z = inputs['Z'] ?? values.z;
      return { outputs: [{ x, y, z }] };
    },
  },

  // =========================================================================
  // MESH PRIMITIVES
  // =========================================================================
  'mesh_cube': {
    label: 'Cube',
    category: 'MESH',
    inputs: [
      { name: 'Size', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { sizeX: 1, sizeY: 1, sizeZ: 1 },
    props: [
      { key: 'sizeX', label: 'Size X', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'sizeY', label: 'Size Y', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'sizeZ', label: 'Size Z', type: 'float', min: 0.01, max: 50, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const size = inputs['Size'] || { x: values.sizeX, y: values.sizeY, z: values.sizeZ };
      return { outputs: [{
        type: 'cube',
        sizeX: size.x || values.sizeX,
        sizeY: size.y || values.sizeY,
        sizeZ: size.z || values.sizeZ,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_sphere': {
    label: 'UV Sphere',
    category: 'MESH',
    inputs: [
      { name: 'Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { radius: 1, segments: 16, rings: 8 },
    props: [
      { key: 'radius', label: 'Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'segments', label: 'Segments', type: 'int', min: 3, max: 64, step: 1 },
      { key: 'rings', label: 'Rings', type: 'int', min: 2, max: 32, step: 1 },
    ],
    evaluate(values, inputs) {
      const r = inputs['Radius'] ?? values.radius;
      return { outputs: [{
        type: 'sphere', radius: r,
        segments: values.segments, rings: values.rings,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_cylinder': {
    label: 'Cylinder',
    category: 'MESH',
    inputs: [
      { name: 'Radius', type: SocketType.FLOAT },
      { name: 'Depth', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { radius: 1, depth: 2, vertices: 16 },
    props: [
      { key: 'radius', label: 'Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'depth', label: 'Depth', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'vertices', label: 'Vertices', type: 'int', min: 3, max: 64, step: 1 },
    ],
    evaluate(values, inputs) {
      const r = inputs['Radius'] ?? values.radius;
      const d = inputs['Depth'] ?? values.depth;
      return { outputs: [{
        type: 'cylinder', radius: r, depth: d,
        vertices: values.vertices,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_cone': {
    label: 'Cone',
    category: 'MESH',
    inputs: [
      { name: 'Radius', type: SocketType.FLOAT },
      { name: 'Depth', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { radius1: 1, radius2: 0, depth: 2, vertices: 16 },
    props: [
      { key: 'radius1', label: 'Bottom Radius', type: 'float', min: 0, max: 50, step: 0.1 },
      { key: 'radius2', label: 'Top Radius', type: 'float', min: 0, max: 50, step: 0.1 },
      { key: 'depth', label: 'Depth', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'vertices', label: 'Vertices', type: 'int', min: 3, max: 64, step: 1 },
    ],
    evaluate(values, inputs) {
      const d = inputs['Depth'] ?? values.depth;
      return { outputs: [{
        type: 'cone',
        radius1: values.radius1, radius2: values.radius2,
        depth: d, vertices: values.vertices,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_torus': {
    label: 'Torus',
    category: 'MESH',
    inputs: [],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { majorRadius: 1, minorRadius: 0.3, majorSegments: 24, minorSegments: 12 },
    props: [
      { key: 'majorRadius', label: 'Major Radius', type: 'float', min: 0.1, max: 50, step: 0.1 },
      { key: 'minorRadius', label: 'Minor Radius', type: 'float', min: 0.01, max: 20, step: 0.05 },
      { key: 'majorSegments', label: 'Major Segments', type: 'int', min: 3, max: 64, step: 1 },
      { key: 'minorSegments', label: 'Minor Segments', type: 'int', min: 3, max: 32, step: 1 },
    ],
    evaluate(values) {
      return { outputs: [{
        type: 'torus',
        majorRadius: values.majorRadius, minorRadius: values.minorRadius,
        majorSegments: values.majorSegments, minorSegments: values.minorSegments,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_plane': {
    label: 'Grid / Plane',
    category: 'MESH',
    inputs: [
      { name: 'Size', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { sizeX: 2, sizeY: 2, subdX: 1, subdY: 1 },
    props: [
      { key: 'sizeX', label: 'Size X', type: 'float', min: 0.01, max: 100, step: 0.1 },
      { key: 'sizeY', label: 'Size Y', type: 'float', min: 0.01, max: 100, step: 0.1 },
      { key: 'subdX', label: 'Subdivisions X', type: 'int', min: 1, max: 100, step: 1 },
      { key: 'subdY', label: 'Subdivisions Y', type: 'int', min: 1, max: 100, step: 1 },
    ],
    evaluate(values, inputs) {
      const sz = inputs['Size'] ?? null;
      return { outputs: [{
        type: 'plane',
        sizeX: sz ?? values.sizeX, sizeY: sz ?? values.sizeY,
        subdX: values.subdX, subdY: values.subdY,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_icosphere': {
    label: 'Ico Sphere',
    category: 'MESH',
    inputs: [
      { name: 'Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { radius: 1, detail: 1 },
    props: [
      { key: 'radius', label: 'Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'detail', label: 'Detail', type: 'int', min: 0, max: 5, step: 1 },
    ],
    evaluate(values, inputs) {
      const r = inputs['Radius'] ?? values.radius;
      return { outputs: [{
        type: 'icosphere', radius: r, detail: values.detail,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_line': {
    label: 'Mesh Line',
    category: 'MESH',
    inputs: [
      { name: 'Count', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { count: 10, startX: 0, startY: 0, startZ: 0, endX: 0, endY: 0, endZ: 1 },
    props: [
      { key: 'count', label: 'Count', type: 'int', min: 2, max: 200, step: 1 },
      { key: 'startX', label: 'Start X', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'startY', label: 'Start Y', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'startZ', label: 'Start Z', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'endX', label: 'End X', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'endY', label: 'End Y', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'endZ', label: 'End Z', type: 'float', min: -50, max: 50, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const count = inputs['Count'] ?? values.count;
      return { outputs: [{
        type: 'line', count: count,
        start: { x: values.startX, y: values.startY, z: values.startZ },
        end: { x: values.endX, y: values.endY, z: values.endZ },
        transforms: [], smooth: false,
      }] };
    },
  },

  // =========================================================================
  // MESH OPERATIONS
  // =========================================================================
  'extrude_mesh': {
    label: 'Extrude Mesh',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
      { name: 'Offset', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { mode: 'faces', offset: 0.5, individual: false },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'faces', label: 'Faces' },
        { value: 'edges', label: 'Edges' },
        { value: 'vertices', label: 'Vertices' },
      ]},
      { key: 'offset', label: 'Offset', type: 'float', min: -10, max: 10, step: 0.05 },
      { key: 'individual', label: 'Individual', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      const offset = inputs['Offset'] ?? values.offset;
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.extrude = { mode: values.mode, offset, individual: values.individual };
        return g;
      })] };
    },
  },

  'scale_elements': {
    label: 'Scale Elements',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Scale', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { domain: 'faces', scale: 1.0 },
    props: [
      { key: 'domain', label: 'Domain', type: 'select', options: [
        { value: 'faces', label: 'Faces' },
        { value: 'edges', label: 'Edges' },
      ]},
      { key: 'scale', label: 'Scale', type: 'float', min: 0, max: 5, step: 0.05 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const scale = inputs['Scale'] ?? values.scale;
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.scaleElements = { domain: values.domain, scale };
        return g;
      })] };
    },
  },

  'subdivision_surface': {
    label: 'Subdivision Surface',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
      { name: 'Level', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { level: 1 },
    props: [
      { key: 'level', label: 'Level', type: 'int', min: 0, max: 4, step: 1 },
    ],
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      const lvl = inputs['Level'] ?? values.level;
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.subdivisionSurface = (g.subdivisionSurface || 0) + lvl;
        g.smooth = true;
        return g;
      })] };
    },
  },

  'mesh_boolean': {
    label: 'Mesh Boolean',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh A', type: SocketType.GEOMETRY },
      { name: 'Mesh B', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { operation: 'difference' },
    props: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'intersect', label: 'Intersect' },
        { value: 'union', label: 'Union' },
        { value: 'difference', label: 'Difference' },
      ]},
    ],
    evaluate(values, inputs) {
      const a = inputs['Mesh A'];
      const b = inputs['Mesh B'];
      if (!a) return { outputs: [null] };
      const geoA = cloneGeo(a);
      return { outputs: [{
        type: 'boolean',
        operation: values.operation,
        meshA: geoA,
        meshB: b ? cloneGeo(b) : null,
        transforms: [], smooth: false,
      }] };
    },
  },

  'triangulate': {
    label: 'Triangulate',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.triangulate = true;
        return g;
      })] };
    },
  },

  'dual_mesh': {
    label: 'Dual Mesh',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Dual Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.dualMesh = true;
        return g;
      })] };
    },
  },

  'flip_faces': {
    label: 'Flip Faces',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.flipFaces = true;
        return g;
      })] };
    },
  },

  'split_edges': {
    label: 'Split Edges',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.splitEdges = true;
        return g;
      })] };
    },
  },

  'merge_by_distance': {
    label: 'Merge by Distance',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Distance', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { distance: 0.001 },
    props: [
      { key: 'distance', label: 'Distance', type: 'float', min: 0, max: 10, step: 0.001 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const dist = inputs['Distance'] ?? values.distance;
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.mergeByDistance = dist;
        return g;
      })] };
    },
  },

  'delete_geometry': {
    label: 'Delete Geometry',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Selection', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { domain: 'faces', invert: false },
    props: [
      { key: 'domain', label: 'Domain', type: 'select', options: [
        { value: 'points', label: 'Points' },
        { value: 'edges', label: 'Edges' },
        { value: 'faces', label: 'Faces' },
      ]},
      { key: 'invert', label: 'Invert', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const sel = inputs['Selection'] ?? true;
      if (!geo) return { outputs: [null] };
      if (sel && !values.invert) {
        return { outputs: [null] };
      }
      return { outputs: [cloneGeo(geo)] };
    },
  },

  'separate_geometry': {
    label: 'Separate Geometry',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Selection', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Selection', type: SocketType.GEOMETRY },
      { name: 'Inverted', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const sel = inputs['Selection'] ?? true;
      if (!geo) return { outputs: [null, null] };
      if (sel) {
        return { outputs: [cloneGeo(geo), null] };
      }
      return { outputs: [null, cloneGeo(geo)] };
    },
  },

  // =========================================================================
  // TRANSFORM
  // =========================================================================
  'transform': {
    label: 'Transform Geometry',
    category: 'TRANSFORM',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Translation', type: SocketType.VECTOR },
      { name: 'Rotation', type: SocketType.VECTOR },
      { name: 'Scale', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: {
      tx: 0, ty: 0, tz: 0,
      rx: 0, ry: 0, rz: 0,
      sx: 1, sy: 1, sz: 1,
    },
    props: [
      { key: 'tx', label: 'Translate X', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'ty', label: 'Translate Y', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'tz', label: 'Translate Z', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'rx', label: 'Rotate X (deg)', type: 'float', min: -360, max: 360, step: 1 },
      { key: 'ry', label: 'Rotate Y (deg)', type: 'float', min: -360, max: 360, step: 1 },
      { key: 'rz', label: 'Rotate Z (deg)', type: 'float', min: -360, max: 360, step: 1 },
      { key: 'sx', label: 'Scale X', type: 'float', min: 0.01, max: 100, step: 0.1 },
      { key: 'sy', label: 'Scale Y', type: 'float', min: 0.01, max: 100, step: 0.1 },
      { key: 'sz', label: 'Scale Z', type: 'float', min: 0.01, max: 100, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      if (!geo) return { outputs: [null] };
      const t = inputs['Translation'] || { x: values.tx, y: values.ty, z: values.tz };
      const r = inputs['Rotation'] || { x: values.rx, y: values.ry, z: values.rz };
      const s = inputs['Scale'] || { x: values.sx, y: values.sy, z: values.sz };
      return { outputs: [mapGeo(geo, g => {
        g.transforms = g.transforms || [];
        g.transforms.push({
          translate: { x: t.x ?? values.tx, y: t.y ?? values.ty, z: t.z ?? values.tz },
          rotate: { x: (r.x ?? values.rx) * Math.PI / 180, y: (r.y ?? values.ry) * Math.PI / 180, z: (r.z ?? values.rz) * Math.PI / 180 },
          scale: { x: s.x ?? values.sx, y: s.y ?? values.sy, z: s.z ?? values.sz },
        });
        return g;
      })] };
    },
  },

  // =========================================================================
  // GEOMETRY OPERATIONS
  // =========================================================================
  'join_geometry': {
    label: 'Join Geometry',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Geometry 1', type: SocketType.GEOMETRY },
      { name: 'Geometry 2', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const g1 = inputs['Geometry 1'];
      const g2 = inputs['Geometry 2'];
      const combined = [];
      if (g1) combined.push(...geoToArray(g1));
      if (g2) combined.push(...geoToArray(g2));
      return { outputs: [combined.length > 0 ? combined : null] };
    },
  },

  'subdivide': {
    label: 'Subdivide Mesh',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
      { name: 'Level', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { level: 1 },
    props: [
      { key: 'level', label: 'Level', type: 'int', min: 0, max: 4, step: 1 },
    ],
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      const lvl = inputs['Level'] ?? values.level;
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.subdivide = (g.subdivide || 0) + lvl;
        return g;
      })] };
    },
  },

  'set_shade_smooth': {
    label: 'Set Shade Smooth',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Smooth', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { smooth: true },
    props: [
      { key: 'smooth', label: 'Smooth', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const sm = inputs['Smooth'] ?? values.smooth;
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => { g.smooth = sm; return g; })] };
    },
  },

  'bounding_box': {
    label: 'Bounding Box',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Bounding Box', type: SocketType.GEOMETRY },
      { name: 'Min', type: SocketType.VECTOR },
      { name: 'Max', type: SocketType.VECTOR },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      if (!geo) return { outputs: [null, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }] };
      const bbGeo = {
        type: 'cube', sizeX: 2, sizeY: 2, sizeZ: 2,
        transforms: [], smooth: false,
        wireframeOnly: true,
      };
      return { outputs: [bbGeo, { x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 }] };
    },
  },

  'convex_hull': {
    label: 'Convex Hull',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Convex Hull', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.convexHull = true;
        return g;
      })] };
    },
  },

  'geometry_proximity': {
    label: 'Geometry Proximity',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Target', type: SocketType.GEOMETRY },
      { name: 'Source Position', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Distance', type: SocketType.FLOAT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [0] };
    },
  },

  'distribute_points_on_faces': {
    label: 'Distribute Points on Faces',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
      { name: 'Density', type: SocketType.FLOAT },
      { name: 'Seed', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Points', type: SocketType.GEOMETRY },
    ],
    defaults: { mode: 'random', density: 10, seed: 0 },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'random', label: 'Random' },
        { value: 'poisson', label: 'Poisson Disk' },
      ]},
      { key: 'density', label: 'Density', type: 'float', min: 0.1, max: 100, step: 0.5 },
      { key: 'seed', label: 'Seed', type: 'int', min: 0, max: 9999, step: 1 },
    ],
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      const density = inputs['Density'] ?? values.density;
      const seed = inputs['Seed'] ?? values.seed;
      if (!mesh) return { outputs: [null] };
      return { outputs: [{
        type: 'points',
        source: cloneGeo(mesh),
        mode: values.mode,
        density: density,
        seed: seed,
        transforms: [], smooth: false,
      }] };
    },
  },

  'mesh_to_points': {
    label: 'Mesh to Points',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Points', type: SocketType.GEOMETRY },
    ],
    defaults: { mode: 'vertices' },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'vertices', label: 'Vertices' },
        { value: 'faces', label: 'Face Centers' },
        { value: 'edges', label: 'Edge Centers' },
      ]},
    ],
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      if (!mesh) return { outputs: [null] };
      return { outputs: [{
        type: 'points',
        source: cloneGeo(mesh),
        mode: values.mode,
        density: 1,
        seed: 0,
        transforms: [], smooth: false,
      }] };
    },
  },

  // =========================================================================
  // INSTANCE NODES
  // =========================================================================
  'instance_on_points': {
    label: 'Instance on Points',
    category: 'INSTANCE',
    inputs: [
      { name: 'Points', type: SocketType.GEOMETRY },
      { name: 'Instance', type: SocketType.GEOMETRY },
      { name: 'Scale', type: SocketType.VECTOR },
      { name: 'Rotation', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
    ],
    defaults: { scaleX: 1, scaleY: 1, scaleZ: 1 },
    props: [
      { key: 'scaleX', label: 'Scale X', type: 'float', min: 0.01, max: 10, step: 0.1 },
      { key: 'scaleY', label: 'Scale Y', type: 'float', min: 0.01, max: 10, step: 0.1 },
      { key: 'scaleZ', label: 'Scale Z', type: 'float', min: 0.01, max: 10, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const points = inputs['Points'];
      const instance = inputs['Instance'];
      const scale = inputs['Scale'] || { x: values.scaleX, y: values.scaleY, z: values.scaleZ };
      const rotation = inputs['Rotation'] || { x: 0, y: 0, z: 0 };
      if (!points || !instance) return { outputs: [points || null] };
      return { outputs: [{
        type: 'instance_on_points',
        points: cloneGeo(points),
        instance: cloneGeo(instance),
        scale: { x: scale.x ?? values.scaleX, y: scale.y ?? values.scaleY, z: scale.z ?? values.scaleZ },
        rotation: rotation,
        transforms: [], smooth: false,
      }] };
    },
  },

  'realize_instances': {
    label: 'Realize Instances',
    category: 'INSTANCE',
    inputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const instances = inputs['Instances'];
      if (!instances) return { outputs: [null] };
      return { outputs: [mapGeo(instances, g => { g.realized = true; return g; })] };
    },
  },

  'rotate_instances': {
    label: 'Rotate Instances',
    category: 'INSTANCE',
    inputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
      { name: 'Rotation', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
    ],
    defaults: { rx: 0, ry: 0, rz: 0 },
    props: [
      { key: 'rx', label: 'Rotation X (deg)', type: 'float', min: -360, max: 360, step: 1 },
      { key: 'ry', label: 'Rotation Y (deg)', type: 'float', min: -360, max: 360, step: 1 },
      { key: 'rz', label: 'Rotation Z (deg)', type: 'float', min: -360, max: 360, step: 1 },
    ],
    evaluate(values, inputs) {
      const instances = inputs['Instances'];
      const rot = inputs['Rotation'] || { x: values.rx, y: values.ry, z: values.rz };
      if (!instances) return { outputs: [null] };
      return { outputs: [mapGeo(instances, g => {
        g.transforms = g.transforms || [];
        g.transforms.push({
          translate: { x: 0, y: 0, z: 0 },
          rotate: { x: (rot.x ?? values.rx) * Math.PI / 180, y: (rot.y ?? values.ry) * Math.PI / 180, z: (rot.z ?? values.rz) * Math.PI / 180 },
          scale: { x: 1, y: 1, z: 1 },
        });
        return g;
      })] };
    },
  },

  'scale_instances': {
    label: 'Scale Instances',
    category: 'INSTANCE',
    inputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
      { name: 'Scale', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
    ],
    defaults: { sx: 1, sy: 1, sz: 1 },
    props: [
      { key: 'sx', label: 'Scale X', type: 'float', min: 0.01, max: 100, step: 0.1 },
      { key: 'sy', label: 'Scale Y', type: 'float', min: 0.01, max: 100, step: 0.1 },
      { key: 'sz', label: 'Scale Z', type: 'float', min: 0.01, max: 100, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const instances = inputs['Instances'];
      const sc = inputs['Scale'] || { x: values.sx, y: values.sy, z: values.sz };
      if (!instances) return { outputs: [null] };
      return { outputs: [mapGeo(instances, g => {
        g.transforms = g.transforms || [];
        g.transforms.push({
          translate: { x: 0, y: 0, z: 0 },
          rotate: { x: 0, y: 0, z: 0 },
          scale: { x: sc.x ?? values.sx, y: sc.y ?? values.sy, z: sc.z ?? values.sz },
        });
        return g;
      })] };
    },
  },

  'translate_instances': {
    label: 'Translate Instances',
    category: 'INSTANCE',
    inputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
      { name: 'Translation', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Instances', type: SocketType.GEOMETRY },
    ],
    defaults: { tx: 0, ty: 0, tz: 0 },
    props: [
      { key: 'tx', label: 'Translation X', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'ty', label: 'Translation Y', type: 'float', min: -100, max: 100, step: 0.1 },
      { key: 'tz', label: 'Translation Z', type: 'float', min: -100, max: 100, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const instances = inputs['Instances'];
      const tr = inputs['Translation'] || { x: values.tx, y: values.ty, z: values.tz };
      if (!instances) return { outputs: [null] };
      return { outputs: [mapGeo(instances, g => {
        g.transforms = g.transforms || [];
        g.transforms.push({
          translate: { x: tr.x ?? values.tx, y: tr.y ?? values.ty, z: tr.z ?? values.tz },
          rotate: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        });
        return g;
      })] };
    },
  },

  // =========================================================================
  // CURVE NODES
  // =========================================================================
  'curve_circle': {
    label: 'Curve Circle',
    category: 'CURVE',
    inputs: [
      { name: 'Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { radius: 1, resolution: 16 },
    props: [
      { key: 'radius', label: 'Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'resolution', label: 'Resolution', type: 'int', min: 3, max: 128, step: 1 },
    ],
    evaluate(values, inputs) {
      const r = inputs['Radius'] ?? values.radius;
      return { outputs: [{
        type: 'curve_circle',
        radius: r, resolution: values.resolution,
        transforms: [], smooth: false,
      }] };
    },
  },

  'curve_line': {
    label: 'Curve Line',
    category: 'CURVE',
    inputs: [
      { name: 'Start', type: SocketType.VECTOR },
      { name: 'End', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { startX: 0, startY: 0, startZ: 0, endX: 0, endY: 0, endZ: 1 },
    props: [
      { key: 'startX', label: 'Start X', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'startY', label: 'Start Y', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'startZ', label: 'Start Z', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'endX', label: 'End X', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'endY', label: 'End Y', type: 'float', min: -50, max: 50, step: 0.1 },
      { key: 'endZ', label: 'End Z', type: 'float', min: -50, max: 50, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const start = inputs['Start'] || { x: values.startX, y: values.startY, z: values.startZ };
      const end = inputs['End'] || { x: values.endX, y: values.endY, z: values.endZ };
      return { outputs: [{
        type: 'curve_line',
        start: { x: start.x ?? values.startX, y: start.y ?? values.startY, z: start.z ?? values.startZ },
        end: { x: end.x ?? values.endX, y: end.y ?? values.endY, z: end.z ?? values.endZ },
        transforms: [], smooth: false,
      }] };
    },
  },

  'curve_to_mesh': {
    label: 'Curve to Mesh',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Profile', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { fillCaps: true },
    props: [
      { key: 'fillCaps', label: 'Fill Caps', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      const profile = inputs['Profile'];
      if (!curve) return { outputs: [null] };
      return { outputs: [{
        type: 'curve_to_mesh',
        curve: cloneGeo(curve),
        profile: profile ? cloneGeo(profile) : null,
        fillCaps: values.fillCaps,
        transforms: [], smooth: true,
      }] };
    },
  },

  'resample_curve': {
    label: 'Resample Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Count', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { mode: 'count', count: 16 },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'count', label: 'Count' },
        { value: 'length', label: 'Length' },
      ]},
      { key: 'count', label: 'Count', type: 'int', min: 2, max: 256, step: 1 },
    ],
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      const count = inputs['Count'] ?? values.count;
      if (!curve) return { outputs: [null] };
      return { outputs: [mapGeo(curve, g => {
        g.resample = { mode: values.mode, count };
        return g;
      })] };
    },
  },

  'fill_curve': {
    label: 'Fill Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      if (!curve) return { outputs: [null] };
      return { outputs: [{
        type: 'fill_curve',
        curve: cloneGeo(curve),
        transforms: [], smooth: false,
      }] };
    },
  },

  'curve_spiral': {
    label: 'Spiral',
    category: 'CURVE',
    inputs: [],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { turns: 4, height: 2, startRadius: 1, endRadius: 1, resolution: 64 },
    props: [
      { key: 'turns', label: 'Turns', type: 'float', min: 0.1, max: 20, step: 0.1 },
      { key: 'height', label: 'Height', type: 'float', min: 0, max: 20, step: 0.1 },
      { key: 'startRadius', label: 'Start Radius', type: 'float', min: 0.01, max: 20, step: 0.1 },
      { key: 'endRadius', label: 'End Radius', type: 'float', min: 0.01, max: 20, step: 0.1 },
      { key: 'resolution', label: 'Resolution', type: 'int', min: 8, max: 256, step: 4 },
    ],
    evaluate(values) {
      return { outputs: [{
        type: 'spiral',
        turns: values.turns, height: values.height,
        startRadius: values.startRadius, endRadius: values.endRadius,
        resolution: values.resolution,
        transforms: [], smooth: false,
      }] };
    },
  },

  // =========================================================================
  // MATH NODES
  // =========================================================================
  'math': {
    label: 'Math',
    category: 'MATH',
    inputs: [
      { name: 'A', type: SocketType.FLOAT },
      { name: 'B', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Result', type: SocketType.FLOAT },
    ],
    defaults: { operation: 'add', a: 0, b: 0 },
    props: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'add', label: 'Add' },
        { value: 'subtract', label: 'Subtract' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'divide', label: 'Divide' },
        { value: 'power', label: 'Power' },
        { value: 'sqrt', label: 'Square Root' },
        { value: 'log', label: 'Logarithm' },
        { value: 'modulo', label: 'Modulo' },
        { value: 'min', label: 'Min' },
        { value: 'max', label: 'Max' },
        { value: 'abs', label: 'Absolute' },
        { value: 'floor', label: 'Floor' },
        { value: 'ceil', label: 'Ceil' },
        { value: 'round', label: 'Round' },
        { value: 'sin', label: 'Sine' },
        { value: 'cos', label: 'Cosine' },
        { value: 'tan', label: 'Tangent' },
        { value: 'asin', label: 'Arcsine' },
        { value: 'acos', label: 'Arccosine' },
        { value: 'atan', label: 'Arctangent' },
        { value: 'atan2', label: 'Arctan2' },
        { value: 'sign', label: 'Sign' },
        { value: 'fract', label: 'Fraction' },
        { value: 'snap', label: 'Snap' },
        { value: 'pingpong', label: 'Ping Pong' },
        { value: 'wrap', label: 'Wrap' },
        { value: 'smooth_min', label: 'Smooth Min' },
        { value: 'smooth_max', label: 'Smooth Max' },
      ]},
      { key: 'a', label: 'A', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'b', label: 'B', type: 'float', min: -1000, max: 1000, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const a = inputs['A'] ?? values.a;
      const b = inputs['B'] ?? values.b;
      let val = 0;
      switch (values.operation) {
        case 'add': val = a + b; break;
        case 'subtract': val = a - b; break;
        case 'multiply': val = a * b; break;
        case 'divide': val = b !== 0 ? a / b : 0; break;
        case 'power': val = Math.pow(a, b); break;
        case 'sqrt': val = Math.sqrt(Math.abs(a)); break;
        case 'log': val = a > 0 ? Math.log(a) / (b > 0 && b !== 1 ? Math.log(b) : 1) : 0; break;
        case 'modulo': val = b !== 0 ? ((a % b) + b) % b : 0; break;
        case 'min': val = Math.min(a, b); break;
        case 'max': val = Math.max(a, b); break;
        case 'abs': val = Math.abs(a); break;
        case 'floor': val = Math.floor(a); break;
        case 'ceil': val = Math.ceil(a); break;
        case 'round': val = Math.round(a); break;
        case 'sin': val = Math.sin(a); break;
        case 'cos': val = Math.cos(a); break;
        case 'tan': val = Math.tan(a); break;
        case 'asin': val = Math.asin(Math.max(-1, Math.min(1, a))); break;
        case 'acos': val = Math.acos(Math.max(-1, Math.min(1, a))); break;
        case 'atan': val = Math.atan(a); break;
        case 'atan2': val = Math.atan2(a, b); break;
        case 'sign': val = Math.sign(a); break;
        case 'fract': val = a - Math.floor(a); break;
        case 'snap': val = b !== 0 ? Math.floor(a / b) * b : a; break;
        case 'pingpong': val = b !== 0 ? Math.abs(((a % (b * 2)) + b * 2) % (b * 2) - b) : 0; break;
        case 'wrap': {
          const range = b - 0;
          val = range !== 0 ? a - Math.floor(a / range) * range : a;
          break;
        }
        case 'smooth_min': {
          const k = Math.max(b, 0.0001);
          const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k));
          val = lerp(b, a, h) - k * h * (1 - h);
          break;
        }
        case 'smooth_max': {
          const k = Math.max(b, 0.0001);
          const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (a - b) / k));
          val = lerp(b, a, h) + k * h * (1 - h);
          break;
        }
      }
      if (!isFinite(val)) val = 0;
      return { outputs: [val] };
    },
  },

  'vector_math': {
    label: 'Vector Math',
    category: 'MATH',
    inputs: [
      { name: 'A', type: SocketType.VECTOR },
      { name: 'B', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Vector', type: SocketType.VECTOR },
      { name: 'Value', type: SocketType.FLOAT },
    ],
    defaults: { operation: 'add' },
    props: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'add', label: 'Add' },
        { value: 'subtract', label: 'Subtract' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'divide', label: 'Divide' },
        { value: 'cross', label: 'Cross Product' },
        { value: 'dot', label: 'Dot Product' },
        { value: 'distance', label: 'Distance' },
        { value: 'normalize', label: 'Normalize' },
        { value: 'length', label: 'Length' },
        { value: 'scale', label: 'Scale' },
        { value: 'reflect', label: 'Reflect' },
        { value: 'project', label: 'Project' },
        { value: 'faceforward', label: 'Faceforward' },
        { value: 'snap', label: 'Snap' },
        { value: 'floor', label: 'Floor' },
        { value: 'ceil', label: 'Ceil' },
        { value: 'abs', label: 'Absolute' },
        { value: 'min', label: 'Min' },
        { value: 'max', label: 'Max' },
        { value: 'sine', label: 'Sine' },
        { value: 'cosine', label: 'Cosine' },
        { value: 'tangent', label: 'Tangent' },
      ]},
    ],
    evaluate(values, inputs) {
      const a = inputs['A'] || { x: 0, y: 0, z: 0 };
      const b = inputs['B'] || { x: 0, y: 0, z: 0 };
      let vec = { x: 0, y: 0, z: 0 };
      let scalar = 0;
      switch (values.operation) {
        case 'add': vec = { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; break;
        case 'subtract': vec = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; break;
        case 'multiply': vec = { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z }; break;
        case 'divide': vec = {
          x: b.x !== 0 ? a.x / b.x : 0,
          y: b.y !== 0 ? a.y / b.y : 0,
          z: b.z !== 0 ? a.z / b.z : 0,
        }; break;
        case 'cross': vec = {
          x: a.y * b.z - a.z * b.y,
          y: a.z * b.x - a.x * b.z,
          z: a.x * b.y - a.y * b.x,
        }; break;
        case 'dot': scalar = a.x * b.x + a.y * b.y + a.z * b.z; break;
        case 'distance': {
          const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          scalar = Math.sqrt(dx * dx + dy * dy + dz * dz);
        } break;
        case 'normalize': {
          const len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) || 1;
          vec = { x: a.x / len, y: a.y / len, z: a.z / len };
        } break;
        case 'length': scalar = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); break;
        case 'scale': vec = { x: a.x * b.x, y: a.y * b.x, z: a.z * b.x }; break;
        case 'reflect': {
          const d = 2 * (a.x * b.x + a.y * b.y + a.z * b.z);
          vec = { x: a.x - d * b.x, y: a.y - d * b.y, z: a.z - d * b.z };
        } break;
        case 'project': {
          const d = (a.x * b.x + a.y * b.y + a.z * b.z);
          const bl = b.x * b.x + b.y * b.y + b.z * b.z;
          const f = bl !== 0 ? d / bl : 0;
          vec = { x: b.x * f, y: b.y * f, z: b.z * f };
        } break;
        case 'faceforward': {
          const d = a.x * b.x + a.y * b.y + a.z * b.z;
          vec = d < 0 ? { x: a.x, y: a.y, z: a.z } : { x: -a.x, y: -a.y, z: -a.z };
        } break;
        case 'snap': vec = {
          x: b.x !== 0 ? Math.floor(a.x / b.x) * b.x : a.x,
          y: b.y !== 0 ? Math.floor(a.y / b.y) * b.y : a.y,
          z: b.z !== 0 ? Math.floor(a.z / b.z) * b.z : a.z,
        }; break;
        case 'floor': vec = { x: Math.floor(a.x), y: Math.floor(a.y), z: Math.floor(a.z) }; break;
        case 'ceil': vec = { x: Math.ceil(a.x), y: Math.ceil(a.y), z: Math.ceil(a.z) }; break;
        case 'abs': vec = { x: Math.abs(a.x), y: Math.abs(a.y), z: Math.abs(a.z) }; break;
        case 'min': vec = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) }; break;
        case 'max': vec = { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) }; break;
        case 'sine': vec = { x: Math.sin(a.x), y: Math.sin(a.y), z: Math.sin(a.z) }; break;
        case 'cosine': vec = { x: Math.cos(a.x), y: Math.cos(a.y), z: Math.cos(a.z) }; break;
        case 'tangent': vec = { x: Math.tan(a.x), y: Math.tan(a.y), z: Math.tan(a.z) }; break;
      }
      return { outputs: [vec, scalar] };
    },
  },

  'boolean_math': {
    label: 'Boolean Math',
    category: 'MATH',
    inputs: [
      { name: 'A', type: SocketType.BOOL },
      { name: 'B', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Result', type: SocketType.BOOL },
    ],
    defaults: { operation: 'and', a: false, b: false },
    props: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'and', label: 'AND' },
        { value: 'or', label: 'OR' },
        { value: 'not', label: 'NOT' },
        { value: 'nand', label: 'NAND' },
        { value: 'nor', label: 'NOR' },
        { value: 'xor', label: 'XOR' },
        { value: 'xnor', label: 'XNOR' },
      ]},
      { key: 'a', label: 'A', type: 'bool' },
      { key: 'b', label: 'B', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const a = inputs['A'] ?? values.a;
      const b = inputs['B'] ?? values.b;
      let val = false;
      switch (values.operation) {
        case 'and': val = a && b; break;
        case 'or': val = a || b; break;
        case 'not': val = !a; break;
        case 'nand': val = !(a && b); break;
        case 'nor': val = !(a || b); break;
        case 'xor': val = (a || b) && !(a && b); break;
        case 'xnor': val = !((a || b) && !(a && b)); break;
      }
      return { outputs: [!!val] };
    },
  },

  'clamp': {
    label: 'Clamp',
    category: 'MATH',
    inputs: [
      { name: 'Value', type: SocketType.FLOAT },
      { name: 'Min', type: SocketType.FLOAT },
      { name: 'Max', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Result', type: SocketType.FLOAT },
    ],
    defaults: { value: 0.5, min: 0, max: 1 },
    props: [
      { key: 'value', label: 'Value', type: 'float', min: -1000, max: 1000, step: 0.01 },
      { key: 'min', label: 'Min', type: 'float', min: -1000, max: 1000, step: 0.01 },
      { key: 'max', label: 'Max', type: 'float', min: -1000, max: 1000, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const v = inputs['Value'] ?? values.value;
      const mn = inputs['Min'] ?? values.min;
      const mx = inputs['Max'] ?? values.max;
      return { outputs: [Math.min(Math.max(v, mn), mx)] };
    },
  },

  'map_range': {
    label: 'Map Range',
    category: 'MATH',
    inputs: [
      { name: 'Value', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Result', type: SocketType.FLOAT },
    ],
    defaults: { value: 0.5, fromMin: 0, fromMax: 1, toMin: 0, toMax: 10 },
    props: [
      { key: 'value', label: 'Value', type: 'float', min: -1000, max: 1000, step: 0.01 },
      { key: 'fromMin', label: 'From Min', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'fromMax', label: 'From Max', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'toMin', label: 'To Min', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'toMax', label: 'To Max', type: 'float', min: -1000, max: 1000, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const v = inputs['Value'] ?? values.value;
      const fMin = values.fromMin;
      const fMax = values.fromMax;
      const tMin = values.toMin;
      const tMax = values.toMax;
      const range = fMax - fMin;
      const mapped = range !== 0 ? tMin + ((v - fMin) / range) * (tMax - tMin) : tMin;
      return { outputs: [mapped] };
    },
  },

  // =========================================================================
  // UTILITY NODES
  // =========================================================================
  'compare': {
    label: 'Compare',
    category: 'UTILITY',
    inputs: [
      { name: 'A', type: SocketType.FLOAT },
      { name: 'B', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Result', type: SocketType.BOOL },
    ],
    defaults: { operation: 'greater_than', a: 0, b: 0.5, epsilon: 0.001 },
    props: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'less_than', label: 'Less Than' },
        { value: 'less_equal', label: 'Less or Equal' },
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'greater_equal', label: 'Greater or Equal' },
        { value: 'equal', label: 'Equal' },
        { value: 'not_equal', label: 'Not Equal' },
      ]},
      { key: 'a', label: 'A', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'b', label: 'B', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'epsilon', label: 'Epsilon', type: 'float', min: 0, max: 1, step: 0.001 },
    ],
    evaluate(values, inputs) {
      const a = inputs['A'] ?? values.a;
      const b = inputs['B'] ?? values.b;
      const eps = values.epsilon;
      let val = false;
      switch (values.operation) {
        case 'less_than': val = a < b; break;
        case 'less_equal': val = a <= b; break;
        case 'greater_than': val = a > b; break;
        case 'greater_equal': val = a >= b; break;
        case 'equal': val = Math.abs(a - b) <= eps; break;
        case 'not_equal': val = Math.abs(a - b) > eps; break;
      }
      return { outputs: [val] };
    },
  },

  'switch': {
    label: 'Switch',
    category: 'UTILITY',
    inputs: [
      { name: 'Switch', type: SocketType.BOOL },
      { name: 'False', type: SocketType.GEOMETRY },
      { name: 'True', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Output', type: SocketType.GEOMETRY },
    ],
    defaults: { switch_val: false },
    props: [
      { key: 'switch_val', label: 'Switch', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const sw = inputs['Switch'] ?? values.switch_val;
      const falseVal = inputs['False'] || null;
      const trueVal = inputs['True'] || null;
      return { outputs: [sw ? trueVal : falseVal] };
    },
  },

  'switch_float': {
    label: 'Switch (Float)',
    category: 'UTILITY',
    inputs: [
      { name: 'Switch', type: SocketType.BOOL },
      { name: 'False', type: SocketType.FLOAT },
      { name: 'True', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Output', type: SocketType.FLOAT },
    ],
    defaults: { switch_val: false, falseVal: 0, trueVal: 1 },
    props: [
      { key: 'switch_val', label: 'Switch', type: 'bool' },
      { key: 'falseVal', label: 'False', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'trueVal', label: 'True', type: 'float', min: -1000, max: 1000, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const sw = inputs['Switch'] ?? values.switch_val;
      const falseVal = inputs['False'] ?? values.falseVal;
      const trueVal = inputs['True'] ?? values.trueVal;
      return { outputs: [sw ? trueVal : falseVal] };
    },
  },

  'switch_vector': {
    label: 'Switch (Vector)',
    category: 'UTILITY',
    inputs: [
      { name: 'Switch', type: SocketType.BOOL },
      { name: 'False', type: SocketType.VECTOR },
      { name: 'True', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Output', type: SocketType.VECTOR },
    ],
    defaults: { switch_val: false },
    props: [
      { key: 'switch_val', label: 'Switch', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const sw = inputs['Switch'] ?? values.switch_val;
      const falseVal = inputs['False'] || { x: 0, y: 0, z: 0 };
      const trueVal = inputs['True'] || { x: 0, y: 0, z: 0 };
      return { outputs: [sw ? trueVal : falseVal] };
    },
  },

  // =========================================================================
  // TEXTURE NODES
  // =========================================================================
  'noise_texture': {
    label: 'Noise Texture',
    category: 'TEXTURE',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
      { name: 'Scale', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Fac', type: SocketType.FLOAT },
      { name: 'Color', type: SocketType.VECTOR },
    ],
    defaults: { scale: 5, detail: 2, roughness: 0.5, distortion: 0 },
    props: [
      { key: 'scale', label: 'Scale', type: 'float', min: 0.01, max: 100, step: 0.5 },
      { key: 'detail', label: 'Detail', type: 'float', min: 0, max: 15, step: 0.5 },
      { key: 'roughness', label: 'Roughness', type: 'float', min: 0, max: 1, step: 0.05 },
      { key: 'distortion', label: 'Distortion', type: 'float', min: 0, max: 10, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      const sc = inputs['Scale'] ?? values.scale;
      const detail = values.detail;
      const rough = values.roughness;
      const dist = values.distortion;
      let sx = v.x * sc, sy = v.y * sc, sz = v.z * sc;
      if (dist > 0) {
        sx += valueNoise3D(sx + 100, sy, sz) * dist;
        sy += valueNoise3D(sx, sy + 100, sz) * dist;
        sz += valueNoise3D(sx, sy, sz + 100) * dist;
      }
      const fac = fbmNoise3D(sx, sy, sz, Math.ceil(detail) + 1, rough);
      return { outputs: [fac, { x: fac, y: fac * 0.8, z: fac * 0.6 }] };
    },
  },

  'voronoi_texture': {
    label: 'Voronoi Texture',
    category: 'TEXTURE',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
      { name: 'Scale', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Distance', type: SocketType.FLOAT },
      { name: 'Color', type: SocketType.VECTOR },
    ],
    defaults: { scale: 5, feature: 'f1', randomness: 1 },
    props: [
      { key: 'scale', label: 'Scale', type: 'float', min: 0.01, max: 100, step: 0.5 },
      { key: 'feature', label: 'Feature', type: 'select', options: [
        { value: 'f1', label: 'F1 (Nearest)' },
        { value: 'f2', label: 'F2 (Second Nearest)' },
        { value: 'smooth_f1', label: 'Smooth F1' },
      ]},
      { key: 'randomness', label: 'Randomness', type: 'float', min: 0, max: 1, step: 0.05 },
    ],
    evaluate(values, inputs) {
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      const sc = inputs['Scale'] ?? values.scale;
      const sx = v.x * sc, sy = v.y * sc, sz = v.z * sc;
      const { dist, col } = voronoi3D(sx, sy, sz, values.randomness, values.feature);
      return { outputs: [dist, col] };
    },
  },

  'white_noise': {
    label: 'White Noise',
    category: 'TEXTURE',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Value', type: SocketType.FLOAT },
      { name: 'Color', type: SocketType.VECTOR },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      const val = hash3(Math.floor(v.x * 1000), Math.floor(v.y * 1000), Math.floor(v.z * 1000));
      const col = {
        x: hash3(Math.floor(v.x * 1000) + 17, Math.floor(v.y * 1000) + 31, Math.floor(v.z * 1000) + 59),
        y: hash3(Math.floor(v.x * 1000) + 73, Math.floor(v.y * 1000) + 97, Math.floor(v.z * 1000) + 113),
        z: hash3(Math.floor(v.x * 1000) + 151, Math.floor(v.y * 1000) + 173, Math.floor(v.z * 1000) + 199),
      };
      return { outputs: [val, col] };
    },
  },

  // =========================================================================
  // NEW INPUT NODES
  // =========================================================================
  'value_color': {
    label: 'Color',
    category: 'INPUT',
    inputs: [],
    outputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    defaults: { r: 0.5, g: 0.5, b: 0.5 },
    props: [
      { key: 'r', label: 'R', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'g', label: 'G', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'b', label: 'B', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values) {
      return {
        outputs: [{
          r: clampVal(values.r ?? 0.5, 0, 1),
          g: clampVal(values.g ?? 0.5, 0, 1),
          b: clampVal(values.b ?? 0.5, 0, 1),
        }],
      };
    },
  },

  // =========================================================================
  // NEW OUTPUT NODES
  // =========================================================================
  'viewer': {
    label: 'Viewer',
    category: 'OUTPUT',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Value', type: SocketType.FLOAT },
    ],
    outputs: [],
    defaults: {},
    evaluate(values, inputs) {
      return { outputs: [], geometry: inputs['Geometry'] || null, viewerValue: inputs['Value'] ?? 0 };
    },
  },

  // =========================================================================
  // NEW MESH PRIMITIVES
  // =========================================================================
  'mesh_circle': {
    label: 'Mesh Circle',
    category: 'MESH',
    inputs: [
      { name: 'Vertices', type: SocketType.INT },
      { name: 'Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    defaults: { vertices: 32, radius: 1, fillType: 'ngon' },
    props: [
      { key: 'vertices', label: 'Vertices', type: 'int', min: 3, max: 128, step: 1 },
      { key: 'radius', label: 'Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'fillType', label: 'Fill', type: 'select', options: [
        { value: 'none', label: 'None' },
        { value: 'ngon', label: 'Ngon' },
        { value: 'triangle_fan', label: 'Triangle Fan' },
      ]},
    ],
    evaluate(values, inputs) {
      const verts = inputs['Vertices'] ?? values.vertices;
      const r = inputs['Radius'] ?? values.radius;
      return { outputs: [{
        type: 'mesh_circle',
        vertices: verts, radius: r,
        fillType: values.fillType,
        transforms: [], smooth: false,
      }] };
    },
  },

  // =========================================================================
  // NEW MESH OPERATIONS
  // =========================================================================
  'mesh_to_curve': {
    label: 'Mesh to Curve',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Mesh', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const mesh = inputs['Mesh'];
      if (!mesh) return { outputs: [null] };
      return { outputs: [mapGeo(mesh, g => {
        g.meshToCurve = true;
        return g;
      })] };
    },
  },

  'duplicate_elements': {
    label: 'Duplicate Elements',
    category: 'GEOMETRY',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Amount', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Duplicate Index', type: SocketType.INT },
    ],
    defaults: { amount: 1, domain: 'faces' },
    props: [
      { key: 'amount', label: 'Amount', type: 'int', min: 0, max: 100, step: 1 },
      { key: 'domain', label: 'Domain', type: 'select', options: [
        { value: 'points', label: 'Points' },
        { value: 'edges', label: 'Edges' },
        { value: 'faces', label: 'Faces' },
        { value: 'instances', label: 'Instances' },
      ]},
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const amount = inputs['Amount'] ?? values.amount;
      if (!geo) return { outputs: [null, 0] };
      // Create array of duplicated geometry
      const result = [];
      for (let i = 0; i <= amount; i++) {
        result.push(...geoToArray(cloneGeo(geo)));
      }
      return { outputs: [result.length > 0 ? result : null, amount] };
    },
  },

  // =========================================================================
  // MESH READ NODES
  // =========================================================================
  'edge_angle': {
    label: 'Edge Angle',
    category: 'MESH_OPS',
    inputs: [],
    outputs: [
      { name: 'Unsigned Angle', type: SocketType.FLOAT },
      { name: 'Signed Angle', type: SocketType.FLOAT },
    ],
    defaults: {},
    evaluate() {
      // Field node: returns default values; actual per-edge evaluation at build time
      return { outputs: [0, 0] };
    },
  },

  'edge_neighbors': {
    label: 'Edge Neighbors',
    category: 'MESH_OPS',
    inputs: [],
    outputs: [
      { name: 'Face Count', type: SocketType.INT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [2] };
    },
  },

  'face_area': {
    label: 'Face Area',
    category: 'MESH_OPS',
    inputs: [],
    outputs: [
      { name: 'Area', type: SocketType.FLOAT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [1.0] };
    },
  },

  'face_neighbors': {
    label: 'Face Neighbors',
    category: 'MESH_OPS',
    inputs: [],
    outputs: [
      { name: 'Vertex Count', type: SocketType.INT },
      { name: 'Face Count', type: SocketType.INT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [4, 4] };
    },
  },

  'vertex_neighbors': {
    label: 'Vertex Neighbors',
    category: 'MESH_OPS',
    inputs: [],
    outputs: [
      { name: 'Vertex Count', type: SocketType.INT },
      { name: 'Face Count', type: SocketType.INT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [4, 4] };
    },
  },

  // =========================================================================
  // MESH WRITE NODES
  // =========================================================================
  'set_sharp_edges': {
    label: 'Set Sharp Edges',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Selection', type: SocketType.BOOL },
      { name: 'Sharp', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { sharp: true },
    props: [
      { key: 'sharp', label: 'Sharp', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const sharp = inputs['Sharp'] ?? values.sharp;
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.sharpEdges = sharp;
        return g;
      })] };
    },
  },

  'set_sharp_faces': {
    label: 'Set Sharp Faces',
    category: 'MESH_OPS',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Selection', type: SocketType.BOOL },
      { name: 'Sharp', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { sharp: true },
    props: [
      { key: 'sharp', label: 'Sharp', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const sharp = inputs['Sharp'] ?? values.sharp;
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.sharpFaces = sharp;
        g.smooth = !sharp;
        return g;
      })] };
    },
  },

  // =========================================================================
  // NEW CURVE PRIMITIVES
  // =========================================================================
  'curve_arc': {
    label: 'Arc',
    category: 'CURVE',
    inputs: [
      { name: 'Resolution', type: SocketType.INT },
      { name: 'Radius', type: SocketType.FLOAT },
      { name: 'Start Angle', type: SocketType.FLOAT },
      { name: 'Sweep Angle', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { resolution: 16, radius: 1, startAngle: 0, sweepAngle: 315 },
    props: [
      { key: 'resolution', label: 'Resolution', type: 'int', min: 2, max: 128, step: 1 },
      { key: 'radius', label: 'Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'startAngle', label: 'Start Angle (deg)', type: 'float', min: 0, max: 360, step: 1 },
      { key: 'sweepAngle', label: 'Sweep Angle (deg)', type: 'float', min: -360, max: 360, step: 1 },
    ],
    evaluate(values, inputs) {
      const resolution = inputs['Resolution'] ?? values.resolution;
      const radius = inputs['Radius'] ?? values.radius;
      const startAngle = (inputs['Start Angle'] ?? values.startAngle) * Math.PI / 180;
      const sweepAngle = (inputs['Sweep Angle'] ?? values.sweepAngle) * Math.PI / 180;
      return { outputs: [{
        type: 'curve_arc',
        resolution, radius, startAngle, sweepAngle,
        transforms: [], smooth: false,
      }] };
    },
  },

  'curve_star': {
    label: 'Star',
    category: 'CURVE',
    inputs: [
      { name: 'Points', type: SocketType.INT },
      { name: 'Inner Radius', type: SocketType.FLOAT },
      { name: 'Outer Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { points: 5, innerRadius: 0.5, outerRadius: 1, twist: 0 },
    props: [
      { key: 'points', label: 'Points', type: 'int', min: 3, max: 64, step: 1 },
      { key: 'innerRadius', label: 'Inner Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'outerRadius', label: 'Outer Radius', type: 'float', min: 0.01, max: 50, step: 0.1 },
      { key: 'twist', label: 'Twist (deg)', type: 'float', min: -360, max: 360, step: 1 },
    ],
    evaluate(values, inputs) {
      const pts = inputs['Points'] ?? values.points;
      const innerR = inputs['Inner Radius'] ?? values.innerRadius;
      const outerR = inputs['Outer Radius'] ?? values.outerRadius;
      return { outputs: [{
        type: 'curve_star',
        points: pts, innerRadius: innerR, outerRadius: outerR,
        twist: (values.twist ?? 0) * Math.PI / 180,
        transforms: [], smooth: false,
      }] };
    },
  },

  // =========================================================================
  // NEW CURVE OPERATIONS
  // =========================================================================
  'curve_to_points': {
    label: 'Curve to Points',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Count', type: SocketType.INT },
    ],
    outputs: [
      { name: 'Points', type: SocketType.GEOMETRY },
      { name: 'Tangent', type: SocketType.VECTOR },
      { name: 'Normal', type: SocketType.VECTOR },
    ],
    defaults: { mode: 'count', count: 16 },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'count', label: 'Count' },
        { value: 'evaluated', label: 'Evaluated' },
      ]},
      { key: 'count', label: 'Count', type: 'int', min: 2, max: 256, step: 1 },
    ],
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      const count = inputs['Count'] ?? values.count;
      if (!curve) return { outputs: [null, { x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 }] };
      return {
        outputs: [
          {
            type: 'points',
            source: cloneGeo(curve),
            mode: 'vertices',
            density: 1,
            seed: 0,
            curveToPoints: { mode: values.mode, count },
            transforms: [], smooth: false,
          },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 1, z: 0 },
        ],
      };
    },
  },

  'fillet_curve': {
    label: 'Fillet Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Count', type: SocketType.INT },
      { name: 'Radius', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { count: 1, radius: 0.25, mode: 'bezier' },
    props: [
      { key: 'count', label: 'Count', type: 'int', min: 1, max: 32, step: 1 },
      { key: 'radius', label: 'Radius', type: 'float', min: 0, max: 10, step: 0.01 },
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'bezier', label: 'Bezier' },
        { value: 'poly', label: 'Poly' },
      ]},
    ],
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      const count = inputs['Count'] ?? values.count;
      const radius = inputs['Radius'] ?? values.radius;
      if (!curve) return { outputs: [null] };
      return { outputs: [mapGeo(curve, g => {
        g.fillet = { count, radius, mode: values.mode };
        return g;
      })] };
    },
  },

  'trim_curve': {
    label: 'Trim Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
      { name: 'Start', type: SocketType.FLOAT },
      { name: 'End', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: { start: 0, end: 1, mode: 'factor' },
    props: [
      { key: 'start', label: 'Start', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'end', label: 'End', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'factor', label: 'Factor' },
        { value: 'length', label: 'Length' },
      ]},
    ],
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      const start = inputs['Start'] ?? values.start;
      const end = inputs['End'] ?? values.end;
      if (!curve) return { outputs: [null] };
      return { outputs: [mapGeo(curve, g => {
        g.trim = { start, end, mode: values.mode };
        return g;
      })] };
    },
  },

  'reverse_curve': {
    label: 'Reverse Curve',
    category: 'CURVE',
    inputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Curve', type: SocketType.GEOMETRY },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const curve = inputs['Curve'];
      if (!curve) return { outputs: [null] };
      return { outputs: [mapGeo(curve, g => {
        g.reverseCurve = true;
        return g;
      })] };
    },
  },

  // =========================================================================
  // CURVE READ NODES
  // =========================================================================
  'spline_parameter': {
    label: 'Spline Parameter',
    category: 'CURVE',
    inputs: [],
    outputs: [
      { name: 'Factor', type: SocketType.FLOAT },
      { name: 'Length', type: SocketType.FLOAT },
      { name: 'Index', type: SocketType.INT },
    ],
    defaults: {},
    evaluate() {
      // Field node: returns defaults; actual per-point values evaluated at build time
      return { outputs: [0.5, 1.0, 0] };
    },
  },

  // =========================================================================
  // CURVE WRITE NODES
  // =========================================================================
  'set_spline_cyclic': {
    label: 'Set Spline Cyclic',
    category: 'CURVE',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
      { name: 'Cyclic', type: SocketType.BOOL },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { cyclic: true },
    props: [
      { key: 'cyclic', label: 'Cyclic', type: 'bool' },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      const cyclic = inputs['Cyclic'] ?? values.cyclic;
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.cyclic = cyclic;
        return g;
      })] };
    },
  },

  // =========================================================================
  // MATERIAL NODES
  // =========================================================================
  'set_material': {
    label: 'Set Material',
    category: 'MATERIAL',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    outputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    defaults: { color: '#6688cc', metallic: 0, roughness: 0.5 },
    props: [
      { key: 'color', label: 'Color', type: 'color' },
      { key: 'metallic', label: 'Metallic', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'roughness', label: 'Roughness', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const geo = inputs['Geometry'];
      if (!geo) return { outputs: [null] };
      return { outputs: [mapGeo(geo, g => {
        g.material = {
          color: values.color,
          metallic: values.metallic,
          roughness: values.roughness,
        };
        return g;
      })] };
    },
  },

  'material_index': {
    label: 'Material Index',
    category: 'MATERIAL',
    inputs: [],
    outputs: [
      { name: 'Material Index', type: SocketType.INT },
    ],
    defaults: {},
    evaluate() {
      return { outputs: [0] };
    },
  },

  // =========================================================================
  // COLOR NODES
  // =========================================================================
  'geo_color_ramp': {
    label: 'Color Ramp',
    category: 'COLOR',
    inputs: [
      { name: 'Fac', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Color', type: SocketType.COLOR },
      { name: 'Alpha', type: SocketType.FLOAT },
    ],
    defaults: { color1: '#000000', color2: '#ffffff', pos1: 0, pos2: 1 },
    props: [
      { key: 'color1', label: 'Color 1', type: 'color' },
      { key: 'color2', label: 'Color 2', type: 'color' },
      { key: 'pos1', label: 'Pos 1', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'pos2', label: 'Pos 2', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const fac = clampVal(inputs['Fac'] ?? 0.5, 0, 1);
      const h = hex => {
        const hh = (hex || '#000000').replace('#', '');
        return {
          r: parseInt(hh.substring(0, 2), 16) / 255,
          g: parseInt(hh.substring(2, 4), 16) / 255,
          b: parseInt(hh.substring(4, 6), 16) / 255,
        };
      };
      const c1 = h(values.color1);
      const c2 = h(values.color2);
      const p1 = values.pos1 ?? 0;
      const p2 = values.pos2 ?? 1;
      const range = p2 - p1;
      const t = range > 0 ? clampVal((fac - p1) / range, 0, 1) : (fac >= p1 ? 1 : 0);
      return {
        outputs: [
          {
            r: c1.r + (c2.r - c1.r) * t,
            g: c1.g + (c2.g - c1.g) * t,
            b: c1.b + (c2.b - c1.b) * t,
          },
          t,
        ],
      };
    },
  },

  'geo_combine_color': {
    label: 'Combine Color',
    category: 'COLOR',
    inputs: [
      { name: 'R', type: SocketType.FLOAT },
      { name: 'G', type: SocketType.FLOAT },
      { name: 'B', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    defaults: { r: 0, g: 0, b: 0, mode: 'rgb' },
    props: [
      { key: 'r', label: 'R / H', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'g', label: 'G / S', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'b', label: 'B / V', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'rgb', label: 'RGB' },
        { value: 'hsv', label: 'HSV' },
      ]},
    ],
    evaluate(values, inputs) {
      const c1 = clampVal(inputs['R'] ?? values.r ?? 0, 0, 1);
      const c2 = clampVal(inputs['G'] ?? values.g ?? 0, 0, 1);
      const c3 = clampVal(inputs['B'] ?? values.b ?? 0, 0, 1);
      if (values.mode === 'hsv') {
        // HSV to RGB conversion
        const h = c1, s = c2, v = c3;
        const hi = Math.floor(h * 6);
        const f = h * 6 - hi;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        let r, g, b;
        switch (hi % 6) {
          case 0: r = v; g = t; b = p; break;
          case 1: r = q; g = v; b = p; break;
          case 2: r = p; g = v; b = t; break;
          case 3: r = p; g = q; b = v; break;
          case 4: r = t; g = p; b = v; break;
          case 5: r = v; g = p; b = q; break;
          default: r = v; g = t; b = p;
        }
        return { outputs: [{ r, g, b }] };
      }
      return { outputs: [{ r: c1, g: c2, b: c3 }] };
    },
  },

  'geo_separate_color': {
    label: 'Separate Color',
    category: 'COLOR',
    inputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    outputs: [
      { name: 'R', type: SocketType.FLOAT },
      { name: 'G', type: SocketType.FLOAT },
      { name: 'B', type: SocketType.FLOAT },
    ],
    defaults: { mode: 'rgb' },
    props: [
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'rgb', label: 'RGB' },
        { value: 'hsv', label: 'HSV' },
      ]},
    ],
    evaluate(values, inputs) {
      const color = inputs['Color'] || { r: 0, g: 0, b: 0 };
      if (values.mode === 'hsv') {
        // RGB to HSV conversion
        const r = color.r ?? 0, g = color.g ?? 0, b = color.b ?? 0;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const d = mx - mn;
        let h = 0;
        const s = mx === 0 ? 0 : d / mx;
        const v = mx;
        if (d !== 0) {
          if (mx === r) h = ((g - b) / d + 6) % 6;
          else if (mx === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h /= 6;
        }
        return { outputs: [h, s, v] };
      }
      return { outputs: [color.r ?? 0, color.g ?? 0, color.b ?? 0] };
    },
  },

});
