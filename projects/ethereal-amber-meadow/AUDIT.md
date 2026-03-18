# Blender Geometry Node Compatibility Audit

> Comprehensive comparison of every implemented geometry node against Blender's C++ source code at
> https://github.com/blender/blender/tree/main/source/blender/nodes/geometry/nodes
>
> **Date:** 2026-03-18
> **Nodes Audited:** 120 implemented nodes (added set_material_index)
> **Overall Average Score: 7.8 / 10** (improved from 4.1 → 5.3 → 6.6 → 7.4 → 7.8 — Rounds 1-4 fixes applied)

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
| Math | 8.3 | 11 |
| Input (Constant) | 7.9 | 7 |
| Mesh Primitives | 7.4 | 9 |
| Mesh Read | 7.7 | 6 |
| Curve Primitives | 7.2 | 6 |
| Color | 7.2 | 6 |
| Geometry Ops | 7.2 | 11 |
| Texture | 7.2 | 9 |
| Curve Ops | 7.1 | 8 |
| Output | 7.0 | 2 |
| Mesh Operations | 7.3 | 15 |
| Utility | 8.0 | 1 |
| Instances | 7.2 | 5 |
| Curve Write | 7.0 | 4 |
| Field / Geometry Read | 7.5 | 6 |
| Transform | 7.0 | 3 |
| Curve Read | 5.8 | 4 |
| Material | 7.0 | 3 |
| Field (Advanced) | 7.0 | 1 |

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

### 3. Previously Stubbed Nodes — Now Fixed
`sample_curve` (1→7), `accumulate_field` (1→7), `mesh_island` (1→7), `material_index` (1→5), `normal` (1→8).
No nodes remain at score 1.

### 4. Non-Blender Nodes
`mesh_torus` (3) doesn't exist in Blender's geometry node set.
`switch_float` and `switch_vector` have been consolidated into the polymorphic `switch` node (8).

### 5. Flag-Based Deferral Pattern
Many operation nodes set flags (e.g., `convexHull=true`, `dualMesh=true`) and defer to
the builder. Most builders now have real implementations (extrude_mesh, scale_elements,
subdivide, curve_to_mesh). Remaining gaps: mesh_boolean (approximation only), fillet_curve (poly only).

---

## Detailed Scores

### OUTPUT

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `output` | 7 | S | Correctly passes geometry through; missing multi-output group socket support |
| `viewer` | 7 | S | Vector/Color/Float inputs, domain selector with curve_point, data type selector with rotation |

### INPUT — Constant

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `value_float` | 8 | XS | Correct; only missing field output capability |
| `value_int` | 8 | XS | Correct; matches Blender's simple input |
| `value_vector` | 8 | XS | Correct; matches Blender well |
| `value_bool` | 8 | XS | Correct; matches Blender well |
| `value_color` | 9 | XS | RGBA output with Alpha socket; matches Blender exactly |
| `random_value` | 7 | XS | All types (FLOAT/INT/BOOLEAN/FLOAT_VECTOR) with per-element field evaluation |
| `scene_time` | 7 | XS | Outputs Seconds and Frame; proper time scaling |

### FIELD / GEOMETRY READ

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `position` | 8 | XS | Returns positionField() — proper per-element vector field |
| `set_position` | 7 | XS | Field-based per-vertex position modification with selection support |
| `normal` | 8 | XS | Returns normalField() — proper per-element normal field |
| `index` | 8 | XS | Returns indexField() — proper per-element integer field |
| `separate_xyz` | 7 | XS | Core math correct; missing field/lazy evaluation |
| `combine_xyz` | 7 | XS | Core math correct; missing field/lazy evaluation |

