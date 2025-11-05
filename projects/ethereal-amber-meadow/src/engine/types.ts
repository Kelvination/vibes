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
