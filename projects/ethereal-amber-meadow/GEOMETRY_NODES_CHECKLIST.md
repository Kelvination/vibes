# Geometry Nodes Checklist

> Complete list of every Blender Geometry Node (as of Blender 4.4), ordered from most commonly used to most rarely used. Checked items are already implemented in this project.

---

## Session Maintenance Instructions

**Before EVERY session:**
1. Read through `geo/nodes.js` and identify all registered node keys and their labels
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
- It must be registered in `geo/nodes.js` via `registry.addNodes('geo', { ... })`
- It must have a working `evaluate()` function
- It must have correct inputs, outputs, and at minimum its core functionality

---

## Progress Summary

<!-- UPDATE THESE COUNTS AFTER EVERY SESSION -->
- **Implemented:** 84 / 248
- **Remaining:** 164
- **Last updated:** 2026-02-10

---

## Output

- [x] Group Output
- [x] Viewer (as `viewer`)

## Input -- Constant

- [x] Value (Float)
- [x] Integer
- [x] Vector
- [x] Boolean
- [x] Color (as `value_color`)
- [ ] Rotation
- [ ] String
- [ ] Material
- [ ] Image
- [ ] Special Characters

## Input -- Scene

- [x] Scene Time
- [ ] Object Info
- [ ] Collection Info
- [ ] Self Object
- [ ] Is Viewport
- [ ] Active Camera
- [ ] Camera Info
- [ ] Image Info

## Input -- Gizmo (4.3+)

- [ ] Dial Gizmo
- [ ] Linear Gizmo
- [ ] Transform Gizmo

## Geometry -- Read

- [x] Position
- [x] Normal
- [x] Index
- [ ] ID
- [ ] Named Attribute
- [ ] Radius

## Geometry -- Write

- [x] Set Position
- [ ] Set ID
- [ ] Set Geometry Name

## Geometry -- Sample

- [x] Geometry Proximity
- [ ] Raycast
- [ ] Sample Index
- [ ] Sample Nearest
- [ ] Index of Nearest

## Geometry -- Operations

- [x] Transform Geometry
- [x] Join Geometry
- [x] Delete Geometry
- [x] Separate Geometry
- [x] Bounding Box
- [x] Merge by Distance
- [x] Convex Hull
- [x] Duplicate Elements (as `duplicate_elements`)
- [ ] Sort Elements
- [ ] Geometry to Instance
- [ ] Separate Components
- [ ] Split to Instances
- [ ] Bake

## Mesh Primitives

- [x] Cube
- [x] UV Sphere
- [x] Cylinder
- [x] Cone
- [x] Grid (Plane)
- [x] Ico Sphere
- [x] Torus *(custom addition, not standard Blender node)*
- [x] Mesh Line
- [x] Mesh Circle (as `mesh_circle`)

## Mesh -- Operations

- [x] Extrude Mesh
- [x] Subdivision Surface
- [x] Subdivide Mesh
- [x] Mesh Boolean
- [x] Scale Elements
- [x] Triangulate
- [x] Dual Mesh
- [x] Flip Faces
- [x] Split Edges
- [x] Mesh to Points
- [x] Mesh to Curve (as `mesh_to_curve`)
- [ ] Mesh to Volume
- [ ] Edge Paths to Curves
- [ ] Edge Paths to Selection
- [ ] Sample Nearest Surface
- [ ] Sample UV Surface

## Mesh -- Read

- [x] Set Shade Smooth
- [x] Edge Angle (as `edge_angle`)
- [x] Edge Neighbors (as `edge_neighbors`)
- [ ] Edge Vertices
- [ ] Edges to Face Groups
- [x] Face Area (as `face_area`)
- [ ] Face Group Boundaries
- [x] Face Neighbors (as `face_neighbors`)
- [ ] Is Edge Smooth
- [ ] Is Face Planar
- [ ] Is Face Smooth
- [ ] Mesh Island
- [ ] Shortest Edge Paths
- [x] Vertex Neighbors (as `vertex_neighbors`)

## Mesh -- Write

- [x] Set Sharp Edges (as `set_sharp_edges`)
- [x] Set Sharp Faces (as `set_sharp_faces`)

## Mesh -- Topology

