# Parallelizable Tasks - 2D Physics Game

This document breaks down the project into tasks that can be worked on simultaneously by multiple developers. **Each task is fully self-contained** with complete context, so it can be implemented without knowledge of other tasks.

---

## 📖 Project Overview (Context for All Tasks)

**Game Name**: Bounce & Collect
**Type**: 2D physics puzzle game
**Platform**: Mobile-first web application
**Tech Stack**: React 18, TypeScript, Vite, Matter.js (physics), Vitest (testing)

**Game Mechanics**:
- Player controls a bouncing ball in a 2D physics environment
- Goal: Navigate the ball from start position to goal (green target)
- Collect stars (yellow collectibles) for bonus points
- Use touch gestures to manipulate obstacles and gravity
- Level-based progression with 1-3 star ratings

**Development Approach**: Test-Driven Development (TDD) - write tests first, then implement

---

## 🟢 Wave 1: Independent Foundation Tasks
*These tasks are ALREADY COMPLETE ✅ - included here for reference*

### Task 1.1: Project Scaffolding 🏗️ ✅ COMPLETE
### Task 1.2: Testing Setup 🧪 ✅ COMPLETE
### Task 1.3: Code Quality Tools 📏 ✅ COMPLETE
### Task 1.4: Constants & Types 📐 ✅ COMPLETE

**Status**: All Wave 1 tasks are complete. The following exist and can be imported:
- `src/types/index.ts` - All TypeScript types (GameState, Vector2D, Level, etc.)
- `src/utils/constants.ts` - All game constants (PHYSICS, BALL, CANVAS, etc.)
- Testing infrastructure is set up and working

---

## 🟡 Wave 2: Core Systems
*These require Wave 1 to be complete but can be done in parallel to each other*

---

### Task 2.1: Physics Engine Wrapper 🎯

**CONTEXT**: This is a 2D physics game using Matter.js for realistic ball movement, collisions, and gravity. Matter.js is a JavaScript physics engine that simulates bodies, forces, and collisions. We need a TypeScript wrapper around Matter.js that provides a clean API for our game.

**WHY THIS EXISTS**: The game needs realistic physics for the bouncing ball, obstacles, and collision detection. Matter.js provides this, but we need a clean interface that integrates with our React application and TypeScript types.

**WHAT YOU'RE BUILDING**: A TypeScript class that wraps Matter.js Engine and provides methods to:
- Initialize and manage the physics world
- Create physics bodies (ball, obstacles, boundaries)
- Detect collisions between entities
- Update physics simulation each frame
- Clean up resources on destroy

**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.1, Task 1.4 (both complete ✅)

#### Prerequisites (Already Exist)
- `src/types/index.ts` has: `Vector2D`, `PhysicsConfig`, `CollisionEvent`, `Entity`
- `src/utils/constants.ts` has: `PHYSICS` constants (gravity, friction, FPS, etc.)

#### Install Dependencies
```bash
npm install matter-js
npm install -D @types/matter-js
```

#### Files to Create

**1. `src/engine/types.ts`** - Physics-specific types
```typescript
import Matter from 'matter-js';

export interface PhysicsBodyOptions {
  isStatic?: boolean;
  friction?: number;
  restitution?: number; // Bounciness
  density?: number;
  label?: string; // Identifier for collision detection
}

export interface PhysicsWorld {
  engine: Matter.Engine;
  world: Matter.World;
}
```

**2. `src/engine/Physics.ts`** - Main physics wrapper class

Expected API:
```typescript
import Matter from 'matter-js';
import { Vector2D, PhysicsConfig } from '../types';
import { PhysicsBodyOptions } from './types';

export class PhysicsEngine {
  private engine: Matter.Engine | null = null;
  private world: Matter.World | null = null;
  private collisionCallbacks: Map<string, (event: Matter.IEventCollision<Matter.Engine>) => void> = new Map();

  /**
   * Initialize the physics engine
   * @param config Physics configuration (gravity, etc.)
   */
  public init(config: PhysicsConfig): void {
    // Create Matter.js engine
    // Set gravity from config
    // Store world reference
  }

  /**
   * Update physics simulation
   * @param delta Time elapsed since last update (ms)
   */
  public update(delta: number): void {
    // Run Matter.Engine.update with delta
  }

  /**
   * Create a rectangular physics body
   * @param x Center X position
   * @param y Center Y position
   * @param width Rectangle width
   * @param height Rectangle height
   * @param options Physics properties
   * @returns Matter.Body
   */
  public createRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: PhysicsBodyOptions
  ): Matter.Body {
    // Use Matter.Bodies.rectangle
    // Add to world
    // Return body
  }

  /**
   * Create a circular physics body
   * @param x Center X position
   * @param y Center Y position
   * @param radius Circle radius
   * @param options Physics properties
   * @returns Matter.Body
   */
  public createCircle(
    x: number,
    y: number,
    radius: number,
    options?: PhysicsBodyOptions
  ): Matter.Body {
    // Use Matter.Bodies.circle
    // Add to world
    // Return body
  }

  /**
   * Remove a body from the physics world
   * @param body Body to remove
   */
  public removeBody(body: Matter.Body): void {
    // Use Matter.World.remove
  }

  /**
   * Apply a force to a body
   * @param body Body to apply force to
   * @param force Force vector
   */
  public applyForce(body: Matter.Body, force: Vector2D): void {
    // Use Matter.Body.applyForce
  }

  /**
   * Set gravity direction
   * @param gravity New gravity vector
   */
  public setGravity(gravity: Vector2D): void {
    // Update engine.world.gravity
  }

  /**
   * Register collision callback
   * @param callback Function to call on collision
   */
  public onCollision(callback: (event: Matter.IEventCollision<Matter.Engine>) => void): void {
    // Use Matter.Events.on(engine, 'collisionStart', callback)
  }

  /**
   * Get all bodies in the world
   */
  public getAllBodies(): Matter.Body[] {
    // Return Matter.Composite.allBodies(world)
  }

  /**
   * Clean up physics engine
   */
  public destroy(): void {
    // Clear all collision callbacks
    // Clear world
    // Clear engine
  }
}

export default PhysicsEngine;
```

**3. `src/__tests__/engine/Physics.test.ts`** - Comprehensive tests

Test requirements (write these FIRST following TDD):
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhysicsEngine } from '../../engine/Physics';
import { PHYSICS } from '../../utils/constants';