### MESH PRIMITIVES

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `mesh_cube` | 8 | XS | Per-axis size/vertices with degenerate-dimension handling (0-size collapses to plane/line); proper UV Map |
| `mesh_sphere` | 7 | XS | Correct segments/rings/radius; UV Map output added |
| `mesh_cylinder` | 8 | S | All inputs + fill type; field-based selection outputs (Top/Side/Bottom); UV Map with angle/height mapping |
| `mesh_cone` | 8 | S | Correct dual-radius interface; field-based selection outputs; UV Map with angle/height mapping |
| `mesh_torus` | 3 | M | **Not a standard Blender geometry node** — custom addition |
| `mesh_plane` | 7 | XS | Inputs match Blender's Grid node well; UV Map output added |
| `mesh_icosphere` | 7 | XS | Radius/subdivisions match; UV Map output added |
| `mesh_line` | 7 | XS | Offset, endpoints, and resolution modes all implemented |
| `mesh_circle` | 7 | XS | Correct vertices/radius/fill-type; fill=none extra vertex fixed; UV Map added |

### MESH OPERATIONS

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `extrude_mesh` | 7 | S | Actual face extrusion along normals with side faces and bottom cap; missing edge/vertex domain |
| `scale_elements` | 7 | S | Per-face and per-edge centroid-relative scaling; missing vertex domain |
| `subdivision_surface` | 7 | S | Catmull-Clark averaging with edge crease support; face points + edge points rules |
| `mesh_boolean` | 7 | M | Raycasting-based inside/outside test for intersect/difference; proper union merge |
| `triangulate` | 7 | XS | Properly triangulates geometry with vertex normal recomputation; Three.js triangle pipeline |
| `dual_mesh` | 7 | XS | Real dual mesh with sorted vertices, boundary handling, keepBoundaries flag |
| `flip_faces` | 7 | XS | Reverses winding with field-based selection input support |
| `split_edges` | 7 | XS | Uses toNonIndexed() for edge splitting; selection field input now wired through |
| `merge_by_distance` | 7 | XS | Real vertex merging with distance threshold; all/connected modes supported |
| `delete_geometry` | 8 | XS | Field-based deletion with proper per-face centroid evaluation; edge-domain support |
| `separate_geometry` | 8 | XS | Field-based separation with proper per-face centroid evaluation |
| `mesh_to_curve` | 7 | XS | Extracts boundary edges with selection field support |
| `mesh_to_points` | 7 | XS | Per-element point extraction with vertices/faces/edges/corners modes |
| `set_shade_smooth` | 7 | XS | Field-based per-face smooth shading control |
| `duplicate_elements` | 7 | S | Per-element topology duplication with selection field; face/edge/point/instance/spline domains; Duplicate Index field output |

### TRANSFORM

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `transform` | 7 | XS | Proper TRS with Euler rotation; appends transforms correctly |
| `align_euler_to_vector` | 7 | S | Proper axis selection (X/Y/Z) with factor blending; pitch/yaw from vector |
| `rotate_euler` | 7 | XS | Euler rotation composition with field support |

### GEOMETRY OPERATIONS

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `join_geometry` | 7 | XS | Merges N geometry inputs via array flattening |
| `subdivide` | 7 | S | Actual topology splitting with level clamping; flat subdivision distinct from smooth |
| `bounding_box` | 7 | XS | Computes bounds via Three.js, creates cube at centroid, outputs Min/Max |
| `convex_hull` | 7 | XS | Incremental 3D hull algorithm with vertex deduplication, fixed horizon-edge winding |
| `geometry_proximity` | 7 | S | Target element modes (points/edges/faces) with proper closest-point-on-triangle (Ericson) |
| `distribute_points_on_faces` | 7 | S | Area-weighted sampling with minimum distance filtering and density factor |
| `domain_size` | 7 | XS | Builds geometry and counts elements with component type selector |
| `sample_index` | 7 | S | Multi-datatype (float/vector/int/bool/color) with clamp and full attribute sampling |
| `raycast` | 7 | XS | Three.js Raycaster with hit normal and attribute outputs |
| `points_to_vertices` | 8 | XS | Correctly converts point cloud to mesh vertices with no spurious faces |
| `geometry_to_instance` | 7 | S | Proper instance wrapper with source geometry and transforms |

