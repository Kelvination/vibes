# Parallelizable Tasks - 2D Physics Game

This document breaks down the project into tasks that can be worked on simultaneously by multiple developers. Tasks are organized by dependency groups.

---

## 🟢 Wave 1: Independent Foundation Tasks
*These can ALL be done in parallel - no dependencies on each other*

### Task 1.1: Project Scaffolding 🏗️
**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started

**Objective**: Set up the basic Vite + React + TypeScript project structure

**Acceptance Criteria**:
- [ ] Vite project initialized with React + TypeScript template
- [ ] Project runs with `npm run dev`
- [ ] TypeScript configured with strict mode
- [ ] Basic folder structure created (`src/components`, `src/engine`, `src/hooks`, etc.)
- [ ] `index.html` properly configured with viewport meta tags
- [ ] Initial App.tsx renders "Hello World"

**Commands**:
```bash
cd projects/ethereal-amber-meadow
npm create vite@latest . -- --template react-ts
```

**Files to Create**:
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/App.tsx`
- `src/main.tsx`
- `index.html`

---

### Task 1.2: Testing Setup 🧪
**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.1 (package.json must exist)

**Objective**: Configure Vitest and React Testing Library

**Acceptance Criteria**:
- [ ] Vitest installed and configured
- [ ] React Testing Library installed
- [ ] `vitest.config.ts` created
- [ ] Test command works: `npm test`
- [ ] Example test file passes
- [ ] Coverage reporting configured

**Dependencies to Install**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Files to Create**:
- `vitest.config.ts`
- `src/setupTests.ts`
- `src/__tests__/example.test.tsx` (sample test)

---

### Task 1.3: Code Quality Tools 📏
**Owner**: TBD
**Estimated Effort**: 1 hour
**Status**: ⏳ Not Started
**Depends On**: Task 1.1 (package.json must exist)

**Objective**: Set up ESLint and Prettier for code quality

**Acceptance Criteria**:
- [ ] ESLint configured with React + TypeScript rules
- [ ] Prettier configured
- [ ] Scripts added to package.json: `lint`, `format`
- [ ] No linting errors on initial code
- [ ] Editor integration instructions in README

**Dependencies to Install**:
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier
```

**Files to Create**:
- `.eslintrc.json`
- `.prettierrc`
- `.prettierignore`

---

### Task 1.4: Constants & Types 📐
**Owner**: TBD
**Estimated Effort**: 1 hour
**Status**: ⏳ Not Started

**Objective**: Define core constants and TypeScript types

**Acceptance Criteria**:
- [ ] `src/utils/constants.ts` created with game constants
- [ ] `src/types/index.ts` created with core types
- [ ] All exports properly typed
- [ ] Unit tests for any utility functions

**Constants to Define**:
- Canvas dimensions
- Physics constants (gravity, friction, restitution)
- Game timing (FPS, tick rate)
- Color palette
- Touch/click thresholds

**Types to Define**:
- `GameState`, `GameStatus`, `Level`, `Entity`, `Vector2D`

**Files to Create**:
- `src/utils/constants.ts`
- `src/types/index.ts`
- `src/__tests__/constants.test.ts`

---

## 🟡 Wave 2: Core Systems
*These require Wave 1 to be complete but can be done in parallel to each other*

### Task 2.1: Physics Engine Wrapper 🎯
**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.1, Task 1.4

**Objective**: Create a TypeScript wrapper around Matter.js

**Acceptance Criteria**:
- [ ] Matter.js installed
- [ ] `src/engine/Physics.ts` created
- [ ] Physics engine initializes correctly
- [ ] Can create bodies (static, dynamic)
- [ ] Can detect collisions
- [ ] Can apply forces
- [ ] Comprehensive unit tests (>90% coverage)
- [ ] Memory cleanup on destroy

**Dependencies to Install**:
```bash
npm install matter-js
npm install -D @types/matter-js
```

**Files to Create**:
- `src/engine/Physics.ts`
- `src/engine/types.ts`
- `src/__tests__/engine/Physics.test.ts`

**Key Methods**:
- `init()`, `destroy()`, `update(delta: number)`
- `createBody()`, `removeBody()`, `applyForce()`
- `setGravity()`, `onCollision(callback)`

---

### Task 2.2: Game State Management 🎮
**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4

**Objective**: Implement game state using React Context + useReducer

**Acceptance Criteria**:
- [ ] `src/context/GameContext.tsx` created
- [ ] Game reducer handles all state transitions
- [ ] Actions defined for: START, PAUSE, RESUME, WIN, LOSE, RESET
- [ ] Score, time, and level tracked
- [ ] Unit tests for reducer (>95% coverage)
- [ ] React hooks for accessing state

