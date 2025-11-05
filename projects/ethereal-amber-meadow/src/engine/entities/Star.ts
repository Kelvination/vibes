import { Entity } from './Entity';
import { Vector2D, StarConfig } from '../../types';
import { PhysicsEngine } from '../Physics';

/**
 * Star (collectible) entity
 * Static, sensor body that detects when the ball collects it
 */
export class Star extends Entity {
  private readonly radius: number;
  private collected: boolean = false;
  private collectionTimestamp: number | null = null;
  private rotationAngle: number = 0;
  private pulseTime: number = 0;
  private readonly rotationSpeed: number = Math.PI; // Radians per second
  private readonly pulseSpeed: number = 3; // Cycles per second

  constructor(physics: PhysicsEngine, config: StarConfig) {
    // Create a circular sensor body (doesn't physically collide)
    const body = physics.createCircle(
      config.position.x,
      config.position.y,
      config.radius,
      {
        isStatic: true,
        label: `star-${config.id}`,
      }
    );

    // Make it a sensor so it doesn't physically collide
    body.isSensor = true;

    super(body, config.id, 'star');

    this.radius = config.radius;
  }

  /**
   * Mark star as collected
   */
  public collect(): void {
    if (!this.collected) {
      this.collected = true;
      this.collectionTimestamp = Date.now();
    }
  }

  /**
   * Check if star has been collected
   */
  public isCollected(): boolean {
    return this.collected;
  }

  /**
   * Get timestamp when star was collected
   */
  public getCollectionTimestamp(): number | null {
    return this.collectionTimestamp;
  }

  /**
   * Get star radius
   */
  public getRadius(): number {
    return this.radius;
  }

  /**
   * Get current rotation angle for animation
   */
  public getRotationAngle(): number {
    return this.rotationAngle;
  }

  /**
   * Get current pulse scale for animation
   */
  public getPulseScale(): number {
    // Sine wave oscillation between 0.9 and 1.1 (or 0.8 to 1.2)
    const amplitude = 0.1;
    const baseline = 1.0;
    return baseline + amplitude * Math.sin(this.pulseTime * this.pulseSpeed * Math.PI * 2);
  }

  /**
   * Update star animation
   */
  public update(deltaTime: number): void {
    if (!this.collected) {
      // Update rotation
      this.rotationAngle += this.rotationSpeed * deltaTime;
      if (this.rotationAngle >= Math.PI * 2) {
        this.rotationAngle -= Math.PI * 2;
      }

      // Update pulse time
      this.pulseTime += deltaTime;
    }
  }

  /**
   * Render star to canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Don't render if collected
    if (this.collected) {
      return;
    }

    ctx.save();

    const pos = this.getPosition();
    const scale = this.getPulseScale();
    const rotation = this.rotationAngle;

    // Move to star position
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Draw star shape
    this.drawStar(ctx, 0, 0, this.radius, this.radius * 0.5, 5);

    ctx.restore();
  }

  /**
   * Draw a star shape
   * @param ctx Canvas context
   * @param cx Center X
   * @param cy Center Y
   * @param outerRadius Outer radius of star points
   * @param innerRadius Inner radius between points
   * @param points Number of star points
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    points: number
  ): void {
    const step = Math.PI / points;

    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2; // Start from top
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    // Fill star
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.fill();

    // Stroke outline
    ctx.strokeStyle = '#FFA500'; // Orange outline
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add a highlight/glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  }
}
