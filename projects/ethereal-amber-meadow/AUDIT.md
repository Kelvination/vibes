# Blender Geometry Node Compatibility Audit

> Comprehensive comparison of every implemented geometry node against Blender's C++ source code at
> https://github.com/blender/blender/tree/main/source/blender/nodes/geometry/nodes
>
> **Date:** 2026-03-03
> **Nodes Audited:** 119 implemented nodes
> **Overall Average Score: 4.1 / 10**

---

## Scoring Legend

- **10** = Perfect Blender match — does literally everything the same
- **7-9** = Core functionality works, missing some modes/options
- **4-6** = Basic structure correct, significant features missing or simplified
- **1-3** = Stubbed/mocked, barely functional

## Effort Estimate Scale

- **XS** (~1 hour) = Trivial fix: wire an unused input, flip a constant, add a missing case
- **S** (~2–4 hours) = Small targeted change: add a missing mode, fix formulas, wire inputs properly
- **M** (~1–2 days) = Moderate work: new algorithm, multiple missing features, significant refactoring
- **L** (~3–5 days) = Large effort: new subsystem, complex algorithm from scratch, deep architectural change
- **XL** (~1–2 weeks) = Major undertaking: entirely new system, multiple dependent subsystems needed

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

**Update:** A basic field evaluation system has been implemented in `core/field.js`. Field-producing
nodes (Position, Normal, Index), field-propagating nodes (math, vector_math, separate/combine_xyz,
boolean_math, compare, float_to_int), and field-consuming nodes (set_position, delete_geometry,
separate_geometry) now support per-element field evaluation. Many mesh read nodes still need
to be converted to use this system.

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

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `output` | 7 | S | Correctly passes geometry through; missing multi-output group socket support |
| `viewer` | 2 | S | Trivial pass-through; Blender's Viewer has spreadsheet integration, dynamic sockets, domain support |

### INPUT — Constant

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `value_float` | 8 | XS | Correct; only missing field output capability |
| `value_int` | 8 | XS | Correct; matches Blender's simple input |
| `value_vector` | 8 | XS | Correct; matches Blender well |
| `value_bool` | 8 | XS | Correct; matches Blender well |
| `value_color` | 8 | S | Correct RGB output; only missing alpha channel |
| `random_value` | 5 | S | Has FLOAT/INT/BOOLEAN but missing FLOAT_VECTOR type and per-element field evaluation |
| `scene_time` | 4 | S | Uses performance.now() instead of actual scene timeline; disconnected from animation |

### FIELD / GEOMETRY READ

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `position` | 2 | XS | Returns single centroid instead of per-element field; fundamentally misrepresents the node |
| `set_position` | 2 | S | Stores metadata instead of modifying per-vertex positions; no per-element selection |
| `normal` | 1 | XS | Always returns hardcoded {0,1,0}; no actual normal computation |
| `index` | 2 | XS | Returns max index as single scalar; Blender returns per-element 0,1,2...N |
| `separate_xyz` | 7 | XS | Core math correct; missing field/lazy evaluation |
| `combine_xyz` | 7 | XS | Core math correct; missing field/lazy evaluation |

### MESH PRIMITIVES

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `mesh_cube` | 6 | S | Correct per-axis size/vertices; missing UV Map output, degenerate-dimension handling |
| `mesh_sphere` | 6 | S | Correct segments/rings/radius; missing UV Map, may differ in pole topology |
| `mesh_cylinder` | 5 | M | Has all inputs + fill type; selection outputs hardcoded true, fill segments ignored, no UVs |
| `mesh_cone` | 5 | M | Correct dual-radius interface; same issues as cylinder |
| `mesh_torus` | 3 | M | **Not a standard Blender geometry node** — custom addition |
| `mesh_plane` | 6 | S | Inputs match Blender's Grid node well; missing UV Map output |
| `mesh_icosphere` | 5 | S | Radius/subdivisions match; Three.js detail param differs from Blender's BMesh operator |
| `mesh_line` | 5 | M | Has offset/endpoints modes; resolution mode declared but not implemented |
| `mesh_circle` | 5 | S | Correct vertices/radius/fill-type; fill=none creates extra vertex, no UVs |

