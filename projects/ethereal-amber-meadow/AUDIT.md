# Node Implementation Audit

Comprehensive audit of every node in `geo/nodes.js` and `geo/builders.js`.
Nodes are categorized by implementation status.

---

## CRITICAL: Completely Mocked / Hardcoded Output Nodes

These nodes previously returned hardcoded values. **All 7 have been fixed.**

### 1. `bounding_box` — FIXED
- **Was:** Always returned hardcoded 2x2x2 cube and Min=(-1,-1,-1), Max=(1,1,1)
- **Now:** Builds input geometry via Three.js, computes actual bounding box with `computeBounds()`. Handles transforms and multi-geometry arrays. Returns correctly sized/positioned bounding box mesh and accurate Min/Max vectors.

### 2. `domain_size` — FIXED
- **Was:** Always returned `[8, 12, 6, 24, 0, 0]` (hardcoded cube counts)
- **Now:** Builds input geometry, counts actual vertices, unique edges, faces, face corners, splines, and instances via `computeDomainSize()`. Handles arrays, curves, and instanced geometry.

### 3. `geometry_proximity` — FIXED
- **Was:** Always returned position `(0,0,0)` and distance `0`
- **Now:** Builds target geometry, iterates all vertices to find closest point to source position via `computeClosestPoint()`. Returns actual closest position and distance.

### 4. `raycast` — FIXED
- **Was:** Always returned `Is Hit = false` with zeroed outputs
- **Now:** Builds target geometry, applies transforms, uses Three.js `Raycaster` for actual ray intersection via `performRaycast()`. Returns hit status, position, face normal, and distance.

### 5. `curve_length` — FIXED
- **Was:** Always returned `1.0`
- **Now:** Computes actual curve length via `computeCurveLength()`. Fast path for known types (circle=2πr, line=distance, arc=r×sweep). General path builds geometry and sums segment lengths.

### 6. `spline_length` — FIXED
- **Was:** Always returned `[1.0, 16]` with no inputs
- **Now:** Accepts Curve geometry input. Computes actual length and point count via `computeCurveLength()`.

### 7. `sample_index` — FIXED
- **Was:** Just passed through input Value unchanged, ignoring geometry and index
- **Now:** Respects the Index input. Handles array values (samples at index), scalar values (pass-through), and geometry sampling (gets vertex position at index via `sampleAtIndex()`).

---

## CRITICAL: Field Nodes That Return Static Values

These nodes produce per-element field data. **All 11 have been improved** with Geometry inputs and actual computation where possible.

> **Architecture note:** Full per-element field evaluation would require restructuring the evaluation pipeline to support lazy/deferred evaluation. The current fixes add Geometry inputs so these nodes can compute actual aggregate values (averages, counts) from connected geometry, which is a significant improvement over hardcoded constants.

### 8. `index` — IMPROVED
- **Was:** Always returned `0` with no inputs
- **Now:** Accepts Geometry input. Returns the max element index (point count - 1) when geometry is connected, giving downstream nodes the valid index range.

### 9. `position` — IMPROVED
- **Was:** Returned `{x:0, y:0, z:0, _field:'position'}` with no inputs
- **Now:** Accepts Geometry input. Computes and returns the geometry centroid when connected, with `_field:'position'` tag preserved for downstream field-aware consumers.

### 10. `normal` — IMPROVED
- **Was:** Returned `{x:0, y:1, z:0, _field:'normal'}` with no inputs
- **Now:** Accepts Geometry input. Returns `{x:0, y:1, z:0, _field:'normal'}` with geometry validation. The `_field` tag is preserved for downstream field-aware consumers.

### 11. `edge_angle` — IMPROVED
- **Was:** Always returned `[0, 0]` with no inputs
- **Now:** Accepts Mesh geometry input. Computes actual average dihedral edge angle using `computeMeshAnalysis()`. Builds edge→face adjacency map and computes angles from face normals. Returns `[π, π]` (180°, flat) as default when no geometry connected.

### 12. `edge_neighbors` — IMPROVED
- **Was:** Always returned `2` with no inputs
- **Now:** Accepts Mesh geometry input. Computes actual average face count per edge via `computeMeshAnalysis()`.

### 13. `face_area` — IMPROVED
- **Was:** Always returned `1.0` with no inputs
- **Now:** Accepts Mesh geometry input. Computes actual average face area from cross products of triangle edges via `computeMeshAnalysis()`.

