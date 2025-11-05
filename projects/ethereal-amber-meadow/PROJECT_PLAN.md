# 2D Physics Game - Project Plan

## Game Concept: "Bounce & Collect"

A mobile-friendly 2D physics puzzle game where players manipulate gravity and obstacles to guide a ball to collect stars and reach the goal. Think of it as a mix between physics puzzles and skill-based navigation.

### Core Mechanics
- **Physics-based ball movement** using Matter.js physics engine
- **Touch controls** for mobile (tap to place/remove obstacles, swipe to adjust gravity)
- **Level-based progression** with increasing difficulty
- **Star collection** for bonus points
- **Time challenges** for replayability

---

## Technical Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Physics Engine**: Matter.js
- **Testing**: Vitest + React Testing Library + @testing-library/user-event
- **State Management**: React Context + useReducer (no external state library needed)
- **Styling**: CSS Modules + Mobile-first responsive design
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Deployment**: Vercel (via GitHub Actions)

### Project Structure
```
ethereal-amber-meadow/
├── public/
│   └── assets/           # Game assets (sprites, sounds if needed)
├── src/
│   ├── components/
│   │   ├── Game/         # Main game component
│   │   ├── UI/           # UI components (HUD, menus)
│   │   └── common/       # Reusable components
│   ├── engine/
│   │   ├── Physics.ts    # Matter.js wrapper
│   │   ├── Game.ts       # Game loop and state
│   │   └── entities/     # Game entities (Ball, Obstacle, etc.)
│   ├── hooks/
│   │   ├── useGameLoop.ts
│   │   ├── useTouch.ts   # Touch/pointer handlers
│   │   └── usePhysics.ts
│   ├── levels/
│   │   ├── levelData.ts  # Level configurations
│   │   └── types.ts
│   ├── utils/
│   │   ├── collision.ts
│   │   ├── scoring.ts
│   │   └── constants.ts
│   ├── __tests__/        # Test files mirror src structure
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── PROJECT_PLAN.md       # This file
├── TASKS.md              # Parallelizable tasks
└── README.md
```

---

## Development Phases

### Phase 1: Foundation Setup ⚙️
**Goal**: Set up the project infrastructure with proper tooling and testing

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Vitest and React Testing Library
- [ ] Set up ESLint and Prettier with strict rules
- [ ] Create basic folder structure
- [ ] Set up CI/CD compatibility (GitHub Actions ready)
- [ ] Write initial tests for setup validation

### Phase 2: Physics Engine Integration 🎯
**Goal**: Integrate Matter.js and create physics abstractions

- [ ] Install and configure Matter.js
- [ ] Create Physics engine wrapper with TypeScript
- [ ] Write tests for physics initialization
- [ ] Create basic game entities (Ball, Ground, Wall)
- [ ] Test collision detection and responses
- [ ] Create render loop integration with React

### Phase 3: Core Game Loop 🎮
**Goal**: Implement the main game loop and state management

- [ ] Design game state structure
- [ ] Implement game loop with requestAnimationFrame
- [ ] Create game context and reducer
- [ ] Write tests for game state transitions
- [ ] Implement pause/resume functionality
- [ ] Add win/lose conditions

### Phase 4: Mobile Touch Controls 📱
**Goal**: Create intuitive mobile-first controls

- [ ] Implement touch event handlers
- [ ] Create gesture recognition (tap, swipe, hold)
- [ ] Add visual feedback for touches
- [ ] Test touch interactions on mobile viewport
- [ ] Implement obstacle placement via touch
- [ ] Add gravity manipulation controls

### Phase 5: Game Components 🧩
**Goal**: Build reusable game components

- [ ] Create Game Canvas component
- [ ] Build HUD component (score, time, stars)
- [ ] Create Level component
- [ ] Build Menu components (start, pause, win, lose)
- [ ] Test all components in isolation
- [ ] Integrate components with game state

### Phase 6: Level System 🗺️
**Goal**: Implement level loading and progression

- [ ] Design level data structure
- [ ] Create 3-5 initial levels with increasing difficulty
- [ ] Implement level loader
- [ ] Add level progression logic
- [ ] Test level transitions
- [ ] Create level selection UI

