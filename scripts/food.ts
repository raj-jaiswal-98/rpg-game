import { GameObject, Sprite } from "./gameObject.js";

export type FoodType = 'fastfood' | 'meal';

export class Food extends GameObject {
  type: FoodType;
  eatTime: number; // in milliseconds
  energyValue: number;
  isSpawning: boolean;

  constructor({
    game,
    sprite,
    position,
    type,
  }: {
    game: any;
    sprite: Sprite;
    position: { x: number; y: number };
    type: FoodType;
  }) {
    super({ game, sprite, position, scale: 0.5 });
    console.log(`[DEBUG] Food instance created. Sprite image src: ${this.sprite.image.src}`);
    this.type = type;
    this.eatTime = type === 'fastfood' ? 2000 : 5000;
    this.energyValue = type === 'fastfood' ? 30 : 100;
    this.isSpawning = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Simple pulse effect for spawning
    ctx.save();
    if (this.isSpawning) {
      const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
      ctx.translate(this.position.x + 16, this.position.y + 16);
      ctx.scale(pulse, pulse);
      ctx.translate(-(this.position.x + 16), -(this.position.y + 16));
    }
    super.draw(ctx);
    ctx.restore();
  }
}