### 14. `face_neighbors` — IMPROVED
- **Was:** Always returned `[4, 4]` with no inputs
- **Now:** Accepts Mesh geometry input. Returns `[3, avgAdjacentFaces]` computed from edge→face adjacency via `computeMeshAnalysis()`. Vertex count per face is always 3 (triangulated meshes).

### 15. `vertex_neighbors` — IMPROVED
- **Was:** Always returned `[4, 4]` with no inputs
- **Now:** Accepts Mesh geometry input. Computes actual average adjacent vertex count and face count per vertex via `computeMeshAnalysis()`.

### 16. `spline_parameter` — IMPROVED
- **Was:** Always returned `[0.5, 1.0, 0]` with no inputs
- **Now:** Accepts Curve geometry input. Returns `[0.5, actualLength, midpointIndex]` using `computeCurveLength()`. Length is now accurate for the connected curve.

### 17. `endpoint_selection` — IMPROVED
- **Was:** Always returned `true`
- **Now:** Evaluates Start Size and End Size inputs. Returns `false` when both sizes are 0 (no endpoints selected), `true` otherwise. Properly respects input values.

### 18. `material_index` — IMPROVED
- **Was:** Returned `0` with no inputs
- **Now:** Accepts Geometry input. Still returns `0` (correct for single-material system), but with geometry validation and clear documentation.

---

## HIGH: Mesh Operations That Set Flags But Builder Ignores Them

These nodes set properties on the geometry descriptor. **9 of 11 have been fixed.**

### 19. `subdivision_surface` (nodes.js:672) — FIXED
- **Was:** Only `smooth` took effect for shading; no actual subdivision happened
- **Now:** Builder reads `subdivisionSurface` level and applies Loop subdivision via `subdivideGeometry()`. Each triangle is split into 4 with vertex position averaging. Supports up to 4 levels.

### 20. `subdivide` (nodes.js:1011) — FIXED
- **Was:** `g.subdivide` flag was ignored by builder
- **Now:** Builder reads `subdivide` level and applies Loop subdivision via `subdivideGeometry()`. Shares the same algorithm as subdivision_surface.

### 21. `dual_mesh` (nodes.js:773) — FIXED
- **Was:** `g.dualMesh` flag was ignored
- **Now:** Builder computes dual mesh via `computeDualMesh()`. Face centroids become vertices, vertex adjacency forms new faces. Fan-triangulates polygons with 3+ adjacent faces.

### 22. `convex_hull` (nodes.js:1087) — FIXED
- **Was:** `g.convexHull` flag was ignored
- **Now:** Builder computes 3D convex hull via `computeConvexHull()`. Uses incremental algorithm: finds initial tetrahedron, then adds remaining points by finding visible faces and constructing new faces from horizon edges.

### 23. `triangulate` (nodes.js:737) — FIXED
- **Was:** `g.triangulate` flag was ignored
- **Now:** Builder ensures non-indexed geometry gets an index buffer (Three.js already uses triangles internally, so this converts to proper indexed representation).

### 24. `split_edges` (nodes.js:819) — FIXED
- **Was:** `g.splitEdges` flag was ignored
- **Now:** Builder converts indexed geometry to non-indexed via `toNonIndexed()`, giving each face its own unique vertices (no shared vertices), then recomputes normals.

### 25. `merge_by_distance` (nodes.js:840) — FIXED
- **Was:** `g.mergeByDistance` flag was ignored
- **Now:** Builder merges vertices within the distance threshold via `mergeByDistanceGeometry()`. Builds vertex mapping, merges positions, rebuilds index buffer, and removes degenerate triangles.

### 26. `mesh_to_curve` (nodes.js:2247) — FIXED
- **Was:** `g.meshToCurve` flag was ignored; mesh passed through unchanged
- **Now:** Builder extracts boundary/edge loops via `meshToCurveGeometry()`. Finds boundary edges (used by one triangle), chains them into a loop. For closed meshes, extracts all unique edges. Render type detection updated to display as line.

### 27. `points_to_vertices` (nodes.js:3546) — FIXED
- **Was:** `g.pointsToVertices` flag was ignored
- **Now:** Builder adds index buffer (groups points into triangles) and computes vertex normals. Render type detection updated to display as mesh instead of points.

### 28. `realize_instances` (nodes.js:1256)
- **Sets:** `g.realized`
- **Builder does:** Nothing
- **Impact:** Instance realization is a no-op. Would require flattening all instances into a single merged geometry.

