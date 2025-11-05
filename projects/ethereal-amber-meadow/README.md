# Bounce & Collect 🎮

A mobile-friendly 2D physics puzzle game built with React, TypeScript, and Matter.js. Guide a bouncing ball through obstacles, collect stars, and reach the goal!

## 🎯 Game Features

- **Physics-based gameplay** using Matter.js engine
- **Touch-optimized controls** for mobile devices
- **Multiple levels** with increasing difficulty
- **Star collection** system with ratings (1-3 stars)
- **Time challenges** for replay value
- **Progressive difficulty** with unlockable levels

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Check code coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

Visit `http://localhost:3000` to play the game locally.

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
ethereal-amber-meadow/
├── src/
│   ├── components/       # React components
│   │   ├── Game/         # Game canvas and logic
│   │   ├── UI/           # Menus, HUD, overlays
│   │   └── common/       # Reusable components
│   ├── engine/           # Physics and game engine
│   │   └── entities/     # Game entities (Ball, Obstacle, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React context for state management
│   ├── levels/           # Level definitions
│   ├── utils/            # Utility functions and constants
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Test files
├── public/               # Static assets
├── PROJECT_PLAN.md       # Detailed project plan
└── TASKS.md              # Parallelizable task breakdown
```

## 🎮 How to Play

1. **Objective**: Guide the ball to the goal (green target)
2. **Controls**:
   - **Tap**: Place an obstacle at the tap location
   - **Long Press**: Remove an obstacle
   - **Swipe**: Adjust gravity direction
3. **Scoring**:
   - Reach the goal: Base points
   - Collect stars: Bonus points
   - Fast completion: Time bonus
   - Perfect run (all stars): Extra bonus
4. **Star Ratings**:
   - 🌟: Complete the level
   - 🌟🌟: Collect some stars, decent time
   - 🌟🌟🌟: Collect all stars, fast time

## 🧪 Testing

This project follows **Test-Driven Development (TDD)** principles:

- Tests are written BEFORE implementation
- Focus on behavior, not implementation details
- Target: >80% code coverage on critical paths

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test -- --run

# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html
```

## 📱 Mobile Optimization

- **Responsive design**: Adapts to all screen sizes
- **Touch-first controls**: Optimized for mobile interaction
- **Performance**: Maintains 60fps on mid-range devices
- **PWA-ready**: Can be installed as a mobile app
- **No zoom/scroll**: Full-screen game experience
- **Battery-friendly**: Pauses when tab is inactive

## 🛠️ Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server
- **Matter.js**: 2D physics engine
- **Vitest**: Fast unit testing
- **React Testing Library**: Component testing
- **ESLint + Prettier**: Code quality and formatting

## 🎨 Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types allowed
- Explicit return types for all functions
- Comprehensive type definitions

### React
- Functional components only
- Custom hooks for reusable logic
- Proper dependency arrays
- Context for global state

### Testing
- Arrange-Act-Assert pattern
- Descriptive test names
- Test user behavior, not implementation
- Independent, fast tests

## 📋 Development Workflow

1. **Choose a task** from `TASKS.md`
2. **Write tests** for the feature
3. **Implement** the feature
4. **Run tests** to verify
5. **Format & lint** code
6. **Commit** with descriptive message

See `PROJECT_PLAN.md` for detailed development phases and `TASKS.md` for parallelizable tasks.

## 🐛 Debugging Strategy

If stuck on a bug for 3+ attempts:

1. **Step back** - Review the approach
2. **Simplify** - Test smallest unit
3. **Log** - Add extensive debugging
4. **Alternative** - Try different implementation
5. **Move on** - Flag and return later

## 🚢 Deployment

This project is configured for automatic deployment to Vercel via GitHub Actions:

1. Push changes to your branch
2. Create a Pull Request
3. Merge PR to deploy
4. Live URL posted in PR comments

## 📊 Performance

- **Bundle size**: Target <500KB (gzipped)
- **Load time**: <2s on 3G
- **Frame rate**: Consistent 60fps
- **Time to interactive**: <3s
- **Memory usage**: <50MB on mobile

## 🤝 Contributing

1. Check `TASKS.md` for available tasks
2. Follow TDD principles
3. Maintain code quality standards
4. Write meaningful commit messages
5. Ensure all tests pass before PR

## 📄 License

This project is part of the `vibes` monorepo for rapid prototyping and experimentation.

## 🎯 Project Status

**Current Phase**: Foundation Setup ✅

- [x] Project scaffolding
- [x] Testing setup
- [x] Code quality tools
- [x] Constants and types
- [ ] Physics engine integration
- [ ] Game loop
- [ ] Touch controls
- [ ] Game components
- [ ] Level system
- [ ] Polish and deployment

## 🔗 Links

- [Project Plan](./PROJECT_PLAN.md) - Comprehensive development plan
- [Task Breakdown](./TASKS.md) - Parallelizable task list
- [Vibes Repo](../../) - Parent monorepo

---

**Built with ❤️ using React, TypeScript, and Matter.js**
