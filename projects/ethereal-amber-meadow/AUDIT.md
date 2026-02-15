# Node Implementation Audit

Comprehensive audit of every node in `geo/nodes.js` and `geo/builders.js`.
Nodes are categorized by implementation status.

---

## CRITICAL: Completely Mocked / Hardcoded Output Nodes

These nodes return hardcoded values that have no relation to their actual inputs.

### 1. `bounding_box` (nodes.js:1063)
- **Expected:** Compute actual bounding box of input geometry, output Min/Max vectors
- **Actual:** Always returns a hardcoded 2x2x2 cube and Min=(-1,-1,-1), Max=(1,1,1) regardless of input geometry
- **Impact:** Any node chain depending on bounding box dimensions gets wrong data

### 2. `domain_size` (nodes.js:3437)
- **Expected:** Count actual points, edges, faces, etc. of input geometry
- **Actual:** Always returns `[8, 12, 6, 24, 0, 0]` (hardcoded cube counts) regardless of input
- **Impact:** Any procedural logic using mesh element counts will be wrong

### 3. `geometry_proximity` (nodes.js:1107)
- **Expected:** Compute closest point on target geometry and distance from source position
- **Actual:** Always returns position `(0,0,0)` and distance `0`
- **Impact:** Completely non-functional

### 4. `raycast` (nodes.js:3507)
- **Expected:** Cast ray against target geometry, return hit info
- **Actual:** Always returns `Is Hit = false` with zeroed outputs
- **Impact:** Completely non-functional

### 5. `curve_length` (nodes.js:3621)
- **Expected:** Compute actual length of input curve
- **Actual:** Always returns `1.0` regardless of curve
- **Impact:** Any logic depending on curve length gets wrong value

### 6. `spline_length` (nodes.js:3662)
- **Expected:** Return length and point count of spline
- **Actual:** Always returns `[1.0, 16]`
- **Impact:** Same as curve_length

### 7. `sample_index` (nodes.js:3468)
- **Expected:** Sample attribute value at specific element index from geometry
- **Actual:** Just passes through the input `Value` unchanged, ignores geometry and index
- **Impact:** Cannot sample per-element data

---

## CRITICAL: Field Nodes That Return Static Values

These are "field" nodes that should provide per-element data but return a single static value.

### 8. `index` (nodes.js:248)
- **Expected:** Return the index of the current element being processed
- **Actual:** Always returns `0`

### 9. `position` (nodes.js:186)
- **Expected:** Return the position of the current element
- **Actual:** Returns `{x:0, y:0, z:0, _field:'position'}` - the `_field` tag exists but nothing evaluates it

### 10. `normal` (nodes.js:235)
- **Expected:** Return the normal of the current element
- **Actual:** Returns `{x:0, y:1, z:0, _field:'normal'}` - same issue

### 11. `edge_angle` (nodes.js:2306)
- **Expected:** Return unsigned/signed angle between adjacent faces at edge
- **Actual:** Always returns `[0, 0]`

### 12. `edge_neighbors` (nodes.js:2321)
- **Expected:** Return face count adjacent to edge
- **Actual:** Always returns `2`

### 13. `face_area` (nodes.js:2334)
- **Expected:** Return area of current face
- **Actual:** Always returns `1.0`

### 14. `face_neighbors` (nodes.js:2347)
- **Expected:** Return vertex count and adjacent face count
- **Actual:** Always returns `[4, 4]`

### 15. `vertex_neighbors` (nodes.js:2361)
- **Expected:** Return adjacent vertex count and face count
- **Actual:** Always returns `[4, 4]`

### 16. `spline_parameter` (nodes.js:2629)
- **Expected:** Return factor (0-1), length, and index along spline
- **Actual:** Always returns `[0.5, 1.0, 0]`

### 17. `endpoint_selection` (nodes.js:3641)
- **Expected:** Return true for points at start/end of spline within given sizes
- **Actual:** Always returns `true`

### 18. `material_index` (nodes.js:2707)
- **Expected:** Return material index of current element
- **Actual:** Always returns `0`

---

## HIGH: Mesh Operations That Set Flags But Builder Ignores Them

These nodes set properties on the geometry descriptor, but `buildGeometry()` in builders.js
never reads those properties. The geometry passes through completely unchanged.

### 19. `subdivision_surface` (nodes.js:672)
- **Sets:** `g.subdivisionSurface`, `g.edgeCrease`, `g.smooth = true`
- **Builder does:** Nothing with `subdivisionSurface` or `edgeCrease` (only `smooth` takes effect for flat/smooth shading)
- **Impact:** No subdivision actually happens; only the shading mode changes

### 20. `subdivide` (nodes.js:1011)
- **Sets:** `g.subdivide`
- **Builder does:** Nothing
- **Impact:** Mesh is not subdivided at all

### 21. `dual_mesh` (nodes.js:773)
- **Sets:** `g.dualMesh`, `g.keepBoundaries`
- **Builder does:** Nothing
- **Impact:** No dual mesh computed

### 22. `convex_hull` (nodes.js:1087)
- **Sets:** `g.convexHull`
- **Builder does:** Nothing
- **Impact:** No convex hull computed

### 23. `triangulate` (nodes.js:737)
- **Sets:** `g.triangulate`
- **Builder does:** Nothing
- **Impact:** No triangulation (Three.js already uses triangles internally, but the node should handle ngon/quad methods)

### 24. `split_edges` (nodes.js:819)
- **Sets:** `g.splitEdges`
- **Builder does:** Nothing
- **Impact:** No edge splitting

