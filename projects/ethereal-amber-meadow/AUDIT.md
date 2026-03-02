# Blender Geometry Node Compatibility Audit

> Comprehensive comparison of every implemented geometry node against Blender's C++ source code at
> https://github.com/blender/blender/tree/main/source/blender/nodes/geometry/nodes
>
> **Date:** 2026-03-02
> **Nodes Audited:** 119 implemented nodes
> **Overall Average Score: 4.1 / 10**

---

## Scoring Legend

- **10** = Perfect Blender match — does literally everything the same
- **7-9** = Core functionality works, missing some modes/options
- **4-6** = Basic structure correct, significant features missing or simplified
- **1-3** = Stubbed/mocked, barely functional

---

## Summary Statistics

| Category | Avg Score | Node Count |
|----------|-----------|------------|
| Input (Constant) | 6.7 | 7 |
| Math | 6.2 | 11 |
| Color | 5.4 | 6 |
| Mesh Primitives | 5.2 | 9 |
| Texture | 5.1 | 9 |
| Output | 4.5 | 2 |
| Curve Primitives | 4.5 | 6 |
| Utility | 4.3 | 3 |
| Geometry Ops | 3.8 | 11 |
| Curve Ops | 3.8 | 8 |
| Curve Write | 3.5 | 4 |
| Field / Geometry Read | 3.4 | 6 |
| Mesh Operations | 3.4 | 15 |
| Transform | 3.3 | 3 |
| Instances | 3.2 | 5 |
| Curve Read | 2.8 | 4 |
| Mesh Read | 2.0 | 6 |
| Material | 1.5 | 2 |
| Field (Advanced) | 1.0 | 1 |

---

## Key Findings

### 1. Fundamental: No Field Evaluation System
The biggest systemic issue. Blender nodes like Position, Normal, Index, and all mesh read
nodes produce **lazy per-element fields** evaluated downstream. This project evaluates
everything as **single scalar/vector values**, which fundamentally breaks how many nodes work.

### 2. Best Nodes (Score 8-10)
Simple math and constant nodes that don't depend on per-element evaluation:
`float_to_int` (10), `clamp` (9), `boolean_math` (8), `checker_texture` (8),
`invert_color` (8), `hue_saturation_value` (8), `mix_float` (8), value input nodes (8).

### 3. Fully Stubbed Nodes (Score 1)
`sample_curve`, `accumulate_field`, `mesh_island`, `material_index`, `normal`.

### 4. Non-Blender Nodes
`mesh_torus` (3), `switch_float` (3), `switch_vector` (3) don't exist in Blender's
geometry node set.

### 5. Flag-Based Deferral Pattern
Many operation nodes set flags (e.g., `convexHull=true`, `dualMesh=true`) and defer to
the builder. Implementation quality in the builder varies from decent (merge_by_distance,
dual_mesh) to non-functional (extrude_mesh, scale_elements, fillet_curve).

---

## Detailed Scores

### OUTPUT

| Node | Score | Reason |
|------|-------|--------|
| `output` | 7 | Correctly passes geometry through; missing multi-output group socket support |
| `viewer` | 2 | Trivial pass-through; Blender's Viewer has spreadsheet integration, dynamic sockets, domain support |

### INPUT — Constant

| Node | Score | Reason |
|------|-------|--------|
| `value_float` | 8 | Correct; only missing field output capability |
| `value_int` | 8 | Correct; matches Blender's simple input |
| `value_vector` | 8 | Correct; matches Blender well |
| `value_bool` | 8 | Correct; matches Blender well |
| `value_color` | 8 | Correct RGB output; only missing alpha channel |
| `random_value` | 5 | Has FLOAT/INT/BOOLEAN but missing FLOAT_VECTOR type and per-element field evaluation |
| `scene_time` | 4 | Uses performance.now() instead of actual scene timeline; disconnected from animation |

### FIELD / GEOMETRY READ

