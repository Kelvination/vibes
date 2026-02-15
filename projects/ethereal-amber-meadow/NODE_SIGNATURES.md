# Node Signature Reference - Blender 4.x/5.0 Compatibility

> **IMPORTANT:** All signatures in this file should be double-checked against
> Blender before adding new features or building on top of existing nodes.
> Open Blender, add the node, and verify every input/output socket name, type,
> and default value matches what we have here.

## Verification Status Key

- **VERIFIED** - Matches Blender exactly (inputs, outputs, dropdowns)
- **CLOSE** - Core inputs/outputs match, minor differences in defaults or extra Blender sockets omitted
- **SIMPLIFIED** - Significant simplification from Blender (fewer inputs, missing modes)
- **CUSTOM** - Not in Blender / custom to this editor

---

## Geometry Nodes (`geo/nodes.js`)

### Output / Input

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `output` | Group Output | VERIFIED | Geometry input |
| `value_float` | Value | VERIFIED | Float output |
| `value_int` | Integer | VERIFIED | Int output |
| `value_vector` | Vector | VERIFIED | Vector output with X/Y/Z |
| `value_bool` | Boolean | VERIFIED | Bool output |
| `value_color` | Color | VERIFIED | Color output with R/G/B |
| `viewer` | Viewer | CLOSE | Has Geometry + Value; Blender 5.0 Viewer supports dynamic inputs |

### Mesh Primitives

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `mesh_cube` | Cube | VERIFIED | Size + Vertices X/Y/Z |
| `mesh_sphere` | UV Sphere | VERIFIED | Segments=32, Rings=16, Radius |
| `mesh_cylinder` | Cylinder | VERIFIED | Vertices, Side/Fill Segments, Radius, Depth, Fill Type, Top/Side/Bottom outputs |
| `mesh_cone` | Cone | VERIFIED | Vertices, Side/Fill Segments, Radius Top/Bottom, Depth, Fill Type, Top/Side/Bottom outputs |
| `mesh_plane` | Grid | VERIFIED | Size X/Y, Vertices X/Y |
| `mesh_icosphere` | Ico Sphere | VERIFIED | Radius, Subdivisions |
| `mesh_torus` | Torus | VERIFIED | Major/Minor Segments + Radius as socket inputs, Mode dropdown |
| `mesh_line` | Mesh Line | VERIFIED | Count, Start Location, Offset vectors, Mode/Count Mode dropdowns |
| `mesh_circle` | Mesh Circle | VERIFIED | Vertices, Radius, Fill Type |

### Mesh Operations

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `extrude_mesh` | Extrude Mesh | VERIFIED | Selection, Offset, Offset Scale, Individual, Mode; Top/Side outputs |
| `scale_elements` | Scale Elements | VERIFIED | Selection, Scale, Center, Axis; Scale Mode dropdown |
| `subdivision_surface` | Subdivision Surface | VERIFIED | Level, Edge Crease |
| `mesh_boolean` | Mesh Boolean | VERIFIED | Mesh 1/2, Self Intersection, Hole Tolerant; Intersecting Edges output |
| `triangulate` | Triangulate | VERIFIED | Selection, Min Vertices; Quad/N-gon Method dropdowns |
| `dual_mesh` | Dual Mesh | VERIFIED | Keep Boundaries |
| `flip_faces` | Flip Faces | VERIFIED | Selection |
| `split_edges` | Split Edges | VERIFIED | Selection |
| `merge_by_distance` | Merge by Distance | VERIFIED | Selection, Distance, Mode |
| `delete_geometry` | Delete Geometry | VERIFIED | Selection, Domain (5 options), Mode dropdown |
| `separate_geometry` | Separate Geometry | VERIFIED | Selection, Domain dropdown |
| `mesh_to_curve` | Mesh to Curve | VERIFIED | Mesh, Selection |
| `set_sharp_edges` | Set Sharp Edges | VERIFIED | Geometry, Selection, Sharp |
| `set_sharp_faces` | Set Sharp Faces | VERIFIED | Geometry, Selection, Sharp |