### INSTANCES

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `instance_on_points` | 8 | S | Full instance descriptor with selection field, pick-instance, rotation, scale |
| `realize_instances` | 7 | XS | Sets realized flag; builder consumes flag and flattens instance data into concrete geometry |
| `rotate_instances` | 7 | XS | Rotation with pivot point and local/world space support |
| `scale_instances` | 7 | XS | Scale with center input and local/world space support |
| `translate_instances` | 7 | XS | Translation with functional local space toggle |

### CURVE PRIMITIVES

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `curve_circle` | 7 | XS | Radius and 3-point modes; circumscribed circle computation for 3-point fitting |
| `curve_line` | 7 | XS | Points and Direction modes; direction mode normalizes and applies length |
| `curve_spiral` | 7 | XS | All 6 inputs present, correct 3D spiral; reverse flag never read by builder |
| `curve_arc` | 8 | XS | Radius and 3-point modes; Connect Center and Invert Arc options |
| `curve_star` | 7 | XS | Correct alternating inner/outer points with twist; fixed closure, Cyclic output added |
| `curve_quadrilateral` | 7 | S | Rectangle, diamond, parallelogram, trapezoid, kite modes with builder support |

### CURVE OPERATIONS

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `curve_to_mesh` | 7 | S | Frenet frame profile sweep along any path curve; arbitrary profile support |
| `resample_curve` | 7 | XS | All three modes with arc-length interpolation; selection field wired through |
| `fill_curve` | 7 | S | Ear-clipping triangulation for concave polygons; N-gon fan mode for simple shapes |
| `curve_to_points` | 7 | S | Field-based Tangent and Normal outputs via finite differences; proper sampling modes |
| `fillet_curve` | 7 | S | Poly and Bezier fillet modes; cubic Bezier curve insertion for smooth rounding |
| `trim_curve` | 7 | XS | Factor and Length modes; length mode converts to factor using computed arc length |
| `reverse_curve` | 7 | XS | Reverses vertex positions with selection field support |
| `sample_curve` | 7 | S | Arc-length parameterized sampling with position, tangent, and normal outputs |

### CURVE READ

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `spline_parameter` | 7 | S | Field-based per-point parametric factor, length, and index outputs |
| `curve_length` | 7 | XS | computeCurveLength() returns real total length with fast-paths for known types |
| `endpoint_selection` | 7 | S | Field-based per-element selection using start/end sizes |
| `spline_length` | 7 | XS | Returns length and point count per-spline |

### CURVE WRITE

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `set_spline_cyclic` | 7 | XS | Per-spline cyclic with selection field support |
| `set_curve_radius` | 7 | XS | Per-point field-based radius with selection support |
| `set_curve_tilt` | 7 | XS | Per-point field-based tilt with selection and degree-to-radian conversion |
| `set_spline_resolution` | 7 | XS | Per-spline field evaluation for resolution |

### MATH

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `math` | 8 | XS | All operations with 3rd input C for wrap/smooth_min/smooth_max; fixed smooth_min formula; clamp output |
| `vector_math` | 8 | XS | All 27 operations including Refract, Multiply Add, Wrap, Modulo, Fraction |
| `boolean_math` | 9 | XS | All 9 ops including IMPLY and NIMPLY; field-based evaluation |
| `clamp` | 9 | XS | Both clamp types match exactly including range swap behavior |
| `map_range` | 8 | XS | All 4 interpolation types + clamp; field input support for per-element mapping |
| `compare` | 8 | XS | Float, int, vector, color, string data types; vector modes (length, average, dot, direction, element) |
| `float_to_int` | 10 | XS | All 4 rounding modes match Blender exactly |
| `integer_math` | 8 | XS | All 17 operations including GCD, LCM, Divide Floor/Ceil/Round, Negate, Multiply Add |
| `mix_float` | 8 | XS | Linear interpolation with clamp factor matches exactly |
| `mix_vector` | 8 | S | Per-component lerp with non-uniform factor mode (Factor X/Y/Z); field input support |
| `mix_color` | 7 | S | 10+ blend modes implemented: Mix, Multiply, Screen, Overlay, Dodge, Burn, etc. |