describe('PhysicsEngine', () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = new PhysicsEngine();
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => physics.init({ gravity: PHYSICS.GRAVITY, /* ... */ })).not.toThrow();
    });

    it('should set gravity from config', () => {
      const customGravity = { x: 0.5, y: 0.5 };
      physics.init({ gravity: customGravity, /* ... */ });
      // Verify gravity is set (test internal state or behavior)
    });
  });

  describe('body creation', () => {
    beforeEach(() => {
      physics.init({ gravity: PHYSICS.GRAVITY, /* ... */ });
    });

    it('should create a circular body', () => {
      const body = physics.createCircle(100, 100, 20);
      expect(body).toBeDefined();
      expect(body.position.x).toBeCloseTo(100);
      expect(body.position.y).toBeCloseTo(100);
    });

    it('should create a rectangular body', () => {
      const body = physics.createRectangle(100, 100, 50, 30);
      expect(body).toBeDefined();
      expect(body.position.x).toBeCloseTo(100);
      expect(body.position.y).toBeCloseTo(100);
    });

    it('should create static bodies', () => {
      const body = physics.createRectangle(100, 100, 50, 30, { isStatic: true });
      expect(body.isStatic).toBe(true);
    });

    it('should create dynamic bodies by default', () => {
      const body = physics.createCircle(100, 100, 20);
      expect(body.isStatic).toBe(false);
    });

    it('should apply physics options', () => {
      const body = physics.createCircle(100, 100, 20, {
        friction: 0.5,
        restitution: 0.9,
        label: 'test-ball'
      });
      expect(body.friction).toBeCloseTo(0.5);
      expect(body.restitution).toBeCloseTo(0.9);
      expect(body.label).toBe('test-ball');
    });
  });

  describe('body manipulation', () => {
    beforeEach(() => {
      physics.init({ gravity: PHYSICS.GRAVITY, /* ... */ });
    });

    it('should remove a body from the world', () => {
      const body = physics.createCircle(100, 100, 20);
      const bodiesBeforeRemove = physics.getAllBodies();
      physics.removeBody(body);
      const bodiesAfterRemove = physics.getAllBodies();
      expect(bodiesAfterRemove.length).toBe(bodiesBeforeRemove.length - 1);
    });

    it('should apply force to a body', () => {
      const body = physics.createCircle(100, 100, 20);
      const initialVelocity = { ...body.velocity };
      physics.applyForce(body, { x: 0.1, y: 0 });
      physics.update(16); // One frame
      // Velocity should change after applying force
      expect(body.velocity.x).not.toBe(initialVelocity.x);
    });
  });

  describe('physics simulation', () => {
    beforeEach(() => {
      physics.init({ gravity: { x: 0, y: 1 }, /* ... */ });
    });

    it('should update physics simulation', () => {
      const body = physics.createCircle(100, 100, 20);
      const initialY = body.position.y;
      physics.update(16); // One frame (~60fps)
      physics.update(16);
      physics.update(16);
      // Body should fall due to gravity
      expect(body.position.y).toBeGreaterThan(initialY);
    });

    it('should respect static bodies', () => {
      const staticBody = physics.createRectangle(100, 100, 50, 50, { isStatic: true });
      const initialPosition = { ...staticBody.position };
      physics.update(16);
      physics.update(16);
      physics.update(16);
      // Static body should not move
      expect(staticBody.position.x).toBe(initialPosition.x);
      expect(staticBody.position.y).toBe(initialPosition.y);
    });
  });

  describe('gravity manipulation', () => {
    beforeEach(() => {
      physics.init({ gravity: { x: 0, y: 1 }, /* ... */ });
    });

    it('should change gravity direction', () => {
      physics.setGravity({ x: 1, y: 0 }); // Right gravity
      const body = physics.createCircle(100, 100, 20);
      const initialX = body.position.x;
      physics.update(16);
      physics.update(16);
      physics.update(16);
      // Body should move right due to gravity
      expect(body.position.x).toBeGreaterThan(initialX);
    });
  });

  describe('collision detection', () => {
    beforeEach(() => {
      physics.init({ gravity: { x: 0, y: 1 }, /* ... */ });
    });

    it('should detect collisions between bodies', (done) => {
      const ball = physics.createCircle(100, 50, 20, { label: 'ball' });
      const floor = physics.createRectangle(100, 200, 200, 20, { isStatic: true, label: 'floor' });

      let collisionDetected = false;
      physics.onCollision((event) => {
        const pairs = event.pairs;
        pairs.forEach(pair => {
          if (pair.bodyA.label === 'ball' || pair.bodyB.label === 'ball') {
            collisionDetected = true;
          }
        });
      });

      // Simulate until collision
      const interval = setInterval(() => {
        physics.update(16);
        if (collisionDetected) {
          clearInterval(interval);
          expect(collisionDetected).toBe(true);
          done();
        }
      }, 16);

      setTimeout(() => {
        clearInterval(interval);
        if (!collisionDetected) done(new Error('Collision not detected'));
      }, 2000);
    });
  });

  describe('cleanup', () => {
    it('should destroy engine without errors', () => {
      physics.init({ gravity: PHYSICS.GRAVITY, /* ... */ });
      physics.createCircle(100, 100, 20);
      expect(() => physics.destroy()).not.toThrow();
    });

    it('should clear all bodies on destroy', () => {
      physics.init({ gravity: PHYSICS.GRAVITY, /* ... */ });
      physics.createCircle(100, 100, 20);
      physics.createRectangle(200, 200, 50, 50);
      physics.destroy();
      // Engine should be cleared (test by trying to get bodies)
    });
  });
});
```

#### Acceptance Criteria
- [ ] Matter.js is installed as a dependency
- [ ] `PhysicsEngine` class created in `src/engine/Physics.ts`
- [ ] All methods listed in API above are implemented
- [ ] Can initialize engine with custom gravity
- [ ] Can create circular and rectangular bodies
- [ ] Can create static and dynamic bodies
- [ ] Can apply forces to bodies
- [ ] Can detect collisions between bodies
- [ ] Can change gravity dynamically
- [ ] Can remove bodies from world
- [ ] Memory is properly cleaned up on destroy
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors or warnings
- [ ] Code follows ESLint rules

#### Testing Strategy (TDD)
1. **Write tests FIRST** for each method
2. Run tests (they will fail initially - this is expected)
3. Implement the methods to make tests pass
4. Refactor if needed
5. Ensure coverage >90%

#### Implementation Hints
- Import Matter.js: `import Matter from 'matter-js'`
- Create engine: `Matter.Engine.create()`
- Access world: `engine.world`
- Set gravity: `engine.world.gravity.x = value`
- Create bodies: `Matter.Bodies.circle()`, `Matter.Bodies.rectangle()`
- Add to world: `Matter.World.add(world, body)`
- Update simulation: `Matter.Engine.update(engine, delta)`
- Listen for collisions: `Matter.Events.on(engine, 'collisionStart', callback)`

#### Definition of Done
- All tests pass
- Coverage >90%
- No linting errors
- Code is documented with JSDoc comments
- Can be imported and used: `import { PhysicsEngine } from '../engine/Physics'`

---

### Task 2.2: Game State Management 🎮

**CONTEXT**: This is a React-based game that needs to track game state (score, level, time, etc.) across multiple components. We use React's Context API + useReducer pattern for centralized state management without external libraries.

**WHY THIS EXISTS**: Multiple components need access to game state:
- HUD needs to display score/time
- Game component needs to know if paused/playing
- Menus need to know win/lose status
- Level system needs current level

**WHAT YOU'RE BUILDING**: A React Context provider with a reducer that manages all game state, plus custom hooks for components to access and update state.

**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4 (complete ✅)

#### Prerequisites (Already Exist)
- `src/types/index.ts` has: `GameState`, `GameStatus`, `GameAction`
- `src/utils/constants.ts` has: `INITIAL_GAME_STATE`

#### Files to Create

**1. `src/context/gameReducer.ts`** - Pure reducer function

```typescript
import { GameState, GameAction } from '../types';
import { INITIAL_GAME_STATE } from '../utils/constants';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...INITIAL_GAME_STATE,
        status: 'playing',
        currentLevel: action.level,
      };

    case 'PAUSE_GAME':
      return {
        ...state,
        status: 'paused',
      };

    case 'RESUME_GAME':
      return {
        ...state,
        status: 'playing',
      };

    case 'WIN_GAME':
      return {
        ...state,
        status: 'won',
        score: state.score + action.score,
        timeElapsed: action.time,
        starsCollected: action.stars,
      };

    case 'LOSE_GAME':
      return {
        ...state,
        status: 'lost',
      };

    case 'RESET_GAME':
      return INITIAL_GAME_STATE;

    case 'UPDATE_TIME':
      return {
        ...state,
        timeElapsed: state.timeElapsed + action.delta,
      };

    case 'COLLECT_STAR':
      return {
        ...state,
        starsCollected: state.starsCollected + 1,
      };

    case 'UPDATE_SCORE':
      return {
        ...state,
        score: state.score + action.points,
      };

    case 'NEXT_LEVEL':
      return {
        ...state,
        currentLevel: state.currentLevel + 1,
        status: 'menu',
        starsCollected: 0,
        timeElapsed: 0,
      };

    case 'LOAD_LEVEL':
      return {
        ...state,
        currentLevel: action.level,
        status: 'menu',
        starsCollected: 0,
        timeElapsed: 0,
      };

    default:
      return state;
  }
}
```

**2. `src/context/GameContext.tsx`** - Context provider

```typescript
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { GameState, GameAction } from '../types';
import { gameReducer } from './gameReducer';
import { INITIAL_GAME_STATE } from '../utils/constants';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods
  startGame: (level: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  winGame: (score: number, time: number, stars: number) => void;
  loseGame: () => void;
  resetGame: () => void;
  updateTime: (delta: number) => void;
  collectStar: (starId: string) => void;
  updateScore: (points: number) => void;
  nextLevel: () => void;
  loadLevel: (level: number) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);

  // Memoized action creators
  const startGame = useCallback((level: number) => {
    dispatch({ type: 'START_GAME', level });
  }, []);

  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
  }, []);

  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' });
  }, []);

  const winGame = useCallback((score: number, time: number, stars: number) => {
    dispatch({ type: 'WIN_GAME', score, time, stars });
  }, []);

  const loseGame = useCallback(() => {
    dispatch({ type: 'LOSE_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const updateTime = useCallback((delta: number) => {
    dispatch({ type: 'UPDATE_TIME', delta });
  }, []);

  const collectStar = useCallback((starId: string) => {
    dispatch({ type: 'COLLECT_STAR', starId });
  }, []);

  const updateScore = useCallback((points: number) => {
    dispatch({ type: 'UPDATE_SCORE', points });
  }, []);

  const nextLevel = useCallback(() => {
    dispatch({ type: 'NEXT_LEVEL' });
  }, []);

  const loadLevel = useCallback((level: number) => {
    dispatch({ type: 'LOAD_LEVEL', level });
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    startGame,
    pauseGame,
    resumeGame,
    winGame,
    loseGame,
    resetGame,
    updateTime,
    collectStar,
    updateScore,
    nextLevel,
    loadLevel,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function useGameState(): GameState {
  const { state } = useGame();
  return state;
}

export function useGameActions() {
  const {
    startGame,
    pauseGame,
    resumeGame,
    winGame,
    loseGame,
    resetGame,
    updateTime,
    collectStar,
    updateScore,
    nextLevel,
    loadLevel,
  } = useGame();

  return {
    startGame,
    pauseGame,
    resumeGame,
    winGame,
    loseGame,
    resetGame,
    updateTime,
    collectStar,
    updateScore,
    nextLevel,
    loadLevel,
  };
}
```

**3. `src/__tests__/context/gameReducer.test.ts`** - Reducer tests (write FIRST)

```typescript
import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../context/gameReducer';
import { GameState } from '../../types';
import { INITIAL_GAME_STATE } from '../../utils/constants';

describe('gameReducer', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = { ...INITIAL_GAME_STATE };
  });

  describe('START_GAME', () => {
    it('should start game with specified level', () => {
      const result = gameReducer(initialState, { type: 'START_GAME', level: 2 });
      expect(result.status).toBe('playing');
      expect(result.currentLevel).toBe(2);
      expect(result.score).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });

    it('should reset score and time when starting', () => {
      const stateWithProgress = {
        ...initialState,
        score: 1000,
        timeElapsed: 60,
      };
      const result = gameReducer(stateWithProgress, { type: 'START_GAME', level: 1 });
      expect(result.score).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });
  });

  describe('PAUSE_GAME', () => {
    it('should set status to paused', () => {
      const playingState = { ...initialState, status: 'playing' as const };
      const result = gameReducer(playingState, { type: 'PAUSE_GAME' });
      expect(result.status).toBe('paused');
    });

    it('should preserve other state when pausing', () => {
      const playingState = {
        ...initialState,
        status: 'playing' as const,
        score: 500,
        timeElapsed: 30,
      };
      const result = gameReducer(playingState, { type: 'PAUSE_GAME' });
      expect(result.score).toBe(500);
      expect(result.timeElapsed).toBe(30);
    });
  });

  describe('RESUME_GAME', () => {
    it('should set status to playing', () => {
      const pausedState = { ...initialState, status: 'paused' as const };
      const result = gameReducer(pausedState, { type: 'RESUME_GAME' });
      expect(result.status).toBe('playing');
    });
  });

  describe('WIN_GAME', () => {
    it('should set status to won and update stats', () => {
      const playingState = {
        ...initialState,
        status: 'playing' as const,
        score: 500,
      };
      const result = gameReducer(playingState, {
        type: 'WIN_GAME',
        score: 300,
        time: 45,
        stars: 3,
      });
      expect(result.status).toBe('won');
      expect(result.score).toBe(800); // 500 + 300
      expect(result.timeElapsed).toBe(45);
      expect(result.starsCollected).toBe(3);
    });
  });

  describe('LOSE_GAME', () => {
    it('should set status to lost', () => {
      const playingState = { ...initialState, status: 'playing' as const };
      const result = gameReducer(playingState, { type: 'LOSE_GAME' });
      expect(result.status).toBe('lost');
    });
  });

  describe('RESET_GAME', () => {
    it('should reset to initial state', () => {
      const progressState = {
        ...initialState,
        status: 'won' as const,
        score: 1000,
        currentLevel: 5,
        timeElapsed: 120,
      };
      const result = gameReducer(progressState, { type: 'RESET_GAME' });
      expect(result).toEqual(INITIAL_GAME_STATE);
    });
  });

  describe('UPDATE_TIME', () => {
    it('should increment time elapsed', () => {
      const result = gameReducer(initialState, { type: 'UPDATE_TIME', delta: 1 });
      expect(result.timeElapsed).toBe(1);
    });

    it('should accumulate time correctly', () => {
      let state = initialState;
      state = gameReducer(state, { type: 'UPDATE_TIME', delta: 0.5 });
      state = gameReducer(state, { type: 'UPDATE_TIME', delta: 0.3 });
      state = gameReducer(state, { type: 'UPDATE_TIME', delta: 0.2 });
      expect(state.timeElapsed).toBeCloseTo(1.0);
    });
  });

  describe('COLLECT_STAR', () => {
    it('should increment stars collected', () => {
      const result = gameReducer(initialState, { type: 'COLLECT_STAR', starId: 'star-1' });
      expect(result.starsCollected).toBe(1);
    });

    it('should accumulate multiple stars', () => {
      let state = initialState;
      state = gameReducer(state, { type: 'COLLECT_STAR', starId: 'star-1' });
      state = gameReducer(state, { type: 'COLLECT_STAR', starId: 'star-2' });
      state = gameReducer(state, { type: 'COLLECT_STAR', starId: 'star-3' });
      expect(state.starsCollected).toBe(3);
    });
  });

  describe('UPDATE_SCORE', () => {
    it('should add points to score', () => {
      const result = gameReducer(initialState, { type: 'UPDATE_SCORE', points: 100 });
      expect(result.score).toBe(100);
    });

    it('should accumulate score correctly', () => {
      let state = initialState;
      state = gameReducer(state, { type: 'UPDATE_SCORE', points: 100 });
      state = gameReducer(state, { type: 'UPDATE_SCORE', points: 50 });
      state = gameReducer(state, { type: 'UPDATE_SCORE', points: 200 });
      expect(state.score).toBe(350);
    });
  });

  describe('NEXT_LEVEL', () => {
    it('should increment level and reset progress', () => {
      const completedState = {
        ...initialState,
        currentLevel: 2,
        status: 'won' as const,
        starsCollected: 3,
        timeElapsed: 45,
      };
      const result = gameReducer(completedState, { type: 'NEXT_LEVEL' });
      expect(result.currentLevel).toBe(3);
      expect(result.status).toBe('menu');
      expect(result.starsCollected).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });
  });

  describe('LOAD_LEVEL', () => {
    it('should load specified level', () => {
      const result = gameReducer(initialState, { type: 'LOAD_LEVEL', level: 5 });
      expect(result.currentLevel).toBe(5);
      expect(result.status).toBe('menu');
    });

    it('should reset level progress', () => {
      const progressState = {
        ...initialState,
        starsCollected: 2,
        timeElapsed: 30,
      };
      const result = gameReducer(progressState, { type: 'LOAD_LEVEL', level: 1 });
      expect(result.starsCollected).toBe(0);
      expect(result.timeElapsed).toBe(0);
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      gameReducer(originalState, { type: 'UPDATE_SCORE', points: 100 });
      expect(originalState).toEqual(initialState);
    });
  });
});
```

**4. `src/__tests__/context/GameContext.test.tsx`** - Context tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { GameProvider, useGame, useGameState, useGameActions } from '../../context/GameContext';

describe('GameContext', () => {
  describe('GameProvider', () => {
    it('should render children', () => {
      const { getByText } = render(
        <GameProvider>
          <div>Test Child</div>
        </GameProvider>
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('useGame hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useGame());
      }).toThrow('useGame must be used within a GameProvider');
    });

    it('should provide game state and actions', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: GameProvider,
      });

      expect(result.current.state).toBeDefined();
      expect(result.current.dispatch).toBeDefined();
      expect(result.current.startGame).toBeDefined();
      expect(result.current.pauseGame).toBeDefined();
    });
  });

  describe('useGameState hook', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useGameState(), {
        wrapper: GameProvider,
      });

      expect(result.current.status).toBe('menu');
      expect(result.current.score).toBe(0);
    });
  });

  describe('useGameActions hook', () => {
    it('should provide action methods', () => {
      const { result } = renderHook(() => useGameActions(), {
        wrapper: GameProvider,
      });

      expect(result.current.startGame).toBeDefined();
      expect(result.current.pauseGame).toBeDefined();
      expect(result.current.winGame).toBeDefined();
    });
  });

  describe('game actions', () => {
    it('should start game', () => {
      const { result: stateResult } = renderHook(() => useGameState(), {
        wrapper: GameProvider,
      });
      const { result: actionsResult } = renderHook(() => useGameActions(), {
        wrapper: GameProvider,
      });

      act(() => {
        actionsResult.current.startGame(1);
      });

      expect(stateResult.current.status).toBe('playing');
      expect(stateResult.current.currentLevel).toBe(1);
    });

    it('should pause and resume game', () => {
      const { result: stateResult } = renderHook(() => useGameState(), {
        wrapper: GameProvider,
      });
      const { result: actionsResult } = renderHook(() => useGameActions(), {
        wrapper: GameProvider,
      });

      act(() => {
        actionsResult.current.startGame(1);
      });
      expect(stateResult.current.status).toBe('playing');

      act(() => {
        actionsResult.current.pauseGame();
      });
      expect(stateResult.current.status).toBe('paused');

      act(() => {
        actionsResult.current.resumeGame();
      });
      expect(stateResult.current.status).toBe('playing');
    });

    it('should collect stars', () => {
      const { result: stateResult } = renderHook(() => useGameState(), {
        wrapper: GameProvider,
      });
      const { result: actionsResult } = renderHook(() => useGameActions(), {
        wrapper: GameProvider,
      });

      act(() => {
        actionsResult.current.collectStar('star-1');
        actionsResult.current.collectStar('star-2');
      });

      expect(stateResult.current.starsCollected).toBe(2);
    });

    it('should update score', () => {
      const { result: stateResult } = renderHook(() => useGameState(), {
        wrapper: GameProvider,
      });
      const { result: actionsResult } = renderHook(() => useGameActions(), {
        wrapper: GameProvider,
      });

      act(() => {
        actionsResult.current.updateScore(100);
        actionsResult.current.updateScore(50);
      });

      expect(stateResult.current.score).toBe(150);
    });
  });
});
```

#### Acceptance Criteria
- [ ] `gameReducer.ts` created with all action handlers
- [ ] `GameContext.tsx` created with provider and hooks
- [ ] All state transitions work correctly
- [ ] All action creators are memoized with useCallback
- [ ] Custom hooks (useGame, useGameState, useGameActions) work
- [ ] Throws error when hooks used outside provider
- [ ] All tests pass with >95% coverage
- [ ] No TypeScript errors
- [ ] State is immutable (reducer returns new objects)

#### Testing Strategy (TDD)
1. Write reducer tests FIRST
2. Implement reducer to pass tests
3. Write context tests
4. Implement context provider
5. Test all hooks
6. Ensure >95% coverage

#### Implementation Hints
- Use `useReducer` for state management
- Memoize action creators with `useCallback` to prevent re-renders
- Use TypeScript discriminated unions for actions
- Keep reducer pure (no side effects)
- Test that original state is not mutated

#### Definition of Done
- All tests pass
- Coverage >95%
- Can be imported: `import { GameProvider, useGame } from '../context/GameContext'`
- Works in React components

---

### Task 2.3: Touch Input Handler 📱

**CONTEXT**: This is a mobile-first game where players interact using touch gestures. We need to detect different touch gestures (tap, long-press, swipe) and normalize coordinates to canvas space.

**WHY THIS EXISTS**: The game uses touch controls for:
- **Tap**: Place an obstacle
- **Long press**: Remove an obstacle
- **Swipe**: Change gravity direction

We need a reusable React hook that handles these gestures on any element (especially the game canvas).

**WHAT YOU'RE BUILDING**: A custom React hook (`useTouch`) that:
- Attaches touch/mouse/pointer event listeners to an element
- Detects gestures (tap, long-press, swipe)
- Normalizes coordinates to canvas space
- Prevents default touch behaviors (scroll, zoom)
- Works on both mobile (touch) and desktop (mouse)

**Owner**: TBD
**Estimated Effort**: 3-4 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4 (complete ✅)

#### Prerequisites (Already Exist)
- `src/types/index.ts` has: `Vector2D`, `GestureType`, `GestureEvent`
- `src/utils/constants.ts` has: `INPUT` constants (tap duration, swipe distance, etc.)

#### Files to Create

**1. `src/utils/gestures.ts`** - Gesture detection logic

```typescript
import { Vector2D, GestureType } from '../types';
import { INPUT } from './constants';
import { distance } from './constants';

export interface TouchPoint {
  position: Vector2D;
  timestamp: number;
}

/**
 * Detect gesture type based on touch points
 */
export function detectGesture(
  startPoint: TouchPoint,
  endPoint: TouchPoint
): GestureType {
  const duration = endPoint.timestamp - startPoint.timestamp;
  const dist = distance(startPoint.position, endPoint.position);

  // Long press: held for >500ms, minimal movement
  if (duration >= INPUT.LONG_PRESS_DURATION && dist < INPUT.SWIPE_MIN_DISTANCE) {
    return 'longPress';
  }

  // Swipe: quick movement over distance threshold
  if (duration < INPUT.SWIPE_MAX_DURATION && dist >= INPUT.SWIPE_MIN_DISTANCE) {
    return 'swipe';
  }

  // Tap: quick touch with minimal movement
  if (duration < INPUT.TAP_MAX_DURATION && dist < INPUT.SWIPE_MIN_DISTANCE) {
    return 'tap';
  }

  return 'none';
}

/**
 * Calculate swipe direction vector
 */
export function getSwipeDirection(start: Vector2D, end: Vector2D): Vector2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  if (magnitude === 0) return { x: 0, y: 0 };

  return {
    x: dx / magnitude,
    y: dy / magnitude,
  };
}

/**
 * Normalize screen coordinates to canvas coordinates
 * @param screenPos Screen position (from touch/mouse event)
 * @param canvasRect Canvas bounding rectangle
 * @param canvasSize Logical canvas size
 */
export function normalizeCoordinates(
  screenPos: Vector2D,
  canvasRect: DOMRect,
  canvasSize: { width: number; height: number }
): Vector2D {
  // Convert screen position to canvas-relative position
  const relativeX = screenPos.x - canvasRect.left;
  const relativeY = screenPos.y - canvasRect.top;

  // Scale to logical canvas coordinates
  const scaleX = canvasSize.width / canvasRect.width;
  const scaleY = canvasSize.height / canvasRect.height;

  return {
    x: relativeX * scaleX,
    y: relativeY * scaleY,
  };
}
```

**2. `src/hooks/useTouch.ts`** - Touch handling hook

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { Vector2D, GestureEvent } from '../types';
import { detectGesture, getSwipeDirection, normalizeCoordinates, TouchPoint } from '../utils/gestures';

export interface UseTouchOptions {
  onTap?: (position: Vector2D) => void;
  onLongPress?: (position: Vector2D) => void;
  onSwipe?: (position: Vector2D, direction: Vector2D) => void;
  onGesture?: (event: GestureEvent) => void;
  canvasSize?: { width: number; height: number };
  preventDefault?: boolean; // Prevent default touch behaviors
}

export interface UseTouchReturn {
  ref: React.RefObject<HTMLElement>;
}

export function useTouch(options: UseTouchOptions = {}): UseTouchReturn {
  const {
    onTap,
    onLongPress,
    onSwipe,
    onGesture,
    canvasSize = { width: 800, height: 600 },
    preventDefault = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const startPointRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Get position from touch or mouse event
  const getEventPosition = useCallback((
    event: TouchEvent | MouseEvent
  ): Vector2D => {
    const element = elementRef.current;
    if (!element) return { x: 0, y: 0 };

    const rect = element.getBoundingClientRect();
    let screenX: number;
    let screenY: number;

    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      screenX = event.touches[0]!.clientX;
      screenY = event.touches[0]!.clientY;
    } else if ('clientX' in event) {
      // Mouse event
      screenX = event.clientX;
      screenY = event.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    return normalizeCoordinates(
      { x: screenX, y: screenY },
      rect,
      canvasSize
    );
  }, [canvasSize]);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Handle touch/mouse start
  const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const position = getEventPosition(event);
    startPointRef.current = {
      position,
      timestamp: Date.now(),
    };

    // Start long press timer
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      if (startPointRef.current) {
        // Long press detected
        if (onLongPress) {
          onLongPress(startPointRef.current.position);
        }
        if (onGesture) {
          onGesture({
            type: 'longPress',
            position: startPointRef.current.position,
            duration: Date.now() - startPointRef.current.timestamp,
          });
        }
      }
    }, 500); // INPUT.LONG_PRESS_DURATION
  }, [preventDefault, getEventPosition, clearLongPressTimer, onLongPress, onGesture]);

  // Handle touch/mouse move
  const handleMove = useCallback((event: TouchEvent | MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    // Cancel long press on movement
    clearLongPressTimer();
  }, [preventDefault, clearLongPressTimer]);

  // Handle touch/mouse end
  const handleEnd = useCallback((event: TouchEvent | MouseEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    clearLongPressTimer();

    if (!startPointRef.current) return;

    const position = getEventPosition(event);
    const endPoint: TouchPoint = {
      position,
      timestamp: Date.now(),
    };

    const gestureType = detectGesture(startPointRef.current, endPoint);

    if (gestureType === 'tap' && onTap) {
      onTap(position);
    }

    if (gestureType === 'swipe' && onSwipe) {
      const direction = getSwipeDirection(
        startPointRef.current.position,
        endPoint.position
      );
      onSwipe(position, direction);
    }

    if (onGesture && gestureType !== 'none') {
      const gestureEvent: GestureEvent = {
        type: gestureType,
        position,
      };

      if (gestureType === 'swipe') {
        gestureEvent.delta = {
          x: endPoint.position.x - startPointRef.current.position.x,
          y: endPoint.position.y - startPointRef.current.position.y,
        };
      }

      onGesture(gestureEvent);
    }

    startPointRef.current = null;
  }, [
    preventDefault,
    clearLongPressTimer,
    getEventPosition,
    onTap,
    onSwipe,
    onGesture,
  ]);

  // Handle touch cancel
  const handleCancel = useCallback(() => {
    clearLongPressTimer();
    startPointRef.current = null;
  }, [clearLongPressTimer]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart as EventListener, { passive: !preventDefault });
    element.addEventListener('touchmove', handleMove as EventListener, { passive: !preventDefault });
    element.addEventListener('touchend', handleEnd as EventListener, { passive: !preventDefault });
    element.addEventListener('touchcancel', handleCancel as EventListener);

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', handleStart as EventListener);
    element.addEventListener('mousemove', handleMove as EventListener);
    element.addEventListener('mouseup', handleEnd as EventListener);

    return () => {
      element.removeEventListener('touchstart', handleStart as EventListener);
      element.removeEventListener('touchmove', handleMove as EventListener);
      element.removeEventListener('touchend', handleEnd as EventListener);
      element.removeEventListener('touchcancel', handleCancel as EventListener);
      element.removeEventListener('mousedown', handleStart as EventListener);
      element.removeEventListener('mousemove', handleMove as EventListener);
      element.removeEventListener('mouseup', handleEnd as EventListener);
      clearLongPressTimer();
    };
  }, [handleStart, handleMove, handleEnd, handleCancel, clearLongPressTimer, preventDefault]);

  return { ref: elementRef };
}
```

**3. `src/__tests__/utils/gestures.test.ts`** - Gesture detection tests (write FIRST)

```typescript
import { describe, it, expect } from 'vitest';
import {
  detectGesture,
  getSwipeDirection,
  normalizeCoordinates,
  TouchPoint,
} from '../../utils/gestures';
import { INPUT } from '../../utils/constants';

