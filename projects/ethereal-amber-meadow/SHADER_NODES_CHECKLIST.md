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
- **Implemented:** 41 / 94
- **Remaining:** 53
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
- [x] Diffuse BSDF (as `diffuse_bsdf`)
- [x] Glossy BSDF (as `glossy_bsdf`)
- [x] Glass BSDF (as `glass_bsdf`)
- [x] Transparent BSDF (as `transparent_bsdf`)
- [x] Translucent BSDF (as `translucent_bsdf`)
- [ ] Subsurface Scattering
- [ ] Refraction BSDF
- [x] Add Shader (as `add_shader`)
- [ ] Principled Volume
- [ ] Volume Absorption
- [ ] Volume Scatter
- [ ] Toon BSDF
- [ ] Hair BSDF
- [ ] Principled Hair BSDF
- [x] Holdout (as `holdout`)
- [x] Background (as `background`)
- [ ] Sheen BSDF (4.0+)
- [ ] Metallic BSDF (4.3+)
- [ ] Ray Portal BSDF (4.2+)
- [ ] Specular BSDF (EEVEE legacy)

## Input

- [x] Fresnel
- [x] Texture Coordinate
- [x] Color (as `color_value`)
- [x] Value (Float) (as `shader_value`)
- [ ] Attribute
- [x] Geometry (as `shader_geometry`)
- [ ] Object Info
- [ ] Camera Data
- [x] Light Path (as `light_path`)
- [x] Layer Weight (as `layer_weight`)
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
- [x] Checker Texture (as `checker_texture_shader`)
- [x] Gradient Texture (as `gradient_texture_shader`)
- [x] Brick Texture (as `brick_texture_shader`)
- [x] Wave Texture (as `wave_texture_shader`)
- [x] Magic Texture (as `magic_texture_shader`)
- [x] White Noise Texture (as `white_noise_texture_shader`)
- [ ] Sky Texture
- [ ] IES Texture
- [ ] Point Density
- [ ] Gabor Texture (4.2+)

## Color

- [x] Mix Color
- [ ] RGB Curves
- [x] Hue/Saturation/Value (as `hue_saturation_value`)
- [x] Brightness/Contrast (as `brightness_contrast`)
- [x] Gamma (as `gamma`)
- [x] Invert Color (as `invert_color`)
- [ ] Light Falloff

## Vector

- [x] Mapping
- [x] Normal Map (as `normal_map`)
- [x] Bump (as `bump`)
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
- [x] Combine XYZ (as `shader_combine_xyz`)
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

### 2026-02-10 -- Batch Implementation (25 nodes)
- Implemented 25 new shader nodes, bringing total from 16 to 41
- **BSDFs/Materials (8):** Diffuse BSDF, Glossy BSDF, Glass BSDF, Transparent BSDF, Translucent BSDF, Add Shader, Holdout, Background
- **Inputs (4):** Value (Float), Geometry, Light Path, Layer Weight
- **Textures (6):** Checker Texture, Gradient Texture, Brick Texture, Wave Texture, Magic Texture, White Noise Texture
- **Color (4):** Hue/Saturation/Value, Brightness/Contrast, Gamma, Invert Color
- **Vector (2):** Normal Map, Bump
- **Converter (1):** Combine XYZ
- Added new SHADER_CONVERTER category
- BSDFs approximate via principled material descriptors for preview rendering

### 2026-02-10 -- Initial Audit
- Created this checklist from full Blender 4.4 shader node catalog
- Audited `shader/nodes.js` against all known shader nodes
- 16 nodes implemented, 78 remaining
- Principled BSDF marked as partial (only supports Base Color, Metallic, Roughness, Normal -- missing Specular, IOR, Transmission, Coat, Sheen, Emission, Alpha, Subsurface, Anisotropic, and other inputs)
- Noise Texture and Voronoi Texture have simplified parameter sets compared to Blender originals
- Math and Vector Math nodes share operation sets with their geometry counterparts
