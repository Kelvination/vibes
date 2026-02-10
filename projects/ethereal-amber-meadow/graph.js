/**
 * Graph data model - manages nodes, connections, and evaluation.
 */
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

    // Enforce singular nodes (only one output node)
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
    // Validate types match
    const fromDef = NodeTypes[this.nodes.find(n => n.id === fromNode)?.type];
    const toDef = NodeTypes[this.nodes.find(n => n.id === toNode)?.type];
    if (!fromDef || !toDef) return false;

    const fromType = fromDef.outputs[fromSocket]?.type;
    const toType = toDef.inputs[toSocket]?.type;
    if (!fromType || !toType) return false;
    if (fromType !== toType) return false;

    // Don't connect to self
    if (fromNode === toNode) return false;

    this.saveUndo();

    // Remove existing connection to this input
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
   * Returns an array of geometry instructions for the 3D viewport.
   */
  evaluate() {
    const outputNode = this.nodes.find(n => n.type === 'output');
    if (!outputNode) return { geometries: [], error: 'No output node' };

    const evaluated = {};
    const errors = [];

    const evalNode = (nodeId) => {
      if (evaluated[nodeId] !== undefined) return evaluated[nodeId];

      const node = this.nodes.find(n => n.id === nodeId);
      if (!node) return null;

      const def = NodeTypes[node.type];
      if (!def) return null;

      // Gather inputs by evaluating connected nodes
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

      // Process based on node type
      let result = { outputs: [] };

      try {
        switch (node.type) {
          case 'output':
            result.outputs = [];
            result.geometry = inputValues['Geometry'] || null;
            break;

          case 'value_float':
            result.outputs = [node.values.value];
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

          case 'mesh_cube': {
            const size = inputValues['Size'] || { x: node.values.sizeX, y: node.values.sizeY, z: node.values.sizeZ };
            result.outputs = [{
              type: 'cube',
              sizeX: size.x || node.values.sizeX,
              sizeY: size.y || node.values.sizeY,
              sizeZ: size.z || node.values.sizeZ,
              transforms: [],
              smooth: false,
            }];
            break;
          }

          case 'mesh_sphere': {
            const r = inputValues['Radius'] ?? node.values.radius;
            result.outputs = [{
              type: 'sphere',
              radius: r,
              segments: node.values.segments,
              rings: node.values.rings,
              transforms: [],
              smooth: false,
            }];
            break;
          }

          case 'mesh_cylinder': {
            const r = inputValues['Radius'] ?? node.values.radius;
            const d = inputValues['Depth'] ?? node.values.depth;
            result.outputs = [{
              type: 'cylinder',
              radius: r,
              depth: d,
              vertices: node.values.vertices,
              transforms: [],
              smooth: false,
            }];
            break;
          }

          case 'mesh_cone': {
            const r = inputValues['Radius'] ?? node.values.radius1;
            const d = inputValues['Depth'] ?? node.values.depth;
            result.outputs = [{
              type: 'cone',
              radius1: node.values.radius1,
              radius2: node.values.radius2,
              depth: d,
              vertices: node.values.vertices,
              transforms: [],
              smooth: false,
            }];
            break;
          }

          case 'mesh_torus':
            result.outputs = [{
              type: 'torus',
              majorRadius: node.values.majorRadius,
              minorRadius: node.values.minorRadius,
              majorSegments: node.values.majorSegments,
              minorSegments: node.values.minorSegments,
              transforms: [],
              smooth: false,
            }];
            break;

          case 'mesh_plane': {
            const sz = inputValues['Size'] ?? null;
            result.outputs = [{
              type: 'plane',
              sizeX: sz ?? node.values.sizeX,
              sizeY: sz ?? node.values.sizeY,
              subdX: node.values.subdX,
              subdY: node.values.subdY,
              transforms: [],
              smooth: false,
            }];
            break;
          }

          case 'mesh_icosphere': {
            const r = inputValues['Radius'] ?? node.values.radius;
            result.outputs = [{
              type: 'icosphere',
              radius: r,
              detail: node.values.detail,
              transforms: [],
              smooth: false,
            }];
            break;
          }

          case 'transform': {
            const geo = inputValues['Geometry'];
            if (!geo) {
              result.outputs = [null];
              break;
            }
            const t = inputValues['Translation'] || { x: node.values.tx, y: node.values.ty, z: node.values.tz };
            const r = inputValues['Rotation'] || { x: node.values.rx, y: node.values.ry, z: node.values.rz };
            const s = inputValues['Scale'] || { x: node.values.sx, y: node.values.sy, z: node.values.sz };

            // Clone geo and add transform
            const clone = JSON.parse(JSON.stringify(geo));
            if (Array.isArray(clone)) {
              clone.forEach(g => {
                g.transforms = g.transforms || [];
                g.transforms.push({
                  translate: { x: t.x || node.values.tx, y: t.y || node.values.ty, z: t.z || node.values.tz },
                  rotate: { x: (r.x || node.values.rx) * Math.PI / 180, y: (r.y || node.values.ry) * Math.PI / 180, z: (r.z || node.values.rz) * Math.PI / 180 },
                  scale: { x: s.x || node.values.sx, y: s.y || node.values.sy, z: s.z || node.values.sz },
                });
              });
              result.outputs = [clone];
            } else {
              clone.transforms = clone.transforms || [];
              clone.transforms.push({
                translate: { x: t.x || node.values.tx, y: t.y || node.values.ty, z: t.z || node.values.tz },
                rotate: { x: (r.x || node.values.rx) * Math.PI / 180, y: (r.y || node.values.ry) * Math.PI / 180, z: (r.z || node.values.rz) * Math.PI / 180 },
                scale: { x: s.x || node.values.sx, y: s.y || node.values.sy, z: s.z || node.values.sz },
              });
              result.outputs = [clone];
            }
            break;
          }

          case 'join_geometry': {
            const g1 = inputValues['Geometry 1'];
            const g2 = inputValues['Geometry 2'];
            const combined = [];
            if (g1) combined.push(...(Array.isArray(g1) ? g1 : [g1]));
            if (g2) combined.push(...(Array.isArray(g2) ? g2 : [g2]));
            result.outputs = [combined.length > 0 ? combined : null];
            break;
          }

          case 'subdivide': {
            const mesh = inputValues['Mesh'];
            const lvl = inputValues['Level'] ?? node.values.level;
            if (!mesh) { result.outputs = [null]; break; }
            const clone = JSON.parse(JSON.stringify(mesh));
            if (Array.isArray(clone)) {
              clone.forEach(g => { g.subdivide = (g.subdivide || 0) + lvl; });
            } else {
              clone.subdivide = (clone.subdivide || 0) + lvl;
            }
            result.outputs = [clone];
            break;
          }

          case 'set_shade_smooth': {
            const geo = inputValues['Geometry'];
            const sm = inputValues['Smooth'] ?? node.values.smooth;
            if (!geo) { result.outputs = [null]; break; }
            const clone = JSON.parse(JSON.stringify(geo));
            if (Array.isArray(clone)) {
              clone.forEach(g => { g.smooth = sm; });
            } else {
              clone.smooth = sm;
            }
            result.outputs = [clone];
            break;
          }

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
              case 'min': val = Math.min(a, b); break;
              case 'max': val = Math.max(a, b); break;
              case 'abs': val = Math.abs(a); break;
              case 'sin': val = Math.sin(a); break;
              case 'cos': val = Math.cos(a); break;
            }
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
              case 'cross': vec = {
                x: a.y * b.z - a.z * b.y,
                y: a.z * b.x - a.x * b.z,
                z: a.x * b.y - a.y * b.x,
              }; break;
              case 'dot': scalar = a.x * b.x + a.y * b.y + a.z * b.z; break;
              case 'normalize': {
                const len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) || 1;
                vec = { x: a.x / len, y: a.y / len, z: a.z / len };
              } break;
              case 'length': scalar = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); break;
              case 'scale': vec = { x: a.x * b.x, y: a.y * b.x, z: a.z * b.x }; break;
            }
            result.outputs = [vec, scalar];
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

    return { geometries, error: errors.length > 0 ? errors.join('; ') : null };
  }

  /**
   * Serialize the graph to JSON for persistence.
   */
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
