# 3D Raycast Racer

A simple pseudo-3D racing game built with vanilla JavaScript and HTML5 Canvas, inspired by classic racing games like OutRun.

## Controls

- **W / ↑** - Accelerate
- **S / ↓** - Brake / Reverse
- **A / ←** - Turn Left
- **D / →** - Turn Right

## Features

- Pseudo-3D road rendering using raycasting techniques
- Dynamic curves and turns
- Simple physics (acceleration, deceleration, turning)
- Speedometer HUD
- Alternating road stripes and rumble strips
- Responsive car controls

## How It Works

The game uses a classic "mode 7"-style pseudo-3D rendering technique where:
1. Road segments are stored as a series of points in 3D space
2. Each segment is projected onto the 2D screen using perspective projection
3. Segments are drawn from back to front to create depth
4. The player's position is simulated by scrolling through the road segments
5. Curves are applied by offsetting segment positions horizontally

## Technical Details

- Pure vanilla JavaScript (no frameworks)
- HTML5 Canvas for rendering
- 60 FPS game loop
- Perspective projection for 3D effect
- Segment-based road system with configurable curves

## Getting Started

Simply open `index.html` in a web browser and start driving!

## Future Enhancements

- Add obstacles and other cars
- Implement collision detection
- Add more track variety
- Score/lap system
- Better car sprite
- Sound effects and music
- Mobile touch controls
