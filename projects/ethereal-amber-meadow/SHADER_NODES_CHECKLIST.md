# Shader Nodes Checklist

> Complete list of every Blender Shader Node (as of Blender 4.4), ordered from most commonly used to most rarely used. Checked items are already implemented in this project.

---

## Session Maintenance Instructions

**Before EVERY session:**
1. Read through `shader/nodes.js` and identify all registered node keys and their labels
2. Cross-reference against this checklist
3. Uncheck any items that were removed or broken since last session
4. Note any discrepancies at the bottom in the Session Log section

**After EVERY session:**
1. For each node you implemented, change `[ ]` to `[x]` on the corresponding line
2. If you partially implemented a node (missing features/modes), add `(partial)` after the checkbox
3. Update the counts in the Progress Summary section below
4. Add a dated entry to the Session Log at the bottom of this file
5. Commit this file alongside your code changes

**How to verify a node is "implemented":**
- It must be registered in `shader/nodes.js` via `registry.addNodes('shader', { ... })`
- It must have a working `evaluate()` function
- It must produce correct GLSL output via the shader compiler (`shader/compiler.js`)
- It must have correct inputs, outputs, and at minimum its core functionality

---

## Progress Summary

<!-- UPDATE THESE COUNTS AFTER EVERY SESSION -->
- **Implemented:** 16 / 94
- **Remaining:** 78
- **Last updated:** 2026-02-10

---

## Output

- [x] Material Output (as `shader_output`)
- [ ] World Output
- [ ] Light Output
- [ ] AOV Output

## Shader (BSDFs & Materials)

- [x] Principled BSDF (partial -- Base Color, Metallic, Roughness, Normal inputs)
- [x] Emission
- [x] Mix Shader
- [ ] Diffuse BSDF
- [ ] Glossy BSDF (includes Anisotropic)
- [ ] Glass BSDF
- [ ] Transparent BSDF
- [ ] Translucent BSDF
- [ ] Subsurface Scattering
- [ ] Refraction BSDF
- [ ] Add Shader
- [ ] Principled Volume
- [ ] Volume Absorption
- [ ] Volume Scatter
- [ ] Toon BSDF
- [ ] Hair BSDF
- [ ] Principled Hair BSDF
- [ ] Holdout
- [ ] Background
- [ ] Sheen BSDF (4.0+)
- [ ] Metallic BSDF (4.3+)
- [ ] Ray Portal BSDF (4.2+)
- [ ] Specular BSDF (EEVEE legacy)

## Input

- [x] Fresnel
- [x] Texture Coordinate
- [x] Color (as `color_value`)
- [ ] Value (Float)
- [ ] Attribute
- [ ] Geometry
- [ ] Object Info
- [ ] Camera Data
- [ ] Light Path
- [ ] Layer Weight
- [ ] UV Map
- [ ] Tangent
- [ ] Wireframe
- [ ] Ambient Occlusion
- [ ] Bevel
- [ ] Color Attribute
- [ ] Curves Info (Hair Info)
- [ ] Particle Info
- [ ] Point Info
- [ ] Volume Info

## Texture

- [x] Noise Texture (as `noise_texture_shader`)
- [x] Voronoi Texture (as `voronoi_texture_shader`)
- [ ] Image Texture
- [ ] Environment Texture
- [ ] Checker Texture
- [ ] Gradient Texture
- [ ] Brick Texture
- [ ] Wave Texture
- [ ] Magic Texture
- [ ] White Noise Texture
- [ ] Sky Texture
- [ ] IES Texture
- [ ] Point Density
- [ ] Gabor Texture (4.2+)

## Color

- [x] Mix Color
- [ ] RGB Curves
- [ ] Hue/Saturation/Value
- [ ] Brightness/Contrast
- [ ] Gamma
- [ ] Invert Color
- [ ] Light Falloff

## Vector

- [x] Mapping
- [ ] Normal Map
- [ ] Bump
- [ ] Displacement
- [ ] Normal
- [ ] Vector Curves
- [ ] Vector Rotate
- [ ] Vector Transform
- [ ] Vector Displacement

## Converter

- [x] Math (as `shader_math` -- same operations as geo Math)
- [x] Vector Math (as `shader_vector_math` -- same operations as geo Vector Math)
- [x] Color Ramp
- [x] Separate Color
- [x] Combine Color
- [ ] Combine XYZ
- [ ] Separate XYZ
- [ ] Map Range
- [ ] Clamp
- [ ] Mix (Float/Vector/Color)
- [ ] Float Curve
- [ ] RGB to BW
- [ ] Shader to RGB
- [ ] Blackbody
- [ ] Wavelength

## Script

- [ ] Script Node (OSL -- Cycles only)

## Group

- [ ] Group Input
- [ ] Group Output
- [ ] Node Group (custom/linked)

---

## Session Log

<!-- Add entries here after each session, newest first -->

### 2026-02-10 -- Initial Audit
- Created this checklist from full Blender 4.4 shader node catalog
- Audited `shader/nodes.js` against all known shader nodes
- 16 nodes implemented, 78 remaining
- Principled BSDF marked as partial (only supports Base Color, Metallic, Roughness, Normal -- missing Specular, IOR, Transmission, Coat, Sheen, Emission, Alpha, Subsurface, Anisotropic, and other inputs)
- Noise Texture and Voronoi Texture have simplified parameter sets compared to Blender originals
- Math and Vector Math nodes share operation sets with their geometry counterparts
