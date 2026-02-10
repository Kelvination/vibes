/**
 * shader/nodes.js - Shader node type definitions.
 *
 * Registers all shader-specific node types with the shared registry.
 * Each node has inputs, outputs, defaults, optional props, and an
 * evaluate function that produces shader descriptor objects.
 */

import { registry, SocketType } from '../core/registry.js';

// ── Shader categories ──────────────────────────────────────────────
registry.addCategory('shader', 'SHADER_INPUT',    { name: 'Input',    color: '#c62828', icon: '\u2192' });
registry.addCategory('shader', 'SHADER_COLOR',    { name: 'Color',    color: '#fbc02d', icon: '\u25d0' });
registry.addCategory('shader', 'SHADER_TEXTURE',  { name: 'Texture',  color: '#bf360c', icon: '\u25a4' });
registry.addCategory('shader', 'SHADER_VECTOR',   { name: 'Vector',   color: '#7c4dff', icon: '\u2197' });
registry.addCategory('shader', 'SHADER_MATERIAL', { name: 'Material', color: '#2e7d32', icon: '\u25c9' });
registry.addCategory('shader', 'SHADER_OUTPUT',   { name: 'Output',   color: '#e65100', icon: '\u25ce' });
registry.addCategory('shader', 'SHADER_MATH',     { name: 'Math',     color: '#6a1b9a', icon: '\u0192' });

// ── Helpers ────────────────────────────────────────────────────────

/** Parse a hex colour string to {r,g,b} in 0-1 range. */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

/** Linearly interpolate two {r,g,b} colours. */
function lerpColor(c1, c2, t) {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  };
}

/** Clamp a number to [0, 1]. */
function clamp01(v) { return Math.min(Math.max(v, 0), 1); }

/** Safe divide (returns 0 for zero divisor). */
function safeDivide(a, b) { return b === 0 ? 0 : a / b; }

// ── Math operation evaluator (shared by shader_math) ───────────────
function evalMathOp(op, a, b) {
  switch (op) {
    case 'add':        return a + b;
    case 'subtract':   return a - b;
    case 'multiply':   return a * b;
    case 'divide':     return safeDivide(a, b);
    case 'power':      return Math.pow(a, b);
    case 'sqrt':       return Math.sqrt(Math.abs(a));
    case 'log':        return a > 0 ? Math.log(a) : 0;
    case 'modulo':     return b !== 0 ? ((a % b) + b) % b : 0;
    case 'min':        return Math.min(a, b);
    case 'max':        return Math.max(a, b);
    case 'abs':        return Math.abs(a);
    case 'floor':      return Math.floor(a);
    case 'ceil':       return Math.ceil(a);
    case 'round':      return Math.round(a);
    case 'sin':        return Math.sin(a);
    case 'cos':        return Math.cos(a);
    case 'tan':        return Math.tan(a);
    case 'asin':       return Math.asin(clamp01(a));
    case 'acos':       return Math.acos(clamp01(a));
    case 'atan':       return Math.atan(a);
    case 'atan2':      return Math.atan2(a, b);
    case 'sign':       return Math.sign(a);
    case 'fract':      return a - Math.floor(a);
    case 'snap':       return b !== 0 ? Math.floor(a / b) * b : a;
    case 'pingpong':   return b !== 0 ? Math.abs(((a % (2 * b)) + 2 * b) % (2 * b) - b) : 0;
    case 'wrap': {
      const range = b - 0; // wrap around b with 0 as min
      return range !== 0 ? a - range * Math.floor(a / range) : 0;
    }
    case 'smooth_min': {
      const k = 0.1;
      const h = clamp01(0.5 + 0.5 * (b - a) / k);
      return a * h + b * (1 - h) - k * h * (1 - h);
    }
    case 'smooth_max': {
      const k = 0.1;
      const h = clamp01(0.5 + 0.5 * (a - b) / k);
      return a * h + b * (1 - h) + k * h * (1 - h);
    }
    default: return a + b;
  }
}