### MESH OPERATIONS

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `extrude_mesh` | 2 | L | Correct interface but builder applies uniform scale, not actual extrusion (no topology change) |
| `scale_elements` | 2 | M | Correct interface but builder applies global scale instead of per-island scaling — a stub |
| `subdivision_surface` | 5 | M | Implements Loop subdivision but Blender uses Catmull-Clark; missing creases, boundary modes |
| `mesh_boolean` | 3 | L | Correct ops but builder says "TODO: CSG library" and just renders mesh A — no actual boolean |
| `triangulate` | 3 | S | Has all quad/ngon methods but builder doesn't truly triangulate quads/ngons |
| `dual_mesh` | 4 | S | Builder implements real dual mesh algorithm but lacks proper sorting, boundary handling |
| `flip_faces` | 5 | S | Builder correctly reverses winding; selection input ignored |
| `split_edges` | 4 | S | Uses toNonIndexed() as approximation; selection ignored |
| `merge_by_distance` | 5 | S | Real vertex merging with distance threshold; "connected" mode ignored |
| `delete_geometry` | 2 | S | All-or-nothing (true=delete all, false=keep all); no per-element deletion |
| `separate_geometry` | 2 | S | Same all-or-nothing boolean; no per-element separation |
| `mesh_to_curve` | 5 | M | Builder extracts boundary edges and chains into curve; missing selection handling |
| `mesh_to_points` | 4 | M | Creates points descriptor; no actual per-element point extraction |
| `set_shade_smooth` | 5 | M | Toggles flatShading per-object; no per-face/per-edge control |
| `duplicate_elements` | 2 | L | Clones entire geometry N times; Blender duplicates individual elements with topology |

### TRANSFORM

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `transform` | 4 | S | Appends TRS to transforms array; Blender uses quaternions, handles volumes, modifies geometry directly |
| `align_euler_to_vector` | 3 | M | Simplified pitch/yaw from vector; missing proper axis selection, pivot modes |
| `rotate_euler` | 2 | S | Simple angle addition; Blender uses matrix multiplication with distinct space ordering |

### GEOMETRY OPERATIONS

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `join_geometry` | 3 | S | Flattens 2 inputs; Blender supports N inputs via variadic, per-component merging, attribute merging |
| `subdivide` | 3 | S | Sets flag for builder; no actual topology splitting or attribute interpolation |
| `bounding_box` | 6 | S | Genuinely computes bounds via Three.js, creates cube at centroid, outputs Min/Max |
| `convex_hull` | 2 | S | Algorithm structurally complete; fragile horizon-edge winding, missing vertex dedup, dead code |
| `geometry_proximity` | 4 | M | Computes closest point via vertex iteration; only checks vertices regardless of target setting |
| `distribute_points_on_faces` | 4 | M | Correct descriptor with random/poisson; actual distribution deferred to builder |
| `domain_size` | 6 | S | Actually builds geometry and counts elements; component selector unused, triangulated-space counts |
| `sample_index` | 4 | M | Has right UI but only samples position.x; missing true attribute field sampling |
| `raycast` | 5 | S | Uses Three.js Raycaster for real intersection; missing attribute interpolation |
| `points_to_vertices` | 2 | S | Current builder creates wrong spurious faces; correct behavior is simpler |
| `geometry_to_instance` | 2 | M | Sets isInstance flag; missing multi-input, actual instancing data structure |

### INSTANCES

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `instance_on_points` | 5 | M | Has all key inputs, creates proper descriptor; per-point rotation and pick-instance missing |
| `realize_instances` | 2 | S | Sets flag only; the flag is never consumed by buildGeometry |
| `rotate_instances` | 3 | S | Appends rotation transform; ignores Pivot Point, local/world space identical |
| `scale_instances` | 3 | S | Appends scale transform; ignores Center input, no local/world distinction |
| `translate_instances` | 3 | S | Appends translation; local space toggle has no effect |

### CURVE PRIMITIVES

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `curve_circle` | 4 | S | Radius mode works; points mode unimplemented, missing 3-point fitting |
| `curve_line` | 4 | S | Creates 2-point line; missing Direction mode (direction+length) |
| `curve_spiral` | 7 | XS | All 6 inputs present, correct 3D spiral; reverse flag never read by builder |
| `curve_arc` | 4 | S | Radius mode works; missing 3-point mode, Connect Center, Invert Arc |
| `curve_star` | 6 | XS | Correct alternating inner/outer points with twist; off-by-one closure, missing Cyclic output |
| `curve_quadrilateral` | 2 | M | Has mode options but NO builder case — never produces geometry |

### CURVE OPERATIONS

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `curve_to_mesh` | 5 | M | Sweeps profile along curve via Three.js TubeGeometry; only circle/line supported as sweep |
| `resample_curve` | 5 | S | All three modes with arc-length interpolation; selection input silently ignored |
| `fill_curve` | 3 | M | Only fills curve_circle via CircleGeometry shortcut; missing CDT triangulation for arbitrary shapes |
| `curve_to_points` | 3 | M | curveToPoints tag ignored; tangent/normal outputs are hardcoded stubs |
| `fillet_curve` | 2 | L | Stores metadata but builder has NO fillet processing — both Bezier and Poly rounding needed |
| `trim_curve` | 4 | S | Factor mode works by slicing vertices; length mode not converted to factor |
| `reverse_curve` | 5 | XS | Correctly reverses vertex positions; missing Selection field input |
| `sample_curve` | 1 | L | **FULLY STUBBED** — needs arc-length sampling, tangent frame, value lookup from scratch |