**Files to Create**:
- `src/context/GameContext.tsx`
- `src/context/gameReducer.ts`
- `src/context/actions.ts`
- `src/__tests__/context/gameReducer.test.ts`

**State Shape**:
```typescript
{
  status: 'menu' | 'playing' | 'paused' | 'won' | 'lost',
  score: number,
  time: number,
  level: number,
  starsCollected: number,
  lives: number
}
```

---

### Task 2.3: Touch Input Handler 📱
**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4

**Objective**: Create touch/pointer event handling system

**Acceptance Criteria**:
- [ ] `src/hooks/useTouch.ts` custom hook created
- [ ] Handles touch, mouse, and pointer events
- [ ] Detects gestures: tap, long-press, swipe
- [ ] Prevents default touch behaviors (scroll, zoom)
- [ ] Normalizes coordinates to canvas space
- [ ] Unit tests for gesture detection

**Files to Create**:
- `src/hooks/useTouch.ts`
- `src/utils/gestures.ts`
- `src/__tests__/hooks/useTouch.test.ts`

**Gestures to Support**:
- Single tap (place obstacle)
- Long press (remove obstacle)
- Swipe (adjust gravity direction)
- Multi-touch prevention

---

### Task 2.4: Game Loop Hook ⏱️
**Owner**: TBD
**Estimated Effort**: 2-3 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4

**Objective**: Create a game loop using requestAnimationFrame

**Acceptance Criteria**:
- [ ] `src/hooks/useGameLoop.ts` custom hook created
- [ ] Runs at target FPS (60fps)
- [ ] Pauses when tab inactive
- [ ] Handles delta time correctly
- [ ] Can pause/resume
- [ ] Cleanup on unmount
- [ ] Tests for timing accuracy

**Files to Create**:
- `src/hooks/useGameLoop.ts`
- `src/__tests__/hooks/useGameLoop.test.ts`

**Hook API**:
```typescript
const { start, stop, pause, resume } = useGameLoop({
  onUpdate: (deltaTime) => { /* update game */ },
  targetFPS: 60
});
```

---

## 🔵 Wave 3: Game Entities
*Requires Wave 2 (especially Physics wrapper) to be complete*

### Task 3.1: Ball Entity 🏀
**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1

**Objective**: Create the player-controlled ball entity

**Acceptance Criteria**:
- [ ] `src/engine/entities/Ball.ts` created
- [ ] Ball physics body created with Matter.js
- [ ] Render method for canvas drawing
- [ ] Position, velocity getters
- [ ] Apply force method
- [ ] Unit tests for ball behavior

**Files to Create**:
- `src/engine/entities/Ball.ts`
- `src/engine/entities/Entity.ts` (base class)
- `src/__tests__/engine/entities/Ball.test.ts`

---

### Task 3.2: Static Obstacles 🧱
**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1

**Objective**: Create static obstacles (walls, platforms)

**Acceptance Criteria**:
- [ ] `src/engine/entities/Obstacle.ts` created
- [ ] Support for rectangles and circles
- [ ] Static physics bodies
- [ ] Render method
- [ ] Unit tests

**Files to Create**:
- `src/engine/entities/Obstacle.ts`
- `src/__tests__/engine/entities/Obstacle.test.ts`

---

### Task 3.3: Collectibles (Stars) ⭐
**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1

**Objective**: Create collectible star entities

**Acceptance Criteria**:
- [ ] `src/engine/entities/Star.ts` created
- [ ] Sensor physics body (no collision, only detection)
- [ ] Render method with animation
- [ ] Collected state
- [ ] Unit tests

**Files to Create**:
- `src/engine/entities/Star.ts`
- `src/__tests__/engine/entities/Star.test.ts`

---

### Task 3.4: Goal/Target 🎯
**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1

**Objective**: Create the level goal/target entity

**Acceptance Criteria**:
- [ ] `src/engine/entities/Goal.ts` created
- [ ] Sensor physics body
- [ ] Visual indicator (animation, glow)
- [ ] Reached detection
- [ ] Unit tests

**Files to Create**:
- `src/engine/entities/Goal.ts`
- `src/__tests__/engine/entities/Goal.test.ts`

---

## 🟣 Wave 4: UI Components
*Can be done in parallel with Wave 3*

### Task 4.1: Game Canvas Component 🖼️
**Owner**: TBD
**Estimated Effort**: 3 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.1, Task 2.1