### Phase 7: Polish & Mobile Optimization ✨
**Goal**: Optimize for mobile and add polish

- [ ] Optimize render performance (RAF throttling if needed)
- [ ] Add responsive design for various screen sizes
- [ ] Test on mobile devices/simulators
- [ ] Add sound effects (optional, toggle-able)
- [ ] Add visual effects (particles, animations)
- [ ] Implement local storage for progress

### Phase 8: Testing & Documentation 📋
**Goal**: Ensure quality and maintainability

- [ ] Achieve >80% code coverage on critical paths
- [ ] Write integration tests for full game flow
- [ ] Performance testing (60fps target)
- [ ] Create comprehensive README
- [ ] Document all components and functions
- [ ] User acceptance testing

---

## Test-Driven Development Strategy

### Testing Principles
1. **Write tests BEFORE implementation** for core logic
2. **Test behavior, not implementation details**
3. **Focus on user interactions and outcomes**
4. **Use meaningful test descriptions** (it should...)
5. **Keep tests fast and independent**

### What to Test (Priority Order)
1. **Physics engine integration** - collision detection, forces, constraints
2. **Game state management** - state transitions, win/lose conditions
3. **Touch input handlers** - gesture recognition, coordinate mapping
4. **Level loading** - data parsing, entity creation
5. **Scoring system** - point calculation, star collection
6. **Component rendering** - UI components render correctly
7. **Game loop** - timing, updates, render cycle

### Testing Tools
- **Unit Tests**: Vitest for utilities, hooks, and pure functions
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Test full game flows (start → play → win)
- **Visual Tests**: Manual testing on multiple devices

---

## Mobile Optimization Checklist

- [ ] Viewport meta tag configured
- [ ] Touch events properly handled (no 300ms delay)
- [ ] Prevent scrolling/zooming during gameplay
- [ ] Responsive canvas sizing
- [ ] Touch targets ≥44x44px
- [ ] Landscape and portrait support
- [ ] Performance: maintain 60fps on mid-range devices
- [ ] Battery-friendly (pause when tab inactive)
- [ ] Touch feedback (visual/haptic if available)

---

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Interface over type alias for objects
- Proper generics usage

### React
- Functional components only
- Custom hooks for reusable logic
- Proper dependency arrays in useEffect
- Memoization where appropriate (useMemo, useCallback)
- Avoid prop drilling (use Context for global state)

### Testing
- Arrange-Act-Assert pattern
- Descriptive test names
- Test user behavior, not implementation
- Mock external dependencies
- Clean up after tests

### Git
- Meaningful commit messages
- Small, focused commits
- Feature branches for major changes
- No commits directly to main

---

## Performance Targets

- **Initial Load**: <2 seconds on 3G
- **Frame Rate**: Consistent 60fps
- **Bundle Size**: <500KB (gzipped)
- **Time to Interactive**: <3 seconds
- **Memory**: <50MB on mobile devices

---

## Debugging Strategy

**If stuck on a bug for 3+ attempts:**
1. **Step back** - Review the approach
2. **Simplify** - Remove complexity, test smallest unit
3. **Log extensively** - Add debug logging
4. **Rubber duck** - Explain the problem out loud
5. **Try alternative** - Consider different implementation
6. **Move on** - Flag for later if not critical

---

## Success Criteria

✅ Game is playable on mobile devices (iOS Safari, Chrome Android)
✅ Physics feel realistic and responsive
✅ Touch controls are intuitive
✅ At least 3 playable levels
✅ Test coverage >80% on core functionality
✅ No TypeScript errors or warnings
✅ Passes ESLint with zero warnings
✅ Maintains 60fps during gameplay
✅ Successfully deploys to Vercel
✅ Code is well-documented and maintainable

---

## Timeline Estimate

- **Phase 1-2**: 20% of effort (Foundation + Physics)
- **Phase 3-4**: 25% of effort (Game Loop + Controls)
- **Phase 5-6**: 30% of effort (Components + Levels)
- **Phase 7-8**: 25% of effort (Polish + Testing)

**Note**: This is a living document. Update as project evolves.