| Node | Score | Reason |
|------|-------|--------|
| `position` | 2 | Returns single centroid instead of per-element field; fundamentally misrepresents the node |
| `set_position` | 2 | Stores metadata instead of modifying per-vertex positions; no per-element selection |
| `normal` | 1 | Always returns hardcoded {0,1,0}; no actual normal computation |
| `index` | 2 | Returns max index as single scalar; Blender returns per-element 0,1,2...N |
| `separate_xyz` | 7 | Core math correct; missing field/lazy evaluation |
| `combine_xyz` | 7 | Core math correct; missing field/lazy evaluation |

### MESH PRIMITIVES

| Node | Score | Reason |
|------|-------|--------|
| `mesh_cube` | 6 | Correct per-axis size/vertices; missing UV Map output, degenerate-dimension handling |
| `mesh_sphere` | 6 | Correct segments/rings/radius; missing UV Map, may differ in pole topology |
| `mesh_cylinder` | 5 | Has all inputs + fill type; selection outputs hardcoded true, fill segments ignored, no UVs |
| `mesh_cone` | 5 | Correct dual-radius interface; same issues as cylinder |
| `mesh_torus` | 3 | **Not a standard Blender geometry node** — custom addition |
| `mesh_plane` | 6 | Inputs match Blender's Grid node well; missing UV Map output |
| `mesh_icosphere` | 5 | Radius/subdivisions match; Three.js detail param differs from Blender's BMesh operator |
| `mesh_line` | 5 | Has offset/endpoints modes; resolution mode declared but not implemented |
| `mesh_circle` | 5 | Correct vertices/radius/fill-type; fill=none creates extra vertex, no UVs |

### MESH OPERATIONS

| Node | Score | Reason |
|------|-------|--------|
| `extrude_mesh` | 2 | Correct interface but builder applies uniform scale, not actual extrusion (no topology change) |
| `scale_elements` | 2 | Correct interface but builder applies global scale instead of per-island scaling — a stub |
| `subdivision_surface` | 5 | Implements Loop subdivision but Blender uses Catmull-Clark; missing creases, boundary modes |
| `mesh_boolean` | 3 | Correct ops but builder says "TODO: CSG library" and just renders mesh A — no actual boolean |
| `triangulate` | 3 | Has all quad/ngon methods but builder doesn't truly triangulate quads/ngons |
| `dual_mesh` | 4 | Builder implements real dual mesh algorithm but lacks proper sorting, boundary handling |
| `flip_faces` | 5 | Builder correctly reverses winding; selection input ignored |
| `split_edges` | 4 | Uses toNonIndexed() as approximation; selection ignored |
| `merge_by_distance` | 5 | Real vertex merging with distance threshold; "connected" mode ignored |
| `delete_geometry` | 2 | All-or-nothing (true=delete all, false=keep all); no per-element deletion |
| `separate_geometry` | 2 | Same all-or-nothing boolean; no per-element separation |
| `mesh_to_curve` | 5 | Builder extracts boundary edges and chains into curve; missing selection handling |
| `mesh_to_points` | 4 | Creates points descriptor; no actual per-element point extraction |
| `set_shade_smooth` | 5 | Toggles flatShading per-object; no per-face/per-edge control |
| `duplicate_elements` | 2 | Clones entire geometry N times; Blender duplicates individual elements with topology |

### TRANSFORM

| Node | Score | Reason |
|------|-------|--------|
| `transform` | 4 | Appends TRS to transforms array; Blender uses quaternions, handles volumes, modifies geometry directly |
| `align_euler_to_vector` | 3 | Simplified pitch/yaw from vector; missing proper axis selection, pivot modes |
| `rotate_euler` | 2 | Simple angle addition; Blender uses matrix multiplication with distinct space ordering |

### GEOMETRY OPERATIONS

