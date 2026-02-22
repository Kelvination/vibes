# Luminara Shader Collection

**12 Professional Shaders for Godot 4**

A curated pack of production-ready shaders for Godot 4, covering stylized rendering, environmental effects, post-processing, and vertex animation. Each shader is self-contained, well-documented, and designed for straightforward integration into any project.

---

## Shaders

| # | Shader | Type | Description |
|---|--------|------|-------------|
| 1 | **Toon Shading** | `spatial` | Cel-shaded look with configurable color bands, rim lighting, and specular. |
| 2 | **Dissolve** | `spatial` | Burn-edge dissolve with noise, edge glow, and emission. |
| 3 | **Hologram** | `spatial` | Sci-fi hologram with scanlines, flicker, glitch, and fresnel. |
| 4 | **Water Surface** | `spatial` | Animated water with dual-layer waves, foam, depth fade. |
| 5 | **Force Field** | `spatial` | Hexagonal energy shield with intersection highlight and pulse. |
| 6 | **Pixelation** | `canvas_item` | Retro pixelation with color reduction and CRT scanlines. |
| 7 | **Outline** | `spatial` | Inverted-hull outline with distance fade and pulse. |
| 8 | **Frosted Glass** | `spatial` | Frosted glass with voronoi frost patterns and refraction. |
| 9 | **Lava Flow** | `spatial` | Animated flowing lava with crust, cracks, and emission. |
| 10 | **Energy Beam** | `spatial` | Animated beam with core glow, noise distortion, sparkle. |
| 11 | **Triplanar Blend** | `spatial` | Seamless triplanar mapping with height-based blending. |
| 12 | **Wind Sway** | `spatial` | Vertex animation for foliage and grass with wind simulation. |

---

## Installation

1. Download or clone this repository.
2. Copy the `shaders/` folder into your Godot 4 project directory (e.g., `res://shaders/`).
3. Each `.gdshader` file is self-contained and ready to use.

No addons, no plugins, no external dependencies.

---

## Quick Start

### Spatial Shaders (3D)

1. Select a **MeshInstance3D** node in your scene.
2. In the Inspector, create a new **ShaderMaterial** under the material slot.
3. Click the ShaderMaterial, then assign a new **Shader** resource.
4. Load the desired `.gdshader` file (e.g., `toon_shading.gdshader`).
5. Adjust uniforms in the Inspector under **Shader Parameters**.

### Canvas Item Shaders (2D / Post-Processing)

1. Add a **ColorRect** or **TextureRect** that covers the viewport, or apply directly to any **CanvasItem** node.
2. Create a new **ShaderMaterial** on the node.
3. Load the desired `.gdshader` file (e.g., `pixelate.gdshader`).
4. Adjust uniforms in the Inspector.

For full-screen post-processing, parent a **ColorRect** to a **CanvasLayer** and set it to fill the screen.

### Special Cases

- **Outline shader** -- Apply as a **Next Pass** material on the same mesh, not as the primary material. The outline renders back faces expanded along normals.
- **Water Surface shader** -- Assign normal map textures to `normal_texture_1` and `normal_texture_2` for best results. The shader reads the depth and screen textures internally.
- **Force Field shader** -- Works best on sphere or capsule meshes. Uses the depth buffer for intersection highlighting.

---

## File Structure

```
shaders/
  toon_shading.gdshader
  dissolve.gdshader
  hologram.gdshader
  water_surface.gdshader
  force_field.gdshader
  pixelate.gdshader
  outline.gdshader
  frosted_glass.gdshader
  lava_flow.gdshader
  energy_beam.gdshader
  triplanar_blend.gdshader
  wind_sway.gdshader
```

---

## Documentation

See [SHADER_GUIDE.md](SHADER_GUIDE.md) for detailed documentation on every shader, including parameter descriptions, recommended use cases, and performance tips.

---

## Compatibility

- **Engine**: Godot 4.0+
- **Renderer**: Tested with Forward+ and Mobile renderers
- **Platform**: Desktop, Mobile, Web (performance varies by shader complexity)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright 2026 Luminara Studios.