// ── Vector math operation evaluator (shared by shader_vector_math) ─
function evalVectorMathOp(op, a, b) {
  const ax = a?.x ?? 0, ay = a?.y ?? 0, az = a?.z ?? 0;
  const bx = b?.x ?? 0, by = b?.y ?? 0, bz = b?.z ?? 0;

  const vecLen = (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const normalize = (v) => {
    const l = vecLen(v) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  };

  switch (op) {
    case 'add':       return { vec: { x: ax + bx, y: ay + by, z: az + bz }, val: 0 };
    case 'subtract':  return { vec: { x: ax - bx, y: ay - by, z: az - bz }, val: 0 };
    case 'multiply':  return { vec: { x: ax * bx, y: ay * by, z: az * bz }, val: 0 };
    case 'divide':    return { vec: { x: safeDivide(ax, bx), y: safeDivide(ay, by), z: safeDivide(az, bz) }, val: 0 };
    case 'cross':     return { vec: { x: ay * bz - az * by, y: az * bx - ax * bz, z: ax * by - ay * bx }, val: 0 };
    case 'dot':       return { vec: { x: 0, y: 0, z: 0 }, val: ax * bx + ay * by + az * bz };
    case 'distance': {
      const dx = ax - bx, dy = ay - by, dz = az - bz;
      return { vec: { x: 0, y: 0, z: 0 }, val: Math.sqrt(dx * dx + dy * dy + dz * dz) };
    }
    case 'normalize': return { vec: normalize({ x: ax, y: ay, z: az }), val: vecLen({ x: ax, y: ay, z: az }) };
    case 'length':    return { vec: { x: 0, y: 0, z: 0 }, val: vecLen({ x: ax, y: ay, z: az }) };
    case 'scale':     return { vec: { x: ax * bx, y: ay * bx, z: az * bx }, val: 0 };
    case 'reflect': {
      const d = 2 * (ax * bx + ay * by + az * bz);
      return { vec: { x: ax - d * bx, y: ay - d * by, z: az - d * bz }, val: 0 };
    }
    case 'project': {
      const denom = bx * bx + by * by + bz * bz;
      if (denom === 0) return { vec: { x: 0, y: 0, z: 0 }, val: 0 };
      const s = (ax * bx + ay * by + az * bz) / denom;
      return { vec: { x: bx * s, y: by * s, z: bz * s }, val: 0 };
    }
    case 'faceforward': {
      const dot = ax * bx + ay * by + az * bz;
      const sign = dot < 0 ? 1 : -1;
      return { vec: { x: ax * sign, y: ay * sign, z: az * sign }, val: 0 };
    }
    case 'snap': {
      const sx = bx !== 0 ? Math.floor(ax / bx) * bx : ax;
      const sy = by !== 0 ? Math.floor(ay / by) * by : ay;
      const sz = bz !== 0 ? Math.floor(az / bz) * bz : az;
      return { vec: { x: sx, y: sy, z: sz }, val: 0 };
    }
    case 'floor':   return { vec: { x: Math.floor(ax), y: Math.floor(ay), z: Math.floor(az) }, val: 0 };
    case 'ceil':    return { vec: { x: Math.ceil(ax), y: Math.ceil(ay), z: Math.ceil(az) }, val: 0 };
    case 'abs':     return { vec: { x: Math.abs(ax), y: Math.abs(ay), z: Math.abs(az) }, val: 0 };
    case 'min':     return { vec: { x: Math.min(ax, bx), y: Math.min(ay, by), z: Math.min(az, bz) }, val: 0 };
    case 'max':     return { vec: { x: Math.max(ax, bx), y: Math.max(ay, by), z: Math.max(az, bz) }, val: 0 };
    case 'sine':    return { vec: { x: Math.sin(ax), y: Math.sin(ay), z: Math.sin(az) }, val: 0 };
    case 'cosine':  return { vec: { x: Math.cos(ax), y: Math.cos(ay), z: Math.cos(az) }, val: 0 };
    case 'tangent': return { vec: { x: Math.tan(ax), y: Math.tan(ay), z: Math.tan(az) }, val: 0 };
    default:        return { vec: { x: ax + bx, y: ay + by, z: az + bz }, val: 0 };
  }
}

// ── Color blend modes ──────────────────────────────────────────────
function blendColors(mode, c1, c2, fac) {
  const f = clamp01(fac);
  const r1 = c1?.r ?? 0, g1 = c1?.g ?? 0, b1 = c1?.b ?? 0;
  const r2 = c2?.r ?? 0, g2 = c2?.g ?? 0, b2 = c2?.b ?? 0;

  let rr, gg, bb;
  switch (mode) {
    case 'multiply':
      rr = r1 * r2; gg = g1 * g2; bb = b1 * b2;
      break;
    case 'screen':
      rr = 1 - (1 - r1) * (1 - r2);
      gg = 1 - (1 - g1) * (1 - g2);
      bb = 1 - (1 - b1) * (1 - b2);
      break;
    case 'overlay':
      rr = r1 < 0.5 ? 2 * r1 * r2 : 1 - 2 * (1 - r1) * (1 - r2);
      gg = g1 < 0.5 ? 2 * g1 * g2 : 1 - 2 * (1 - g1) * (1 - g2);
      bb = b1 < 0.5 ? 2 * b1 * b2 : 1 - 2 * (1 - b1) * (1 - b2);
      break;
    case 'add':
      rr = Math.min(r1 + r2, 1); gg = Math.min(g1 + g2, 1); bb = Math.min(b1 + b2, 1);
      break;
    case 'subtract':
      rr = Math.max(r1 - r2, 0); gg = Math.max(g1 - g2, 0); bb = Math.max(b1 - b2, 0);
      break;
    default: // 'mix'
      rr = r2; gg = g2; bb = b2;
      break;
  }

  // Lerp between original c1 and blended result by factor
  return {
    r: r1 + (rr - r1) * f,
    g: g1 + (gg - g1) * f,
    b: b1 + (bb - b1) * f,
  };
}

// ══════════════════════════════════════════════════════════════════
//  NODE TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════

registry.addNodes('shader', {

  // ─── Output ──────────────────────────────────────────────────────
  shader_output: {
    label: 'Shader Output',
    category: 'SHADER_OUTPUT',
    singular: true,
    inputs: [
      { name: 'Shader', type: SocketType.SHADER },
    ],
    outputs: [],
    defaults: {},
    evaluate(values, inputs) {
      return { outputs: [], shaderResult: inputs['Shader'] || null };
    },
  },

  // ─── Material / Shader ──────────────────────────────────────────
  principled_bsdf: {
    label: 'Principled BSDF',
    category: 'SHADER_MATERIAL',
    inputs: [
      { name: 'Base Color', type: SocketType.COLOR },
      { name: 'Metallic',   type: SocketType.FLOAT },
      { name: 'Roughness',  type: SocketType.FLOAT },
      { name: 'Normal',     type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Shader', type: SocketType.SHADER },
    ],
    defaults: { baseColor: '#6688cc', metallic: 0.0, roughness: 0.5 },
    props: [
      { key: 'baseColor', label: 'Base Color', type: 'color' },
      { key: 'metallic',  label: 'Metallic',  type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'roughness', label: 'Roughness', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const defaultColor = hexToRgb(values.baseColor || '#6688cc');
      const baseColor = inputs['Base Color'] || defaultColor;
      const metallic  = inputs['Metallic']  ?? values.metallic ?? 0.0;
      const roughness = inputs['Roughness'] ?? values.roughness ?? 0.5;
      const normal    = inputs['Normal'] || null;
      return {
        outputs: [{
          type: 'principled',
          baseColor,
          metallic,
          roughness,
          normal,
          emission: null,
          emissionStrength: 0,
        }],
      };
    },
  },

  emission: {
    label: 'Emission',
    category: 'SHADER_MATERIAL',
    inputs: [
      { name: 'Color',    type: SocketType.COLOR },
      { name: 'Strength', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Shader', type: SocketType.SHADER },
    ],
    defaults: { color: '#ffffff', strength: 1.0 },
    props: [
      { key: 'color',    label: 'Color',    type: 'color' },
      { key: 'strength', label: 'Strength', type: 'float', min: 0, max: 100, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const defaultColor = hexToRgb(values.color || '#ffffff');
      const color    = inputs['Color'] || defaultColor;
      const strength = inputs['Strength'] ?? values.strength ?? 1.0;
      return {
        outputs: [{
          type: 'emission',
          emission: color,
          emissionStrength: strength,
          baseColor: { r: 0, g: 0, b: 0 },
          metallic: 0,
          roughness: 1,
          normal: null,
        }],
      };
    },
  },

  mix_shader: {
    label: 'Mix Shader',
    category: 'SHADER_MATERIAL',
    inputs: [
      { name: 'Fac',     type: SocketType.FLOAT },
      { name: 'Shader1', type: SocketType.SHADER },
      { name: 'Shader2', type: SocketType.SHADER },
    ],
    outputs: [
      { name: 'Shader', type: SocketType.SHADER },
    ],
    defaults: { fac: 0.5 },
    props: [
      { key: 'fac', label: 'Factor', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const fac = clamp01(inputs['Fac'] ?? values.fac ?? 0.5);
      const s1  = inputs['Shader1'];
      const s2  = inputs['Shader2'];

      if (!s1 && !s2) return { outputs: [null] };
      if (!s1) return { outputs: [s2] };
      if (!s2) return { outputs: [s1] };

      // Blend material properties
      const bc1 = s1.baseColor || { r: 0, g: 0, b: 0 };
      const bc2 = s2.baseColor || { r: 0, g: 0, b: 0 };
      const em1 = s1.emission  || { r: 0, g: 0, b: 0 };
      const em2 = s2.emission  || { r: 0, g: 0, b: 0 };

      return {
        outputs: [{
          type: 'mix',
          baseColor: lerpColor(bc1, bc2, fac),
          metallic:  (s1.metallic ?? 0) * (1 - fac) + (s2.metallic ?? 0) * fac,
          roughness: (s1.roughness ?? 0.5) * (1 - fac) + (s2.roughness ?? 0.5) * fac,
          emission:  lerpColor(em1, em2, fac),
          emissionStrength: (s1.emissionStrength ?? 0) * (1 - fac) + (s2.emissionStrength ?? 0) * fac,
          normal: s2.normal || s1.normal || null,
        }],
      };
    },
  },

  // ─── Color ──────────────────────────────────────────────────────
  color_value: {
    label: 'Color',
    category: 'SHADER_INPUT',
    inputs: [],
    outputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    defaults: { r: 0.4, g: 0.53, b: 0.8 },
    props: [
      { key: 'r', label: 'R', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'g', label: 'G', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'b', label: 'B', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values) {
      return {
        outputs: [{
          r: clamp01(values.r ?? 0.4),
          g: clamp01(values.g ?? 0.53),
          b: clamp01(values.b ?? 0.8),
        }],
      };
    },
  },

  mix_color: {
    label: 'Mix Color',
    category: 'SHADER_COLOR',
    inputs: [
      { name: 'Fac',    type: SocketType.FLOAT },
      { name: 'Color1', type: SocketType.COLOR },
      { name: 'Color2', type: SocketType.COLOR },
    ],
    outputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    defaults: { fac: 0.5, mode: 'mix' },
    props: [
      { key: 'fac',  label: 'Factor', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'mix',      label: 'Mix' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'screen',   label: 'Screen' },
        { value: 'overlay',  label: 'Overlay' },
        { value: 'add',      label: 'Add' },
        { value: 'subtract', label: 'Subtract' },
      ]},
    ],
    evaluate(values, inputs) {
      const fac  = inputs['Fac'] ?? values.fac ?? 0.5;
      const c1   = inputs['Color1'] || { r: 0, g: 0, b: 0 };
      const c2   = inputs['Color2'] || { r: 1, g: 1, b: 1 };
      const mode = values.mode || 'mix';
      return { outputs: [blendColors(mode, c1, c2, fac)] };
    },
  },

  fresnel: {
    label: 'Fresnel',
    category: 'SHADER_INPUT',
    inputs: [
      { name: 'IOR',    type: SocketType.FLOAT },
      { name: 'Normal', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Fac', type: SocketType.FLOAT },
    ],
    defaults: { ior: 1.45 },
    props: [
      { key: 'ior', label: 'IOR', type: 'float', min: 1.0, max: 3.0, step: 0.01 },
    ],
    evaluate(values, inputs) {
      // Approximate Fresnel using Schlick's approximation with default view angle
      const ior = inputs['IOR'] ?? values.ior ?? 1.45;
      const r0  = Math.pow((1 - ior) / (1 + ior), 2);
      // Default viewing angle ~45 degrees for preview purposes
      const cosTheta = 0.707;
      const fresnel  = r0 + (1 - r0) * Math.pow(1 - cosTheta, 5);
      return { outputs: [clamp01(fresnel)] };
    },
  },

  // ─── Vector ─────────────────────────────────────────────────────
  texture_coord: {
    label: 'Texture Coordinate',
    category: 'SHADER_VECTOR',
    inputs: [],
    outputs: [
      { name: 'UV',     type: SocketType.VECTOR },
      { name: 'Object', type: SocketType.VECTOR },
      { name: 'Normal', type: SocketType.VECTOR },
    ],
    defaults: {},
    evaluate() {
      // These are symbolic placeholders; the compiler resolves them to GLSL varyings
      return {
        outputs: [
          { x: 0, y: 0, z: 0, _source: 'uv' },
          { x: 0, y: 0, z: 0, _source: 'object' },
          { x: 0, y: 0, z: 0, _source: 'normal' },
        ],
      };
    },
  },

  mapping: {
    label: 'Mapping',
    category: 'SHADER_VECTOR',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Vector', type: SocketType.VECTOR },
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
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      // Apply scale
      let x = (v.x ?? 0) * (values.sx ?? 1);
      let y = (v.y ?? 0) * (values.sy ?? 1);
      let z = (v.z ?? 0) * (values.sz ?? 1);
      // Apply rotation (simple Euler, degrees to radians)
      const toRad = Math.PI / 180;
      const rxr = (values.rx ?? 0) * toRad;
      const ryr = (values.ry ?? 0) * toRad;
      const rzr = (values.rz ?? 0) * toRad;
      // Rotate Z
      let x1 = x * Math.cos(rzr) - y * Math.sin(rzr);
      let y1 = x * Math.sin(rzr) + y * Math.cos(rzr);
      x = x1; y = y1;
      // Rotate Y
      let x2 = x * Math.cos(ryr) + z * Math.sin(ryr);
      let z2 = -x * Math.sin(ryr) + z * Math.cos(ryr);
      x = x2; z = z2;
      // Rotate X
      let y3 = y * Math.cos(rxr) - z * Math.sin(rxr);
      let z3 = y * Math.sin(rxr) + z * Math.cos(rxr);
      y = y3; z = z3;
      // Apply translation
      x += values.tx ?? 0;
      y += values.ty ?? 0;
      z += values.tz ?? 0;
      return { outputs: [{ x, y, z }] };
    },
  },

  // ─── Texture ────────────────────────────────────────────────────
  noise_texture_shader: {
    label: 'Noise Texture',
    category: 'SHADER_TEXTURE',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
      { name: 'Scale',  type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Fac',   type: SocketType.FLOAT },
      { name: 'Color', type: SocketType.COLOR },
    ],
    defaults: { scale: 5, detail: 2 },
    props: [
      { key: 'scale',  label: 'Scale',  type: 'float', min: 0.01, max: 100, step: 0.5 },
      { key: 'detail', label: 'Detail', type: 'float', min: 0, max: 15, step: 0.5 },
    ],
    evaluate(values, inputs) {
      // Simple procedural evaluation for preview; the compiler generates GLSL
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      const scale  = inputs['Scale'] ?? values.scale ?? 5;
      const detail = values.detail ?? 2;
      const sx = (v.x ?? 0) * scale;
      const sy = (v.y ?? 0) * scale;
      const sz = (v.z ?? 0) * scale;
      // Simple hash-based pseudo-noise
      const hash = (a, b, c) => {
        let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) >>> 0) / 4294967296;
      };
      const ix = Math.floor(sx), iy = Math.floor(sy), iz = Math.floor(sz);
      const fac = hash(ix * 100 + detail, iy * 100, iz * 100);
      return {
        outputs: [
          fac,
          { r: fac, g: hash(ix, iy + 73, iz), b: hash(ix + 31, iy, iz + 97) },
        ],
      };
    },
  },

  voronoi_texture_shader: {
    label: 'Voronoi Texture',
    category: 'SHADER_TEXTURE',
    inputs: [
      { name: 'Vector', type: SocketType.VECTOR },
      { name: 'Scale',  type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Distance', type: SocketType.FLOAT },
      { name: 'Color',    type: SocketType.COLOR },
    ],
    defaults: { scale: 5 },
    props: [
      { key: 'scale', label: 'Scale', type: 'float', min: 0.01, max: 100, step: 0.5 },
    ],
    evaluate(values, inputs) {
      const v = inputs['Vector'] || { x: 0, y: 0, z: 0 };
      const scale = inputs['Scale'] ?? values.scale ?? 5;
      const sx = (v.x ?? 0) * scale;
      const sy = (v.y ?? 0) * scale;
      const sz = (v.z ?? 0) * scale;
      const hash = (a, b, c) => {
        let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0;
        h = (h ^ (h >> 13)) * 1274126177;
        return ((h ^ (h >> 16)) >>> 0) / 4294967296;
      };
      const ix = Math.floor(sx), iy = Math.floor(sy), iz = Math.floor(sz);
      let minDist = 999;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const cx = ix + dx, cy = iy + dy, cz = iz + dz;
            const px = cx + hash(cx, cy, cz);
            const py = cy + hash(cx + 73, cy + 157, cz + 31);
            const pz = cz + hash(cx + 139, cy + 29, cz + 97);
            const ddx = sx - px, ddy = sy - py, ddz = sz - pz;
            const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
            if (d < minDist) minDist = d;
          }
        }
      }
      const dist = clamp01(minDist);
      return {
        outputs: [
          dist,
          { r: dist, g: 1 - dist, b: dist * 0.5 },
        ],
      };
    },
  },

  color_ramp: {
    label: 'Color Ramp',
    category: 'SHADER_COLOR',
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
      { key: 'pos1',   label: 'Pos 1', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'pos2',   label: 'Pos 2', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values, inputs) {
      const fac = clamp01(inputs['Fac'] ?? 0.5);
      const c1  = hexToRgb(values.color1 || '#000000');
      const c2  = hexToRgb(values.color2 || '#ffffff');
      const p1  = values.pos1 ?? 0;
      const p2  = values.pos2 ?? 1;
      const range = p2 - p1;
      const t = range > 0 ? clamp01((fac - p1) / range) : (fac >= p1 ? 1 : 0);
      const color = lerpColor(c1, c2, t);
      return { outputs: [color, t] };
    },
  },

  // ─── Color utilities ────────────────────────────────────────────
  separate_color: {
    label: 'Separate Color',
    category: 'SHADER_COLOR',
    inputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    outputs: [
      { name: 'R', type: SocketType.FLOAT },
      { name: 'G', type: SocketType.FLOAT },
      { name: 'B', type: SocketType.FLOAT },
    ],
    defaults: {},
    evaluate(values, inputs) {
      const c = inputs['Color'] || { r: 0, g: 0, b: 0 };
      return { outputs: [c.r ?? 0, c.g ?? 0, c.b ?? 0] };
    },
  },

  combine_color: {
    label: 'Combine Color',
    category: 'SHADER_COLOR',
    inputs: [
      { name: 'R', type: SocketType.FLOAT },
      { name: 'G', type: SocketType.FLOAT },
      { name: 'B', type: SocketType.FLOAT },
    ],
    outputs: [
      { name: 'Color', type: SocketType.COLOR },
    ],
    defaults: { r: 0, g: 0, b: 0 },
    props: [
      { key: 'r', label: 'R', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'g', label: 'G', type: 'float', min: 0, max: 1, step: 0.01 },
      { key: 'b', label: 'B', type: 'float', min: 0, max: 1, step: 0.01 },
    ],
    evaluate(values, inputs) {
      return {
        outputs: [{
          r: clamp01(inputs['R'] ?? values.r ?? 0),
          g: clamp01(inputs['G'] ?? values.g ?? 0),
          b: clamp01(inputs['B'] ?? values.b ?? 0),
        }],
      };
    },
  },

  // ─── Math ───────────────────────────────────────────────────────
  shader_math: {
    label: 'Math',
    category: 'SHADER_MATH',
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
        { value: 'add',        label: 'Add' },
        { value: 'subtract',   label: 'Subtract' },
        { value: 'multiply',   label: 'Multiply' },
        { value: 'divide',     label: 'Divide' },
        { value: 'power',      label: 'Power' },
        { value: 'sqrt',       label: 'Square Root' },
        { value: 'log',        label: 'Logarithm' },
        { value: 'modulo',     label: 'Modulo' },
        { value: 'min',        label: 'Min' },
        { value: 'max',        label: 'Max' },
        { value: 'abs',        label: 'Absolute' },
        { value: 'floor',      label: 'Floor' },
        { value: 'ceil',       label: 'Ceil' },
        { value: 'round',      label: 'Round' },
        { value: 'sin',        label: 'Sine' },
        { value: 'cos',        label: 'Cosine' },
        { value: 'tan',        label: 'Tangent' },
        { value: 'asin',       label: 'Arcsine' },
        { value: 'acos',       label: 'Arccosine' },
        { value: 'atan',       label: 'Arctangent' },
        { value: 'atan2',      label: 'Arctan2' },
        { value: 'sign',       label: 'Sign' },
        { value: 'fract',      label: 'Fraction' },
        { value: 'snap',       label: 'Snap' },
        { value: 'pingpong',   label: 'Ping Pong' },
        { value: 'wrap',       label: 'Wrap' },
        { value: 'smooth_min', label: 'Smooth Min' },
        { value: 'smooth_max', label: 'Smooth Max' },
      ]},
      { key: 'a', label: 'A', type: 'float', min: -1000, max: 1000, step: 0.1 },
      { key: 'b', label: 'B', type: 'float', min: -1000, max: 1000, step: 0.1 },
    ],
    evaluate(values, inputs) {
      const op = values.operation || 'add';
      const a  = inputs['A'] ?? values.a ?? 0;
      const b  = inputs['B'] ?? values.b ?? 0;
      return { outputs: [evalMathOp(op, a, b)] };
    },
  },

  shader_vector_math: {
    label: 'Vector Math',
    category: 'SHADER_MATH',
    inputs: [
      { name: 'A', type: SocketType.VECTOR },
      { name: 'B', type: SocketType.VECTOR },
    ],
    outputs: [
      { name: 'Vector', type: SocketType.VECTOR },
      { name: 'Value',  type: SocketType.FLOAT },
    ],
    defaults: { operation: 'add' },
    props: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'add',         label: 'Add' },
        { value: 'subtract',    label: 'Subtract' },
        { value: 'multiply',    label: 'Multiply' },
        { value: 'divide',      label: 'Divide' },
        { value: 'cross',       label: 'Cross Product' },
        { value: 'dot',         label: 'Dot Product' },
        { value: 'distance',    label: 'Distance' },
        { value: 'normalize',   label: 'Normalize' },
        { value: 'length',      label: 'Length' },
        { value: 'scale',       label: 'Scale' },
        { value: 'reflect',     label: 'Reflect' },
        { value: 'project',     label: 'Project' },
        { value: 'faceforward', label: 'Faceforward' },
        { value: 'snap',        label: 'Snap' },
        { value: 'floor',       label: 'Floor' },
        { value: 'ceil',        label: 'Ceil' },
        { value: 'abs',         label: 'Absolute' },
        { value: 'min',         label: 'Min' },
        { value: 'max',         label: 'Max' },
        { value: 'sine',        label: 'Sine' },
        { value: 'cosine',      label: 'Cosine' },
        { value: 'tangent',     label: 'Tangent' },
      ]},
    ],
    evaluate(values, inputs) {
      const op = values.operation || 'add';
      const a  = inputs['A'] || { x: 0, y: 0, z: 0 };
      const b  = inputs['B'] || { x: 0, y: 0, z: 0 };
      const result = evalVectorMathOp(op, a, b);
      return { outputs: [result.vec, result.val] };
    },
  },
});
