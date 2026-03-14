import { TILE_SIZE } from "../main.js";

export interface Position {
  x: number;
  y: number;
}

/**
 * Visual indicator for highlighting tiles on the canvas
 */
export class VisualIndicator {
  private targetPosition: Position | null;
  private blinkTimer: number;
  private isVisible: boolean;
  private readonly BLINK_INTERVAL = 500; // milliseconds

  constructor() {
    this.targetPosition = null;
    this.blinkTimer = 0;
    this.isVisible = true;
  }

  /**
   * Set the target tile to highlight
   * @param position Position of the tile (in pixels)
   */
  setTarget(position: Position | null): void {
    this.targetPosition = position;
    if (position) {
      this.blinkTimer = 0;
      this.isVisible = true;
    }
  }

  /**
   * Get the current target position
   */
  getTarget(): Position | null {
    return this.targetPosition;
  }

  /**
   * Clear the target indicator
   */
  clear(): void {
    this.targetPosition = null;
    this.blinkTimer = 0;
    this.isVisible = true;
  }

  /**
   * Update the blink animation
   * @param deltaTime Time elapsed since last frame in milliseconds
   */
  update(deltaTime: number): void {
    if (!this.targetPosition) return;

    this.blinkTimer += deltaTime;
    
    // Toggle visibility every BLINK_INTERVAL ms
    if (this.blinkTimer >= this.BLINK_INTERVAL) {
      this.isVisible = !this.isVisible;
      this.blinkTimer = 0;
    }
  }

  /**
   * Draw the blinking indicator on the canvas
   * @param ctx Canvas rendering context
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.targetPosition || !this.isVisible) return;

    const x = this.targetPosition.x;
    const y = this.targetPosition.y;

    // Draw blinking red stroke around the tile
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.globalAlpha = 1.0;

    // Draw a subtle red fill when visible
    ctx.fillStyle = "rgba(255, 68, 68, 0.15)";
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
}