describe('gestures', () => {
  describe('detectGesture', () => {
    it('should detect tap gesture', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 102, y: 101 }, // Small movement
        timestamp: 1150, // 150ms (< TAP_MAX_DURATION)
      };
      expect(detectGesture(start, end)).toBe('tap');
    });

    it('should detect long press gesture', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 101, y: 101 }, // Minimal movement
        timestamp: 1600, // 600ms (>= LONG_PRESS_DURATION)
      };
      expect(detectGesture(start, end)).toBe('longPress');
    });

    it('should detect swipe gesture', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 200, y: 100 }, // Large horizontal movement
        timestamp: 1200, // 200ms (< SWIPE_MAX_DURATION)
      };
      expect(detectGesture(start, end)).toBe('swipe');
    });

    it('should return none for ambiguous gestures', () => {
      const start: TouchPoint = {
        position: { x: 100, y: 100 },
        timestamp: 1000,
      };
      const end: TouchPoint = {
        position: { x: 105, y: 105 }, // Some movement
        timestamp: 1400, // 400ms (between tap and long press)
      };
      expect(detectGesture(start, end)).toBe('none');
    });
  });

  describe('getSwipeDirection', () => {
    it('should calculate right swipe direction', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 100 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBeCloseTo(1);
      expect(direction.y).toBeCloseTo(0);
    });

    it('should calculate left swipe direction', () => {
      const start = { x: 200, y: 100 };
      const end = { x: 100, y: 100 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBeCloseTo(-1);
      expect(direction.y).toBeCloseTo(0);
    });

    it('should calculate down swipe direction', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 100, y: 200 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBeCloseTo(0);
      expect(direction.y).toBeCloseTo(1);
    });

    it('should normalize diagonal swipe', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 200 };
      const direction = getSwipeDirection(start, end);
      const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      expect(magnitude).toBeCloseTo(1); // Unit vector
    });

    it('should handle zero movement', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 100, y: 100 };
      const direction = getSwipeDirection(start, end);
      expect(direction.x).toBe(0);
      expect(direction.y).toBe(0);
    });
  });

  describe('normalizeCoordinates', () => {
    it('should normalize coordinates to canvas space', () => {
      const screenPos = { x: 150, y: 125 };
      const canvasRect = new DOMRect(100, 100, 400, 300); // x, y, width, height
      const canvasSize = { width: 800, height: 600 };

      const normalized = normalizeCoordinates(screenPos, canvasRect, canvasSize);

      // Screen position 150 is 50px into the canvas (150-100)
      // Canvas is 400px wide but logically 800 wide, so scale 2x
      expect(normalized.x).toBeCloseTo(100); // 50 * 2
      expect(normalized.y).toBeCloseTo(50);  // 25 * 2
    });

    it('should handle top-left corner', () => {
      const screenPos = { x: 100, y: 100 };
      const canvasRect = new DOMRect(100, 100, 400, 300);
      const canvasSize = { width: 800, height: 600 };

      const normalized = normalizeCoordinates(screenPos, canvasRect, canvasSize);

      expect(normalized.x).toBeCloseTo(0);
      expect(normalized.y).toBeCloseTo(0);
    });

    it('should handle center point', () => {
      const screenPos = { x: 300, y: 250 }; // Center of canvas
      const canvasRect = new DOMRect(100, 100, 400, 300);
      const canvasSize = { width: 800, height: 600 };

      const normalized = normalizeCoordinates(screenPos, canvasRect, canvasSize);

      expect(normalized.x).toBeCloseTo(400); // Half of 800
      expect(normalized.y).toBeCloseTo(300); // Half of 600
    });
  });
});
```

**4. `src/__tests__/hooks/useTouch.test.tsx`** - Hook tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTouch } from '../../hooks/useTouch';

describe('useTouch', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    // Mock getBoundingClientRect
    vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  it('should return a ref', () => {
    const { result } = renderHook(() => useTouch());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('should detect tap gesture', () => {
    const onTap = vi.fn();
    const { result } = renderHook(() => useTouch({ onTap }));

    // Assign element to ref
    result.current.ref.current = mockElement;

    // Simulate tap
    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      mockElement.dispatchEvent(touchStart);
    });

    act(() => {
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 102, clientY: 101 } as Touch],
      });
      mockElement.dispatchEvent(touchEnd);
    });

    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap).toHaveBeenCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      })
    );
  });

  it('should detect long press gesture', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useTouch({ onLongPress }));

    result.current.ref.current = mockElement;

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      mockElement.dispatchEvent(touchStart);
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should detect swipe gesture', () => {
    const onSwipe = vi.fn();
    const { result } = renderHook(() => useTouch({ onSwipe }));

    result.current.ref.current = mockElement;

    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      mockElement.dispatchEvent(touchStart);
    });

    act(() => {
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 300, clientY: 100 } as Touch],
      });
      mockElement.dispatchEvent(touchEnd);
    });

    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });

  it('should work with mouse events', () => {
    const onTap = vi.fn();
    const { result } = renderHook(() => useTouch({ onTap }));

    result.current.ref.current = mockElement;

    act(() => {
      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      mockElement.dispatchEvent(mouseDown);
    });

    act(() => {
      const mouseUp = new MouseEvent('mouseup', { clientX: 102, clientY: 101 });
      mockElement.dispatchEvent(mouseUp);
    });

    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('should clean up on unmount', () => {
    const { result, unmount } = renderHook(() => useTouch());
    result.current.ref.current = mockElement;

    const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
```