### Mesh Read (Field) Nodes

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `edge_angle` | Edge Angle | VERIFIED | Unsigned/Signed Angle outputs |
| `edge_neighbors` | Edge Neighbors | VERIFIED | Face Count output |
| `face_area` | Face Area | VERIFIED | Area output |
| `face_neighbors` | Face Neighbors | VERIFIED | Vertex/Face Count outputs |
| `vertex_neighbors` | Vertex Neighbors | VERIFIED | Vertex/Face Count outputs |
| `mesh_island` | Mesh Island | VERIFIED | Island Index/Count outputs |

### Transform

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `transform` | Transform | CLOSE | Translation, Rotation, Scale vectors. Blender also has Mode (Object/Geometry) |
| `align_euler_to_vector` | Align Euler to Vector | VERIFIED | Rotation, Factor, Vector; Axis dropdown |
| `rotate_euler` | Rotate Euler | VERIFIED | Rotation, Rotate By; Space dropdown |

### Field Nodes

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `set_position` | Set Position | VERIFIED | Geometry, Selection, Position, Offset |
| `index` | Index | VERIFIED | Index output |
| `normal` | Normal | VERIFIED | Normal vector output |
| `position` | Position | VERIFIED | Position vector output |
| `accumulate_field` | Accumulate Field | VERIFIED | Value, Group Index; Data Type, Domain dropdowns |

### Geometry

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `set_shade_smooth` | Set Shade Smooth | VERIFIED | Geometry, Selection, Shade Smooth; Domain (Face/Edge) |
| `distribute_points_on_faces` | Distribute Points on Faces | VERIFIED | Mesh, Selection, Distance Min, Density Max, Density Factor, Seed; Normal/Rotation outputs |
| `mesh_to_points` | Mesh to Points | VERIFIED | Mesh, Selection, Position, Radius; Mode (Vertices/Faces/Edges/Corners) |
| `geometry_proximity` | Geometry Proximity | VERIFIED | Geometry, Source Position; Target Element dropdown; Position/Distance outputs |
| `domain_size` | Domain Size | VERIFIED | Component dropdown; 6 count outputs |
| `sample_index` | Sample Index | VERIFIED | Data Type, Domain, Clamp |
| `raycast` | Raycast | VERIFIED | Target Geometry, Attribute, Source Position, Ray Direction, Ray Length; Data Type, Mapping |
| `bounding_box` | Bounding Box | VERIFIED | Min/Max vector outputs |
| `join_geometry` | Join Geometry | VERIFIED | Two geometry inputs |
| `points_to_vertices` | Points to Vertices | VERIFIED | Points, Selection |
| `duplicate_elements` | Duplicate Elements | VERIFIED | Geometry, Selection, Amount; Domain dropdown |

### Instance

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `instance_on_points` | Instance on Points | VERIFIED | Points, Selection, Instance, Pick Instance, Instance Index, Rotation, Scale |
| `realize_instances` | Realize Instances | VERIFIED | Geometry, Selection, Realize All |
| `rotate_instances` | Rotate Instances | VERIFIED | Instances, Selection, Rotation, Pivot Point, Local Space |
| `scale_instances` | Scale Instances | VERIFIED | Instances, Selection, Scale, Center, Local Space |
| `translate_instances` | Translate Instances | VERIFIED | Instances, Selection, Translation, Local Space |
| `geometry_to_instance` | Geometry to Instance | VERIFIED | Geometry input |

### Curve Primitives

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `curve_circle` | Curve Circle | VERIFIED | Resolution, Radius sockets; Mode, Center output |
| `curve_line` | Curve Line | VERIFIED | Start/End vectors |
| `curve_spiral` | Spiral | VERIFIED | Resolution, Rotations, Start/End Radius, Height, Reverse |
| `curve_arc` | Arc | VERIFIED | Resolution, Radius, Start/Sweep Angle |
| `curve_star` | Star | VERIFIED | Points, Inner/Outer Radius |
| `curve_quadrilateral` | Quadrilateral | VERIFIED | Width, Height; Mode dropdown |

