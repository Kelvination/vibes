/**
 * Node type definitions for the geometry nodes editor.
 * Each node type has inputs, outputs, defaults, and an evaluate function.
 */

const SocketType = {
  GEOMETRY: 'geometry',
  FLOAT: 'float',
  INT: 'int',
  VECTOR: 'vector',
  BOOL: 'bool',
};

const SocketColors = {
  geometry: '#69f0ae',
  float: '#90a4ae',
  int: '#4fc3f7',
  vector: '#7c4dff',
  bool: '#ffab40',
};

const NodeCategories = {
  INPUT: { name: 'Input', color: '#c62828', icon: '→' },
  FIELD: { name: 'Field', color: '#ad1457', icon: '◎' },
  MESH: { name: 'Mesh Primitives', color: '#2e7d32', icon: '△' },
  MESH_OPS: { name: 'Mesh Operations', color: '#1b5e20', icon: '⬡' },
  TRANSFORM: { name: 'Transform', color: '#1565c0', icon: '↻' },
  GEOMETRY: { name: 'Geometry', color: '#00838f', icon: '◈' },
  INSTANCE: { name: 'Instances', color: '#00695c', icon: '⊞' },
  CURVE: { name: 'Curve', color: '#827717', icon: '∿' },
  MATH: { name: 'Math', color: '#6a1b9a', icon: 'ƒ' },
  UTILITY: { name: 'Utility', color: '#4527a0', icon: '⚙' },
  TEXTURE: { name: 'Texture', color: '#bf360c', icon: '▤' },
  OUTPUT: { name: 'Output', color: '#e65100', icon: '◉' },
};

/**
 * Registry of all available node types.
 */
const NodeTypes = {
  // ===== Output =====
  'output': {
    label: 'Group Output',
    category: 'OUTPUT',
    inputs: [
      { name: 'Geometry', type: SocketType.GEOMETRY },
    ],
    outputs: [],
    defaults: {},
    singular: true,
  },

  // ===================================================================
  // INPUT NODES
  // ===================================================================
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
  },

  // ===================================================================
  // FIELD NODES (per-element attribute access)
  // ===================================================================
  'position': {
    label: 'Position',
    category: 'FIELD',
    inputs: [],
    outputs: [
      { name: 'Position', type: SocketType.VECTOR },
    ],
    defaults: {},
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
  },

  'normal': {
    label: 'Normal',
    category: 'FIELD',
    inputs: [],
    outputs: [
      { name: 'Normal', type: SocketType.VECTOR },
    ],
    defaults: {},
  },

  'index': {
    label: 'Index',
    category: 'FIELD',
    inputs: [],
    outputs: [
      { name: 'Index', type: SocketType.INT },
    ],
    defaults: {},
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
  },

  // ===================================================================
  // MESH PRIMITIVES
  // ===================================================================
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
  },

  // ===================================================================
  // MESH OPERATIONS (geometry modification)
  // ===================================================================
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
  },

  // ===================================================================
  // TRANSFORM
  // ===================================================================
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
  },

  // ===================================================================
  // GEOMETRY OPERATIONS
  // ===================================================================
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
  },

  // ===================================================================
  // INSTANCE NODES
  // ===================================================================
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
  },

  // ===================================================================
  // CURVE NODES
  // ===================================================================
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
  },

  // ===================================================================
  // MATH NODES
  // ===================================================================
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
  },

  // ===================================================================
  // UTILITY NODES
  // ===================================================================
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
  },

  // ===================================================================
  // TEXTURE NODES
  // ===================================================================
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
  },
};