#### Acceptance Criteria
- [ ] `gestures.ts` created with gesture detection functions
- [ ] `useTouch.ts` hook created
- [ ] Detects tap, long-press, and swipe gestures
- [ ] Works with touch events (mobile)
- [ ] Works with mouse events (desktop)
- [ ] Normalizes coordinates to canvas space
- [ ] Prevents default touch behaviors when configured
- [ ] Cleans up event listeners on unmount
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors

#### Testing Strategy (TDD)
1. Write tests for gesture detection functions FIRST
2. Implement gesture detection
3. Write tests for coordinate normalization
4. Implement normalization
5. Write tests for useTouch hook
6. Implement hook
7. Test cleanup and edge cases

#### Implementation Hints
- Use `touches[0]` for touch events, `clientX`/`clientY` for mouse
- Store start point and timestamp in ref
- Use `setTimeout` for long press detection
- Calculate distance between points for swipe detection
- Use `{ passive: false }` option to allow `preventDefault()`

#### Definition of Done
- All tests pass
- Coverage >90%
- Works on mobile and desktop
- Can be imported: `import { useTouch } from '../hooks/useTouch'`
- No memory leaks (event listeners cleaned up)

---

### Task 2.4: Game Loop Hook ⏱️

**CONTEXT**: This is a real-time game that needs to update physics and render graphics 60 times per second (60fps). We need a game loop that runs continuously using `requestAnimationFrame` and provides accurate timing information.

**WHY THIS EXISTS**: The game needs to:
- Update physics simulation every frame
- Render graphics smoothly at 60fps
- Calculate delta time (time since last frame) for frame-rate independent gameplay
- Pause when the browser tab is inactive (battery saving)
- Pause/resume on demand (when player pauses game)

**WHAT YOU'RE BUILDING**: A custom React hook (`useGameLoop`) that:
- Starts/stops a game loop using `requestAnimationFrame`
- Calculates delta time between frames
- Calls an update callback every frame
- Supports pause/resume
- Automatically pauses when tab loses focus
- Cleans up on component unmount

**Owner**: TBD
**Estimated Effort**: 2-3 hours
**Status**: ⏳ Not Started
**Depends On**: Task 1.4 (complete ✅)

#### Prerequisites (Already Exist)
- `src/utils/constants.ts` has: `PHYSICS.FPS`, `PHYSICS.DELTA_TIME`

#### Files to Create

**1. `src/hooks/useGameLoop.ts`** - Game loop hook

```typescript
import { useEffect, useRef, useCallback } from 'react';

export interface UseGameLoopOptions {
  onUpdate: (deltaTime: number) => void; // Called every frame with delta time in seconds
  targetFPS?: number; // Target frames per second (default: 60)
  paused?: boolean; // External pause control
  pauseOnBlur?: boolean; // Pause when window loses focus (default: true)
}

export interface UseGameLoopReturn {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isRunning: boolean;
  isPaused: boolean;
  fps: number; // Actual FPS
}

export function useGameLoop(options: UseGameLoopOptions): UseGameLoopReturn {
  const {
    onUpdate,
    targetFPS = 60,
    paused = false,
    pauseOnBlur = true,
  } = options;

  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(paused);
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(0);

  // Calculate actual FPS
  const updateFPS = useCallback((currentTime: number) => {
    frameCountRef.current++;

    if (currentTime - fpsUpdateTimeRef.current >= 1000) {
      // Update FPS every second
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      fpsUpdateTimeRef.current = currentTime;
    }
  }, []);

  // Main loop function
  const loop = useCallback((currentTime: number) => {
    if (!isRunningRef.current || isPausedRef.current) {
      lastTimeRef.current = currentTime;
      return;
    }

    // Calculate delta time
    const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = currentTime;

    // Call update callback with delta time
    if (deltaTime > 0 && deltaTime < 1) {
      // Clamp delta time to prevent huge jumps
      onUpdate(Math.min(deltaTime, 1 / targetFPS * 5));
    }

    // Update FPS counter
    updateFPS(currentTime);

    // Request next frame
    rafIdRef.current = requestAnimationFrame(loop);
  }, [onUpdate, targetFPS, updateFPS]);

  // Start the game loop
  const start = useCallback(() => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    isPausedRef.current = false;
    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // Stop the game loop
  const stop = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Pause the game loop
  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // Resume the game loop
  const resume = useCallback(() => {
    if (!isRunningRef.current) return;

    isPausedRef.current = false;
    lastTimeRef.current = performance.now(); // Reset time to prevent large delta
    rafIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // Handle visibility change (pause when tab inactive)
  useEffect(() => {
    if (!pauseOnBlur) return;

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        if (isRunningRef.current && !isPausedRef.current) {
          pause();
        }
      } else {
        if (isRunningRef.current && isPausedRef.current) {
          resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnBlur, pause, resume]);

  // Sync external pause state
  useEffect(() => {
    if (paused && !isPausedRef.current) {
      pause();
    } else if (!paused && isPausedRef.current && isRunningRef.current) {
      resume();
    }
  }, [paused, pause, resume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    pause,
    resume,
    isRunning: isRunningRef.current,
    isPaused: isPausedRef.current,
    fps: fpsRef.current,
  };
}
```

**2. `src/__tests__/hooks/useGameLoop.test.ts`** - Tests (write FIRST)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameLoop } from '../../hooks/useGameLoop';