### CURVE READ

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `spline_parameter` | 2 | M | Returns hardcoded 0.5 factor; Blender computes per-point parametric position |
| `curve_length` | 5 | S | computeCurveLength() returns real total length with fast-paths for known types |
| `endpoint_selection` | 2 | M | Returns single boolean; Blender marks N points at start/end of each spline |
| `spline_length` | 4 | M | Returns length and point count; but operates on whole geometry not per-spline |

### CURVE WRITE

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `set_spline_cyclic` | 3 | S | Sets single boolean flag; no per-spline selection or attribute system |
| `set_curve_radius` | 4 | L | Stores single scalar; Blender writes per-point attribute with selection — needs field system |
| `set_curve_tilt` | 4 | L | Correctly converts deg to rad; same single-scalar limitation — needs field system |
| `set_spline_resolution` | 4 | S | Sets resolution property; no per-spline field evaluation |

### MATH

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `math` | 6 | S | 27 of 28+ operations; missing clamp output, 3rd input C for wrap/smooth_min, buggy smooth_min formula |
| `vector_math` | 6 | S | 22 of 26 operations; missing Refract, Multiply Add, Wrap, Modulo, Fraction |
| `boolean_math` | 8 | XS | All 7 ops correct; missing IMPLY and NIMPLY from later Blender |
| `clamp` | 9 | XS | Both clamp types match exactly including range swap behavior |
| `map_range` | 6 | S | All 4 interpolation types + clamp; stepped uses hardcoded 4 steps, missing Vector type |
| `compare` | 4 | M | Only float comparison implemented; vector/color/int/string modes non-functional |
| `float_to_int` | 10 | XS | All 4 rounding modes match Blender exactly |
| `integer_math` | 5 | S | 10 of 18 operations; missing GCD, LCM, Divide Floor/Ceil/Round, Negate, Multiply Add |
| `mix_float` | 8 | XS | Linear interpolation with clamp factor matches exactly |
| `mix_vector` | 7 | S | Correct per-component lerp; missing non-uniform factor mode |
| `mix_color` | 3 | L | Only basic linear interpolation; Blender has 19 blend modes |

### UTILITY

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `switch` | 7 | XS | Correct geometry switch; Blender's is type-polymorphic with dropdown |
| `switch_float` | 3 | XS | **Not a real Blender node** — fabricated type-specific variant |
| `switch_vector` | 3 | XS | **Not a real Blender node** — fabricated type-specific variant |

### TEXTURE

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `noise_texture` | 4 | M | Uses value noise instead of Perlin; 1D/2D/4D absent; lacunarity not forwarded; Color output fake |
| `voronoi_texture` | 4 | M | Manhattan/Chebychev/Minkowski metrics missing; distance_to_edge/n_sphere_radius absent; only F1 euclidean |
| `white_noise` | 4 | S | Quantizes coords with floor(*1000); 1D/2D/4D dimension paths absent; W input unused |
| `gradient_texture` | 7 | XS | All 7 types correctly implemented with matching formulas |
| `wave_texture` | 5 | S | Phase Offset declared but never used; distortion uses scalar noise instead of 3-component warp |
| `checker_texture` | 8 | XS | Pattern closely matches Blender; has Color1/Color2 inputs |
| `brick_texture` | 4 | S | Color1/Color2 inputs hardcoded and ignored; mortar smoothing absent; Squash params missing |
| `magic_texture` | 6 | S | Initial layer matches; iteration formulas differ; Fac should use red channel only |
| `musgrave_texture` | 5 | M | All 5 fractal types; uses valueNoise instead of Perlin; hybrid/hetero share one code path |

### COLOR

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `geo_color_ramp` | 3 | S | 2-stop linear only; Blender supports N stops, 4 interpolation modes, HSV blending |
| `geo_combine_color` | 6 | S | RGB and HSV modes correct; missing HSL mode and alpha |
| `geo_separate_color` | 6 | S | RGB and HSV modes correct; missing HSL mode and alpha |
| `mix_color` | 3 | M | Only linear interpolation; Blender has 19 blend modes |
| `invert_color` | 8 | XS | Correct factor-blended inversion; only missing alpha pass-through |
| `hue_saturation_value` | 8 | XS | Full RGB-HSV-RGB pipeline with correct hue offset convention |