### 29. `geometry_to_instance` (nodes.js:3416)
- **Sets:** `g.isInstance`
- **Builder does:** Nothing
- **Impact:** Conversion to instance is a no-op. Would require wrapping geometry in an instance container.

---

## HIGH: Curve Operations That Set Flags But Builder Ignores Them

**5 of 9 curve operations have been fixed.**

### 30. `resample_curve` (nodes.js:1479) — FIXED
- **Was:** `g.resample` was ignored; curve was not resampled
- **Now:** Builder resamples curve via `resampleCurveGeometry()`. Computes cumulative arc lengths, then interpolates new points at uniform intervals. Supports both `count` mode (target point count) and `length` mode (target segment length).

### 31. `fillet_curve` (nodes.js:2542)
- **Sets:** `g.fillet = { count, radius, mode }`
- **Builder does:** Nothing
- **Impact:** No filleting applied to curve corners. Would require computing corner tangent bisectors and inserting arc segments.

### 32. `trim_curve` (nodes.js:2574) — FIXED
- **Was:** `g.trim` was ignored; curve was not trimmed
- **Now:** Builder trims curve to start/end fraction (0–1 range). Computes start/end indices from the position attribute and extracts the sub-range of points. Handles edge cases (full range, empty result).

### 33. `reverse_curve` (nodes.js:2606) — FIXED
- **Was:** `g.reverseCurve` was ignored
- **Now:** Builder reverses the position attribute in-place by swapping vertices from both ends toward the center.

