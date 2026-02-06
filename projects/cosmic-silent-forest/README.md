# Terrain Studio

A powerful 3D terrain visualization tool that combines real-world elevation data with procedural generation.

## Features

### Data Sources
- **Real-World Elevation** - Fetches actual terrain data via Open-Meteo and OpenTopoData APIs
- **Procedural Generation** - Instant Perlin noise terrain with 5 terrain types (mountains, islands, ridges, plateaus, canyons)
- **Place Search** - Search for any location by name using OpenStreetMap geocoding

### Visualization
- 10 color schemes (Natural, Satellite, Ocean, Thermal, Topographic, Arctic, Volcanic, Neon, Sunset, Grayscale)
- Animated water plane with configurable sea level
- Gradient sky dome atmosphere
- Adjustable sun position and height
- Fog/atmosphere toggle
- Wireframe and flat shading modes
- Shadow mapping

### Analysis Tools
- **Slope Visualization** - Color-coded slope angles
- **Aspect Map** - Terrain facing direction as hue
- **Contour Lines** - Adjustable elevation interval
- **Cross-Section Profile** - Click two points to see elevation profile chart
- **Live HUD** - Hover to see coordinates, elevation, and slope at cursor

### Export
- PNG screenshot
- Heightmap image (grayscale)
- STL file for 3D printing
- Raw JSON data

### Camera
- Orbit controls (rotate, pan, zoom)
- Preset views (top, side, 3/4 angle)
- Animated fly-through with adjustable speed
- Smooth camera transitions

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| G | Generate terrain |
| R | Randomize procedural |
| P | Screenshot |
| F | Fullscreen |
| W | Toggle wireframe |
| C | Cycle color schemes |
| 1/2/3 | Camera views |
| Space | Fly through |
| +/- | Vertical scale |
| Tab | Toggle sidebar |
| ? | Help |

## Technology
- Three.js (WebGL)
- Vanilla JavaScript (ES modules)
- Custom GLSL shaders (water, sky)
- Perlin noise implementation
- Binary STL export

## 12 Location Presets
Swiss Alps, Grand Canyon, Mt. Everest, Mt. Fuji, Yosemite, Kilimanjaro, Iceland Highlands, Machu Picchu, French Alps, Death Valley, NZ Southern Alps, Big Island Hawaii