| Node | Score | Reason |
|------|-------|--------|
| `join_geometry` | 3 | Flattens 2 inputs; Blender supports N inputs via variadic, per-component merging, attribute merging |
| `subdivide` | 3 | Sets flag for builder; no actual topology splitting or attribute interpolation |
| `bounding_box` | 6 | Genuinely computes bounds via Three.js, creates cube at centroid, outputs Min/Max |
| `convex_hull` | 2 | Sets flag only; Blender uses Bullet physics for actual convex hull computation |
| `geometry_proximity` | 4 | Computes closest point via vertex iteration; only checks vertices regardless of target setting |
| `distribute_points_on_faces` | 4 | Correct descriptor with random/poisson; actual distribution deferred to builder |
| `domain_size` | 6 | Actually builds geometry and counts elements; component selector works |
| `sample_index` | 4 | Has right UI but only samples position.x; missing true attribute field sampling |
| `raycast` | 5 | Uses Three.js Raycaster for real intersection; missing attribute interpolation |
| `points_to_vertices` | 2 | Sets flag only; no actual conversion |
| `geometry_to_instance` | 2 | Sets isInstance flag; missing multi-input, actual instancing data structure |

### INSTANCES

| Node | Score | Reason |
|------|-------|--------|
| `instance_on_points` | 5 | Has all key inputs, creates proper descriptor; delegates to builder |
| `realize_instances` | 2 | Sets flag only; Blender performs deep hierarchy flattening with attribute propagation |
| `rotate_instances` | 3 | Appends rotation transform; ignores Pivot Point, local/world space identical |
| `scale_instances` | 3 | Appends scale transform; ignores Center input, no local/world distinction |
| `translate_instances` | 3 | Appends translation; local space toggle has no effect |

### CURVE PRIMITIVES

| Node | Score | Reason |
|------|-------|--------|
| `curve_circle` | 4 | Radius mode works; points mode unimplemented, missing 3-point fitting |
| `curve_line` | 4 | Creates 2-point line; missing Direction mode (direction+length) |
| `curve_spiral` | 7 | All 6 inputs present, correct 3D spiral generation; functionally close |
| `curve_arc` | 4 | Radius mode works; missing 3-point mode, Connect Center, Invert Arc |
| `curve_star` | 6 | Correct alternating inner/outer points with twist; missing Outer Points output |
| `curve_quadrilateral` | 2 | Has mode options but NO builder case — never produces geometry |

### CURVE OPERATIONS

| Node | Score | Reason |
|------|-------|--------|
| `curve_to_mesh` | 5 | Sweeps profile along curve via Three.js TubeGeometry; missing Scale field, UV generation |
| `resample_curve` | 5 | All three modes with arc-length interpolation; missing selection, attribute transfer |
| `fill_curve` | 3 | Only fills curve_circle via CircleGeometry shortcut; missing CDT triangulation for arbitrary shapes |
| `curve_to_points` | 3 | Missing length mode; hardcoded tangent/normal instead of per-point computation |
| `fillet_curve` | 2 | Stores metadata but builder has NO fillet processing — pass-through stub |
| `trim_curve` | 4 | Factor mode works by slicing vertices; length mode silently falls back |
| `reverse_curve` | 5 | Correctly reverses vertex positions; missing selection field for per-curve reversal |
| `sample_curve` | 1 | **FULLY STUBBED** — returns hardcoded zeros for all outputs |

### CURVE READ

| Node | Score | Reason |
|------|-------|--------|
| `spline_parameter` | 2 | Returns hardcoded 0.5 factor; Blender computes per-point parametric position |
| `curve_length` | 5 | computeCurveLength() returns real total length with fast-paths for known types |
| `endpoint_selection` | 2 | Returns single boolean; Blender marks N points at start/end of each spline |
| `spline_length` | 4 | Returns length and point count; but operates on whole geometry not per-spline |

### CURVE WRITE