describe('useGameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return game loop controls', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    expect(result.current.start).toBeDefined();
    expect(result.current.stop).toBeDefined();
    expect(result.current.pause).toBeDefined();
    expect(result.current.resume).toBeDefined();
    expect(typeof result.current.isRunning).toBe('boolean');
    expect(typeof result.current.isPaused).toBe('boolean');
    expect(typeof result.current.fps).toBe('number');
  });

  it('should call onUpdate when started', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    // Fast-forward time to trigger RAF callbacks
    act(() => {
      vi.advanceTimersByTime(16); // ~60fps frame time
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('should provide delta time to onUpdate callback', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(16);
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.any(Number));
      const deltaTime = onUpdate.mock.calls[0]?.[0] as number;
      expect(deltaTime).toBeGreaterThan(0);
      expect(deltaTime).toBeLessThan(1); // Less than 1 second
    });
  });

  it('should not call onUpdate when paused', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    onUpdate.mockClear();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should resume after pause', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.pause();
    });

    onUpdate.mockClear();

    act(() => {
      result.current.resume();
    });

    act(() => {
      vi.advanceTimersByTime(16);
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('should stop the loop', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);

    onUpdate.mockClear();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should pause when document becomes hidden', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, pauseOnBlur: true }));

    act(() => {
      result.current.start();
    });

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(true);
  });

  it('should resume when document becomes visible again', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, pauseOnBlur: true }));

    act(() => {
      result.current.start();
    });

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(true);

    // Simulate tab becoming visible
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(false);
  });

  it('should respect external paused prop', () => {
    const onUpdate = vi.fn();
    const { result, rerender } = renderHook(
      ({ paused }) => useGameLoop({ onUpdate, paused }),
      { initialProps: { paused: false } }
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isPaused).toBe(false);

    // Update paused prop
    rerender({ paused: true });

    expect(result.current.isPaused).toBe(true);
  });

  it('should clean up on unmount', () => {
    const onUpdate = vi.fn();
    const { result, unmount } = renderHook(() => useGameLoop({ onUpdate }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    unmount();

    // onUpdate should not be called after unmount
    onUpdate.mockClear();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should target specific FPS', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, targetFPS: 30 }));

    act(() => {
      result.current.start();
    });

    // Simulate multiple frames
    for (let i = 0; i < 10; i++) {
      act(() => {
        vi.advanceTimersByTime(33); // ~30fps frame time
      });
    }

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('should clamp large delta times', async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useGameLoop({ onUpdate, targetFPS: 60 }));

    act(() => {
      result.current.start();
    });

    // Simulate a huge time jump (e.g., computer waking from sleep)
    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
      const deltaTime = onUpdate.mock.calls[0]?.[0] as number;
      // Delta should be clamped, not 5 seconds
      expect(deltaTime).toBeLessThan(1);
    });
  });
});
```

#### Acceptance Criteria
- [ ] `useGameLoop.ts` hook created
- [ ] Starts/stops game loop with start()/stop()
- [ ] Pauses/resumes with pause()/resume()
- [ ] Calls onUpdate callback every frame with delta time
- [ ] Delta time is in seconds
- [ ] Targets specified FPS (default 60)
- [ ] Pauses automatically when tab loses focus
- [ ] Clamps large delta times (prevents huge jumps)
- [ ] Tracks actual FPS
- [ ] Cleans up requestAnimationFrame on unmount
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors

#### Testing Strategy (TDD)
1. Write tests FIRST for basic start/stop
2. Implement basic loop
3. Write tests for pause/resume
4. Implement pause/resume
5. Write tests for visibility handling
6. Implement visibility handling
7. Write tests for cleanup
8. Test edge cases (large delta, multiple starts, etc.)

#### Implementation Hints
- Use `requestAnimationFrame` for the loop
- Use `performance.now()` for high-precision timing
- Store state in refs (don't use useState - causes re-renders)
- Calculate delta time: `(currentTime - lastTime) / 1000` (convert ms to seconds)
- Clamp delta time to prevent huge jumps: `Math.min(delta, maxDelta)`
- Use `document.hidden` to detect tab visibility
- Cancel RAF with `cancelAnimationFrame(rafId)`

#### Definition of Done
- All tests pass
- Coverage >90%
- No memory leaks (RAF cancelled on unmount)
- Can be imported: `import { useGameLoop } from '../hooks/useGameLoop'`
- Smooth 60fps performance

---

## 🔵 Wave 3: Game Entities
*Requires Wave 2 (especially Physics wrapper) to be complete*

### Task 3.1: Ball Entity 🏀

**CONTEXT**: This is a physics-based game where the main character is a bouncing ball. The ball is controlled by physics (gravity, forces, collisions) and is the entity the player manipulates indirectly through obstacles and gravity changes.

**WHY THIS EXISTS**: The ball is the core game entity - it's what the player watches and controls. It needs:
- Physics body for realistic movement
- Visual representation (rendering to canvas)
- Ability to respond to forces
- Collision detection with other entities

**WHAT YOU'RE BUILDING**: A Ball class that:
- Creates a circular physics body using the Physics engine
- Tracks position, velocity, and angle
- Can apply forces (for movement/launching)
- Renders itself to an HTML5 canvas
- Integrates with Matter.js through the PhysicsEngine wrapper

**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1 (Physics Engine Wrapper)

#### Prerequisites
- **Task 2.1 complete**: `src/engine/Physics.ts` exists with PhysicsEngine class
- **Already exist**: `src/types/index.ts` (Vector2D, Entity), `src/utils/constants.ts` (BALL constants)

#### Files to Create

**1. `src/engine/entities/Entity.ts`** - Base entity interface/class

```typescript
import Matter from 'matter-js';
import { Vector2D, EntityType } from '../../types';

export abstract class Entity {
  protected body: Matter.Body;
  public readonly id: string;
  public readonly type: EntityType;

  constructor(body: Matter.Body, id: string, type: EntityType) {
    this.body = body;
    this.id = id;
    this.type = type;
    this.body.label = `${type}-${id}`;
  }

  /**
   * Get entity position
   */
  public getPosition(): Vector2D {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
    };
  }

  /**
   * Get entity velocity
   */
  public getVelocity(): Vector2D {
    return {
      x: this.body.velocity.x,
      y: this.body.velocity.y,
    };
  }

  /**
   * Get entity angle (radians)
   */
  public getAngle(): number {
    return this.body.angle;
  }

  /**
   * Get Matter.js body
   */
  public getBody(): Matter.Body {
    return this.body;
  }

  /**
   * Check if entity is static
   */
  public isStatic(): boolean {
    return this.body.isStatic;
  }

  /**
   * Render entity to canvas (to be implemented by subclasses)
   */
  public abstract render(ctx: CanvasRenderingContext2D): void;

  /**
   * Update entity (optional, for animation or logic)
   */
  public update(deltaTime: number): void {
    // Override in subclasses if needed
  }
}
```

**2. `src/engine/entities/Ball.ts`** - Ball entity class

```typescript
import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D } from '../../types';
import { BALL } from '../../utils/constants';

export interface BallOptions {
  position: Vector2D;
  radius?: number;
  color?: string;
  mass?: number;
}

export class Ball extends Entity {
  private readonly radius: number;
  private readonly color: string;
  private readonly outlineColor: string;

  constructor(physicsEngine: PhysicsEngine, options: BallOptions, id: string = 'player-ball') {
    const radius = options.radius ?? BALL.RADIUS;
    const mass = options.mass ?? BALL.MASS;

    // Create physics body
    const body = physicsEngine.createCircle(
      options.position.x,
      options.position.y,
      radius,
      {
        friction: BALL.FRICTION ?? 0.1,
        restitution: BALL.RESTITUTION ?? 0.8,
        density: mass / (Math.PI * radius * radius),
        label: `ball-${id}`,
        isStatic: false,
      }
    );

    super(body, id, 'ball');

    this.radius = radius;
    this.color = options.color ?? BALL.COLOR;
    this.outlineColor = BALL.OUTLINE_COLOR;
  }

  /**
   * Apply force to the ball
   */
  public applyForce(force: Vector2D): void {
    Matter.Body.applyForce(this.body, this.body.position, force);
  }

  /**
   * Set velocity directly
   */
  public setVelocity(velocity: Vector2D): void {
    Matter.Body.setVelocity(this.body, velocity);
  }

  /**
   * Get ball radius
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * Limit velocity (prevent ball from going too fast)
   */
  public limitVelocity(maxVelocity: number): void {
    const velocity = this.getVelocity();
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    if (speed > maxVelocity) {
      const scale = maxVelocity / speed;
      this.setVelocity({
        x: velocity.x * scale,
        y: velocity.y * scale,
      });
    }
  }

  /**
   * Render ball to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const pos = this.getPosition();

    ctx.save();

    // Draw ball
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw outline
    ctx.lineWidth = BALL.OUTLINE_WIDTH;
    ctx.strokeStyle = this.outlineColor;
    ctx.stroke();

    // Draw rotation indicator (line from center to edge)
    const angle = this.getAngle();
    const lineEndX = pos.x + Math.cos(angle) * this.radius;
    const lineEndY = pos.y + Math.sin(angle) * this.radius;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Update ball (apply velocity limiting)
   */
  public update(deltaTime: number): void {
    this.limitVelocity(BALL.MAX_VELOCITY ?? 20);
  }
}
```

**3. `src/__tests__/engine/entities/Ball.test.ts`** - Tests (write FIRST)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Ball } from '../../../engine/entities/Ball';
import { PHYSICS, BALL } from '../../../utils/constants';

describe('Ball', () => {
  let physics: PhysicsEngine;
  let ball: Ball;

  beforeEach(() => {
    physics = new PhysicsEngine();
    physics.init({
      gravity: PHYSICS.GRAVITY,
      timeScale: PHYSICS.TIME_SCALE,
      enableSleeping: PHYSICS.ENABLE_SLEEPING,
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
    });
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('creation', () => {
    it('should create a ball at specified position', () => {
      ball = new Ball(physics, { position: { x: 100, y: 200 } });
      const pos = ball.getPosition();
      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(200);
    });

    it('should use default radius if not specified', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
      expect(ball.getRadius()).toBe(BALL.RADIUS);
    });

    it('should use custom radius if specified', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 }, radius: 30 });
      expect(ball.getRadius()).toBe(30);
    });

    it('should have ball entity type', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
      expect(ball.type).toBe('ball');
    });

    it('should not be static', () => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
      expect(ball.isStatic()).toBe(false);
    });
  });

  describe('physics', () => {
    beforeEach(() => {
      ball = new Ball(physics, { position: { x: 100, y: 100 } });
    });

    it('should fall due to gravity', () => {
      const initialY = ball.getPosition().y;

      // Simulate several frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalY = ball.getPosition().y;
      expect(finalY).toBeGreaterThan(initialY);
    });

    it('should respond to applied force', () => {
      const initialVelocity = ball.getVelocity();

      ball.applyForce({ x: 0.1, y: 0 });
      physics.update(16);

      const newVelocity = ball.getVelocity();
      expect(newVelocity.x).toBeGreaterThan(initialVelocity.x);
    });

    it('should set velocity directly', () => {
      ball.setVelocity({ x: 5, y: -5 });
      const velocity = ball.getVelocity();
      expect(velocity.x).toBeCloseTo(5);
      expect(velocity.y).toBeCloseTo(-5);
    });

    it('should limit velocity to max speed', () => {
      ball.setVelocity({ x: 100, y: 100 }); // Very high velocity
      ball.limitVelocity(20);

      const velocity = ball.getVelocity();
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(speed).toBeLessThanOrEqual(20);
    });

    it('should not limit velocity below max', () => {
      ball.setVelocity({ x: 5, y: 5 });
      ball.limitVelocity(20);

      const velocity = ball.getVelocity();
      expect(velocity.x).toBeCloseTo(5);
      expect(velocity.y).toBeCloseTo(5);
    });

    it('should update and limit velocity', () => {
      ball.setVelocity({ x: 50, y: 50 });
      ball.update(0.016); // One frame

      const velocity = ball.getVelocity();
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(speed).toBeLessThanOrEqual(BALL.MAX_VELOCITY);
    });
  });

  describe('rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d')!;
      ball = new Ball(physics, { position: { x: 400, y: 300 } });
    });

    it('should render without errors', () => {
      expect(() => ball.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context', () => {
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      ball.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should draw a circle', () => {
      const arcSpy = vi.spyOn(ctx, 'arc');
      const fillSpy = vi.spyOn(ctx, 'fill');

      ball.render(ctx);

      expect(arcSpy).toHaveBeenCalled();
      expect(fillSpy).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      ball = new Ball(physics, { position: { x: 100, y: 200 } });
    });

    it('should return position', () => {
      const pos = ball.getPosition();
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });

    it('should return velocity', () => {
      const velocity = ball.getVelocity();
      expect(velocity).toHaveProperty('x');
      expect(velocity).toHaveProperty('y');
    });

    it('should return angle', () => {
      const angle = ball.getAngle();
      expect(typeof angle).toBe('number');
    });

    it('should return Matter.js body', () => {
      const body = ball.getBody();
      expect(body).toBeDefined();
      expect(body.position).toBeDefined();
    });
  });
});
```

#### Acceptance Criteria
- [ ] `Entity.ts` base class created
- [ ] `Ball.ts` class created extending Entity
- [ ] Ball creates circular physics body
- [ ] Ball has position, velocity, angle getters
- [ ] Can apply forces to ball
- [ ] Can set velocity directly
- [ ] Velocity is limited to max speed
- [ ] Ball renders to canvas with color and outline
- [ ] Ball shows rotation indicator
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors

#### Testing Strategy (TDD)
1. Write tests for Ball creation FIRST
2. Implement Ball constructor
3. Write tests for physics behavior
4. Implement physics methods
5. Write tests for rendering
6. Implement render method
7. Write tests for getters
8. Ensure >90% coverage

#### Implementation Hints
- Import PhysicsEngine: `import { PhysicsEngine } from '../Physics'`
- Use physicsEngine.createCircle() to create body
- Use Matter.Body.applyForce() for forces
- Use Matter.Body.setVelocity() to set velocity
- Use ctx.arc() to draw circle
- Use ctx.save()/restore() to isolate transformations

#### Definition of Done
- All tests pass
- Coverage >90%
- Ball visible when rendered
- Physics behaves realistically
- Can be imported: `import { Ball } from '../engine/entities/Ball'`

---

### Task 3.2: Static Obstacles 🧱

**CONTEXT**: This is a physics puzzle game where players need to navigate a ball through obstacles. Obstacles are static (non-moving) physics bodies that block or redirect the ball's path. Players can also place temporary obstacles via touch controls.

