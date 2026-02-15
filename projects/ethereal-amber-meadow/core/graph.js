/**
 * core/graph.js - Generic graph data model.
 *
 * Works for both geometry and shader graphs. The graph stores nodes and
 * connections; evaluation is delegated to per-node `evaluate` functions
 * looked up from the registry.
 */
import { registry } from './registry.js';

export class NodeGraph {
  // Allow implicit coercion between compatible numeric/bool types
  static typesCompatible(fromType, toType) {
    if (fromType === toType) return true;
    const coercions = {
      'float:bool': true,   // float > 0.5 → true
      'int:bool': true,     // int !== 0 → true
      'float:int': true,    // float → round to int
      'int:float': true,    // int → float
      'bool:float': true,   // true → 1.0, false → 0.0
      'bool:int': true,     // true → 1, false → 0
    };
    return !!coercions[`${fromType}:${toType}`];
  }

  constructor(graphType) {
    this.graphType = graphType; // 'geo' or 'shader'
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
    const typeDef = registry.getNodeDef(this.graphType, typeId);
    if (!typeDef) return null;
    if (typeDef.singular) {
      const existing = this.nodes.find(n => n.type === typeId);
      if (existing) return existing;
    }
    this.saveUndo();
    const node = {
      id: this.nextId++,
      type: typeId,
      x, y,
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
    const fromNodeObj = this.nodes.find(n => n.id === fromNode);
    const toNodeObj = this.nodes.find(n => n.id === toNode);
    const fromDef = registry.getNodeDef(this.graphType, fromNodeObj?.type);
    const toDef = registry.getNodeDef(this.graphType, toNodeObj?.type);
    if (!fromDef || !toDef) return false;

    const fromType = fromDef.outputs[fromSocket]?.type;
    const toType = toDef.inputs[toSocket]?.type;
    if (!fromType || !toType) return false;
    if (fromType !== toType && !NodeGraph.typesCompatible(fromType, toType)) return false;
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
    return registry.getNodeDef(this.graphType, node.type);
  }

  /**
   * Evaluate the graph. Finds the output node, walks backwards,
   * calling each node's registered `evaluate()` function.
   */
  evaluate() {
    const outputTypeId = this.graphType === 'shader' ? 'shader_output' : 'output';
    const outputNode = this.nodes.find(n => n.type === outputTypeId);
    if (!outputNode) return { geometries: [], shaderResult: null, error: 'No output node' };

    const evaluated = {};
    const errors = [];
    const startTime = performance.now();

    const evalNode = (nodeId) => {
      if (evaluated[nodeId] !== undefined) return evaluated[nodeId];

      const node = this.nodes.find(n => n.id === nodeId);
      if (!node) return null;

      const def = registry.getNodeDef(this.graphType, node.type);
      if (!def) return null;

      // Gather inputs by recursively evaluating upstream
      const inputValues = {};
      def.inputs.forEach((inp, idx) => {
        const conn = this.getInputConnection(nodeId, idx);
        if (conn) {
          const upstream = evalNode(conn.fromNode);
          if (upstream?.outputs) {
            inputValues[inp.name] = upstream.outputs[conn.fromSocket];
          }
        }
      });

      let result = { outputs: [] };
      try {
        if (typeof def.evaluate === 'function') {
          result = def.evaluate(node.values, inputValues, node);
        } else {
          errors.push(`No evaluator for ${def.label}`);
        }
      } catch (e) {
        errors.push(`${def.label}: ${e.message}`);
      }

      evaluated[nodeId] = result;
      return result;
    };

    const outputResult = evalNode(outputNode.id);
    const evalTime = (performance.now() - startTime).toFixed(1);

    // Extract results based on graph type
    if (this.graphType === 'shader') {
      return {
        shaderResult: outputResult,
        error: errors.length > 0 ? errors.join('; ') : null,
        evalTime,
      };
    }

    // Geometry graph
    const geoData = outputResult?.geometry;
    let geometries = [];
    if (geoData) {
      geometries = Array.isArray(geoData) ? geoData.filter(Boolean) : [geoData];
    }

    return {
      geometries,
      error: errors.length > 0 ? errors.join('; ') : null,
      evalTime,
    };
  }

  toJSON() {
    return JSON.stringify({
      graphType: this.graphType,
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