| Node | Score | Reason |
|------|-------|--------|
| `set_spline_cyclic` | 3 | Sets single boolean flag; no per-spline selection or attribute system |
| `set_curve_radius` | 4 | Stores single scalar; Blender writes per-point attribute with selection |
| `set_curve_tilt` | 4 | Correctly converts deg to rad; same single-scalar limitation |
| `set_spline_resolution` | 4 | Sets resolution property; no per-spline field evaluation |

### MATH

| Node | Score | Reason |
|------|-------|--------|
| `math` | 6 | 27 of 28+ operations; missing clamp output, 3rd input C for wrap/smooth_min, buggy smooth_min formula |
| `vector_math` | 6 | 22 of 26 operations; missing Refract, Multiply Add, Wrap, Modulo, Fraction |
| `boolean_math` | 8 | All 7 ops correct; missing IMPLY and NIMPLY from later Blender |
| `clamp` | 9 | Both clamp types match exactly including range swap behavior |
| `map_range` | 6 | All 4 interpolation types + clamp; stepped uses hardcoded 4 steps, missing Vector type |
| `compare` | 4 | Only float comparison implemented; vector/color/int/string modes non-functional |
| `float_to_int` | 10 | All 4 rounding modes match Blender exactly |
| `integer_math` | 5 | 10 of 18 operations; missing GCD, LCM, Divide Floor/Ceil/Round, Negate, Multiply Add |
| `mix_float` | 8 | Linear interpolation with clamp factor matches exactly |
| `mix_vector` | 7 | Correct per-component lerp; missing non-uniform factor mode |
| `mix_color` | 3 | Only basic linear interpolation; Blender has 19 blend modes |

### UTILITY

| Node | Score | Reason |
|------|-------|--------|
| `switch` | 7 | Correct geometry switch; Blender's is type-polymorphic with dropdown |
| `switch_float` | 3 | **Not a real Blender node** — fabricated type-specific variant |
| `switch_vector` | 3 | **Not a real Blender node** — fabricated type-specific variant |

### TEXTURE

| Node | Score | Reason |
|------|-------|--------|
| `noise_texture` | 4 | Uses value noise instead of Perlin; Color output fake {fac, fac*0.8, fac*0.6} |
| `voronoi_texture` | 4 | All features/metrics in UI but only F1 euclidean actually computed |
| `white_noise` | 4 | Only 3D path implemented; uses integer hash instead of proper hash functions |
| `gradient_texture` | 7 | All 7 types correctly implemented with matching formulas |
| `wave_texture` | 5 | Correct types/directions/profiles; Phase Offset declared but never used |
| `checker_texture` | 8 | Pattern closely matches Blender; has Color1/Color2 inputs |
| `brick_texture` | 4 | Ignores Color1/Color2 inputs, uses hardcoded colors; mortar smoothing absent |
| `magic_texture` | 6 | Initial layer matches; iteration formulas differ from Blender's per-depth transforms |
| `musgrave_texture` | 5 | All 5 fractal types enumerated; uses valueNoise instead of Perlin, only 3D computed |

### COLOR

| Node | Score | Reason |
|------|-------|--------|
| `geo_color_ramp` | 3 | 2-stop linear only; Blender supports N stops, 4 interpolation modes, HSV blending |
| `geo_combine_color` | 6 | RGB and HSV modes correct; missing HSL mode and alpha |
| `geo_separate_color` | 6 | RGB and HSV modes correct; missing HSL mode and alpha |
| `mix_color` | 3 | Only linear interpolation; Blender has 19 blend modes |
| `invert_color` | 8 | Correct factor-blended inversion; only missing alpha pass-through |
| `hue_saturation_value` | 8 | Full RGB-HSV-RGB pipeline with correct hue offset convention |

### MATERIAL

| Node | Score | Reason |
|------|-------|--------|
| `set_material` | 2 | Stores inline PBR properties instead of Material datablock reference; no selection |
| `material_index` | 1 | Always returns 0; Blender returns per-face material slot index |