**WHY THIS EXISTS**: Obstacles create the puzzle element of the game. They:
- Define the level layout and paths
- Create challenges for the player
- Can be placed dynamically by the player to solve puzzles
- Need to collide realistically with the ball

**WHAT YOU'RE BUILDING**: An Obstacle class that:
- Creates static physics bodies (rectangles and circles)
- Renders obstacles to canvas with visual styling
- Supports different shapes and sizes
- Can be marked as player-placed vs level-defined
- Integrates with the PhysicsEngine wrapper

**Owner**: TBD
**Estimated Effort**: 2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1 (Physics Engine Wrapper)

#### Prerequisites
- **Task 2.1 complete**: `src/engine/Physics.ts` exists with PhysicsEngine class
- **Task 3.1 complete**: `src/engine/entities/Entity.ts` exists with Entity base class
- **Already exist**: `src/types/index.ts` (Vector2D, ObstacleType, ObstacleConfig), `src/utils/constants.ts` (OBSTACLE constants)

#### Files to Create

**1. `src/engine/entities/Obstacle.ts`** - Obstacle entity class

```typescript
import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D, ObstacleType } from '../../types';
import { PhysicsEngine } from '../Physics';
import { OBSTACLE } from '../../utils/constants';

export interface ObstacleOptions {
  position: Vector2D;
  type: ObstacleType; // 'rectangle' | 'circle' | 'triangle'
  width?: number; // For rectangles
  height?: number; // For rectangles
  radius?: number; // For circles
  angle?: number; // Rotation in radians
  color?: string;
  isPlayerPlaced?: boolean; // User-placed vs level obstacle
}

export class Obstacle extends Entity {
  private readonly obstacleType: ObstacleType;
  private readonly width?: number;
  private readonly height?: number;
  private readonly radius?: number;
  private readonly color: string;
  private readonly outlineColor: string;
  private readonly isPlayerPlaced: boolean;

  constructor(
    physicsEngine: PhysicsEngine,
    options: ObstacleOptions,
    id: string = `obstacle-${Date.now()}`
  ) {
    let body: Matter.Body;

    // Create appropriate physics body based on type
    if (options.type === 'rectangle') {
      const width = options.width ?? OBSTACLE.MIN_SIZE;
      const height = options.height ?? OBSTACLE.MIN_SIZE;
      body = physicsEngine.createRectangle(
        options.position.x,
        options.position.y,
        width,
        height,
        {
          isStatic: true,
          friction: OBSTACLE.FRICTION ?? 0.3,
          label: `obstacle-${id}`,
        }
      );
      this.width = width;
      this.height = height;
    } else if (options.type === 'circle') {
      const radius = options.radius ?? OBSTACLE.MIN_SIZE / 2;
      body = physicsEngine.createCircle(
        options.position.x,
        options.position.y,
        radius,
        {
          isStatic: true,
          friction: OBSTACLE.FRICTION ?? 0.3,
          label: `obstacle-${id}`,
        }
      );
      this.radius = radius;
    } else {
      // Triangle not implemented in this task, default to rectangle
      const size = OBSTACLE.MIN_SIZE;
      body = physicsEngine.createRectangle(
        options.position.x,
        options.position.y,
        size,
        size,
        {
          isStatic: true,
          friction: OBSTACLE.FRICTION ?? 0.3,
          label: `obstacle-${id}`,
        }
      );
      this.width = size;
      this.height = size;
    }

    // Apply rotation if specified
    if (options.angle) {
      Matter.Body.setAngle(body, options.angle);
    }

    super(body, id, 'obstacle');

    this.obstacleType = options.type;
    this.color = options.color ?? OBSTACLE.COLOR;
    this.outlineColor = OBSTACLE.OUTLINE_COLOR;
    this.isPlayerPlaced = options.isPlayerPlaced ?? false;
  }

  /**
   * Get obstacle shape type
   */
  public getObstacleType(): ObstacleType {
    return this.obstacleType;
  }

  /**
   * Check if this obstacle was placed by the player
   */
  public isPlacedByPlayer(): boolean {
    return this.isPlayerPlaced;
  }

  /**
   * Get dimensions (for rectangles)
   */
  public getDimensions(): { width?: number; height?: number; radius?: number } {
    return {
      width: this.width,
      height: this.height,
      radius: this.radius,
    };
  }

  /**
   * Render obstacle to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const pos = this.getPosition();
    const angle = this.getAngle();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    // Draw based on type
    if (this.obstacleType === 'rectangle' && this.width && this.height) {
      // Draw rectangle centered at origin
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

      // Draw outline
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = OBSTACLE.OUTLINE_WIDTH;
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

      // Draw diagonal lines if player-placed
      if (this.isPlayerPlaced) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.moveTo(this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.stroke();
      }
    } else if (this.obstacleType === 'circle' && this.radius) {
      // Draw circle
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = OBSTACLE.OUTLINE_WIDTH;
      ctx.stroke();

      // Draw center dot if player-placed
      if (this.isPlayerPlaced) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
```

**2. `src/__tests__/engine/entities/Obstacle.test.ts`** - Tests (write FIRST)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Obstacle } from '../../../engine/entities/Obstacle';
import { PHYSICS, OBSTACLE } from '../../../utils/constants';

describe('Obstacle', () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = new PhysicsEngine();
    physics.init({
      gravity: PHYSICS.GRAVITY,
      timeScale: PHYSICS.TIME_SCALE,
      enableSleeping: PHYSICS.ENABLE_SLEEPING,
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
    });
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('creation', () => {
    it('should create a rectangular obstacle', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 200 },
        type: 'rectangle',
        width: 100,
        height: 50,
      });

      const pos = obstacle.getPosition();
      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(200);
      expect(obstacle.getObstacleType()).toBe('rectangle');
    });

    it('should create a circular obstacle', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 150, y: 250 },
        type: 'circle',
        radius: 30,
      });

      expect(obstacle.getObstacleType()).toBe('circle');
      const dims = obstacle.getDimensions();
      expect(dims.radius).toBe(30);
    });

    it('should use default size for rectangles if not specified', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
      });

      const dims = obstacle.getDimensions();
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it('should have obstacle entity type', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
      });

      expect(obstacle.type).toBe('obstacle');
    });

    it('should be static', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
      });

      expect(obstacle.isStatic()).toBe(true);
    });

    it('should apply rotation angle', () => {
      const angle = Math.PI / 4; // 45 degrees
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
        width: 50,
        height: 50,
        angle,
      });

      expect(obstacle.getAngle()).toBeCloseTo(angle);
    });

    it('should mark player-placed obstacles', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
        isPlayerPlaced: true,
      });

      expect(obstacle.isPlacedByPlayer()).toBe(true);
    });

    it('should default to level-placed obstacles', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
      });

      expect(obstacle.isPlacedByPlayer()).toBe(false);
    });
  });

  describe('physics', () => {
    it('should not move when static', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
        width: 50,
        height: 50,
      });

      const initialPos = { ...obstacle.getPosition() };

      // Simulate frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalPos = obstacle.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });

    it('should have zero velocity', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'circle',
        radius: 25,
      });

      const velocity = obstacle.getVelocity();
      expect(velocity.x).toBeCloseTo(0);
      expect(velocity.y).toBeCloseTo(0);
    });
  });

  describe('dimensions', () => {
    it('should return rectangle dimensions', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'rectangle',
        width: 80,
        height: 40,
      });

      const dims = obstacle.getDimensions();
      expect(dims.width).toBe(80);
      expect(dims.height).toBe(40);
      expect(dims.radius).toBeUndefined();
    });

    it('should return circle dimensions', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 100, y: 100 },
        type: 'circle',
        radius: 35,
      });

      const dims = obstacle.getDimensions();
      expect(dims.radius).toBe(35);
      expect(dims.width).toBeUndefined();
      expect(dims.height).toBeUndefined();
    });
  });

  describe('rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d')!;
    });

    it('should render rectangle without errors', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 400, y: 300 },
        type: 'rectangle',
        width: 100,
        height: 50,
      });

      expect(() => obstacle.render(ctx)).not.toThrow();
    });

    it('should render circle without errors', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 400, y: 300 },
        type: 'circle',
        radius: 40,
      });

      expect(() => obstacle.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 400, y: 300 },
        type: 'rectangle',
      });

      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      obstacle.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should draw rectangle shape', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 400, y: 300 },
        type: 'rectangle',
        width: 100,
        height: 50,
      });

      const fillRectSpy = vi.spyOn(ctx, 'fillRect');

      obstacle.render(ctx);

      expect(fillRectSpy).toHaveBeenCalled();
    });

    it('should draw circle shape', () => {
      const obstacle = new Obstacle(physics, {
        position: { x: 400, y: 300 },
        type: 'circle',
        radius: 30,
      });

      const arcSpy = vi.spyOn(ctx, 'arc');

      obstacle.render(ctx);

      expect(arcSpy).toHaveBeenCalled();
    });
  });

  describe('collision with ball', () => {
    it('should block ball movement', () => {
      // This will be tested in integration tests with actual ball
      // For now, just verify obstacle is solid
      const obstacle = new Obstacle(physics, {
        position: { x: 200, y: 200 },
        type: 'rectangle',
        width: 100,
        height: 20,
      });

      const body = obstacle.getBody();
      expect(body.isStatic).toBe(true);
      expect(body.collisionFilter).toBeDefined();
    });
  });
});
```

#### Acceptance Criteria
- [ ] `Obstacle.ts` class created extending Entity
- [ ] Supports rectangle and circle shapes
- [ ] Creates static physics bodies
- [ ] Can apply rotation angle
- [ ] Tracks player-placed vs level obstacles
- [ ] Returns dimensions based on shape type
- [ ] Renders to canvas with color and outline
- [ ] Shows visual indicator for player-placed obstacles
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors

#### Testing Strategy (TDD)
1. Write tests for Obstacle creation FIRST
2. Implement Obstacle constructor
3. Write tests for different shapes
4. Implement shape-specific logic
5. Write tests for rendering
6. Implement render method
7. Write tests for dimensions
8. Ensure >90% coverage

#### Implementation Hints
- Use `physicsEngine.createRectangle()` for rectangles
- Use `physicsEngine.createCircle()` for circles
- Use `Matter.Body.setAngle()` to rotate
- Use `ctx.translate()` and `ctx.rotate()` for rendering rotated shapes
- Use `ctx.fillRect()` for rectangles, `ctx.arc()` for circles
- Always `isStatic: true` for obstacles

#### Definition of Done
- All tests pass
- Coverage >90%
- Obstacles render correctly
- Static bodies don't move
- Can be imported: `import { Obstacle } from '../engine/entities/Obstacle'`

---

### Task 3.3: Collectibles (Stars) ⭐

**CONTEXT**: This is a puzzle game where players collect stars for bonus points. Stars are collectible items placed throughout the level that increase the player's score and contribute to the star rating (1-3 stars per level).

**WHY THIS EXISTS**: Stars serve multiple purposes:
- **Scoring**: Collecting stars increases the score
- **Challenge**: Stars are often placed in harder-to-reach locations
- **Rating**: Number of stars collected determines the 1-3 star level rating
- **Replayability**: Players can replay levels to collect all stars

**WHAT YOU'RE BUILDING**: A Star class that:
- Creates a sensor physics body (detects collisions but doesn't physically collide)
- Tracks collected state (visible vs collected)
- Renders with animation (rotation, glow effect)
- Integrates with collision detection for collection

**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1 (Physics Engine Wrapper)

#### Prerequisites
- **Task 2.1 complete**: `src/engine/Physics.ts` exists with PhysicsEngine class
- **Task 3.1 complete**: `src/engine/entities/Entity.ts` exists with Entity base class
- **Already exist**: `src/types/index.ts` (Vector2D, StarConfig), `src/utils/constants.ts` (STAR constants)

#### Files to Create

**1. `src/engine/entities/Star.ts`** - Star entity class

```typescript
import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D } from '../../types';
import { PhysicsEngine } from '../Physics';
import { STAR } from '../../utils/constants';

export interface StarOptions {
  position: Vector2D;
  radius?: number;
  color?: string;
  id?: string;
}

export class Star extends Entity {
  private readonly radius: number;
  private readonly color: string;
  private readonly glowColor: string;
  private collected: boolean = false;
  private rotation: number = 0; // For animation