- [ ] Corners of Edge
- [ ] Corners of Face
- [ ] Corners of Vertex
- [ ] Edge of Corner
- [ ] Edges of Vertex
- [ ] Face of Corner
- [ ] Offset Corner in Face
- [ ] Vertex of Corner

## Mesh -- UV

- [ ] Pack UV Islands
- [ ] UV Unwrap

## Curve -- Primitives

- [x] Curve Circle
- [x] Curve Line
- [x] Spiral
- [x] Arc (as `curve_arc`)
- [ ] Bezier Segment
- [ ] Quadratic Bezier
- [ ] Quadrilateral
- [x] Star (as `curve_star`)

## Curve -- Operations

- [x] Curve to Mesh
- [x] Resample Curve
- [x] Fill Curve
- [x] Curve to Points (as `curve_to_points`)
- [x] Fillet Curve (as `fillet_curve`)
- [x] Trim Curve (as `trim_curve`)
- [x] Reverse Curve (as `reverse_curve`)
- [ ] Sample Curve
- [ ] Subdivide Curve
- [ ] Deform Curves on Surface
- [ ] Interpolate Curves

## Curve -- Read

- [ ] Curve Handle Positions
- [ ] Curve Length
- [ ] Curve Tangent
- [ ] Curve Tilt
- [ ] Endpoint Selection
- [ ] Handle Type Selection
- [ ] Is Spline Cyclic
- [ ] Spline Length
- [x] Spline Parameter (as `spline_parameter`)
- [ ] Spline Resolution

## Curve -- Write

- [ ] Set Curve Normal
- [ ] Set Curve Radius
- [ ] Set Curve Tilt
- [ ] Set Handle Positions
- [ ] Set Handle Type
- [x] Set Spline Cyclic (as `set_spline_cyclic`)
- [ ] Set Spline Resolution
- [ ] Set Spline Type

## Curve -- Topology

- [ ] Curve of Point
- [ ] Offset Point in Curve
- [ ] Points of Curve

## Instances

- [x] Instance on Points
- [x] Realize Instances
- [x] Rotate Instances
- [x] Scale Instances
- [x] Translate Instances
- [ ] Instance Rotation
- [ ] Instance Scale
- [ ] Instance Transform
- [ ] Instances to Points
- [ ] Set Instance Transform

## Point

- [x] Distribute Points on Faces
- [ ] Distribute Points in Volume
- [ ] Points
- [ ] Points to Curves
- [ ] Points to Vertices
- [ ] Points to Volume
- [ ] Set Point Radius

## Material

- [x] Set Material (as `set_material`)
- [x] Material Index (as `material_index`)
- [ ] Material Selection
- [ ] Replace Material
- [ ] Set Material Index

## Attribute

- [ ] Capture Attribute
- [ ] Attribute Statistic
- [ ] Domain Size
- [ ] Store Named Attribute
- [ ] Remove Named Attribute
- [ ] Blur Attribute

## Utilities -- Math

- [x] Math (27 operations: Add, Subtract, Multiply, Divide, Power, Sqrt, Log, Modulo, Min, Max, Abs, Floor, Ceil, Round, Sin, Cos, Tan, Asin, Acos, Atan, Atan2, Sign, Fraction, Snap, Ping Pong, Wrap, Smooth Min, Smooth Max)
- [x] Vector Math (20 operations: Add, Subtract, Multiply, Divide, Cross, Dot, Distance, Normalize, Length, Scale, Reflect, Project, Faceforward, Snap, Floor, Ceil, Abs, Min, Max, Sine, Cosine, Tangent)
- [x] Boolean Math (7 operations: AND, OR, NOT, NAND, NOR, XOR, XNOR)
- [x] Clamp
- [x] Map Range
- [x] Compare
- [x] Random Value
- [ ] Mix (Float/Vector/Color)
- [ ] Float Curve
- [ ] Float to Integer
- [ ] Integer Math (4.3+)

## Utilities -- Rotation

- [ ] Align Euler to Vector
- [ ] Align Rotation to Vector
- [ ] Axes to Rotation
- [ ] Axis Angle to Rotation
- [ ] Euler to Rotation
- [ ] Invert Rotation
- [ ] Rotate Rotation
- [ ] Rotate Vector
- [ ] Rotation to Axis Angle
- [ ] Rotation to Euler
- [ ] Rotation to Quaternion
- [ ] Quaternion to Rotation

