import { UP, RIGHT, DOWN, LEFT } from "./input.js";
import { GameObject, Sprite } from "./gameObject.js";
import { TILE_SIZE } from "../main.js";

interface Position {
  x: number;
  y: number;
}

interface Game {
  world: any;
  input: any;
  eventUpdate: boolean;
  eventTimer: number;
  eventInterval: number;
  debug: boolean;
}

export class Hero extends GameObject {
  speed: number;
  maxFrame: number;
  moving: boolean;

  constructor({
    game,
    sprite,
    position,
    scale,
  }: {
    game: Game;
    sprite: Sprite;
    position?: Position;
    scale?: number;
  }) {
    super({ game, sprite, position, scale });
    this.speed = 75;
    this.maxFrame = 8;
    this.moving = false;
  }
  update(deltaTime: number): void {
    let nextX = this.destinationPosition.x;
    let nextY = this.destinationPosition.y;

    const scaledSpeed = this.speed * (deltaTime / 1000);

    const distance = this.moveTowards(this.destinationPosition, scaledSpeed);
    const arrived = distance < scaledSpeed;
    if (arrived) {
      if (this.game.input.lastKey === UP) {
        nextY -= TILE_SIZE;
        // this.position.y--;
        this.sprite.y = 8;
        console.log("Moving up...");
      } else if (this.game.input.lastKey === RIGHT) {
        nextX += TILE_SIZE;
        // this.position.x++;
        this.sprite.y = 11;
        console.log("Moving right...");
      } else if (this.game.input.lastKey === DOWN) {
        nextY += TILE_SIZE;
        // this.position.y++;
        this.sprite.y = 10;
        console.log("Moving down...");
      } else if (this.game.input.lastKey === LEFT) {
        nextX -= TILE_SIZE;
        // this.position.x--;
        this.sprite.y = 9;
        console.log("Moving left...");
      }
      const row = nextY / TILE_SIZE;
      const col = nextX / TILE_SIZE;
      if (
        this.game.world.getTile(
          this.game.world.level1.collisionLayer,
          row,
          col,
        ) === 0
      ) {
        this.destinationPosition.x = nextX;
        this.destinationPosition.y = nextY;
      }
    }
    if (this.game.input.keys.length > 0 || !arrived) {
      this.moving = true;
    } else {
      this.moving = false;
    }
    if (this.game.eventUpdate && this.moving) {
      this.sprite.x < this.maxFrame ? this.sprite.x++ : (this.sprite.x = 0);
      // this.sprite.x = 0;
    } else if (!this.moving) {
      this.sprite.x = 0;
    }
  }
}