### 25. `merge_by_distance` (nodes.js:840)
- **Sets:** `g.mergeByDistance`
- **Builder does:** Nothing
- **Impact:** No vertex merging

### 26. `mesh_to_curve` (nodes.js:2247)
- **Sets:** `g.meshToCurve`
- **Builder does:** Nothing
- **Impact:** Mesh is not converted to curve; passes through as-is

### 27. `points_to_vertices` (nodes.js:3546)
- **Sets:** `g.pointsToVertices`
- **Builder does:** Nothing
- **Impact:** Points not converted to mesh vertices

### 28. `realize_instances` (nodes.js:1256)
- **Sets:** `g.realized`
- **Builder does:** Nothing
- **Impact:** Instance realization is a no-op

### 29. `geometry_to_instance` (nodes.js:3416)
- **Sets:** `g.isInstance`
- **Builder does:** Nothing
- **Impact:** Conversion to instance is a no-op

---

## HIGH: Curve Operations That Set Flags But Builder Ignores Them

### 30. `resample_curve` (nodes.js:1479)
- **Sets:** `g.resample = { mode, count, length }`
- **Builder does:** Nothing
- **Impact:** Curve is not resampled

### 31. `fillet_curve` (nodes.js:2542)
- **Sets:** `g.fillet = { count, radius, mode }`
- **Builder does:** Nothing
- **Impact:** No filleting applied to curve corners

### 32. `trim_curve` (nodes.js:2574)
- **Sets:** `g.trim = { start, end, mode }`
- **Builder does:** Nothing
- **Impact:** Curve is not trimmed

### 33. `reverse_curve` (nodes.js:2606)
- **Sets:** `g.reverseCurve`
- **Builder does:** Nothing
- **Impact:** Curve direction is not reversed

### 34. `set_spline_cyclic` (nodes.js:2648)
- **Sets:** `g.cyclic`
- **Builder does:** Nothing
- **Impact:** Spline cyclic state not changed

### 35. `set_curve_radius` (nodes.js:3568)
- **Sets:** `g.curveRadius`
- **Builder does:** Nothing
- **Impact:** Curve radius not changed (affects Curve to Mesh profile)

### 36. `set_curve_tilt` (nodes.js:3594)
- **Sets:** `g.curveTilt`
- **Builder does:** Nothing
- **Impact:** Curve tilt not changed

### 37. `set_spline_resolution` (nodes.js:3676)
- **Sets:** `g.splineResolution`
- **Builder does:** Nothing
- **Impact:** Spline resolution not changed

### 38. `set_sharp_edges` (nodes.js:2378)
- **Sets:** `g.sharpEdges`
- **Builder does:** Nothing
- **Impact:** Sharp edges not applied (relevant for subdivision surface)

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

### 44. `instance_on_points` - Rotation input (nodes.js:1225)
- The `Rotation` input is captured in the descriptor (`geoData.rotation`) but the builder never applies per-instance rotation
- `Selection`, `Pick Instance`, and `Instance Index` inputs are also captured but ignored

### 45. `mesh_cube` - Vertices X/Y/Z inputs (nodes.js:312-314)
- These are passed to the descriptor but the builder uses `THREE.BoxGeometry(sizeX, sizeY, sizeZ)` which doesn't accept vertex counts as subdivision parameters (it should use `widthSegments`, `heightSegments`, `depthSegments`)

### 46. `mesh_cylinder` / `mesh_cone` - Side Segments, Fill Segments, Fill Type
- `sideSegments`, `fillSegments`, and `fillType` are in the descriptor but the builder only passes `vertices` and `depth` to `THREE.CylinderGeometry`

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

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 18 | Hardcoded/mocked outputs, non-functional field nodes |
| HIGH | 20 | Flags set by nodes but completely ignored by builder |
| MEDIUM | 10 | Oversimplified operations, ignored inputs |
| LOW | 4 | Minor issues with partial implementations |
| **Total** | **52** | Issues found across ~80 nodes |

## Nodes That Work Correctly

The following nodes are fully or adequately implemented:

- **Mesh Primitives:** `mesh_cube` (geometry only), `mesh_sphere`, `mesh_torus`, `mesh_plane`, `mesh_icosphere`, `mesh_line`, `mesh_circle`
- **Curve Primitives:** `curve_circle`, `curve_line`, `curve_spiral`, `curve_arc`, `curve_star`
- **Curve Operations:** `curve_to_mesh`, `fill_curve` (circle only)
- **Transform:** `transform` (translate, rotate, scale all work)
- **Geometry:** `join_geometry`, `set_shade_smooth`, `flip_faces`, `duplicate_elements`
- **Instances:** `instance_on_points` (positions now work after fix), `rotate_instances`, `scale_instances`, `translate_instances`
- **Points:** `mesh_to_points`, `distribute_points_on_faces` (random mode)
- **Input:** All value nodes (`value_float`, `value_int`, `value_vector`, `value_bool`, `value_color`, `random_value`, `scene_time`)
- **Math:** `math`, `vector_math`, `boolean_math`, `clamp`, `map_range`, `float_to_int`, `integer_math`, `mix_float`, `mix_vector`
- **Utility:** `compare`, `switch`, `switch_float`, `switch_vector`
- **Texture:** `noise_texture`, `voronoi_texture`, `white_noise`, `gradient_texture`, `wave_texture`, `checker_texture`, `brick_texture`, `magic_texture`, `musgrave_texture`
- **Color:** `geo_color_ramp`, `geo_combine_color`, `geo_separate_color`, `mix_color`, `invert_color`, `hue_saturation_value`
- **Material:** `set_material` (color, metallic, roughness work)
- **Output:** `output`, `viewer`