**Objective**: Create the main canvas rendering component

**Acceptance Criteria**:
- [ ] `src/components/Game/Canvas.tsx` created
- [ ] Responsive canvas sizing
- [ ] Integrates with Physics engine
- [ ] Renders all entities
- [ ] Handle resize events
- [ ] Component tests

**Files to Create**:
- `src/components/Game/Canvas.tsx`
- `src/__tests__/components/Game/Canvas.test.tsx`

---

### Task 4.2: HUD Component 📊
**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.2

**Objective**: Create heads-up display for score, time, stars

**Acceptance Criteria**:
- [ ] `src/components/UI/HUD.tsx` created
- [ ] Shows score, time, stars collected
- [ ] Pause button
- [ ] Responsive layout
- [ ] Component tests

**Files to Create**:
- `src/components/UI/HUD.tsx`
- `src/__tests__/components/UI/HUD.test.tsx`

---

### Task 4.3: Menu Components 🎨
**Owner**: TBD
**Estimated Effort**: 3 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.2

**Objective**: Create menu screens (start, pause, win, lose)

**Acceptance Criteria**:
- [ ] `src/components/UI/MainMenu.tsx` created
- [ ] `src/components/UI/PauseMenu.tsx` created
- [ ] `src/components/UI/WinScreen.tsx` created
- [ ] `src/components/UI/LoseScreen.tsx` created
- [ ] Mobile-friendly buttons (≥44px)
- [ ] Component tests for all menus

**Files to Create**:
- `src/components/UI/MainMenu.tsx`
- `src/components/UI/PauseMenu.tsx`
- `src/components/UI/WinScreen.tsx`
- `src/components/UI/LoseScreen.tsx`
- `src/__tests__/components/UI/Menu.test.tsx`

---

### Task 4.4: Level Selector 🗺️
**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.2

**Objective**: Create level selection screen

**Acceptance Criteria**:
- [ ] `src/components/UI/LevelSelector.tsx` created
- [ ] Grid of level cards
- [ ] Shows locked/unlocked status
- [ ] Shows star rating per level
- [ ] Mobile-friendly touch targets
- [ ] Component tests

**Files to Create**:
- `src/components/UI/LevelSelector.tsx`
- `src/__tests__/components/UI/LevelSelector.test.tsx`

---

## 🔴 Wave 5: Level System & Integration
*Requires most previous tasks to be complete*

### Task 5.1: Level Data Structure 📋
**Owner**: TBD
**Estimated Effort**: 2-3 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4, Task 2.1

**Objective**: Create level data format and loader

**Acceptance Criteria**:
- [ ] `src/levels/types.ts` defines level schema
- [ ] `src/levels/levelData.ts` contains 3-5 levels
- [ ] Level loader function with validation
- [ ] Unit tests for level loading
- [ ] Error handling for invalid levels

**Files to Create**:
- `src/levels/types.ts`
- `src/levels/levelData.ts`
- `src/levels/loader.ts`
- `src/__tests__/levels/loader.test.ts`

**Level Schema**:
```typescript
{
  id: number,
  name: string,
  ballStart: { x, y },
  goal: { x, y, radius },
  obstacles: Array<{ type, position, size }>,
  stars: Array<{ x, y }>,
  gravity: { x, y },
  timeLimit: number
}
```

---

### Task 5.2: Scoring System 🏆
**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.2

**Objective**: Implement scoring and star rating system

**Acceptance Criteria**:
- [ ] `src/utils/scoring.ts` created
- [ ] Base points for completing level
- [ ] Bonus points for stars collected
- [ ] Time bonus calculation
- [ ] Star rating (1-3 stars) based on score
- [ ] Unit tests (100% coverage)

**Files to Create**:
- `src/utils/scoring.ts`
- `src/__tests__/utils/scoring.test.ts`

---

### Task 5.3: Collision Handlers 💥
**Owner**: TBD
**Estimated Effort**: 2-3 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1, Wave 3 (all entities)

**Objective**: Implement collision detection and response

**Acceptance Criteria**:
- [ ] `src/utils/collision.ts` created
- [ ] Ball-Star collision (collect star)
- [ ] Ball-Goal collision (level complete)
- [ ] Ball-Obstacle collision (bounce)
- [ ] Ball-Boundary collision (lose condition)
- [ ] Unit tests for all collision types

**Files to Create**:
- `src/utils/collision.ts`
- `src/__tests__/utils/collision.test.ts`

---

### Task 5.4: Progress Persistence 💾
**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.2