## Utilities -- Matrix (4.2+)

- [ ] Combine Transform
- [ ] Invert Matrix
- [ ] Matrix Determinant (4.3+)
- [ ] Multiply Matrices
- [ ] Project Point
- [ ] Separate Transform
- [ ] Transform Direction
- [ ] Transform Point
- [ ] Transpose Matrix

## Utilities -- Vector

- [x] Separate XYZ
- [x] Combine XYZ
- [ ] Vector Curves
- [ ] Vector Rotate

## Utilities -- Field

- [ ] Accumulate Field
- [ ] Evaluate at Index
- [ ] Evaluate on Domain
- [ ] Interpolate Domain

## Utilities -- General

- [x] Switch (Geometry)
- [x] Switch -- Float variant *(custom)*
- [x] Switch -- Vector variant *(custom)*
- [ ] Index Switch
- [ ] Menu Switch
- [ ] Hash Value (4.3+)

## Color

- [x] Color Ramp (as `geo_color_ramp`)
- [x] Combine Color (as `geo_combine_color`)
- [ ] Mix Color
- [x] Separate Color (as `geo_separate_color`)

## Texture

- [x] Noise Texture
- [x] Voronoi Texture
- [x] White Noise Texture
- [ ] Brick Texture
- [ ] Checker Texture
- [ ] Gradient Texture
- [ ] Image Texture
- [ ] Magic Texture
- [ ] Wave Texture

## Text

- [ ] String to Curves
- [ ] Join Strings
- [ ] Replace String
- [ ] Slice String
- [ ] String Length
- [ ] Value to String
- [ ] Find in String (4.4+)

## Volume

- [ ] Mesh to Volume
- [ ] Volume Cube
- [ ] Volume to Mesh

## Grease Pencil (4.3+)

- [ ] Curves to Grease Pencil
- [ ] Grease Pencil to Curves
- [ ] Merge Layers
- [ ] Set Grease Pencil Layer

## Simulation / Zones

- [ ] Simulation Zone
- [ ] Repeat Zone
- [ ] For Each Element Zone (4.3+)

## Tool Context (Operator Nodes)

- [ ] 3D Cursor
- [ ] Active Element
- [ ] Face Set
- [ ] Mouse Position
- [ ] Selection
- [ ] Set Face Set
- [ ] Set Selection
- [ ] Viewport Transform
- [ ] Warning (4.3+)

## Group

- [ ] Group Input
- [ ] Node Group (custom/linked)

---

## Session Log

<!-- Add entries here after each session, newest first -->

### 2026-02-10 -- Batch Implementation (25 nodes)
- Implemented 25 new geometry nodes, bringing total from 59 to 84
- **Input (1):** Color
- **Output (1):** Viewer
- **Mesh Primitives (1):** Mesh Circle
- **Mesh Operations (1):** Mesh to Curve
- **Geometry Operations (1):** Duplicate Elements
- **Mesh Read (5):** Edge Angle, Edge Neighbors, Face Area, Face Neighbors, Vertex Neighbors
- **Mesh Write (2):** Set Sharp Edges, Set Sharp Faces
- **Curve Primitives (2):** Arc, Star
- **Curve Operations (4):** Curve to Points, Fillet Curve, Trim Curve, Reverse Curve
- **Curve Read (1):** Spline Parameter
- **Curve Write (1):** Set Spline Cyclic
- **Material (2):** Set Material, Material Index
- **Color (3):** Color Ramp, Combine Color, Separate Color
- Added new MATERIAL and COLOR categories for geo nodes
- Added builders for mesh_circle, curve_arc, and curve_star in geo/builders.js
- Set Material node applies color/metallic/roughness to Three.js material

### 2026-02-10 -- Initial Audit
- Created this checklist from full Blender 4.4 node catalog
- Audited `geo/nodes.js` against all known geometry nodes
- 59 nodes implemented, 189 remaining
- Note: Torus is a custom addition not in standard Blender Geometry Nodes
- Note: Switch has custom Float and Vector variants beyond standard Blender Switch
