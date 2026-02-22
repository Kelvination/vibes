# Luminara Shader Collection -- Shader Guide

This document provides detailed documentation for every shader in the collection, including parameter descriptions, recommended use cases, performance considerations, and application instructions.

---

## Table of Contents

1. [Toon Shading](#1-toon-shading)
2. [Dissolve](#2-dissolve)
3. [Hologram](#3-hologram)
4. [Water Surface](#4-water-surface)
5. [Force Field](#5-force-field)
6. [Pixelation](#6-pixelation)
7. [Outline](#7-outline)
8. [Frosted Glass](#8-frosted-glass)
9. [Lava Flow](#9-lava-flow)
10. [Energy Beam](#10-energy-beam)
11. [Triplanar Blend](#11-triplanar-blend)
12. [Wind Sway](#12-wind-sway)

---

## How to Apply Shaders

### Spatial Shaders (3D)

Spatial shaders are applied to **MeshInstance3D** nodes:

1. Select the MeshInstance3D in the scene tree.
2. In the Inspector, expand **Geometry > Material Override** (or the mesh's surface material slot).
3. Create a new **ShaderMaterial**.
4. In the ShaderMaterial, click the **Shader** property and load the `.gdshader` file.
5. Parameters appear under **Shader Parameters** in the Inspector.

### Canvas Item Shaders (2D / Post-Processing)

Canvas item shaders are applied to **CanvasItem** nodes (Sprite2D, TextureRect, ColorRect, etc.):

1. Select the CanvasItem node.
2. In the Inspector, create a new **ShaderMaterial** under the **Material** property.
3. Load the `.gdshader` file into the Shader slot.
4. For full-screen effects, use a **ColorRect** parented to a **CanvasLayer**, sized to fill the viewport.

---

## 1. Toon Shading

**File**: `toon_shading.gdshader`
**Type**: `spatial` (render mode: `diffuse_toon, specular_toon`)

A versatile cel-shading shader with quantized lighting bands, rim lighting, and toon specular highlights. Produces the flat, stylized look common in anime and cartoon-style games.

### Parameters

#### Base

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `base_color` | Color | -- | `(0.8, 0.4, 0.2, 1.0)` | Base surface color multiplied with the texture. |
| `base_texture` | Texture2D | -- | -- | Optional albedo texture. If not set, the shader uses `base_color` alone. |
| `bands` | float | 2 -- 10 | `3.0` | Number of discrete lighting steps. Lower values produce a more stylized look; higher values approach smooth shading. |

#### Lighting

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `shadow_threshold` | float | 0 -- 1 | `0.5` | Light level below which the shadow color is applied. |
| `shadow_color` | Color | -- | `(0.15, 0.1, 0.2, 1.0)` | Tint applied to shadowed areas. Cool tones work well for anime-style lighting. |
| `shadow_smoothness` | float | 0 -- 0.1 | `0.02` | Width of the transition between lit and shadowed regions. Set to 0 for a hard edge. |

#### Rim

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `rim_enabled` | bool | -- | `true` | Toggle rim lighting on or off. |
| `rim_color` | Color | -- | `(1.0, 0.9, 0.8, 1.0)` | Color of the rim highlight. |
| `rim_amount` | float | 0 -- 1 | `0.7` | How much of the edge receives rim lighting. Lower values produce a thinner rim. |
| `rim_intensity` | float | 0 -- 5 | `1.5` | Brightness multiplier for the rim effect. |

#### Specular

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `specular_size` | float | 0 -- 1 | `0.3` | Size of the toon specular highlight. |
| `specular_smoothness` | float | 0 -- 0.1 | `0.02` | Edge softness of the specular highlight. |
| `specular_color` | Color | -- | `(1.0, 1.0, 1.0, 1.0)` | Color of the specular spot. |
| `specular_intensity` | float | 0 -- 5 | `1.0` | Brightness multiplier for the specular highlight. |

### Recommended Use Cases

- Character models in stylized or anime-style games.
- Props and environment pieces in cartoon-aesthetic projects.
- Any mesh that benefits from a flat, band-shaded look.

### Performance Tips

- This shader is lightweight. The custom `light()` function runs per-light, per-fragment, so performance scales with light count rather than shader complexity.
- The procedural quantization avoids texture lookups, keeping it efficient on mobile.

---

## 2. Dissolve

**File**: `dissolve.gdshader`
**Type**: `spatial` (render mode: `cull_disabled`)

A burn-edge dissolve effect driven by fractal noise. The dissolve boundary features a two-tone glowing edge with configurable emission. Useful for spawn/despawn effects, damage, and teleportation.

### Parameters

#### Dissolve

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `dissolve_amount` | float | 0 -- 1 | `0.0` | Controls how much of the mesh is dissolved. 0 = fully visible, 1 = fully dissolved. Animate this value for the effect. |
| `dissolve_noise` | Texture2D | -- | -- | Optional noise texture for the dissolve pattern. If not assigned, the shader uses a built-in FBM noise function. |
| `noise_scale` | float | 0.1 -- 10 | `1.0` | Scale of the dissolve noise pattern. Larger values produce finer detail. |
| `use_world_coords` | bool | -- | `false` | When enabled, the noise is sampled in world space instead of UV space. Useful for tiling meshes or meshes with non-uniform UVs. |

#### Edge

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `edge_width` | float | 0 -- 0.2 | `0.05` | Width of the glowing edge along the dissolve boundary. |
| `edge_color_inner` | Color | -- | `(1.0, 0.8, 0.0, 1.0)` | Color at the inner edge (closest to the intact surface). |
| `edge_color_outer` | Color | -- | `(1.0, 0.2, 0.0, 1.0)` | Color at the outer edge (closest to the dissolved region). |
| `edge_emission_strength` | float | 0 -- 20 | `6.0` | Emission intensity of the glowing edge. Higher values create a bloom-friendly glow. |

#### Base

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `base_color` | Color | -- | `(0.9, 0.9, 0.9, 1.0)` | Base surface color. |
| `base_texture` | Texture2D | -- | -- | Optional albedo texture. |
| `metallic` | float | 0 -- 1 | `0.0` | Metallic property of the surface. |
| `roughness` | float | 0 -- 1 | `0.5` | Roughness of the surface. |

#### Animation

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `animate` | bool | -- | `false` | When enabled, the dissolve plays automatically without scripting. |
| `animation_speed` | float | 0.1 -- 5 | `1.0` | Speed of the automatic dissolve animation. |
| `animation_direction` | float | -1 -- 1 | `1.0` | Direction of automatic animation. Positive dissolves outward; negative reverses. |

### Recommended Use Cases

- Character spawn/despawn transitions.
- Damage or destruction effects on props.
- Teleportation and portal effects.
- Scene transitions on 3D UI elements.

### Performance Tips

- The built-in FBM noise uses 4 octaves. If performance is a concern on mobile, provide a pre-baked noise texture via `dissolve_noise` instead of relying on procedural generation.
- `cull_disabled` means both faces are rendered. If you only need front faces, modify the render mode to `cull_back`.

---

## 3. Hologram

**File**: `hologram.gdshader`
**Type**: `spatial` (render mode: `blend_add, depth_draw_opaque, cull_disabled, unshaded`)

A sci-fi hologram effect with animated scanlines, random flicker, glitch distortion, and fresnel-based edge glow. The additive blending produces a transparent, luminous look.

### Parameters

#### Color

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `hologram_color` | Color | -- | `(0.0, 0.8, 1.0, 1.0)` | Primary hologram color, dominant at edge-on angles. |
| `hologram_color_secondary` | Color | -- | `(0.0, 0.4, 1.0, 1.0)` | Secondary color, visible at face-on angles. Blended via fresnel. |
| `brightness` | float | 0 -- 5 | `1.5` | Overall brightness multiplier. |
| `alpha` | float | 0 -- 1 | `0.7` | Base opacity before scanline and flicker modulation. |

#### Scanlines

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `scanlines_enabled` | bool | -- | `true` | Toggle horizontal scanlines. |
| `scanline_density` | float | 10 -- 500 | `120.0` | Number of scanlines across the mesh. Higher values produce finer lines. |
| `scanline_speed` | float | 0 -- 10 | `2.0` | Vertical scroll speed of the scanlines. |
| `scanline_intensity` | float | 0 -- 1 | `0.3` | How strongly the scanlines darken the surface. |

#### Flicker

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `flicker_enabled` | bool | -- | `true` | Toggle random brightness flicker. |
| `flicker_speed` | float | 0 -- 30 | `12.0` | Rate of flicker variation. Higher values create more rapid flickering. |
| `flicker_intensity` | float | 0 -- 1 | `0.15` | Maximum brightness variation from flicker. |

#### Glitch

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `glitch_enabled` | bool | -- | `true` | Toggle vertex glitch displacement. |
| `glitch_speed` | float | 0 -- 10 | `3.0` | Rate at which glitch events occur. |
| `glitch_intensity` | float | 0 -- 0.1 | `0.02` | Magnitude of glitch displacement. Keep low for subtle artifacts. |

#### Fresnel

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `fresnel_power` | float | 0 -- 10 | `2.0` | Controls the falloff curve of the edge glow. Higher values concentrate the glow at steep angles. |
| `fresnel_intensity` | float | 0 -- 5 | `1.5` | Brightness of the fresnel edge glow. |

#### Distortion

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `vertex_offset_intensity` | float | 0 -- 0.1 | `0.01` | Amplitude of the continuous vertex wave wobble. |
| `wave_frequency` | float | 0 -- 20 | `5.0` | Frequency of the vertex wave along the Y axis. |

### Recommended Use Cases

- Holographic displays and projections in sci-fi environments.
- Ghost or spectral character rendering.
- UI hologram panels in 3D space.

### Performance Tips

- The shader is `unshaded`, so it skips Godot's lighting pipeline entirely. This makes it inexpensive even with multiple lights in the scene.
- Disable individual features (scanlines, flicker, glitch) to reduce instruction count if needed.

---

## 4. Water Surface

**File**: `water_surface.gdshader`
**Type**: `spatial` (render mode: `blend_mix, depth_draw_opaque, cull_back`)

An animated water shader with vertex-displaced waves, dual-layer scrolling normal maps, depth-based color blending, edge foam, and fresnel reflectivity. Requires the depth and screen textures.

### Parameters

#### Color

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `shallow_color` | Color | -- | `(0.1, 0.6, 0.7, 0.8)` | Water color in shallow areas (near the shore or objects). |
| `deep_color` | Color | -- | `(0.02, 0.15, 0.3, 0.95)` | Water color in deep areas. |
| `depth_distance` | float | 0.1 -- 50 | `5.0` | Depth range over which the color transitions from shallow to deep. |

#### Waves

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `wave_speed` | float | 0 -- 5 | `1.0` | Speed of the wave animation. |
| `wave_height` | float | 0 -- 2 | `0.15` | Vertical displacement amplitude of the waves. |
| `wave_direction_1` | vec2 | -1 -- 1 | `(1.0, 0.0)` | Direction of the first wave layer. |
| `wave_direction_2` | vec2 | -1 -- 1 | `(0.0, 1.0)` | Direction of the second wave layer. Crossing directions produce more natural motion. |
| `wave_frequency_1` | float | 0.1 -- 10 | `2.0` | Frequency of the first wave layer. |
| `wave_frequency_2` | float | 0.1 -- 10 | `3.5` | Frequency of the second wave layer. |

#### Surface

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `roughness` | float | 0 -- 1 | `0.05` | Surface roughness. Low values produce sharp reflections. |
| `metallic` | float | 0 -- 1 | `0.3` | Metallic property. Moderate values give water a reflective quality. |
| `specular_strength` | float | 0 -- 1 | `0.8` | Intensity of specular highlights from light sources. |

#### Normal Map

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `normal_texture_1` | Texture2D | -- | -- | First normal map texture for surface detail. Assign a tileable water normal map. |
| `normal_texture_2` | Texture2D | -- | -- | Second normal map texture. Using two different normals creates a more organic surface. |
| `normal_scale` | float | 0 -- 5 | `1.0` | Strength of the normal map effect. |
| `normal_tile` | float | 0.1 -- 20 | `4.0` | Tiling factor for the normal maps. |
| `normal_speed` | float | 0 -- 2 | `0.3` | Scroll speed of the normal map animation. |

#### Foam

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `foam_enabled` | bool | -- | `true` | Toggle depth-based edge foam. |
| `foam_color` | Color | -- | `(1.0, 1.0, 1.0, 1.0)` | Color of the foam. |
| `foam_amount` | float | 0 -- 2 | `0.5` | Depth range at which foam appears. Larger values extend foam further from intersections. |
| `foam_sharpness` | float | 0 -- 10 | `3.0` | Controls the falloff curve of the foam edge. Higher values produce a sharper transition. |

#### Fresnel

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `fresnel_power` | float | 0 -- 10 | `3.0` | Controls reflectivity at glancing angles. |
| `fresnel_intensity` | float | 0 -- 1 | `0.5` | Strength of the fresnel reflection effect. |

### Recommended Use Cases

- Oceans, lakes, rivers, and ponds in 3D environments.
- Stylized or realistic water planes.
- Any flat-plane liquid surface (pair with appropriate colors for oil, acid, etc.).

### Performance Tips

- This shader samples `DEPTH_TEXTURE` and `SCREEN_TEXTURE`, which require the Forward+ or Mobile renderer. It will not work with the Compatibility renderer.
- Normal map lookups are the primary cost. Reducing `normal_tile` can help on lower-end hardware.
- On mobile, consider disabling foam and reducing wave calculations.

---

## 5. Force Field

**File**: `force_field.gdshader`
**Type**: `spatial` (render mode: `blend_add, depth_draw_opaque, cull_disabled, unshaded`)

A hexagonal-patterned energy shield that glows at intersection boundaries with scene geometry. Features pulsing animation and fresnel-based edge brightness.

### Parameters

#### Color

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `primary_color` | Color | -- | `(0.1, 0.5, 1.0, 1.0)` | Primary shield color at face-on angles. |
| `secondary_color` | Color | -- | `(0.0, 0.8, 1.0, 1.0)` | Secondary color for edges and intersections. |
| `brightness` | float | 0 -- 10 | `2.0` | Overall brightness multiplier. |
| `base_alpha` | float | 0 -- 1 | `0.15` | Minimum opacity of the shield surface. |

#### Pattern

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `hex_scale` | float | 1 -- 50 | `12.0` | Size of the hexagonal grid pattern. Larger values produce smaller hexagons. |
| `hex_line_width` | float | 0.01 -- 0.2 | `0.05` | Thickness of the hexagonal grid lines. |
| `pattern_intensity` | float | 0 -- 1 | `0.6` | Opacity of the hex pattern overlay. |

#### Intersection

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `intersection_width` | float | 0 -- 5 | `1.0` | Width of the glow where the shield intersects scene geometry. |
| `intersection_intensity` | float | 0 -- 10 | `4.0` | Brightness of the intersection highlight. |

#### Fresnel

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `fresnel_power` | float | 0 -- 10 | `3.0` | Controls how quickly edge glow falls off from rim to center. |
| `fresnel_intensity` | float | 0 -- 5 | `2.0` | Strength of the edge glow effect. |

#### Animation

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `pulse_speed` | float | 0 -- 10 | `2.0` | Speed of the pulsing brightness animation. |
| `pulse_intensity` | float | 0 -- 1 | `0.3` | Amplitude of the pulse variation. |
| `scroll_speed` | float | 0 -- 5 | `0.5` | Vertical scroll speed of the hex pattern (energy flow direction). |

### Recommended Use Cases

- Sci-fi energy shields and barriers.
- Magical protection spheres.
- Zone boundaries and containment fields.

### Performance Tips

- Uses `DEPTH_TEXTURE` for intersection detection. Requires Forward+ or Mobile renderer.
- The hex grid is computed mathematically (no texture needed), keeping memory usage low.
- The shader is `unshaded`, so scene light count does not affect its cost.

---

## 6. Pixelation

**File**: `pixelate.gdshader`
**Type**: `canvas_item`

A retro post-processing effect that reduces screen resolution into large pixels, with optional color palette reduction, Bayer dithering, CRT scanlines, and barrel distortion.

### How to Apply

1. Create a **CanvasLayer** node in your scene.
2. Add a **ColorRect** as a child and set its size to cover the full viewport.
3. Create a new **ShaderMaterial** on the ColorRect.
4. Load `pixelate.gdshader` into the Shader property.

### Parameters

#### Pixelation

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `pixel_size` | float | 1 -- 64 | `8.0` | Size of each output pixel in screen pixels. Larger values produce blockier output. |
| `snap_to_grid` | bool | -- | `true` | When enabled, UV coordinates snap to the pixel grid for clean edges. Disable for a softer downscale. |

#### Color Reduction

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `reduce_colors` | bool | -- | `true` | Enable color palette reduction for a retro look. |
| `color_levels` | float | 2 -- 32 | `8.0` | Number of color levels per channel. Lower values produce more dramatic banding. |
| `dither_enabled` | bool | -- | `true` | Enable Bayer 4x4 ordered dithering to smooth color banding. |
| `dither_intensity` | float | 0 -- 1 | `0.5` | Strength of the dithering effect. |

#### CRT

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `crt_enabled` | bool | -- | `false` | Enable CRT monitor simulation (scanlines, curvature, vignette). |
| `scanline_weight` | float | 0 -- 1 | `0.2` | Darkness of the CRT scanlines. |
| `scanline_frequency` | float | 1 -- 10 | `3.0` | Density of the scanlines relative to screen resolution. |
| `curvature` | float | 0 -- 0.1 | `0.02` | Amount of barrel distortion to simulate a curved CRT screen. |
| `vignette_intensity` | float | 0 -- 1 | `0.3` | Darkening at the screen edges. |

#### Adjustments

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `brightness_boost` | float | 0 -- 2 | `1.0` | Brightness multiplier applied before quantization. |
| `contrast` | float | 0 -- 3 | `1.0` | Contrast adjustment. |
| `saturation` | float | 0 -- 3 | `1.0` | Saturation adjustment. Values below 1 desaturate; above 1 oversaturate. |

### Recommended Use Cases

- Retro game aesthetics (Game Boy, NES, etc.).
- Stylized screenshots and trailers.
- CRT television prop displays in 3D scenes (apply to a SubViewport texture).

### Performance Tips

- This is a screen-space shader applied as a post-process. Cost scales with screen resolution, not scene complexity.
- Disabling `crt_enabled` removes the barrel distortion and scanline passes.
- The Bayer dither matrix is computed arithmetically with no texture cost.

---

## 7. Outline

**File**: `outline.gdshader`
**Type**: `spatial` (render mode: `unshaded, cull_front`)

An inverted-hull outline effect that expands back-face geometry along normals. Supports distance-based width scaling and optional pulsing animation.

### How to Apply

This shader must be applied as a **Next Pass** material, not as the primary material:

1. Select the MeshInstance3D and open its primary material in the Inspector.
2. Scroll to the **Next Pass** property and create a new **ShaderMaterial**.
3. Load `outline.gdshader` into the Shader property.

The outline renders the back faces of the mesh, expanded outward. The primary material renders normally on top.

### Parameters

#### Outline

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `outline_color` | Color | -- | `(0.0, 0.0, 0.0, 1.0)` | Color of the outline stroke. |
| `outline_width` | float | 0 -- 0.5 | `0.03` | Base width of the outline in local units. |
| `use_vertex_color` | bool | -- | `false` | When enabled, the outline color is sourced from the mesh's vertex colors instead of `outline_color`. |

#### Style

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `distance_fade` | bool | -- | `true` | Scale outline width based on distance from the camera. |
| `fade_min_distance` | float | 0 -- 50 | `5.0` | Distance at which the outline begins to scale. |
| `fade_max_distance` | float | 0 -- 200 | `50.0` | Distance at which the scaling reaches its maximum factor. |
| `width_at_distance` | float | 0 -- 3 | `1.5` | Width multiplier applied at `fade_max_distance`. Values above 1 thicken the outline at distance; below 1 thin it. |

#### Animation

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `pulse_enabled` | bool | -- | `false` | Toggle a pulsing width animation. |
| `pulse_speed` | float | 0 -- 10 | `3.0` | Speed of the pulse cycle. |
| `pulse_min` | float | 0 -- 1 | `0.5` | Minimum width multiplier during the pulse. |
| `pulse_max` | float | 1 -- 3 | `1.5` | Maximum width multiplier during the pulse. |

### Recommended Use Cases

- Toon/cel-shaded outlines (pair with the Toon Shading shader).
- Selection or highlight indicators.
- Stylized character rendering.

### Performance Tips

- Very lightweight. The fragment shader is trivial since it only outputs a flat color.
- The vertex shader runs per-vertex to displace normals, so cost scales with mesh complexity.
- For objects with hard edges or split normals, the outline may show gaps. Use smooth normals for best results.

---

## 8. Frosted Glass

**File**: `frosted_glass.gdshader`
**Type**: `spatial` (render mode: `blend_mix, depth_draw_opaque, cull_back`)

A frosted glass material with voronoi-based frost crystal patterns, screen-space blur approximation, refraction, and fresnel-based opacity. Suitable for windows, ice surfaces, and transparent barriers.

### Parameters

#### Glass

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `tint_color` | Color | -- | `(0.9, 0.95, 1.0, 0.3)` | Color tint blended onto the glass. The alpha channel controls tint strength. |
| `opacity` | float | 0 -- 1 | `0.4` | Base opacity of the glass surface. |
| `roughness` | float | 0 -- 1 | `0.15` | Surface roughness (increased automatically in frosted areas). |
| `metallic` | float | 0 -- 1 | `0.0` | Metallic property. |
| `specular_strength` | float | 0 -- 1 | `0.7` | Specular highlight intensity. |

#### Frost

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `frost_enabled` | bool | -- | `true` | Toggle the voronoi frost crystal overlay. |
| `frost_amount` | float | 0 -- 1 | `0.5` | How much of the surface is covered by frost. 0 = clear glass, 1 = fully frosted. |
| `frost_scale` | float | 0.1 -- 20 | `5.0` | Scale of the voronoi frost crystal pattern. |
| `frost_roughness_boost` | float | 0 -- 1 | `0.6` | Additional roughness added in frosted areas for a matte look. |
| `frost_color` | Color | -- | `(1.0, 1.0, 1.0, 1.0)` | Color of the frost crystals. |

#### Refraction

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `refraction_strength` | float | 0 -- 0.5 | `0.05` | Amount of UV distortion for the refraction effect. |
| `blur_amount` | float | 0 -- 10 | `3.0` | Radius of the screen-space blur applied behind the glass. Higher values produce a more opaque frosted appearance. |

#### Fresnel

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `fresnel_power` | float | 0 -- 10 | `4.0` | Controls how steeply the opacity increases at glancing angles. |
| `fresnel_opacity` | float | 0 -- 1 | `0.8` | Maximum opacity at steep viewing angles. |

#### Thickness

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `thickness_variation` | bool | -- | `true` | Enable thickness-based variation using a texture. |
| `thickness_texture` | Texture2D | -- | -- | Grayscale texture controlling glass thickness. Darker areas appear thinner. |
| `thickness_scale` | float | 0 -- 2 | `1.0` | Multiplier for the thickness effect. |

### Recommended Use Cases

- Frosted windows and glass doors.
- Ice and frozen surfaces.
- Sci-fi transparent barriers.
- Shower glass or decorative glass panels.

### Performance Tips

- The blur approximation samples the screen texture 9 times (8 ring samples + center). This is the primary cost driver. Reducing `blur_amount` lowers the effective radius but not the sample count.
- Uses `SCREEN_TEXTURE`, so it requires Forward+ or Mobile renderer.
- The voronoi pattern uses 3 octaves of cell noise. On low-end hardware, disable `frost_enabled` to skip these calculations.

---

## 9. Lava Flow

**File**: `lava_flow.gdshader`
**Type**: `spatial`

An animated lava material with flowing molten surface, dark crust layer, bright crack lines, emission glow, and optional vertex displacement. Uses domain-warped FBM noise for an organic, procedural look.

### Parameters

#### Lava Color

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `hot_color` | Color | -- | `(1.0, 0.6, 0.0, 1.0)` | Color of the hottest, brightest lava regions. |
| `warm_color` | Color | -- | `(1.0, 0.15, 0.0, 1.0)` | Color of cooler molten areas between hot spots. |
| `crust_color` | Color | -- | `(0.1, 0.05, 0.03, 1.0)` | Color of the solidified crust layer. |
| `emission_strength` | float | 0 -- 30 | `8.0` | Emission intensity of the molten portions. Works well with Godot's glow post-process. |

#### Flow

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `flow_direction` | vec2 | -- | `(0.3, 0.7)` | Direction of the lava flow in UV space. |
| `flow_speed` | float | 0 -- 3 | `0.4` | Speed of the flow animation. |
| `turbulence` | float | 0 -- 5 | `2.0` | Amount of domain warping applied to the noise. Higher values produce more swirling, organic patterns. |
| `scale` | float | 0.1 -- 20 | `3.0` | Scale of the noise pattern. |

#### Crust

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `crust_threshold` | float | 0 -- 1 | `0.45` | Noise value above which crust forms. Lower values produce more crust coverage. |
| `crust_softness` | float | 0 -- 0.3 | `0.08` | Width of the transition between molten and crusted areas. |
| `crust_roughness` | float | 0 -- 1 | `0.95` | Roughness of the crust layer. |

#### Displacement

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `height_scale` | float | 0 -- 2 | `0.3` | Amplitude of the vertex displacement along the Y axis. |
| `vertex_displacement` | bool | -- | `true` | Toggle vertex displacement. Disable for a flat lava surface. |

#### Surface

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `roughness_hot` | float | 0 -- 1 | `0.2` | Roughness of the molten lava portions. Low values give a glossy, liquid look. |
| `metallic` | float | 0 -- 1 | `0.1` | Metallic property of the surface. |

### Recommended Use Cases

- Volcanic environments and lava rivers.
- Forge and furnace effects.
- Molten metal surfaces.
- Fire/magma spell effects.

### Performance Tips

- The FBM noise uses 4-5 octaves per evaluation, and the vertex shader evaluates the pattern 3 times (base + 2 neighbors for normal recalculation). This makes it one of the more expensive shaders in the pack.
- Disable `vertex_displacement` to skip the vertex shader noise evaluations, cutting cost significantly.
- For large lava surfaces, consider using a lower-poly mesh, since the vertex shader runs per-vertex.

---

## 10. Energy Beam

**File**: `energy_beam.gdshader`
**Type**: `spatial` (render mode: `blend_add, depth_draw_opaque, cull_disabled, unshaded`)

An animated energy beam with a bright core, inner and outer glow layers, noise-based distortion, and sparkle particles. Designed for elongated quad or cylinder meshes where UV.x runs along the beam and UV.y runs across it.

### Parameters

#### Color

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `core_color` | Color | -- | `(1.0, 1.0, 1.0, 1.0)` | Color of the beam's bright center. |
| `inner_color` | Color | -- | `(0.3, 0.7, 1.0, 1.0)` | Color of the inner glow layer around the core. |
| `outer_color` | Color | -- | `(0.1, 0.2, 1.0, 0.5)` | Color of the soft outer glow. |
| `intensity` | float | 0 -- 20 | `5.0` | Overall brightness multiplier. |

#### Beam

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `core_width` | float | 0 -- 0.5 | `0.05` | Radius of the bright center core. |
| `inner_width` | float | 0 -- 0.5 | `0.15` | Radius of the inner glow layer. |
| `outer_width` | float | 0 -- 1 | `0.4` | Radius of the outer glow falloff. |
| `softness` | float | 0 -- 0.5 | `0.05` | Edge softness of each beam layer. |

#### Noise

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `noise_scale` | float | 0.1 -- 20 | `5.0` | Scale of the distortion noise along the beam. |
| `noise_speed` | float | 0 -- 10 | `3.0` | Scroll speed of the noise pattern. |
| `noise_intensity` | float | 0 -- 0.5 | `0.1` | Amplitude of the noise displacement on the beam edge. |
| `noise_octaves` | int | 1 -- 6 | `3` | Number of FBM octaves. More octaves add detail at the cost of performance. |

#### Animation

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `scroll_speed` | float | 0 -- 20 | `8.0` | Speed of the energy flow scrolling along the beam. |
| `pulse_speed` | float | 0 -- 10 | `0.0` | Speed of brightness pulsing. Set to 0 to disable pulsing. |
| `pulse_amount` | float | 0 -- 1 | `0.2` | Amplitude of the pulse effect. |
| `flicker_speed` | float | 0 -- 30 | `15.0` | Rate of random brightness flicker. |
| `flicker_amount` | float | 0 -- 0.5 | `0.1` | Maximum brightness variation from flicker. |

#### Sparkle

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `sparkle_enabled` | bool | -- | `true` | Toggle sparkle particles along the beam. |
| `sparkle_density` | float | 1 -- 50 | `20.0` | Density of sparkle particles. Higher values produce more particles. |
| `sparkle_speed` | float | 0 -- 20 | `10.0` | Scroll speed of the sparkle particles along the beam. |
| `sparkle_intensity` | float | 0 -- 5 | `2.0` | Brightness of individual sparkle particles. |

### How to Set Up the Mesh

The beam shader expects UV coordinates where:
- **UV.x** runs along the length of the beam (0 to 1).
- **UV.y** runs across the width, with 0.5 at the center.

A simple quad or subdivided plane works well. Orient it so the long axis maps to UV.x.

### Recommended Use Cases

- Laser beams and energy weapons.
- Magic spell projectiles.
- Lightning and electrical arcs.
- Tractor beams and energy tethers.

### Performance Tips

- The shader is `unshaded` with no light interaction.
- The primary cost is the FBM noise. Reduce `noise_octaves` for better performance on mobile.
- Disabling `sparkle_enabled` removes the particle overlay calculations.

---

## 11. Triplanar Blend

**File**: `triplanar_blend.gdshader`
**Type**: `spatial`

A triplanar texture mapping shader that projects textures from three axes (top, side, bottom) and blends between them based on surface normals. Includes optional height-based blending for natural terrain transitions.

### Parameters

#### Textures

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `texture_top` | Texture2D | -- | -- | Albedo texture projected onto upward-facing surfaces (e.g., grass, snow). |
| `texture_side` | Texture2D | -- | -- | Albedo texture for side-facing surfaces (e.g., rock, cliff). |
| `texture_bottom` | Texture2D | -- | -- | Albedo texture for downward-facing surfaces (e.g., cave ceiling, overhang). |

#### Normal Maps

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `normal_top` | Texture2D | -- | -- | Normal map for top-facing surfaces. |
| `normal_side` | Texture2D | -- | -- | Normal map for side-facing surfaces. |
| `normal_bottom` | Texture2D | -- | -- | Normal map for bottom-facing surfaces. |
| `normal_strength` | float | 0 -- 5 | `1.0` | Overall normal map intensity. |

#### Mapping

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `texture_scale` | float | 0.01 -- 10 | `1.0` | Scale of the triplanar texture projection in world units. Smaller values stretch the texture; larger values tile it more densely. |
| `blend_sharpness` | float | 1 -- 32 | `8.0` | Controls how sharply textures transition based on normal angle. Higher values produce tighter blends with less overlap. |
| `top_threshold` | float | 0 -- 1 | `0.7` | Normal Y value above which a surface is considered "top." Lower values classify more surfaces as top-facing. |

#### Height Blend

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `use_height_blend` | bool | -- | `false` | Enable height-based blending for more natural texture transitions. |
| `height_top` | Texture2D | -- | -- | Heightmap for the top texture. White areas protrude and win the blend. |
| `height_side` | Texture2D | -- | -- | Heightmap for the side texture. |
| `height_blend_contrast` | float | 0 -- 1 | `0.5` | Controls how much height information influences the blend boundary. |

#### Surface

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `roughness` | float | 0 -- 1 | `0.8` | Surface roughness. |
| `metallic` | float | 0 -- 1 | `0.0` | Metallic property. |
| `specular` | float | 0 -- 1 | `0.5` | Specular intensity. |

#### Color

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `color_tint` | Color | -- | `(1.0, 1.0, 1.0, 1.0)` | Global color tint applied to the final output. |
| `ao_strength` | float | 0 -- 1 | `0.0` | Ambient occlusion strength. Uses the alpha channel of the top texture as an AO map when greater than 0. |

### Recommended Use Cases

- Terrain and landscape meshes with varying slopes.
- Large rock formations and cliffs.
- Caves and underground environments.
- Any mesh where UV unwrapping is impractical or would cause visible seams.

### Performance Tips

- Triplanar mapping performs 3 texture lookups per texture (one per axis), so it uses 3x the bandwidth of standard UV mapping. With all texture slots filled (3 albedo + 3 normal + 2 height = 8 textures, each sampled 3 times), this can be expensive.
- If height blending is not needed, keep `use_height_blend` disabled to skip 6 additional texture lookups.
- Use lower resolution textures or reduce `texture_scale` on mobile.

---

## 12. Wind Sway

**File**: `wind_sway.gdshader`
**Type**: `spatial` (render mode: `cull_disabled`)

A vertex-animation shader that simulates wind blowing through foliage, grass, and other flexible objects. Supports per-instance variation, configurable sway masking, and tip color blending.

### Parameters

#### Base

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `base_color` | Color | -- | `(0.3, 0.6, 0.2, 1.0)` | Base foliage color. |
| `base_texture` | Texture2D | -- | -- | Albedo texture for the foliage or grass. |
| `alpha_scissor` | float | 0 -- 1 | `0.5` | Alpha cutoff threshold. Pixels with alpha below this value are discarded. |
| `roughness` | float | 0 -- 1 | `0.8` | Surface roughness. |

#### Wind

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `wind_strength` | float | 0 -- 5 | `1.0` | Overall wind force. Controls how far the vegetation bends. |
| `wind_direction` | vec2 | -- | `(1.0, 0.5)` | Direction of the wind in the XZ plane. |
| `wind_speed` | float | 0 -- 10 | `2.0` | Speed of the wind wave propagation. |
| `wind_turbulence` | float | 0 -- 5 | `1.0` | Amount of cross-wind variation (gusts and swirling). |
| `wind_frequency` | float | 0 -- 10 | `3.0` | Spatial frequency of the wind waves. Higher values produce more rapid oscillation across space. |

#### Sway

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `sway_amount` | float | 0 -- 2 | `0.5` | Amplitude of the gentle, ambient sway independent of wind. |
| `sway_speed` | float | 0 -- 10 | `1.5` | Speed of the ambient sway cycle. |
| `use_vertex_color_mask` | bool | -- | `true` | When enabled, the red channel of vertex colors controls sway weight (0 = fixed, 1 = full sway). When disabled, UV.y is used as the mask. |
| `height_mask_power` | float | 0 -- 5 | `2.0` | Power curve applied to the UV.y height mask (only used when `use_vertex_color_mask` is off). Higher values concentrate motion at the tips. |

#### Detail

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `micro_sway` | float | 0 -- 1 | `0.2` | Amplitude of high-frequency leaf/tip jitter. |
| `micro_frequency` | float | 0 -- 20 | `8.0` | Frequency of the micro-sway oscillation. |

#### Color Variation

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `color_variation_enabled` | bool | -- | `true` | Toggle color blending toward tips. |
| `tip_color` | Color | -- | `(0.5, 0.7, 0.1, 1.0)` | Color blended toward the tips of the vegetation. |
| `tip_blend` | float | 0 -- 1 | `0.3` | Strength of the tip color blend. |
| `shadow_tint` | Color | -- | `(0.1, 0.2, 0.1, 1.0)` | Color tint for shadowed portions (unused in current fragment but available for custom light functions). |
| `subsurface_amount` | float | 0 -- 1 | `0.3` | Amount of backlight transmission, simulating light passing through thin leaves. |

### Recommended Use Cases

- Trees, bushes, and foliage.
- Grass fields (works well with MultiMeshInstance3D for large fields).
- Cloth and banner animation.
- Any flexible mesh that should respond to wind.

### How to Prepare Your Mesh

For best results:
- **Vertex color masking** (recommended): Paint the red channel of vertex colors on your mesh. Use 0 (black) at the base where the plant is rooted and 1 (red) at the tips where maximum sway should occur.
- **UV-based masking** (alternative): If you disable `use_vertex_color_mask`, the shader uses UV.y as the sway mask. Ensure your UVs are laid out so that Y=0 is the base and Y=1 is the tip.

### Performance Tips

- The vertex shader uses trigonometric functions but no texture lookups, making it efficient.
- Per-instance variation is computed from world position hashing, so it works well with MultiMeshInstance3D without any additional setup.
- The `cull_disabled` render mode draws both faces, which is ideal for single-plane grass cards. For solid trunk meshes, you can duplicate the shader and change to `cull_back`.

---

## General Performance Notes

- **Mobile targets**: Shaders that use `DEPTH_TEXTURE` or `SCREEN_TEXTURE` (Water Surface, Force Field, Frosted Glass, Pixelation) require the Forward+ or Mobile renderer. They will not work with the Compatibility renderer.
- **Bloom interaction**: Shaders with emission output (Dissolve, Lava Flow, Hologram, Energy Beam, Force Field) look best when Godot's WorldEnvironment has the glow/bloom post-process enabled.
- **Shader compilation**: Godot compiles shaders on first use, which can cause brief hitches. To avoid this during gameplay, instantiate each material once during a loading screen.
- **Texture memory**: Shaders that accept multiple textures (Water Surface, Triplanar Blend, Frosted Glass) can use significant VRAM. Use compressed textures (`.ctex` or Basis Universal) and reasonable resolutions.
