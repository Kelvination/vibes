# 🎯 Cannon Master - Three.js Mobile Game

A mobile-optimized 3D cannon shooting game built with Three.js. Aim your cannon, charge your power, and shoot cannonballs into target holes to score points!

**Play now:** Automatically deployed to Vercel!

## 🎮 How to Play

1. **Aim**: Drag anywhere on the screen to rotate and aim the cannon
2. **Charge**: Press and hold the red "CHARGE" button to build up power
3. **Fire**: Release the button to launch the cannonball
4. **Score**: Land your cannonball in the holes to earn 100 points each!

## ✨ Features

- **Full 3D Graphics**: Built with Three.js for immersive gameplay
- **Realistic Physics**: Gravity-based projectile motion with accurate ballistics
- **Mobile-First Design**: Touch-optimized controls for smartphones and tablets
- **Intuitive Controls**: Simple drag-to-aim and hold-to-charge mechanics
- **Visual Feedback**: Power meter, score display, and hit effects
- **Dynamic Landscape**: Large terrain with trees, flags, and multiple target holes
- **Responsive Design**: Works on any screen size

## 🎯 Game Mechanics

- **Cannon Position**: Mounted on a raised ledge overlooking the landscape
- **Aiming**: 360-degree horizontal rotation + vertical angle adjustment (30-70 degrees)
- **Power System**: Hold button to charge from 0-100% power
- **Gravity**: Realistic projectile physics with downward acceleration
- **Scoring**: 100 points per hole hit, holes reset after 2 seconds
- **Multiple Targets**: 6 colored target holes at varying distances

## 🛠️ Technology Stack

- **Three.js r160**: 3D rendering and scene management
- **Vanilla JavaScript**: Game logic and physics simulation
- **HTML5 Canvas**: Hardware-accelerated rendering
- **CSS3**: UI styling and responsive layout
- **ES6 Modules**: Modern JavaScript architecture

## 🎨 Scene Elements

- **Cannon**: Metallic 3D model with rotating base and barrel
- **Ledge**: Stone platform 3 meters above ground level
- **Landscape**: 200x200 meter terrain with height variation
- **Trees**: Procedurally placed vegetation for scale
- **Target Holes**: 6 holes with colored flags and rim indicators
- **Lighting**: Directional sun with soft shadows

## 🎯 Controls

### Mobile (Touch)
- **Drag screen**: Aim the cannon
- **Hold red button**: Charge power
- **Release button**: Fire!

### Desktop (Mouse)
- **Click and drag**: Aim the cannon
- **Click and hold red button**: Charge power
- **Release**: Fire!

## 🚀 Local Development

Simply open `index.html` in a modern web browser, or run a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 📱 Mobile Optimization

- Touch event handling for smooth aiming
- Viewport meta tags prevent unwanted zooming
- Optimized render settings for mobile GPUs
- Responsive UI elements scale to screen size
- Efficient physics calculations for 60fps on mobile

## 🎮 Gameplay Tips

1. **Start Low**: Begin with lower power to gauge distance
2. **Watch the Angle**: Higher angles go further but less accurately
3. **Lead the Target**: Account for the arc of your shot
4. **Quick Reset**: Holes become active again after scoring
5. **Power Control**: Max power isn't always the best shot!

## 🏗️ Project Structure

```
hidden-crimson-tide/
├── index.html      # Main HTML structure and UI
├── style.css       # Responsive styling and layout
├── game.js         # Three.js game engine and physics
└── README.md       # This file
```

## 🎯 Future Enhancements

- Multiple levels with increasing difficulty
- Moving targets and obstacles
- Wind effects on cannonball trajectory
- Multiplayer mode with turn-based shooting
- Sound effects and background music
- Particle effects for explosions and splashes
- Leaderboard system
- Different cannonball types (heavy, light, explosive)

## 🐛 Known Issues

- None! Built with love and tested extensively.

## 📄 License

Built as part of the vibes repository - a playground for rapid prototyping and creative coding.

---

Built with Three.js 🎮 | Optimized for mobile 📱 | Have fun! 🎯