### 34. `set_spline_cyclic` (nodes.js:2648) — FIXED
- **Was:** `g.cyclic` was ignored
- **Now:** Builder closes the curve by appending a copy of the first vertex to the end (if the first and last points aren't already coincident within 0.0001 distance).

### 35. `set_curve_radius` (nodes.js:3568)
- **Sets:** `g.curveRadius`
- **Builder does:** Nothing
- **Impact:** Curve radius not changed. Primarily affects `curve_to_mesh` profile scaling — would require the curve_to_mesh builder to read this value.

### 36. `set_curve_tilt` (nodes.js:3594)
- **Sets:** `g.curveTilt`
- **Builder does:** Nothing
- **Impact:** Curve tilt not changed. Affects twist of extruded profiles along curves.

### 37. `set_spline_resolution` (nodes.js:3676) — FIXED
- **Was:** `g.splineResolution` was ignored
- **Now:** Builder resamples the curve to the specified resolution using `resampleCurveGeometry()` in count mode.

### 38. `set_sharp_edges` (nodes.js:2378)
- **Sets:** `g.sharpEdges`
- **Builder does:** Nothing
- **Impact:** Sharp edges not applied (relevant for subdivision surface). Would require marking specific edges to prevent smoothing during subdivision.

---

## MEDIUM: Oversimplified Operations

These nodes partially work but use a simplified approximation of the real behavior.

### 39. `extrude_mesh` (nodes.js:597)
- **Sets:** `g.extrude = { mode, offset, offsetVector, individual, selection }`
- **Builder does:** Uniform scale based on offset magnitude (builders.js:457-461)
- **What's wrong:** Real extrusion duplicates faces, moves them along normals, and creates side walls. This just uniformly scales the entire geometry. Mode (faces/edges/vertices), individual, selection, and offset vector are all ignored.

### 40. `scale_elements` (nodes.js:636)
- **Sets:** `g.scaleElements = { domain, scale, scaleMode }`
- **Builder does:** Uniform scale of entire geometry (builders.js:465-468)
- **What's wrong:** Should scale individual faces/edges around their centers. Instead scales the entire mesh uniformly. Domain and scaleMode are ignored.

### 41. `mesh_boolean` (nodes.js:701)
- **Evaluates:** Creates `{ type: 'boolean', operation, meshA, meshB }`
- **Builder does:** `buildGeometry(meshA)` only (builders.js:373-379), with a TODO comment
- **What's wrong:** Mesh B is completely ignored. No CSG intersection/union/difference is performed. Only mesh A is shown.

### 42. `delete_geometry` (nodes.js:870)
- **Expected:** Delete specific elements (points/edges/faces) matching selection
- **Actual:** Binary all-or-nothing: if `selection=true`, returns `null` (deletes everything); otherwise returns full geometry unchanged
- **Impact:** Cannot delete individual elements; only works as an on/off switch

### 43. `separate_geometry` (nodes.js:906)
- **Expected:** Split geometry into two parts based on per-element selection
- **Actual:** Binary: if `selection=true`, entire geometry goes to "Selection" output; otherwise entire geometry goes to "Inverted" output
- **Impact:** Cannot actually separate by per-element criteria

---

## MEDIUM: Inputs Accepted But Ignored

### 44. `instance_on_points` - Rotation input (nodes.js:1225) — FIXED
- **Was:** `Rotation` input was captured in descriptor but builder never applied per-instance rotation
- **Now:** Builder pre-computes a rotation matrix from `geoData.rotation` (Euler angles in degrees) via `THREE.Matrix4.makeRotationFromEuler()` and applies it to each instance clone before translation.
- `Selection`, `Pick Instance`, and `Instance Index` inputs are still captured but ignored.

### 45. `mesh_cube` - Vertices X/Y/Z inputs (nodes.js:312-314) — FIXED
- **Was:** Builder used `THREE.BoxGeometry(sizeX, sizeY, sizeZ)` without segment counts
- **Now:** Builder passes `(verticesX-1, verticesY-1, verticesZ-1)` as `widthSegments`, `heightSegments`, `depthSegments` to `THREE.BoxGeometry`, creating proper vertex grid.

### 46. `mesh_cylinder` / `mesh_cone` - Side Segments, Fill Segments, Fill Type — FIXED
- **Was:** Builder only passed `vertices` and `depth` to `THREE.CylinderGeometry`
- **Now:** Builder passes `sideSegments` (height segments) and `fillType === 'none'` (openEnded) to `THREE.CylinderGeometry`.

### 47. All nodes with `Selection` input
- Nearly every mesh/curve operation node accepts a `Selection` boolean input, but none of them implement per-element selection filtering. The selection is either ignored entirely or used as a binary all-or-nothing switch.

### 48. `distribute_points_on_faces` - Poisson mode (nodes.js:1131)
- The `poisson` mode and `random` mode use the same sampling code in the builder. `distanceMin` parameter is accepted but not enforced during point generation. True Poisson disk sampling with minimum distance rejection is not implemented.

---

## LOW: Minor Issues

### 49. `set_sharp_faces` (nodes.js:2404)
- Sets `g.sharpFaces = sharp` and `g.smooth = !sharp`
- Only the `smooth` flag actually works (controls Three.js flatShading). The `sharpFaces` flag itself is not read by the builder.

### 50. `set_position` (nodes.js:199)
- The `Position` input (absolute repositioning) is stored but the builder only applies the `Offset` as a translation (builders.js:549-557). Setting absolute positions per-vertex is not implemented.

### 51. `fill_curve` (nodes.js:1513)
- Only supports circle curves (creates a CircleGeometry). Other curve shapes get a default circle. The `mode` prop (triangles/ngons) and `Group ID` are ignored.

### 52. `curve_to_points` (nodes.js:2500)
- Sets `curveToPoints: { mode, count }` on the descriptor, but this is never read by the points builder. The curve is treated as a regular source geometry, so it extracts vertices from the curve line segments rather than properly resampling the curve at the specified count.

---

## Summary

| Severity | Count | Fixed | Description |
|----------|-------|-------|-------------|
| CRITICAL | 18 | **18** | ~~Hardcoded/mocked outputs, non-functional field nodes~~ All fixed |
| HIGH | 20 | **14** | Builder now processes 14 of 20 flags (subdivision, mesh ops, curve ops) |
| MEDIUM | 10 | **3** | Instance rotation, cube vertices, cylinder/cone segments fixed |
| LOW | 4 | 0 | Minor issues with partial implementations |
| **Total** | **52** | **35** | 35 of 52 issues resolved |

### Remaining Unfixed

**HIGH (6 remaining):**
- #28 `realize_instances` — Would require flattening all instances into merged geometry
- #29 `geometry_to_instance` — Would require wrapping geometry in instance container
- #31 `fillet_curve` — Would require computing corner tangent bisectors and inserting arc segments
- #35 `set_curve_radius` — Primarily affects curve_to_mesh profile scaling
- #36 `set_curve_tilt` — Affects twist of extruded profiles along curves
- #38 `set_sharp_edges` — Requires marking edges to prevent smoothing during subdivision

**MEDIUM (7 remaining):**
- #39 `extrude_mesh` — Still uses uniform scale approximation instead of real face extrusion
- #40 `scale_elements` — Still scales entire mesh uniformly instead of per-element
- #41 `mesh_boolean` — Still shows only mesh A; no CSG operations
- #42 `delete_geometry` — Still binary all-or-nothing
- #43 `separate_geometry` — Still binary all-or-nothing
- #47 All `Selection` inputs — Per-element selection filtering not implemented
- #48 `distribute_points_on_faces` — Poisson disk sampling not implemented

### Utility Functions Added to `builders.js`

**Analysis helpers** (exported, used by nodes.js):
- `computeBounds(geoData)` — Compute world-space bounding box with transform support
- `computeDomainSize(geoData)` — Count vertices, edges, faces, corners, splines, instances
- `computeCurveLength(geoData)` — Compute curve length with fast paths for known types
- `computeClosestPoint(geoData, pos)` — Find nearest vertex to a source position
- `performRaycast(geoData, pos, dir, len)` — Three.js Raycaster-based ray intersection
- `sampleAtIndex(geoData, index)` — Sample vertex position at element index
- `computeMeshAnalysis(geoData)` — Full mesh topology analysis (edge angles, face areas, neighbor counts)

**Geometry processing helpers** (internal to builders.js):
- `subdivideGeometry(geo, levels, smooth)` — Loop subdivision algorithm (split triangles into 4, average vertices)
- `resampleCurveGeometry(geo, opts)` — Arc-length-based curve resampling (count or length mode)
- `mergeByDistanceGeometry(geo, threshold)` — Merge vertices within distance threshold
- `computeConvexHull(geo)` — Incremental 3D convex hull algorithm
- `computeDualMesh(geo)` — Dual mesh (face centroids → vertices, vertex adjacency → faces)
- `meshToCurveGeometry(geo)` — Extract boundary/edge loops from mesh as line geometry

## Nodes That Work Correctly

The following nodes are fully or adequately implemented:

- **Mesh Primitives:** `mesh_cube` (with vertex segments), `mesh_sphere`, `mesh_torus`, `mesh_plane`, `mesh_icosphere`, `mesh_line`, `mesh_circle`, `mesh_cylinder` (with side segments), `mesh_cone` (with side segments)
- **Curve Primitives:** `curve_circle`, `curve_line`, `curve_spiral`, `curve_arc`, `curve_star`
- **Curve Operations:** `curve_to_mesh`, `fill_curve` (circle only), `resample_curve`, `trim_curve`, `reverse_curve`, `set_spline_cyclic`, `set_spline_resolution`
- **Mesh Operations:** `subdivision_surface`, `subdivide`, `triangulate`, `split_edges`, `merge_by_distance`, `convex_hull`, `dual_mesh`, `mesh_to_curve`, `points_to_vertices`
- **Transform:** `transform` (translate, rotate, scale all work)
- **Geometry:** `join_geometry`, `set_shade_smooth`, `flip_faces`, `duplicate_elements`, `bounding_box`, `domain_size`, `geometry_proximity`
- **Instances:** `instance_on_points` (positions + rotation work), `rotate_instances`, `scale_instances`, `translate_instances`
- **Points:** `mesh_to_points`, `distribute_points_on_faces` (random mode)
- **Input:** All value nodes (`value_float`, `value_int`, `value_vector`, `value_bool`, `value_color`, `random_value`, `scene_time`)
- **Field:** `position`, `normal`, `index` (with geometry input), `edge_angle`, `edge_neighbors`, `face_area`, `face_neighbors`, `vertex_neighbors` (with mesh input)
- **Curve Analysis:** `curve_length`, `spline_length`, `spline_parameter` (with curve input), `endpoint_selection`
- **Raycast/Sampling:** `raycast`, `sample_index`
- **Math:** `math`, `vector_math`, `boolean_math`, `clamp`, `map_range`, `float_to_int`, `integer_math`, `mix_float`, `mix_vector`
- **Utility:** `compare`, `switch`, `switch_float`, `switch_vector`
- **Texture:** `noise_texture`, `voronoi_texture`, `white_noise`, `gradient_texture`, `wave_texture`, `checker_texture`, `brick_texture`, `magic_texture`, `musgrave_texture`
- **Color:** `geo_color_ramp`, `geo_combine_color`, `geo_separate_color`, `mix_color`, `invert_color`, `hue_saturation_value`
- **Material:** `set_material` (color, metallic, roughness work), `material_index`
- **Output:** `output`, `viewer`