**Objective**: Save/load game progress to localStorage

**Acceptance Criteria**:
- [ ] `src/utils/storage.ts` created
- [ ] Save current level
- [ ] Save level completion status
- [ ] Save star ratings per level
- [ ] Load progress on app start
- [ ] Handle corrupted data gracefully
- [ ] Unit tests

**Files to Create**:
- `src/utils/storage.ts`
- `src/__tests__/utils/storage.test.ts`

---

## ⚫ Wave 6: Final Integration
*This is the SINGLE final task that brings everything together*

### Task 6.1: Main Game Component Integration 🎯
**Owner**: TBD
**Estimated Effort**: 4-6 hours
**Status**: ⏳ Not Started
**Depends On**: ALL previous tasks

**Objective**: Integrate all systems into the main Game component

**Acceptance Criteria**:
- [ ] `src/components/Game/Game.tsx` created
- [ ] All systems working together
- [ ] Complete game flow: menu → level → win/lose → next level
- [ ] Touch controls fully functional
- [ ] Level progression works
- [ ] Scoring and stars work
- [ ] Pause/resume works
- [ ] Integration tests for full game flow
- [ ] Performance testing (60fps maintained)
- [ ] Mobile testing on real devices

**Files to Create**:
- `src/components/Game/Game.tsx`
- `src/App.tsx` (update to use Game component)
- `src/__tests__/integration/GameFlow.test.tsx`

**Integration Tests**:
1. Start game → play level → collect stars → reach goal → see win screen
2. Start game → fall off map → see lose screen → restart
3. Pause game → resume → continue playing
4. Complete level → progress to next level
5. Collect all stars → get 3-star rating

---

## 📦 Wave 7: Polish & Deployment
*Final touches before production*

### Task 7.1: Styling & Responsive Design 🎨
**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started

**Objective**: Polish UI and ensure mobile responsiveness

**Acceptance Criteria**:
- [ ] CSS Modules for all components
- [ ] Mobile-first responsive design
- [ ] Tested on multiple screen sizes
- [ ] Landscape and portrait support
- [ ] Touch targets ≥44px
- [ ] Color scheme consistent

**Files to Create/Update**:
- `src/components/**/*.module.css`

---

### Task 7.2: Performance Optimization ⚡
**Owner**: TBD
**Estimated Effort**: 2-3 hours
**Status**: ⏳ Not Started

**Objective**: Optimize for mobile performance

**Acceptance Criteria**:
- [ ] Bundle size <500KB
- [ ] Lazy loading for components
- [ ] Memoization where appropriate
- [ ] 60fps during gameplay
- [ ] No memory leaks
- [ ] Lighthouse score >90

---

### Task 7.3: README & Documentation 📚
**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started

**Objective**: Create comprehensive documentation

**Acceptance Criteria**:
- [ ] README.md with game description
- [ ] Setup instructions
- [ ] How to play
- [ ] Development guide
- [ ] Testing instructions
- [ ] Deployment notes

**Files to Create**:
- `README.md` (update)

---

## Task Assignment Guide

### How to Claim a Task
1. Find a task in the current wave that interests you
2. Update the **Owner** field with your name
3. Change **Status** to `🚧 In Progress`
4. Create a feature branch: `git checkout -b feature/task-X.X-description`
5. Work on the task following TDD principles
6. When done, update status to `✅ Complete` and create a PR

### Task Status Indicators
- ⏳ Not Started
- 🚧 In Progress
- 🔍 In Review
- ✅ Complete
- ❌ Blocked (note blocker in task description)

### Communication
- If blocked, update the task with blocker details
- If task takes longer than estimated, update the estimate
- If you discover new tasks, add them to the appropriate wave

---

## Dependency Graph

```
Wave 1 (All parallel)
├─ Task 1.1 ──┬──> Wave 2 (All parallel)
│             │    ├─ Task 2.1 ──> Wave 3 (All parallel)
│             │    │                └─> Task 6.1
│             │    ├─ Task 2.2 ──> Wave 4 (All parallel)
│             │    │                └─> Task 6.1
│             │    ├─ Task 2.3 ──> Task 6.1
│             │    └─ Task 2.4 ──> Task 6.1
├─ Task 1.2 ──┤
├─ Task 1.3 ──┤
└─ Task 1.4 ──┴──> Wave 2, Wave 3, Wave 4, Wave 5
                   └─> Task 6.1 ──> Wave 7
```

---

**Last Updated**: [DATE]
**Total Tasks**: 24
**Completed**: 0
**In Progress**: 0
**Blocked**: 0
