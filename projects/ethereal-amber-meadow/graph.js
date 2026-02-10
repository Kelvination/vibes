/**
 * Graph data model - manages nodes, connections, and evaluation.
 */

// Simple seeded PRNG (mulberry32)
function seededRandom(seed) {
  let t = (seed + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Simple 3D noise (value noise based on hashing)
function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

function valueNoise3D(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = smoothstep(x - ix), fy = smoothstep(y - iy), fz = smoothstep(z - iz);
  return lerp(
    lerp(
      lerp(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx),
      lerp(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
    lerp(
      lerp(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx),
      lerp(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}

function fbmNoise3D(x, y, z, octaves, roughness) {
  let val = 0, amp = 1, freq = 1, maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    val += valueNoise3D(x * freq, y * freq, z * freq) * amp;
    maxVal += amp;
    amp *= roughness;
    freq *= 2;
  }
  return val / maxVal;
}

// Helper: clone geo data
function cloneGeo(geo) {
  return JSON.parse(JSON.stringify(geo));
}

// Helper: ensure array of geos
function geoToArray(geo) {
  if (!geo) return [];
  return Array.isArray(geo) ? geo : [geo];
}

// Helper: apply fn to single geo or array
function mapGeo(geo, fn) {
  if (!geo) return null;
  if (Array.isArray(geo)) return geo.map(g => fn(cloneGeo(g)));
  return fn(cloneGeo(geo));
}

class NodeGraph {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.nextId = 1;
    this.undoStack = [];
    this.maxUndo = 30;
  }

  saveUndo() {
    this.undoStack.push(JSON.stringify({
      nodes: this.nodes,
      connections: this.connections,
      nextId: this.nextId,
    }));
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    const state = JSON.parse(this.undoStack.pop());
    this.nodes = state.nodes;
    this.connections = state.connections;
    this.nextId = state.nextId;
    return true;
  }

  addNode(typeId, x, y) {
    const typeDef = NodeTypes[typeId];
    if (!typeDef) return null;

    if (typeDef.singular) {
      const existing = this.nodes.find(n => n.type === typeId);
      if (existing) return existing;
    }

    this.saveUndo();

    const node = {
      id: this.nextId++,
      type: typeId,
      x: x,
      y: y,
      values: { ...typeDef.defaults },
      collapsed: false,
    };

    this.nodes.push(node);
    return node;
  }

  removeNode(nodeId) {
    this.saveUndo();
    this.connections = this.connections.filter(
      c => c.fromNode !== nodeId && c.toNode !== nodeId
    );
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
  }

  moveNode(nodeId, x, y) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) { node.x = x; node.y = y; }
  }

  setNodeValue(nodeId, key, value) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      this.saveUndo();
      node.values[key] = value;
    }
  }

  addConnection(fromNode, fromSocket, toNode, toSocket) {
    const fromDef = NodeTypes[this.nodes.find(n => n.id === fromNode)?.type];
    const toDef = NodeTypes[this.nodes.find(n => n.id === toNode)?.type];
    if (!fromDef || !toDef) return false;

    const fromType = fromDef.outputs[fromSocket]?.type;
    const toType = toDef.inputs[toSocket]?.type;
    if (!fromType || !toType) return false;
    if (fromType !== toType) return false;
    if (fromNode === toNode) return false;

    this.saveUndo();

    this.connections = this.connections.filter(
      c => !(c.toNode === toNode && c.toSocket === toSocket)
    );

    this.connections.push({ fromNode, fromSocket, toNode, toSocket });
    return true;
  }

  removeConnection(fromNode, fromSocket, toNode, toSocket) {
    this.saveUndo();
    this.connections = this.connections.filter(
      c => !(c.fromNode === fromNode && c.fromSocket === fromSocket &&
             c.toNode === toNode && c.toSocket === toSocket)
    );
  }

  getInputConnection(nodeId, socketIdx) {
    return this.connections.find(
      c => c.toNode === nodeId && c.toSocket === socketIdx
    );
  }

  getNodeDef(node) {
    return NodeTypes[node.type];
  }

  /**
   * Evaluate the graph starting from the output node.
   */
  evaluate() {
    const outputNode = this.nodes.find(n => n.type === 'output');
    if (!outputNode) return { geometries: [], error: 'No output node' };

    const evaluated = {};
    const errors = [];
    const startTime = performance.now();

    const evalNode = (nodeId) => {
      if (evaluated[nodeId] !== undefined) return evaluated[nodeId];

      const node = this.nodes.find(n => n.id === nodeId);
      if (!node) return null;

      const def = NodeTypes[node.type];
      if (!def) return null;

      // Gather inputs
      const inputValues = {};
      def.inputs.forEach((inp, idx) => {
        const conn = this.getInputConnection(nodeId, idx);
        if (conn) {
          const upstreamResult = evalNode(conn.fromNode);
          if (upstreamResult && upstreamResult.outputs) {
            inputValues[inp.name] = upstreamResult.outputs[conn.fromSocket];
          }
        }
      });

      let result = { outputs: [] };

      try {
        switch (node.type) {
          // ===== OUTPUT =====
          case 'output':
            result.outputs = [];
            result.geometry = inputValues['Geometry'] || null;
            break;

          // ===== INPUT =====
          case 'value_float':
            result.outputs = [parseFloat(node.values.value) || 0];
            break;

          case 'value_int':
            result.outputs = [Math.round(node.values.value)];
            break;

          case 'value_vector':
            result.outputs = [{ x: node.values.x, y: node.values.y, z: node.values.z }];
            break;

          case 'value_bool':
            result.outputs = [!!node.values.value];
            break;

          case 'random_value': {
            const mn = inputValues['Min'] ?? node.values.min;
            const mx = inputValues['Max'] ?? node.values.max;
            const seed = inputValues['Seed'] ?? node.values.seed;
            const r = seededRandom(seed);
            result.outputs = [mn + r * (mx - mn)];
            break;
          }

          case 'scene_time': {
            const now = performance.now() / 1000;
            const fps = node.values.fps || 24;
            result.outputs = [now, Math.floor(now * fps)];
            break;
          }

          // ===== FIELD =====
          case 'position':
            // Outputs a sentinel vector representing "position field"
            result.outputs = [{ x: 0, y: 0, z: 0, _field: 'position' }];
            break;

          case 'set_position': {
            const geo = inputValues['Geometry'];
            if (!geo) { result.outputs = [null]; break; }
            const pos = inputValues['Position'] || null;
            const offset = inputValues['Offset'] || { x: node.values.offsetX, y: node.values.offsetY, z: node.values.offsetZ };
            const clone = cloneGeo(geo);
            const applySetPos = (g) => {
              g.setPosition = {
                position: pos,
                offset: { x: offset.x || node.values.offsetX, y: offset.y || node.values.offsetY, z: offset.z || node.values.offsetZ },
              };
              return g;
            };
            result.outputs = [mapGeo(clone, applySetPos)];
            break;
          }

          case 'normal':
            result.outputs = [{ x: 0, y: 1, z: 0, _field: 'normal' }];
            break;

          case 'index':
            result.outputs = [0]; // sentinel
            break;

          case 'separate_xyz': {
            const v = inputValues['Vector'] || { x: 0, y: 0, z: 0 };
            result.outputs = [v.x || 0, v.y || 0, v.z || 0];
            break;
          }

          case 'combine_xyz': {
            const x = inputValues['X'] ?? node.values.x;
            const y = inputValues['Y'] ?? node.values.y;
            const z = inputValues['Z'] ?? node.values.z;
            result.outputs = [{ x, y, z }];
            break;
          }

          // ===== MESH PRIMITIVES =====
          case 'mesh_cube': {
            const size = inputValues['Size'] || { x: node.values.sizeX, y: node.values.sizeY, z: node.values.sizeZ };
            result.outputs = [{
              type: 'cube',
              sizeX: size.x || node.values.sizeX,
              sizeY: size.y || node.values.sizeY,
              sizeZ: size.z || node.values.sizeZ,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_sphere': {
            const r = inputValues['Radius'] ?? node.values.radius;
            result.outputs = [{
              type: 'sphere', radius: r,
              segments: node.values.segments, rings: node.values.rings,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_cylinder': {
            const r = inputValues['Radius'] ?? node.values.radius;
            const d = inputValues['Depth'] ?? node.values.depth;
            result.outputs = [{
              type: 'cylinder', radius: r, depth: d,
              vertices: node.values.vertices,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_cone': {
            const d = inputValues['Depth'] ?? node.values.depth;
            result.outputs = [{
              type: 'cone',
              radius1: node.values.radius1, radius2: node.values.radius2,
              depth: d, vertices: node.values.vertices,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_torus':
            result.outputs = [{
              type: 'torus',
              majorRadius: node.values.majorRadius, minorRadius: node.values.minorRadius,
              majorSegments: node.values.majorSegments, minorSegments: node.values.minorSegments,
              transforms: [], smooth: false,
            }];
            break;

          case 'mesh_plane': {
            const sz = inputValues['Size'] ?? null;
            result.outputs = [{
              type: 'plane',
              sizeX: sz ?? node.values.sizeX, sizeY: sz ?? node.values.sizeY,
              subdX: node.values.subdX, subdY: node.values.subdY,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_icosphere': {
            const r = inputValues['Radius'] ?? node.values.radius;
            result.outputs = [{
              type: 'icosphere', radius: r, detail: node.values.detail,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_line': {
            const count = inputValues['Count'] ?? node.values.count;
            result.outputs = [{
              type: 'line', count: count,
              start: { x: node.values.startX, y: node.values.startY, z: node.values.startZ },
              end: { x: node.values.endX, y: node.values.endY, z: node.values.endZ },
              transforms: [], smooth: false,
            }];
            break;
          }

          // ===== MESH OPERATIONS =====
          case 'extrude_mesh': {
            const mesh = inputValues['Mesh'];
            const offset = inputValues['Offset'] ?? node.values.offset;
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.extrude = { mode: node.values.mode, offset, individual: node.values.individual };
              return g;
            })];
            break;
          }

          case 'scale_elements': {
            const geo = inputValues['Geometry'];
            const scale = inputValues['Scale'] ?? node.values.scale;
            if (!geo) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(geo, g => {
              g.scaleElements = { domain: node.values.domain, scale };
              return g;
            })];
            break;
          }

          case 'subdivision_surface': {
            const mesh = inputValues['Mesh'];
            const lvl = inputValues['Level'] ?? node.values.level;
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.subdivisionSurface = (g.subdivisionSurface || 0) + lvl;
              g.smooth = true; // subsurf implies smooth shading
              return g;
            })];
            break;
          }

          case 'mesh_boolean': {
            const a = inputValues['Mesh A'];
            const b = inputValues['Mesh B'];
            if (!a) { result.outputs = [null]; break; }
            // Model as a compound geometry with boolean operation metadata
            const geoA = cloneGeo(a);
            result.outputs = [{
              type: 'boolean',
              operation: node.values.operation,
              meshA: geoA,
              meshB: b ? cloneGeo(b) : null,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'triangulate': {
            const mesh = inputValues['Mesh'];
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.triangulate = true;
              return g;
            })];
            break;
          }

          case 'dual_mesh': {
            const mesh = inputValues['Mesh'];
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.dualMesh = true;
              return g;
            })];
            break;
          }

          case 'flip_faces': {
            const mesh = inputValues['Mesh'];
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.flipFaces = true;
              return g;
            })];
            break;
          }

          case 'split_edges': {
            const mesh = inputValues['Mesh'];
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.splitEdges = true;
              return g;
            })];
            break;
          }

          case 'merge_by_distance': {
            const geo = inputValues['Geometry'];
            const dist = inputValues['Distance'] ?? node.values.distance;
            if (!geo) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(geo, g => {
              g.mergeByDistance = dist;
              return g;
            })];
            break;
          }

          case 'delete_geometry': {
            const geo = inputValues['Geometry'];
            const sel = inputValues['Selection'] ?? true;
            if (!geo) { result.outputs = [null]; break; }
            // If selection is true (delete selected), pass through or null
            if (sel && !node.values.invert) {
              result.outputs = [null]; // everything deleted
            } else {
              result.outputs = [cloneGeo(geo)]; // nothing deleted
            }
            break;
          }

          case 'separate_geometry': {
            const geo = inputValues['Geometry'];
            const sel = inputValues['Selection'] ?? true;
            if (!geo) { result.outputs = [null, null]; break; }
            // Simplified: selection output vs inverted
            if (sel) {
              result.outputs = [cloneGeo(geo), null];
            } else {
              result.outputs = [null, cloneGeo(geo)];
            }
            break;
          }

          // ===== TRANSFORM =====
          case 'transform': {
            const geo = inputValues['Geometry'];
            if (!geo) { result.outputs = [null]; break; }
            const t = inputValues['Translation'] || { x: node.values.tx, y: node.values.ty, z: node.values.tz };
            const r = inputValues['Rotation'] || { x: node.values.rx, y: node.values.ry, z: node.values.rz };
            const s = inputValues['Scale'] || { x: node.values.sx, y: node.values.sy, z: node.values.sz };

            result.outputs = [mapGeo(geo, g => {
              g.transforms = g.transforms || [];
              g.transforms.push({
                translate: { x: t.x ?? node.values.tx, y: t.y ?? node.values.ty, z: t.z ?? node.values.tz },
                rotate: { x: (r.x ?? node.values.rx) * Math.PI / 180, y: (r.y ?? node.values.ry) * Math.PI / 180, z: (r.z ?? node.values.rz) * Math.PI / 180 },
                scale: { x: s.x ?? node.values.sx, y: s.y ?? node.values.sy, z: s.z ?? node.values.sz },
              });
              return g;
            })];
            break;
          }

          // ===== GEOMETRY =====
          case 'join_geometry': {
            const g1 = inputValues['Geometry 1'];
            const g2 = inputValues['Geometry 2'];
            const combined = [];
            if (g1) combined.push(...geoToArray(g1));
            if (g2) combined.push(...geoToArray(g2));
            result.outputs = [combined.length > 0 ? combined : null];
            break;
          }

          case 'subdivide': {
            const mesh = inputValues['Mesh'];
            const lvl = inputValues['Level'] ?? node.values.level;
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(mesh, g => {
              g.subdivide = (g.subdivide || 0) + lvl;
              return g;
            })];
            break;
          }

          case 'set_shade_smooth': {
            const geo = inputValues['Geometry'];
            const sm = inputValues['Smooth'] ?? node.values.smooth;
            if (!geo) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(geo, g => { g.smooth = sm; return g; })];
            break;
          }

          case 'bounding_box': {
            const geo = inputValues['Geometry'];
            if (!geo) { result.outputs = [null, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }]; break; }
            // Create a bounding box cube as approximation
            const bbGeo = {
              type: 'cube', sizeX: 2, sizeY: 2, sizeZ: 2,
              transforms: [], smooth: false,
              wireframeOnly: true,
            };
            result.outputs = [bbGeo, { x: -1, y: -1, z: -1 }, { x: 1, y: 1, z: 1 }];
            break;
          }

          case 'convex_hull': {
            const geo = inputValues['Geometry'];
            if (!geo) { result.outputs = [null]; break; }
            // Approximate as icosphere wrapping
            result.outputs = [mapGeo(geo, g => {
              g.convexHull = true;
              return g;
            })];
            break;
          }

          case 'geometry_proximity': {
            // Returns a distance field value - simplified to a constant
            result.outputs = [0];
            break;
          }

          case 'distribute_points_on_faces': {
            const mesh = inputValues['Mesh'];
            const density = inputValues['Density'] ?? node.values.density;
            const seed = inputValues['Seed'] ?? node.values.seed;
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [{
              type: 'points',
              source: cloneGeo(mesh),
              mode: node.values.mode,
              density: density,
              seed: seed,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'mesh_to_points': {
            const mesh = inputValues['Mesh'];
            if (!mesh) { result.outputs = [null]; break; }
            result.outputs = [{
              type: 'points',
              source: cloneGeo(mesh),
              mode: node.values.mode,
              density: 1,
              seed: 0,
              transforms: [], smooth: false,
            }];
            break;
          }

          // ===== INSTANCES =====
          case 'instance_on_points': {
            const points = inputValues['Points'];
            const instance = inputValues['Instance'];
            const scale = inputValues['Scale'] || { x: node.values.scaleX, y: node.values.scaleY, z: node.values.scaleZ };
            const rotation = inputValues['Rotation'] || { x: 0, y: 0, z: 0 };
            if (!points || !instance) { result.outputs = [points || null]; break; }
            result.outputs = [{
              type: 'instance_on_points',
              points: cloneGeo(points),
              instance: cloneGeo(instance),
              scale: { x: scale.x ?? node.values.scaleX, y: scale.y ?? node.values.scaleY, z: scale.z ?? node.values.scaleZ },
              rotation: rotation,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'realize_instances': {
            const instances = inputValues['Instances'];
            if (!instances) { result.outputs = [null]; break; }
            // Pass through - realize is handled in the viewport
            result.outputs = [mapGeo(instances, g => { g.realized = true; return g; })];
            break;
          }

          case 'rotate_instances': {
            const instances = inputValues['Instances'];
            const rot = inputValues['Rotation'] || { x: node.values.rx, y: node.values.ry, z: node.values.rz };
            if (!instances) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(instances, g => {
              g.transforms = g.transforms || [];
              g.transforms.push({
                translate: { x: 0, y: 0, z: 0 },
                rotate: { x: (rot.x ?? node.values.rx) * Math.PI / 180, y: (rot.y ?? node.values.ry) * Math.PI / 180, z: (rot.z ?? node.values.rz) * Math.PI / 180 },
                scale: { x: 1, y: 1, z: 1 },
              });
              return g;
            })];
            break;
          }

          case 'scale_instances': {
            const instances = inputValues['Instances'];
            const sc = inputValues['Scale'] || { x: node.values.sx, y: node.values.sy, z: node.values.sz };
            if (!instances) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(instances, g => {
              g.transforms = g.transforms || [];
              g.transforms.push({
                translate: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                scale: { x: sc.x ?? node.values.sx, y: sc.y ?? node.values.sy, z: sc.z ?? node.values.sz },
              });
              return g;
            })];
            break;
          }

          case 'translate_instances': {
            const instances = inputValues['Instances'];
            const tr = inputValues['Translation'] || { x: node.values.tx, y: node.values.ty, z: node.values.tz };
            if (!instances) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(instances, g => {
              g.transforms = g.transforms || [];
              g.transforms.push({
                translate: { x: tr.x ?? node.values.tx, y: tr.y ?? node.values.ty, z: tr.z ?? node.values.tz },
                rotate: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
              });
              return g;
            })];
            break;
          }

          // ===== CURVES =====
          case 'curve_circle': {
            const r = inputValues['Radius'] ?? node.values.radius;
            result.outputs = [{
              type: 'curve_circle',
              radius: r, resolution: node.values.resolution,
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'curve_line': {
            const start = inputValues['Start'] || { x: node.values.startX, y: node.values.startY, z: node.values.startZ };
            const end = inputValues['End'] || { x: node.values.endX, y: node.values.endY, z: node.values.endZ };
            result.outputs = [{
              type: 'curve_line',
              start: { x: start.x ?? node.values.startX, y: start.y ?? node.values.startY, z: start.z ?? node.values.startZ },
              end: { x: end.x ?? node.values.endX, y: end.y ?? node.values.endY, z: end.z ?? node.values.endZ },
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'curve_to_mesh': {
            const curve = inputValues['Curve'];
            const profile = inputValues['Profile'];
            if (!curve) { result.outputs = [null]; break; }
            result.outputs = [{
              type: 'curve_to_mesh',
              curve: cloneGeo(curve),
              profile: profile ? cloneGeo(profile) : null,
              fillCaps: node.values.fillCaps,
              transforms: [], smooth: true,
            }];
            break;
          }

          case 'resample_curve': {
            const curve = inputValues['Curve'];
            const count = inputValues['Count'] ?? node.values.count;
            if (!curve) { result.outputs = [null]; break; }
            result.outputs = [mapGeo(curve, g => {
              g.resample = { mode: node.values.mode, count };
              return g;
            })];
            break;
          }

          case 'fill_curve': {
            const curve = inputValues['Curve'];
            if (!curve) { result.outputs = [null]; break; }
            result.outputs = [{
              type: 'fill_curve',
              curve: cloneGeo(curve),
              transforms: [], smooth: false,
            }];
            break;
          }

          case 'curve_spiral':
            result.outputs = [{
              type: 'spiral',
              turns: node.values.turns, height: node.values.height,
              startRadius: node.values.startRadius, endRadius: node.values.endRadius,
              resolution: node.values.resolution,
              transforms: [], smooth: false,
            }];
            break;

          // ===== MATH =====
          case 'math': {
            const a = inputValues['A'] ?? node.values.a;
            const b = inputValues['B'] ?? node.values.b;
            let val = 0;
            switch (node.values.operation) {
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
                const range = b - 0; // wrap between 0 and b
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
            result.outputs = [val];
            break;
          }

          case 'vector_math': {
            const a = inputValues['A'] || { x: 0, y: 0, z: 0 };
            const b = inputValues['B'] || { x: 0, y: 0, z: 0 };
            let vec = { x: 0, y: 0, z: 0 };
            let scalar = 0;
            switch (node.values.operation) {
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
            result.outputs = [vec, scalar];
            break;
          }

          case 'boolean_math': {
            const a = inputValues['A'] ?? node.values.a;
            const b = inputValues['B'] ?? node.values.b;
            let val = false;
            switch (node.values.operation) {
              case 'and': val = a && b; break;
              case 'or': val = a || b; break;
              case 'not': val = !a; break;
              case 'nand': val = !(a && b); break;
              case 'nor': val = !(a || b); break;
              case 'xor': val = (a || b) && !(a && b); break;
              case 'xnor': val = !((a || b) && !(a && b)); break;
            }
            result.outputs = [!!val];
            break;
          }

          case 'clamp': {
            const v = inputValues['Value'] ?? node.values.value;
            const mn = inputValues['Min'] ?? node.values.min;
            const mx = inputValues['Max'] ?? node.values.max;
            result.outputs = [Math.min(Math.max(v, mn), mx)];
            break;
          }

          case 'map_range': {
            const v = inputValues['Value'] ?? node.values.value;
            const fMin = node.values.fromMin;
            const fMax = node.values.fromMax;
            const tMin = node.values.toMin;
            const tMax = node.values.toMax;
            const range = fMax - fMin;
            const mapped = range !== 0 ? tMin + ((v - fMin) / range) * (tMax - tMin) : tMin;
            result.outputs = [mapped];
            break;
          }

          // ===== UTILITY =====
          case 'compare': {
            const a = inputValues['A'] ?? node.values.a;
            const b = inputValues['B'] ?? node.values.b;
            const eps = node.values.epsilon;
            let val = false;
            switch (node.values.operation) {
              case 'less_than': val = a < b; break;
              case 'less_equal': val = a <= b; break;
              case 'greater_than': val = a > b; break;
              case 'greater_equal': val = a >= b; break;
              case 'equal': val = Math.abs(a - b) <= eps; break;
              case 'not_equal': val = Math.abs(a - b) > eps; break;
            }
            result.outputs = [val];
            break;
          }

          case 'switch': {
            const sw = inputValues['Switch'] ?? node.values.switch_val;
            const falseVal = inputValues['False'] || null;
            const trueVal = inputValues['True'] || null;
            result.outputs = [sw ? trueVal : falseVal];
            break;
          }

          case 'switch_float': {
            const sw = inputValues['Switch'] ?? node.values.switch_val;
            const falseVal = inputValues['False'] ?? node.values.falseVal;
            const trueVal = inputValues['True'] ?? node.values.trueVal;
            result.outputs = [sw ? trueVal : falseVal];
            break;
          }

          case 'switch_vector': {
            const sw = inputValues['Switch'] ?? node.values.switch_val;
            const falseVal = inputValues['False'] || { x: 0, y: 0, z: 0 };
            const trueVal = inputValues['True'] || { x: 0, y: 0, z: 0 };
            result.outputs = [sw ? trueVal : falseVal];
            break;
          }

          // ===== TEXTURE =====
          case 'noise_texture': {
            const v = inputValues['Vector'] || { x: 0, y: 0, z: 0 };
            const sc = inputValues['Scale'] ?? node.values.scale;
            const detail = node.values.detail;
            const rough = node.values.roughness;
            const dist = node.values.distortion;
            let sx = v.x * sc, sy = v.y * sc, sz = v.z * sc;
            if (dist > 0) {
              sx += valueNoise3D(sx + 100, sy, sz) * dist;
              sy += valueNoise3D(sx, sy + 100, sz) * dist;
              sz += valueNoise3D(sx, sy, sz + 100) * dist;
            }
            const fac = fbmNoise3D(sx, sy, sz, Math.ceil(detail) + 1, rough);
            result.outputs = [fac, { x: fac, y: fac * 0.8, z: fac * 0.6 }];
            break;
          }

          case 'voronoi_texture': {
            const v = inputValues['Vector'] || { x: 0, y: 0, z: 0 };
            const sc = inputValues['Scale'] ?? node.values.scale;
            const sx = v.x * sc, sy = v.y * sc, sz = v.z * sc;
            const ix = Math.floor(sx), iy = Math.floor(sy), iz = Math.floor(sz);

            let minDist = 999, minDist2 = 999;
            let closestPt = { x: 0, y: 0, z: 0 };
            const rand = node.values.randomness;

            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                  const cx = ix + dx, cy = iy + dy, cz = iz + dz;
                  const px = cx + hash3(cx, cy, cz) * rand;
                  const py = cy + hash3(cx + 73, cy + 157, cz + 31) * rand;
                  const pz = cz + hash3(cx + 139, cy + 29, cz + 97) * rand;
                  const ddx = sx - px, ddy = sy - py, ddz = sz - pz;
                  const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
                  if (d < minDist) {
                    minDist2 = minDist;
                    minDist = d;
                    closestPt = { x: px, y: py, z: pz };
                  } else if (d < minDist2) {
                    minDist2 = d;
                  }
                }
              }
            }

            let dist;
            switch (node.values.feature) {
              case 'f1': dist = minDist; break;
              case 'f2': dist = minDist2; break;
              case 'smooth_f1': dist = minDist * 0.7 + minDist2 * 0.3; break;
              default: dist = minDist;
            }

            const col = {
              x: hash3(Math.floor(closestPt.x * 100), Math.floor(closestPt.y * 100), 0),
              y: hash3(Math.floor(closestPt.x * 100), 0, Math.floor(closestPt.z * 100)),
              z: hash3(0, Math.floor(closestPt.y * 100), Math.floor(closestPt.z * 100)),
            };
            result.outputs = [dist, col];
            break;
          }

          case 'white_noise': {
            const v = inputValues['Vector'] || { x: 0, y: 0, z: 0 };
            const val = hash3(Math.floor(v.x * 1000), Math.floor(v.y * 1000), Math.floor(v.z * 1000));
            const col = {
              x: hash3(Math.floor(v.x * 1000) + 17, Math.floor(v.y * 1000) + 31, Math.floor(v.z * 1000) + 59),
              y: hash3(Math.floor(v.x * 1000) + 73, Math.floor(v.y * 1000) + 97, Math.floor(v.z * 1000) + 113),
              z: hash3(Math.floor(v.x * 1000) + 151, Math.floor(v.y * 1000) + 173, Math.floor(v.z * 1000) + 199),
            };
            result.outputs = [val, col];
            break;
          }

          default:
            errors.push(`Unknown node type: ${node.type}`);
            break;
        }
      } catch (e) {
        errors.push(`Error in ${def.label}: ${e.message}`);
      }

      evaluated[nodeId] = result;
      return result;
    };

    const outputResult = evalNode(outputNode.id);
    const geoData = outputResult?.geometry;

    let geometries = [];
    if (geoData) {
      if (Array.isArray(geoData)) {
        geometries = geoData.filter(Boolean);
      } else {
        geometries = [geoData];
      }
    }

    const evalTime = (performance.now() - startTime).toFixed(1);

    return {
      geometries,
      error: errors.length > 0 ? errors.join('; ') : null,
      evalTime,
    };
  }

  toJSON() {
    return JSON.stringify({
      nodes: this.nodes,
      connections: this.connections,
      nextId: this.nextId,
    });
  }

  fromJSON(json) {
    try {
      const data = JSON.parse(json);
      this.nodes = data.nodes || [];
      this.connections = data.connections || [];
      this.nextId = data.nextId || 1;
      return true;
    } catch (e) {
      return false;
    }
  }
}