### Curve Operations

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `curve_to_mesh` | Curve to Mesh | VERIFIED | Curve, Profile Curve, Fill Caps |
| `resample_curve` | Resample Curve | VERIFIED | Curve, Selection, Count, Length; Mode (Count/Length/Evaluated) |
| `fill_curve` | Fill Curve | VERIFIED | Curve, Group ID; Mode (Triangles/N-gons) |
| `curve_to_points` | Curve to Points | VERIFIED | Curve, Count; Mode, Tangent/Normal outputs |
| `fillet_curve` | Fillet Curve | VERIFIED | Count, Radius; Mode (Bezier/Poly) |
| `trim_curve` | Trim Curve | VERIFIED | Start, End; Mode (Factor/Length) |
| `reverse_curve` | Reverse Curve | VERIFIED | Curve input |
| `sample_curve` | Sample Curve | VERIFIED | Curves, Value, Factor, Length, Curve Index; Mode, All Curves |

### Curve Write

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `set_curve_radius` | Set Curve Radius | VERIFIED | Curve, Selection, Radius |
| `set_curve_tilt` | Set Curve Tilt | VERIFIED | Curve, Selection, Tilt |
| `set_spline_cyclic` | Set Spline Cyclic | VERIFIED | Geometry, Selection, Cyclic |
| `set_spline_resolution` | Set Spline Resolution | VERIFIED | Geometry, Selection, Resolution |

### Curve Read

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `endpoint_selection` | Endpoint Selection | VERIFIED | Start/End Size |
| `spline_length` | Spline Length | VERIFIED | Length, Point Count |
| `spline_parameter` | Spline Parameter | VERIFIED | Factor, Length, Index |
| `curve_length` | Curve Length | VERIFIED | Curve → Length |

### Math

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `math` | Math | VERIFIED | 28 operations, Use Clamp |
| `vector_math` | Vector Math | VERIFIED | 22 operations |
| `clamp` | Clamp | VERIFIED | Value, Min, Max; Clamp Type (Min Max/Range) |
| `map_range` | Map Range | VERIFIED | All 5 inputs as sockets; Interpolation Type, Clamp |
| `compare` | Compare | VERIFIED | Data Type, Mode, Operation dropdowns; A, B, C, Angle, Epsilon inputs |
| `float_to_int` | Float to Integer | VERIFIED | Mode (Round/Floor/Ceiling/Truncate) |
| `integer_math` | Integer Math | VERIFIED | 10 operations |
| `mix_float` | Mix (Float) | VERIFIED | Factor, A, B; Clamp Factor |
| `mix_vector` | Mix (Vector) | VERIFIED | Factor, A, B; Clamp Factor |

### Texture

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `noise_texture` | Noise Texture | VERIFIED | Vector, W, Scale, Detail, Roughness, Lacunarity, Distortion; Dimensions dropdown |
| `voronoi_texture` | Voronoi Texture | VERIFIED | Vector, W, Scale, Smoothness, Exponent, Randomness; Dimensions/Feature/Distance dropdowns; Position/W outputs |
| `white_noise` | White Noise Texture | VERIFIED | Vector, W; Dimensions dropdown |
| `musgrave_texture` | Musgrave Texture | VERIFIED | Vector, W, Scale, Detail, Dimension, Lacunarity, Offset, Gain; Dimensions/Type dropdowns |
| `gradient_texture` | Gradient Texture | VERIFIED | Vector; 7 gradient types |
| `wave_texture` | Wave Texture | VERIFIED | Vector, Scale, Distortion, Detail, Detail Scale, Detail Roughness, Phase Offset; Type/Direction/Profile |
| `checker_texture` | Checker Texture | VERIFIED | Vector, Scale, Color1, Color2 |
| `brick_texture` | Brick Texture | VERIFIED | Vector, Color1, Color2, Mortar, Scale, Mortar Size, Mortar Smooth, Bias, Brick Width, Row Height |
| `magic_texture` | Magic Texture | VERIFIED | Vector, Scale, Distortion, Depth |

