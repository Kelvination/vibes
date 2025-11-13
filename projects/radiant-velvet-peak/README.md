# 3D Raycast Car Physics

A real 3D car simulation using Three.js with raycast-based wheel physics and suspension system.

## Controls

- **W** - Accelerate
- **S** - Brake / Reverse
- **A** - Turn Left
- **D** - Turn Right
- **Space** - Handbrake

## Features

### Raycast Physics System
- **4 independent raycasts** shooting down from each wheel position
- Real-time ground detection for each wheel
- Visual ray helpers (green when grounded, red when in air)
- Dynamic suspension compression based on raycast hit distance

### Suspension System
- Spring-damper suspension on each wheel
- Configurable suspension stiffness and damping
- Suspension travel visualization (wheels move up/down)
- Individual wheel ground contact detection

### Car Physics
- **Mass-based physics** (1200kg car)
- **Gravity** and vertical dynamics
- **Engine force** applied through rear wheels
- **Steering** with angular velocity
- **Drag** and rolling resistance
- **Torque calculation** for realistic body roll and pitch

### Visual Features
- 3D car model with body, cabin, and wheels
- Rotating wheels based on speed
- Front wheels turn with steering input
- Dynamic camera that follows the car
- Terrain with gentle height variation
- Real-time HUD showing:
  - Speed (km/h)
  - Number of wheels on ground
  - Car height above ground

## How It Works

### Raycast Wheel Detection
Each frame, the game:
1. Calculates the world position of each wheel
2. Casts a ray downward from each wheel
3. Detects intersection with the ground mesh
4. Measures the distance to ground
5. Uses this distance to calculate suspension compression

### Suspension Physics
For each wheel touching the ground:
- **Spring Force** = compression × stiffness
- **Damper Force** = compression velocity × damping
- Combined force pushes the car up and absorbs bumps

### Movement Physics
- Engine force is applied along the car's forward vector
- Steering creates angular torque around the Y axis
- All forces are integrated into velocity
- Velocity is integrated into position
- Car naturally pitches and rolls based on suspension forces

## Technical Details

- **Engine**: Three.js (WebGL)
- **Physics**: Custom implementation
- **Timestep**: Fixed 60 FPS
- **Raycasting**: Three.js raycaster for ground detection
- **Camera**: Smooth follow camera with lerp

## Future Enhancements

- Wheel friction and sliding
- Better terrain with ramps and obstacles
- Multiple cars
- Collision detection with objects
- Improved car models
- Sound effects
- Different camera modes
- Tire marks
- More realistic suspension geometry