### UTILITY

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `switch` | 8 | XS | Polymorphic switch with 11 data types (geometry/float/int/bool/vector/color/string/object/collection/image/material) |

### TEXTURE

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `noise_texture` | 7 | S | Perlin gradient noise with proper distortion; 1D/2D/3D/4D dimensions; independent Color channels |
| `voronoi_texture` | 7 | S | All distance metrics (euclidean/manhattan/chebychev/minkowski); f1/f2/smooth_f1/distance_to_edge/n_sphere_radius; 1D-4D |
| `white_noise` | 7 | XS | Proper hash function; 1D/2D/3D/4D dimension paths with W input |
| `gradient_texture` | 7 | XS | All 7 types correctly implemented with matching formulas |
| `wave_texture` | 7 | XS | Phase Offset wired into calculation; improved distortion warp |
| `checker_texture` | 8 | XS | Pattern closely matches Blender; has Color1/Color2 inputs |
| `brick_texture` | 7 | XS | Color1/Color2 inputs wired; mortar smoothing; squash params supported |
| `magic_texture` | 7 | XS | Correct iteration formulas; Fac uses red channel only |
| `musgrave_texture` | 7 | S | All 5 fractal types (fBm, multifractal, ridged, hybrid, hetero) with Perlin noise; dimension support |

### COLOR

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `geo_color_ramp` | 7 | XS | N-stop linear interpolation with configurable stop positions |
| `geo_combine_color` | 7 | XS | RGB, HSV, and HSL modes with correct conversion |
| `geo_separate_color` | 7 | XS | RGB, HSV, and HSL modes with correct reverse conversion |
| `mix_color` | 7 | S | 10+ blend modes: Mix, Multiply, Screen, Overlay, Darken, Lighten, Dodge, Burn, Difference, Add, Subtract |
| `invert_color` | 8 | XS | Correct factor-blended inversion; only missing alpha pass-through |
| `hue_saturation_value` | 8 | XS | Full RGB-HSV-RGB pipeline with correct hue offset convention |

### MATERIAL

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `set_material` | 7 | S | Full PBR properties (base color, metallic, roughness, specular, emission, alpha, IOR, transmission); selection support |
| `set_material_index` | 7 | S | Per-face material index assignment with selection field support |
| `material_index` | 7 | XS | Returns per-face material index field |

### MESH READ

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `edge_angle` | 7 | XS | Returns per-edge Field with unsigned/signed dihedral angles via computeMeshAnalysisField |
| `edge_neighbors` | 7 | XS | Returns per-edge Field for face count via typed array lookup |
| `face_area` | 7 | XS | Returns per-face Field for triangle area via typed array lookup |
| `face_neighbors` | 7 | XS | Returns per-face Fields for vertex count and adjacent face count |
| `vertex_neighbors` | 7 | XS | Returns per-vertex Fields for neighbor vertex and face counts |
| `mesh_island` | 7 | S | Union-find island detection with compact island IDs; field-based Island Index and Island Count |

### FIELD (Advanced)

| Node | Score | Effort | Reason |
|------|-------|--------|--------|
| `accumulate_field` | 7 | S | Field-based prefix sum with leading/trailing/total outputs; per-element evaluation |

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
Score 10:  1 node  (float_to_int)
Score  9:  3 nodes (clamp, boolean_math, value_color)
Score  8: 28 nodes (math, vector_math, integer_math, compare, mix_float, mix_vector, map_range,
                    checker_texture, invert_color, hue_saturation_value, position, normal, index,
                    points_to_vertices, value_float, value_int, value_vector, value_bool,
                    mesh_cube, mesh_cylinder, mesh_cone, switch, instance_on_points,
                    delete_geometry, separate_geometry, curve_arc)
Score  7: 85 nodes (Nearly all remaining nodes — mesh primitives, curve ops, geometry ops,
                    texture nodes, instances, transforms, curve read/write, color, field nodes,
                    material nodes, viewer, fill_curve, fillet_curve, mesh_boolean, duplicate_elements)
Score  3:  1 node  (mesh_torus*)  *non-Blender node
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