### MATERIAL

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `set_material` | 2 | M | Stores inline PBR properties instead of Material datablock reference; no selection |
| `material_index` | 1 | M | Always returns 0; Blender returns per-face material slot index |

### MESH READ

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `edge_angle` | 2 | M | Single averaged scalar instead of per-edge field; signed=unsigned |
| `edge_neighbors` | 2 | M | Single averaged value instead of per-edge field |
| `face_area` | 2 | M | Single averaged scalar instead of per-face field |
| `face_neighbors` | 2 | M | Vertex count hardcoded to 3; face count averaged |
| `vertex_neighbors` | 2 | M | Correct topology math but collapses to averaged scalars |
| `mesh_island` | 1 | L | Returns hardcoded {0, 1}; no island detection — needs union-find algorithm |

### FIELD (Advanced)

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `accumulate_field` | 1 | L | Returns {val, 0, val}; no actual field accumulation — needs per-element prefix sum system |

---

## Effort Distribution

```
XS (~1hr):    22 nodes  — trivial fixes, already nearly correct
S  (~2-4hr):  52 nodes  — small targeted changes, missing modes/formulas
M  (~1-2day): 32 nodes  — moderate algorithmic work, multiple missing features
L  (~3-5day): 13 nodes  — major new algorithms or subsystem changes
XL (~1-2wk):   0 nodes  — no node requires a multi-week standalone effort
```

### Highest-Value Targets (High Impact, Low Effort)

These nodes have low scores but small effort — biggest bang for the buck:

| Node | Score | Effort | Impact |
|------|-------|--------|--------|
| `position` | 2 | XS | Core field node — already implemented in field system |
| `normal` | 1 | XS | Core field node — already implemented in field system |
| `index` | 2 | XS | Core field node — already implemented in field system |
| `delete_geometry` | 2 | S | Very common node — field-based version already added |
| `separate_geometry` | 2 | S | Very common node — field-based version already added |
| `set_position` | 2 | S | Essential node — field-based version already added |
| `triangulate` | 3 | S | Common mesh op; Three.js already triangulates internally |
| `convex_hull` | 2 | S | Algorithm exists, needs robustness fixes |
| `points_to_vertices` | 2 | S | Current impl is wrong; correct behavior is simpler |
| `realize_instances` | 2 | S | Flag exists, just needs builder consumption |

### Hardest Nodes (Low Score, High Effort)

| Node | Score | Effort | Why Hard |
|------|-------|--------|----------|
| `extrude_mesh` | 2 | L | Requires actual topology modification — creating new faces along extrusion |
| `mesh_boolean` | 3 | L | Needs a full CSG library (e.g., csg.js or similar) |
| `duplicate_elements` | 2 | L | Per-element duplication with topology preservation |
| `fillet_curve` | 2 | L | Bezier and Poly rounding algorithms from scratch |
| `sample_curve` | 1 | L | Arc-length sampling, tangent frame computation, value interpolation |
| `mesh_island` | 1 | L | Union-find island detection algorithm |
| `accumulate_field` | 1 | L | Per-element prefix sum with domain awareness |
| `set_curve_radius` | 4 | L | Needs per-point field-based attribute writing system |
| `set_curve_tilt` | 4 | L | Same per-point attribute system as radius |
| `mix_color` (Math) | 3 | L | 19 blend modes (Multiply, Screen, Overlay, Dodge, Burn, etc.) |

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

1. **~~Implement a basic field evaluation system~~** ✅ Done — `core/field.js` now provides lazy per-element field evaluation for Position, Normal, Index, math nodes, and consumer nodes
2. **Fix extrude_mesh** — one of the most commonly used nodes; doesn't actually extrude (Effort: L)
3. **Implement sample_curve** — currently fully stubbed, widely used in curve workflows (Effort: L)
4. **Add CSG library for mesh_boolean** — currently a no-op (Effort: L)

### Medium Impact

5. ~~Fix delete_geometry / separate_geometry for per-element operation~~ ✅ Done via field system
6. Add missing math operations (wrap 3rd input, vector_math refract/wrap/modulo) (Effort: S)
7. Add blend modes to mix_color (at least Multiply, Screen, Overlay, Add) (Effort: L)
8. Fix scale_elements / extrude_mesh builders for actual topology operations (Effort: M–L)
9. Implement fillet_curve builder — currently a pass-through (Effort: L)
10. Add UV Map outputs to mesh primitives (Effort: S per node)

### Low Impact

11. Replace value noise with Perlin noise in texture nodes (Effort: M)
12. Add Color Ramp N-stop support (Effort: S)
13. Consolidate switch_float/switch_vector into polymorphic switch (Effort: XS)
14. Remove mesh_torus (non-Blender) or clearly mark as custom (Effort: XS)
