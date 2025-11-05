import Matter from 'matter-js';
import { Entity } from './Entity';
import { Vector2D } from '../../types';
import { GOAL } from '../../utils/constants';
import { PhysicsEngine } from '../Physics';

export interface GoalOptions {
  position: Vector2D;
  radius?: number;
  color?: string;
  glowColor?: string;
}

/**
 * Goal entity - the target area that the player must reach to complete a level.
 * The goal is a static sensor (detects collisions but doesn't physically interact).
 * Features animated glow effect and pulsing animation.
 */
export class Goal extends Entity {
  private readonly radius: number;
  private readonly color: string;
  private readonly glowColor: string;
  private animationTime: number = 0;
  private reached: boolean = false;

  constructor(physicsEngine: PhysicsEngine, options: GoalOptions, id: string = 'goal') {
    const radius = options.radius ?? GOAL.RADIUS;

    // Create physics body as a sensor (detects collisions but doesn't physically interact)
    const body = physicsEngine.createCircle(
      options.position.x,
      options.position.y,
      radius,
      {
        isStatic: true,
        label: `goal-${id}`,
      }
    );

    // Make it a sensor so the ball can pass through and trigger win condition
    body.isSensor = true;

    super(body, id, 'goal');

    this.radius = radius;
    this.color = options.color ?? GOAL.COLOR;
    this.glowColor = options.glowColor ?? GOAL.GLOW_COLOR;
  }

  /**
   * Get goal radius
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * Check if goal has been reached
   */
  public isReached(): boolean {
    return this.reached;
  }

  /**
   * Set goal as reached
   */
  public setReached(reached: boolean): void {
    this.reached = reached;
  }

  /**
   * Update animation state
   */
  public update(deltaTime: number): void {
    this.animationTime += deltaTime * GOAL.ANIMATION_SPEED;
  }

  /**
   * Render goal to canvas with animated glow effect
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const pos = this.getPosition();

    ctx.save();

    // Calculate pulsing animation (0.9 to 1.1 scale)
    const pulseScale = 1 + Math.sin(this.animationTime * Math.PI * 2) * 0.1;
    const currentRadius = this.radius * pulseScale;

    // Draw glow effect (larger radius, semi-transparent)
    const glowRadius = currentRadius * 1.5;
    const gradient = ctx.createRadialGradient(
      pos.x,
      pos.y,
      currentRadius * 0.5,
      pos.x,
      pos.y,
      glowRadius
    );

    if (this.reached) {
      // Brighter glow when reached
      gradient.addColorStop(0, this.glowColor + 'CC'); // 80% opacity
      gradient.addColorStop(0.5, this.glowColor + '66'); // 40% opacity
      gradient.addColorStop(1, this.glowColor + '00'); // Transparent
    } else {
      // Normal glow
      gradient.addColorStop(0, this.glowColor + '66'); // 40% opacity
      gradient.addColorStop(0.5, this.glowColor + '33'); // 20% opacity
      gradient.addColorStop(1, this.glowColor + '00'); // Transparent
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw main goal circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.reached ? this.glowColor : this.color;
    ctx.fill();

    // Draw checkered pattern inside
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw target rings (concentric circles)
    const ringCount = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    for (let i = 1; i <= ringCount; i++) {
      const ringRadius = (currentRadius / (ringCount + 1)) * i;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw center dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw flag or indicator if reached
    if (this.reached) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', pos.x, pos.y);
    }

    ctx.restore();
  }
}