### Utility / Material / Color

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `switch` | Switch | VERIFIED | False/True, Switch |
| `set_material` | Set Material | CLOSE | Has Selection; uses color/metallic/roughness props (Blender uses material datablock reference) |
| `material_index` | Material Index | VERIFIED | Output only |
| `geo_color_ramp` | Color Ramp | SIMPLIFIED | 2-stop only (Blender supports arbitrary stops) |
| `geo_combine_color` | Combine Color | VERIFIED | RGB/HSV mode |
| `geo_separate_color` | Separate Color | VERIFIED | RGB/HSV mode |
| `mix_color` | Mix Color | VERIFIED | Factor, A, B; Clamp Factor/Result |
| `invert_color` | Invert Color | VERIFIED | Factor, Color |
| `hue_saturation_value` | Hue Saturation Value | VERIFIED | Hue, Saturation, Value, Factor, Color |

---

## Shader Nodes (`shader/nodes.js`)

### Output

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `shader_output` | Shader Output | CLOSE | Blender has Surface/Volume/Displacement inputs; we only have Shader |

### Material / BSDF

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `principled_bsdf` | Principled BSDF | CLOSE | Has 20 inputs matching Blender 4.x: Base Color, Metallic, Roughness, IOR, Alpha, Normal, Subsurface, Specular, Anisotropic, Transmission, Coat, Sheen, Emission. Missing: Subsurface Scale, Subsurface Anisotropy, Coat IOR, Coat Tint, Sheen Tint, Tangent, Thin Film |
| `emission` | Emission | VERIFIED | Color, Strength |
| `mix_shader` | Mix Shader | VERIFIED | Fac, Shader1, Shader2 |
| `diffuse_bsdf` | Diffuse BSDF | VERIFIED | Color, Roughness, Normal |
| `glossy_bsdf` | Glossy BSDF | VERIFIED | Color, Roughness, Normal; Distribution dropdown |
| `glass_bsdf` | Glass BSDF | VERIFIED | Color, Roughness, IOR, Normal; Distribution dropdown |
| `transparent_bsdf` | Transparent BSDF | VERIFIED | Color |
| `translucent_bsdf` | Translucent BSDF | VERIFIED | Color, Normal |
| `add_shader` | Add Shader | VERIFIED | Shader1, Shader2 |
| `holdout` | Holdout | VERIFIED | No inputs |
| `background` | Background | VERIFIED | Color, Strength |

### Input

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `color_value` | Color | VERIFIED | R/G/B props |
| `shader_value` | Value | VERIFIED | Float output |
| `fresnel` | Fresnel | VERIFIED | IOR, Normal |
| `shader_geometry` | Geometry | VERIFIED | 9 outputs: Position, Normal, Tangent, True Normal, Incoming, Parametric, Backfacing, Pointiness, Random Per Island |
| `light_path` | Light Path | VERIFIED | 10 outputs matching Blender |
| `layer_weight` | Layer Weight | VERIFIED | Blend, Normal; Fresnel/Facing outputs |
| `object_info` | Object Info | VERIFIED | Location, Color, Alpha, Object Index, Random outputs |
| `uv_map` | UV Map | VERIFIED | UV output |
| `ambient_occlusion` | Ambient Occlusion | VERIFIED | Color, Distance, Normal; Samples prop |

### Texture

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `noise_texture_shader` | Noise Texture | VERIFIED | Vector, W, Scale, Detail, Roughness, Lacunarity, Distortion; Dimensions dropdown |
| `voronoi_texture_shader` | Voronoi Texture | VERIFIED | Vector, W, Scale, Smoothness, Exponent, Randomness; Dimensions/Feature/Distance dropdowns; 4 outputs |
| `checker_texture_shader` | Checker Texture | VERIFIED | Vector, Color1, Color2, Scale |
| `gradient_texture_shader` | Gradient Texture | VERIFIED | 7 gradient types |
| `brick_texture_shader` | Brick Texture | VERIFIED | Vector, Color1, Color2, Mortar, Scale, Mortar Size, Mortar Smooth, Bias, Brick Width, Row Height |
| `wave_texture_shader` | Wave Texture | VERIFIED | Vector, Scale, Distortion, Detail, Detail Scale, Detail Roughness, Phase Offset; Type/Profile/Direction |
| `magic_texture_shader` | Magic Texture | VERIFIED | Vector, Scale, Distortion |
| `white_noise_texture_shader` | White Noise Texture | VERIFIED | Vector, W; Dimensions dropdown |