### MESH READ

| Node | Score | Reason |
|------|-------|--------|
| `edge_angle` | 2 | Single averaged scalar instead of per-edge field; signed=unsigned |
| `edge_neighbors` | 2 | Single averaged value instead of per-edge field |
| `face_area` | 2 | Single averaged scalar instead of per-face field |
| `face_neighbors` | 2 | Vertex count hardcoded to 3; face count averaged |
| `vertex_neighbors` | 2 | Correct topology math but collapses to averaged scalars |
| `mesh_island` | 1 | Returns hardcoded {0, 1}; no island detection |

### FIELD (Advanced)

| Node | Score | Reason |
|------|-------|--------|
| `accumulate_field` | 1 | Returns {val, 0, val}; no actual field accumulation |

---

## Score Distribution

```
Score 10: 1 node   (float_to_int)
Score  9: 1 node   (clamp)
Score  8: 8 nodes  (boolean_math, checker_texture, invert_color, hue_saturation_value, mix_float, value_float/int/vector/bool/color)
Score  7: 6 nodes  (output, separate_xyz, combine_xyz, curve_spiral, gradient_texture, switch, mix_vector)
Score  6: 9 nodes  (mesh_cube, mesh_sphere, mesh_plane, bounding_box, domain_size, math, vector_math, map_range, geo_combine/separate_color, magic_texture, curve_star)
Score  5: 18 nodes (mesh_cylinder/cone/icosphere/line/circle, subdivision_surface, flip_faces, merge_by_distance, mesh_to_curve/points, set_shade_smooth, instance_on_points, curve_to_mesh, resample_curve, reverse_curve, raycast, random_value, wave/musgrave_texture, curve_length, integer_math)
Score  4: 18 nodes (transform, geometry_proximity, distribute_points, mesh_to_points, noise/voronoi/white_noise/brick_texture, compare, curve_circle/line/arc, trim_curve, spline_length, set_curve_radius/tilt, set_spline_resolution, scene_time, sample_index)
Score  3: 15 nodes (mesh_torus, mesh_boolean, triangulate, fill_curve, curve_to_points, join_geometry, subdivide, align_euler_to_vector, rotate/scale/translate_instances, set_spline_cyclic, switch_float/vector, mix_color, geo_color_ramp)
Score  2: 19 nodes (extrude_mesh, scale_elements, delete/separate_geometry, duplicate_elements, convex_hull, points_to_vertices, geometry_to_instance, realize_instances, position, set_position, index, fillet_curve, curve_quadrilateral, rotate_euler, endpoint_selection, spline_parameter, viewer, set_material, edge/face/vertex_neighbors)
Score  1: 5 nodes  (normal, sample_curve, accumulate_field, mesh_island, material_index)
```

---

## Recommendations for Improvement

### High Impact
1. **Implement a basic field evaluation system** — even a simplified version would dramatically improve Position, Normal, Index, and all mesh read nodes
2. **Fix extrude_mesh** — one of the most commonly used nodes; doesn't actually extrude
3. **Implement sample_curve** — currently fully stubbed, widely used in curve workflows
4. **Add CSG library for mesh_boolean** — currently a no-op

### Medium Impact
5. Fix delete_geometry / separate_geometry for per-element operation
6. Add missing math operations (wrap 3rd input, vector_math refract/wrap/modulo)
7. Add blend modes to mix_color (at least Multiply, Screen, Overlay, Add)
8. Fix scale_elements / extrude_mesh builders for actual topology operations
9. Implement fillet_curve builder — currently a pass-through
10. Add UV Map outputs to mesh primitives

### Low Impact
11. Replace value noise with Perlin noise in texture nodes
12. Add Color Ramp N-stop support
13. Consolidate switch_float/switch_vector into polymorphic switch
14. Remove mesh_torus (non-Blender) or clearly mark as custom