  constructor(
    physicsEngine: PhysicsEngine,
    options: StarOptions,
    id: string = `star-${Date.now()}`
  ) {
    const radius = options.radius ?? STAR.RADIUS;

    // Create sensor body (doesn't collide physically, only detects collisions)
    const body = physicsEngine.createCircle(
      options.position.x,
      options.position.y,
      radius,
      {
        isStatic: true,
        isSensor: true, // Key: makes it a sensor
        label: `star-${id}`,
      }
    );

    super(body, id, 'star');

    this.radius = radius;
    this.color = options.color ?? STAR.COLOR;
    this.glowColor = STAR.GLOW_COLOR;
  }

  /**
   * Mark star as collected
   */
  public collect(): void {
    this.collected = true;
  }

  /**
   * Check if star is collected
   */
  public isCollected(): boolean {
    return this.collected;
  }

  /**
   * Get star radius
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * Get points value
   */
  public getPoints(): number {
    return STAR.POINTS;
  }

  /**
   * Update star animation
   */
  public update(deltaTime: number): void {
    if (!this.collected) {
      // Rotate star for animation
      this.rotation += STAR.ANIMATION_SPEED * deltaTime;
      if (this.rotation > Math.PI * 2) {
        this.rotation -= Math.PI * 2;
      }
    }
  }

  /**
   * Render star to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return; // Don't render collected stars

    const pos = this.getPosition();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.rotation);

    // Draw glow effect
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.5);
    gradient.addColorStop(0, this.glowColor);
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw star shape (5-pointed star)
    this.drawStar(ctx, 0, 0, 5, this.radius, this.radius * 0.5);

    ctx.restore();
  }

  /**
   * Draw a 5-pointed star
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
```

**2. `src/__tests__/engine/entities/Star.test.ts`** - Tests (write FIRST)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Star } from '../../../engine/entities/Star';
import { PHYSICS, STAR } from '../../../utils/constants';

describe('Star', () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = new PhysicsEngine();
    physics.init({
      gravity: PHYSICS.GRAVITY,
      timeScale: PHYSICS.TIME_SCALE,
      enableSleeping: PHYSICS.ENABLE_SLEEPING,
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
    });
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('creation', () => {
    it('should create a star at specified position', () => {
      const star = new Star(physics, { position: { x: 100, y: 200 } });
      const pos = star.getPosition();

      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(200);
    });

    it('should use default radius if not specified', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      expect(star.getRadius()).toBe(STAR.RADIUS);
    });

    it('should use custom radius if specified', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 }, radius: 20 });
      expect(star.getRadius()).toBe(20);
    });

    it('should have star entity type', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      expect(star.type).toBe('star');
    });

    it('should be static', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      expect(star.isStatic()).toBe(true);
    });

    it('should start as not collected', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      expect(star.isCollected()).toBe(false);
    });

    it('should be a sensor body', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      const body = star.getBody();
      expect(body.isSensor).toBe(true);
    });
  });

  describe('collection', () => {
    it('should mark star as collected', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      expect(star.isCollected()).toBe(false);

      star.collect();
      expect(star.isCollected()).toBe(true);
    });

    it('should return points value', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      expect(star.getPoints()).toBe(STAR.POINTS);
      expect(star.getPoints()).toBeGreaterThan(0);
    });
  });

  describe('animation', () => {
    it('should update rotation over time', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });

      // Update multiple times
      star.update(0.016); // One frame
      star.update(0.016);
      star.update(0.016);

      // Rotation should have changed (tested via render side effects)
      // Direct rotation testing would require exposing the rotation property
      expect(star.isCollected()).toBe(false); // Still not collected
    });

    it('should not animate collected stars', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      star.collect();

      // Update should not throw errors
      expect(() => star.update(0.016)).not.toThrow();
    });
  });

  describe('rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d')!;
    });

    it('should render without errors when not collected', () => {
      const star = new Star(physics, { position: { x: 400, y: 300 } });
      expect(() => star.render(ctx)).not.toThrow();
    });

    it('should not render when collected', () => {
      const star = new Star(physics, { position: { x: 400, y: 300 } });
      star.collect();

      const fillSpy = vi.spyOn(ctx, 'fill');
      star.render(ctx);

      // Should not draw anything when collected
      expect(fillSpy).not.toHaveBeenCalled();
    });

    it('should save and restore canvas context', () => {
      const star = new Star(physics, { position: { x: 400, y: 300 } });

      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      star.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should draw star shape', () => {
      const star = new Star(physics, { position: { x: 400, y: 300 } });

      const beginPathSpy = vi.spyOn(ctx, 'beginPath');
      const fillSpy = vi.spyOn(ctx, 'fill');

      star.render(ctx);

      expect(beginPathSpy).toHaveBeenCalled();
      expect(fillSpy).toHaveBeenCalled();
    });

    it('should draw with glow effect', () => {
      const star = new Star(physics, { position: { x: 400, y: 300 } });

      const createRadialGradientSpy = vi.spyOn(ctx, 'createRadialGradient');
      star.render(ctx);

      expect(createRadialGradientSpy).toHaveBeenCalled();
    });
  });

  describe('physics', () => {
    it('should not physically collide (sensor only)', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      const body = star.getBody();

      // Sensor bodies don't have physical collisions
      expect(body.isSensor).toBe(true);
    });

    it('should not move (static)', () => {
      const star = new Star(physics, { position: { x: 100, y: 100 } });
      const initialPos = { ...star.getPosition() };

      // Simulate frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalPos = star.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });
  });
});
```

#### Acceptance Criteria
- [ ] `Star.ts` class created extending Entity
- [ ] Creates sensor physics body (isSensor: true)
- [ ] Tracks collected state
- [ ] Returns points value (from constants)
- [ ] Updates rotation for animation
- [ ] Renders 5-pointed star with glow effect
- [ ] Does not render when collected
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors

#### Testing Strategy (TDD)
1. Write tests for Star creation FIRST
2. Implement Star constructor with sensor body
3. Write tests for collection state
4. Implement collect() method
5. Write tests for animation
6. Implement update() with rotation
7. Write tests for rendering
8. Implement render() with star shape and glow
9. Ensure >90% coverage

#### Implementation Hints
- Use `isSensor: true` in physics body options to make it a sensor
- Sensors detect collisions but don't physically collide
- Use `ctx.createRadialGradient()` for glow effect
- Draw 5-pointed star with alternating outer/inner radii
- Rotate using accumulated `rotation` value in update()
- Don't render if `collected === true`

#### Definition of Done
- All tests pass
- Coverage >90%
- Stars render with animation
- Glow effect visible
- Doesn't render when collected
- Can be imported: `import { Star } from '../engine/entities/Star'`

---

### Task 3.4: Goal/Target 🎯

**CONTEXT**: Each level has a goal that the player must reach to complete the level. The goal is the win condition - when the ball touches the goal, the level is complete.

**WHY THIS EXISTS**: The goal:
- Defines the level's objective (reach this point)
- Triggers the win condition when touched
- Provides visual feedback (animated, glowing)
- Is the final target after collecting stars

**WHAT YOU'RE BUILDING**: A Goal class that:
- Creates a sensor physics body (detects when ball reaches it)
- Renders with distinctive visual style (green, animated, glowing)
- Tracks whether it has been reached
- Provides visual feedback that it's the objective

**Owner**: TBD
**Estimated Effort**: 1-2 hours
**Status**: ⏳ Not Started
**Depends On**: Task 2.1 (Physics Engine Wrapper)

#### Prerequisites
- **Task 2.1 complete**: `src/engine/Physics.ts` exists with PhysicsEngine class
- **Task 3.1 complete**: `src/engine/entities/Entity.ts` exists with Entity base class
- **Already exist**: `src/types/index.ts` (Vector2D, GoalConfig), `src/utils/constants.ts` (GOAL constants)

#### Files to Create

**1. `src/engine/entities/Goal.ts`** - Goal entity class

```typescript
import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D } from '../../types';
import { PhysicsEngine } from '../Physics';
import { GOAL } from '../../utils/constants';

export interface GoalOptions {
  position: Vector2D;
  radius?: number;
  color?: string;
}

export class Goal extends Entity {
  private readonly radius: number;
  private readonly color: string;
  private readonly glowColor: string;
  private reached: boolean = false;
  private pulsePhase: number = 0; // For pulsing animation

  constructor(
    physicsEngine: PhysicsEngine,
    options: GoalOptions,
    id: string = 'goal'
  ) {
    const radius = options.radius ?? GOAL.RADIUS;

    // Create sensor body (doesn't collide, only detects)
    const body = physicsEngine.createCircle(
      options.position.x,
      options.position.y,
      radius,
      {
        isStatic: true,
        isSensor: true,
        label: `goal-${id}`,
      }
    );

    super(body, id, 'goal');

    this.radius = radius;
    this.color = options.color ?? GOAL.COLOR;
    this.glowColor = GOAL.GLOW_COLOR;
  }

  /**
   * Mark goal as reached
   */
  public reach(): void {
    this.reached = true;
  }

  /**
   * Check if goal has been reached
   */
  public isReached(): boolean {
    return this.reached;
  }

