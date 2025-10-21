# Slingshot Gravity Game

A mobile-first responsive browser game featuring physics-based slingshot mechanics.

## How to Play

1. **Pull**: Touch and drag down on the golden ball at the bottom of the screen
2. **Aim**: The elastic bands will stretch, showing your trajectory
3. **Release**: Let go to launch the ball toward the targets
4. **Score**: Hit all the colorful targets at the top to complete the level

## Features

- **Mobile-First Design**: Optimized for touch controls on smartphones and tablets
- **Physics Engine**: Realistic gravity, velocity, and collision detection
- **Progressive Difficulty**: Each level adds more targets
- **Responsive**: Adapts to any screen size
- **Visual Feedback**: Trajectory guide when pulling the slingshot

## Technology

- Pure HTML5 Canvas
- Vanilla JavaScript
- CSS3 animations
- Touch and mouse event support

## Game Mechanics

- **Gravity**: Pulls the ball downward
- **Slingshot**: Pull down to bend the elastic and build power
- **Collision Detection**: Circle-to-circle physics for target hits
- **Scoring**: 100 points per target × current level
- **Level Progression**: Unlimited levels with increasing difficulty

## Controls

- **Mobile**: Touch and drag the ball
- **Desktop**: Click and drag with mouse

## Local Testing

Open `index.html` in any modern web browser, or run a local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`