### Color

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `mix_color` | Mix Color | VERIFIED | 6 blend modes (Blender has more: Darken, Lighten, Burn, Dodge, Hue, Saturation, Value, Color) |
| `color_ramp` | Color Ramp | SIMPLIFIED | 2-stop only (Blender supports arbitrary stops) |
| `separate_color` | Separate Color | VERIFIED | RGB/HSV/HSL mode |
| `combine_color` | Combine Color | VERIFIED | RGB/HSV/HSL mode |
| `hue_saturation_value` | Hue/Saturation/Value | VERIFIED | Hue, Saturation, Value, Fac, Color |
| `brightness_contrast` | Brightness/Contrast | VERIFIED | Color, Bright, Contrast |
| `gamma` | Gamma | VERIFIED | Color, Gamma |
| `invert_color` | Invert Color | VERIFIED | Fac, Color |
| `shader_rgb_curves` | RGB Curves | SIMPLIFIED | Passthrough only (no curve editor) |

### Vector

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `texture_coord` | Texture Coordinate | VERIFIED | 7 outputs: Generated, Normal, UV, Object, Camera, Window, Reflection |
| `mapping` | Mapping | VERIFIED | Vector, Location, Rotation, Scale sockets; Type dropdown (Point/Texture/Vector/Normal) |
| `normal_map` | Normal Map | VERIFIED | Strength, Color; Space dropdown |
| `bump` | Bump | VERIFIED | Strength, Distance, Height, Normal; Invert |
| `vector_displacement` | Displacement | VERIFIED | Height, Midlevel, Scale, Normal |

### Math

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `shader_math` | Math | VERIFIED | 28 operations matching Blender |
| `shader_vector_math` | Vector Math | VERIFIED | 22 operations |

### Converter

| Node ID | Label | Status | Notes |
|---------|-------|--------|-------|
| `shader_combine_xyz` | Combine XYZ | VERIFIED | X, Y, Z → Vector |
| `shader_separate_xyz` | Separate XYZ | VERIFIED | Vector → X, Y, Z |
| `shader_map_range` | Map Range | VERIFIED | Value, From/To Min/Max; Interpolation, Clamp |
| `shader_clamp` | Clamp | VERIFIED | Value, Min, Max; Clamp Type |

---

## Known Limitations vs. Blender

1. **Color Ramp** - Both geo and shader versions only support 2 color stops. Blender supports arbitrary stops.
2. **Mix Color blend modes** - We have 6 modes. Blender has ~18 (missing: Darken, Lighten, Color Dodge, Color Burn, Hue, Saturation, Value, Color, Soft Light, Linear Light).
3. **Principled BSDF** - Has 20 of ~27 Blender inputs. Missing: Subsurface Scale, Subsurface Anisotropy, Coat IOR, Coat Tint, Sheen Tint, Tangent, Thin Film Thickness, Thin Film IOR.
4. **Set Material** - Uses inline color/metallic/roughness props instead of Blender's material datablock reference system.
5. **Shader Output** - Only has Shader input. Blender's Material Output has Surface, Volume, and Displacement.
6. **RGB Curves** - Passthrough only; no interactive curve editor.
7. **Volume nodes** - Blender 5.0 added 27 volume grid nodes; not implemented.
8. **Closures/Bundles** - Blender 5.0 features; not implemented.
9. **Evaluate functions** are simplified approximations. They produce reasonable preview values but don't match Blender's exact math (especially for textures, Fresnel, noise).

---

## Before Building New Features

**ALWAYS double-check against Blender before:**
- Adding a new node type
- Modifying an existing node's inputs/outputs
- Changing default values
- Adding/removing dropdown options

**How to verify:**
1. Open Blender (4.x or 5.0)
2. Add the node in a Geometry Nodes or Shader workspace
3. Compare every input socket name, type, and default value
4. Compare every output socket name and type
5. Check all dropdown/enum options
6. Note any Blender features we intentionally simplify (document in this file)

Sources:
- [Blender 5.0 Release Notes](https://www.blender.org/download/releases/5-0/)
- [Blender 5.0 Geometry Nodes Notes](https://developer.blender.org/docs/release_notes/5.0/geometry_nodes/)
- [Blender Manual - Geometry Nodes](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/index.html)