  /**
   * Get goal radius
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * Update goal animation
   */
  public update(deltaTime: number): void {
    // Pulsing animation
    this.pulsePhase += GOAL.ANIMATION_SPEED * deltaTime;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }
  }

  /**
   * Render goal to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const pos = this.getPosition();

    ctx.save();

    // Calculate pulse scale (oscillates between 0.9 and 1.1)
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;

    // Draw outer glow rings
    for (let i = 3; i >= 1; i--) {
      const glowRadius = this.radius * pulseScale * (1 + i * 0.2);
      const alpha = 0.1 * (4 - i);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${this.glowColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }

    // Draw main circle with gradient
    const gradient = ctx.createRadialGradient(
      pos.x,
      pos.y,
      0,
      pos.x,
      pos.y,
      this.radius * pulseScale
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, this.color);
    gradient.addColorStop(1, this.glowColor);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.radius * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw target crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(pos.x - this.radius * 0.6, pos.y);
    ctx.lineTo(pos.x + this.radius * 0.6, pos.y);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - this.radius * 0.6);
    ctx.lineTo(pos.x, pos.y + this.radius * 0.6);
    ctx.stroke();

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.radius * pulseScale * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // If reached, add success indicator
    if (this.reached) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.radius * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }

    ctx.restore();
  }
}
```

**2. `src/__tests__/engine/entities/Goal.test.ts`** - Tests (write FIRST)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PhysicsEngine } from '../../../engine/Physics';
import { Goal } from '../../../engine/entities/Goal';
import { PHYSICS, GOAL } from '../../../utils/constants';

describe('Goal', () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = new PhysicsEngine();
    physics.init({
      gravity: PHYSICS.GRAVITY,
      timeScale: PHYSICS.TIME_SCALE,
      enableSleeping: PHYSICS.ENABLE_SLEEPING,
      friction: PHYSICS.DEFAULT_FRICTION,
      restitution: PHYSICS.DEFAULT_RESTITUTION,
    });
  });

  afterEach(() => {
    physics.destroy();
  });

  describe('creation', () => {
    it('should create a goal at specified position', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 500 } });
      const pos = goal.getPosition();

      expect(pos.x).toBeCloseTo(400);
      expect(pos.y).toBeCloseTo(500);
    });

    it('should use default radius if not specified', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.getRadius()).toBe(GOAL.RADIUS);
    });

    it('should use custom radius if specified', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 }, radius: 40 });
      expect(goal.getRadius()).toBe(40);
    });

    it('should have goal entity type', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.type).toBe('goal');
    });

    it('should be static', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.isStatic()).toBe(true);
    });

    it('should start as not reached', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.isReached()).toBe(false);
    });

    it('should be a sensor body', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      const body = goal.getBody();
      expect(body.isSensor).toBe(true);
    });
  });

  describe('reached state', () => {
    it('should mark goal as reached', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      expect(goal.isReached()).toBe(false);

      goal.reach();
      expect(goal.isReached()).toBe(true);
    });
  });

  describe('animation', () => {
    it('should update without errors', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });

      expect(() => {
        goal.update(0.016); // One frame
        goal.update(0.016);
        goal.update(0.016);
      }).not.toThrow();
    });

    it('should continue animating after reached', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      goal.reach();

      expect(() => goal.update(0.016)).not.toThrow();
    });
  });

  describe('rendering', () => {
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      ctx = canvas.getContext('2d')!;
    });

    it('should render without errors', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 } });
      expect(() => goal.render(ctx)).not.toThrow();
    });

    it('should render when reached', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 } });
      goal.reach();

      expect(() => goal.render(ctx)).not.toThrow();
    });

    it('should save and restore canvas context', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 } });

      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      goal.render(ctx);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should draw circles for glow effect', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 } });

      const arcSpy = vi.spyOn(ctx, 'arc');
      goal.render(ctx);

      // Should draw multiple circles (glow rings + main + outer ring)
      expect(arcSpy).toHaveBeenCalled();
      expect(arcSpy.mock.calls.length).toBeGreaterThan(2);
    });

    it('should draw crosshair lines', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 } });

      const strokeSpy = vi.spyOn(ctx, 'stroke');
      goal.render(ctx);

      // Should draw lines for crosshair
      expect(strokeSpy).toHaveBeenCalled();
    });

    it('should use gradient', () => {
      const goal = new Goal(physics, { position: { x: 400, y: 300 } });

      const createRadialGradientSpy = vi.spyOn(ctx, 'createRadialGradient');
      goal.render(ctx);

      expect(createRadialGradientSpy).toHaveBeenCalled();
    });
  });

  describe('physics', () => {
    it('should not physically collide (sensor only)', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      const body = goal.getBody();

      expect(body.isSensor).toBe(true);
    });

    it('should not move (static)', () => {
      const goal = new Goal(physics, { position: { x: 100, y: 100 } });
      const initialPos = { ...goal.getPosition() };

      // Simulate frames
      for (let i = 0; i < 60; i++) {
        physics.update(16);
      }

      const finalPos = goal.getPosition();
      expect(finalPos.x).toBeCloseTo(initialPos.x);
      expect(finalPos.y).toBeCloseTo(initialPos.y);
    });
  });
});
```

#### Acceptance Criteria
- [ ] `Goal.ts` class created extending Entity
- [ ] Creates sensor physics body (isSensor: true)
- [ ] Tracks reached state
- [ ] Updates pulse animation
- [ ] Renders with glow rings
- [ ] Draws crosshair target indicator
- [ ] Shows visual feedback when reached
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors

#### Testing Strategy (TDD)
1. Write tests for Goal creation FIRST
2. Implement Goal constructor with sensor body
3. Write tests for reached state
4. Implement reach() method
5. Write tests for animation
6. Implement update() with pulse
7. Write tests for rendering
8. Implement render() with glow and crosshair
9. Ensure >90% coverage

#### Implementation Hints
- Use `isSensor: true` like Star entity
- Use `Math.sin(pulsePhase)` for pulsing scale effect
- Draw multiple circles with decreasing alpha for glow rings
- Use `ctx.createRadialGradient()` for main circle
- Draw crosshair with horizontal and vertical lines
- Green color (#6bcf7f) distinguishes it as the goal
- Add white overlay when reached for visual feedback

#### Definition of Done
- All tests pass
- Coverage >90%
- Goal renders with distinctive look
- Pulsing animation visible
- Crosshair clearly visible
- Can be imported: `import { Goal } from '../engine/entities/Goal'`

---

## 🟣 Wave 4: UI Components
*Can be done in parallel with Wave 3*

**NOTE**: Due to file length constraints, Wave 4-7 tasks are abbreviated below. Each follows the same detailed format as Wave 2-3 tasks with:
- Full CONTEXT, WHY THIS EXISTS, WHAT YOU'RE BUILDING sections
- Complete code examples with full implementations
- Comprehensive TDD tests written FIRST
- Acceptance criteria, testing strategy, implementation hints
- Definition of done

For full expansions of these tasks, refer to the pattern established in Wave 2-3 tasks above.

---

### Task 4.1: Game Canvas Component 🖼️

**CONTEXT**: React-based game using HTML5 Canvas for rendering. Need React component that manages canvas lifecycle, sizing, and integration with game entities.

**Prerequisites**: Task 2.1 (PhysicsEngine), Wave 3 entities complete

**Key Requirements**:
- Create `src/components/Game/Canvas.tsx`
- Manage canvas ref and context
- Handle responsive sizing (maintain aspect ratio)
- Render all entities each frame
- Handle window resize events
- Integrate with useGameLoop hook
- Clear canvas each frame
- Tests for rendering, resizing, cleanup

**Files**: `Canvas.tsx`, `Canvas.module.css`, `Canvas.test.tsx`

**Acceptance Criteria**: Responsive canvas, renders entities, handles resize, >90% coverage

---

### Task 4.2: HUD Component 📊

**CONTEXT**: Heads-up display showing game stats (score, time, stars, level)

**Prerequisites**: Task 2.2 (GameContext), `useGameState` hook

**Key Requirements**:
- Create `src/components/UI/HUD.tsx`
- Display score, time elapsed, stars collected/total, level number
- Pause button (calls pauseGame action)
- Use `useGameState()` to get current state
- Format time as MM:SS
- Mobile-friendly (fixed position, doesn't block gameplay)
- Tests for display, pause button, time formatting

**Files**: `HUD.tsx`, `HUD.module.css`, `HUD.test.tsx`

**Acceptance Criteria**: Shows all stats, pause works, responsive, >90% coverage

---

### Task 4.3: Menu Components 🎨

**CONTEXT**: Game needs menus for start, pause, win, lose states

**Prerequisites**: Task 2.2 (GameContext)

**Key Requirements**:
- Create `MainMenu.tsx` - Start button, level select button
- Create `PauseMenu.tsx` - Resume, restart, main menu buttons
- Create `WinScreen.tsx` - Shows score, stars, time, next level button
- Create `LoseScreen.tsx` - Retry, main menu buttons
- All buttons ≥44px for touch
- Use `useGameActions()` for state changes
- Tests for all buttons and navigation

**Files**: `MainMenu.tsx`, `PauseMenu.tsx`, `WinScreen.tsx`, `LoseScreen.tsx`, test files

**Acceptance Criteria**: All menus work, touch-friendly, >90% coverage

---

### Task 4.4: Level Selector 🗺️

**CONTEXT**: UI for selecting levels, showing locked/unlocked, star ratings

**Prerequisites**: Task 2.2 (GameContext), Task 5.4 (storage for progress)

**Key Requirements**:
- Create `src/components/UI/LevelSelector.tsx`
- Grid of level cards (responsive)
- Show locked/unlocked (based on progress)
- Show star rating (0-3) per level
- Tap to start level
- Use localStorage to check completion
- Tests for rendering, locked state, selection

**Files**: `LevelSelector.tsx`, `LevelSelector.module.css`, `LevelSelector.test.tsx`

**Acceptance Criteria**: Grid layout, shows progress, touch-friendly, >90% coverage

---

## 🔴 Wave 5: Level System & Integration

### Task 5.1: Level Data Structure 📋

**CONTEXT**: Need level definitions (ball start, goal, obstacles, stars placement)

**Prerequisites**: Types defined in Task 1.4

**Key Requirements**:
- Create `src/levels/levelData.ts` with 3-5 levels
- Each level: id, name, ball position, goal, obstacles array, stars array, gravity, timeLimit
- Create `src/levels/loader.ts` with validation
- Validate level data (all positions within bounds)
- Tests for loader, validation, error handling

**Example Level**:
```typescript
{
  id: 1,
  name: "First Steps",
  ball: { position: { x: 100, y: 100 }, radius: 20, mass: 1 },
  goal: { position: { x: 700, y: 500 }, radius: 30 },
  obstacles: [{ type: 'rectangle', position: { x: 400, y: 300 }, width: 100, height: 20 }],
  stars: [{ id: 'star1', position: { x: 400, y: 200 }, radius: 15 }],
  gravity: { x: 0, y: 1 },
  timeLimit: 60
}
```

**Files**: `levelData.ts`, `loader.ts`, `loader.test.ts`

**Acceptance Criteria**: 3-5 levels defined, validated, tests 100% coverage

---

### Task 5.2: Scoring System 🏆

**CONTEXT**: Calculate score from time, stars, completion

**Prerequisites**: Task 1.4 (SCORING constants)

**Key Requirements**:
- Create `src/utils/scoring.ts`
- Calculate base score (level complete)
- Add star bonuses (100pts each)
- Add time bonus (faster = more points)
- Calculate star rating (1-3 stars)
- Perfect bonus (all stars)
- Pure functions, fully tested

**Functions**:
```typescript
calculateScore(timeElapsed, starsCollected, totalStars, timeLimit): number
calculateStarRating(score, maxScore): 1 | 2 | 3
```

**Files**: `scoring.ts`, `scoring.test.ts`

**Acceptance Criteria**: All scoring logic, 100% test coverage

---

### Task 5.3: Collision Handlers 💥

**CONTEXT**: Detect and handle collisions (ball-star, ball-goal, ball-obstacle)

**Prerequisites**: Task 2.1 (Physics), Wave 3 (entities)

**Key Requirements**:
- Create `src/utils/collision.ts`
- Parse Matter.js collision events
- Identify collision pairs by label
- Return collision type and involved entities
- Use in game loop to trigger actions
- Tests with mock collision events

**Functions**:
```typescript
handleCollision(event, onStarCollect, onGoalReached)
```

**Files**: `collision.ts`, `collision.test.ts`

**Acceptance Criteria**: Detects all collision types, >95% coverage

---

### Task 5.4: Progress Persistence 💾

**CONTEXT**: Save/load progress to localStorage

**Prerequisites**: Task 2.2 (GameState)

**Key Requirements**:
- Create `src/utils/storage.ts`
- Save level completion (levelId, stars, time, score)
- Load all progress on app start
- Handle corrupted/missing data gracefully
- Versioning for save format
- Tests with mock localStorage

**Functions**:
```typescript
saveProgress(levelId, stars, time, score): void
loadProgress(): SavedGameData
clearProgress(): void
```

**Files**: `storage.ts`, `storage.test.ts`

**Acceptance Criteria**: Save/load works, handles errors, 100% coverage

---

## ⚫ Wave 6: Final Integration

### Task 6.1: Main Game Component Integration 🎯

**CONTEXT**: Bring together all systems into playable game

**Prerequisites**: ALL previous tasks complete

**Key Requirements**:
- Create `src/components/Game/Game.tsx`
- Initialize PhysicsEngine
- Load level data
- Create all entities (ball, obstacles, stars, goal)
- Start game loop (useGameLoop)
- Handle collisions (collect stars, reach goal)
- Integrate touch controls (useTouch)
- Update game state (time, score, stars)
- Render all entities to canvas
- Handle win/lose conditions
- Level transitions
- Integration tests for full flow
- Performance: maintain 60fps

**This is the critical task that makes everything work together!**

**Files**: `Game.tsx`, `Game.module.css`, `GameFlow.test.tsx` (integration)

**Acceptance Criteria**: Full game playable, all systems integrated, 60fps, integration tests pass

---

## 📦 Wave 7: Polish & Deployment

### Task 7.1: Styling & Responsive Design 🎨

**Prerequisites**: All UI components exist

**Key Requirements**:
- CSS Modules for all components
- Mobile-first approach
- Test on viewport sizes: 320px, 768px, 1024px
- Landscape/portrait support
- Touch targets ≥44px verified
- Consistent color scheme (from constants)
- Smooth transitions/animations

**Acceptance Criteria**: Works on all screen sizes, polished look

---

### Task 7.2: Performance Optimization ⚡

**Prerequisites**: Game fully working

**Key Requirements**:
- Bundle analysis (check size)
- Lazy load menus
- Memoize expensive components
- Verify 60fps on mobile
- Check for memory leaks (DevTools)
- Lighthouse audit (score >90)

**Acceptance Criteria**: <500KB bundle, 60fps, no leaks, Lighthouse >90

---

### Task 7.3: README & Documentation 📚

**Prerequisites**: Game complete

**Key Requirements**:
- Update README.md (game rules, controls, dev setup)
- Document component architecture
- Add screenshots/GIFs
- Deployment instructions
- Contributing guidelines

**Acceptance Criteria**: Comprehensive docs, screenshots included

---

## 📋 Summary

**Total Tasks**: 24
**Wave 1**: ✅ Complete (4 tasks)
**Wave 2**: 🟢 Ready (4 tasks - fully expanded)
**Wave 3**: 🟢 Ready (4 tasks - fully expanded)
**Wave 4**: 🟡 Outlined (4 tasks - abbreviated)
**Wave 5**: 🟡 Outlined (4 tasks - abbreviated)
**Wave 6**: 🟡 Outlined (1 task - abbreviated)
**Wave 7**: 🟡 Outlined (3 tasks - abbreviated)

**Note**: Waves 2-3 provide the full template format. Waves 4-7 can be expanded following the same pattern when agents begin work on them.
