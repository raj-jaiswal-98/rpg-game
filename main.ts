import { Input } from "./scripts/input.js";
import World from "./scripts/world.js";
import { Hero } from "./scripts/hero.js";

export const TILE_SIZE = 32;
export const ROWS = 20;
export const COLS = 15;
export const GAME_WIDTH = TILE_SIZE * COLS;
export const GAME_HEIGHT = TILE_SIZE * ROWS;
export const FPS = 60;
export const HALF_TILE = TILE_SIZE / 2;

interface Sprite {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

interface GameObject {
  game: Game;
  sprite: Sprite;
  position: Position;
  scale: number;
  destinationPosition: Position;
  distanceToTravel: Position;
  width: number;
  height: number;
  halfWidth: number;
  moveTowards(destinationPosition: Position, speed: number): number;
  draw(ctx: CanvasRenderingContext2D): void;
}

interface Game {
  world: World;
  hero: Hero;
  input: Input;
  eventUpdate: boolean;
  eventTimer: number;
  eventInterval: number;
  debug: boolean;
  render(ctx: CanvasRenderingContext2D, deltaTime: number): void;
}

window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  class Game {
    world!: World;
    hero!: Hero;
    input!: Input;
    eventUpdate!: boolean;
    eventTimer!: number;
    eventInterval!: number;
    debug!: boolean;

    constructor() {
      this.world = new World();
      this.hero = new Hero({
        game: this,
        sprite: {
          image: document.getElementById("hero1") as HTMLImageElement,
          x: 0,
          y: 0,
          width: 64,
          height: 64,
        },
        position: { x: 1 * TILE_SIZE, y: 2 * TILE_SIZE },
        scale: 1,
      });
      // this.hero2 = new Hero({
      //     game: this,
      //     sprite:{
      //         image: document.getElementById('hero2'),
      //         x: 0,
      //         y: 0,
      //         width: 64,
      //         height: 64
      //     },
      //     position: { x: 3 * TILE_SIZE, y: 19 * TILE_SIZE },
      // });
      this.input = new Input();

      this.eventUpdate = false;
      this.eventTimer = 0;
      this.eventInterval = 50;
      this.debug = false;
    }
    render(ctx: CanvasRenderingContext2D, deltaTime: number) {
      this.hero.update(deltaTime);
      // this.hero2.update(deltaTime);
      this.world.drawBackground(ctx);
      // this.world.drawGrid(ctx);
      this.hero.draw(ctx);
      // this.hero2.draw(ctx);
      this.hero.drawTargetIndicator(ctx);
      this.world.drawForeground(ctx);
      // this.world.drawCollisionGrid(ctx);

      if (this.eventTimer < this.eventInterval) {
        this.eventTimer += deltaTime;
        this.eventUpdate = false;
      } else {
        this.eventTimer = 0;
        this.eventUpdate = true;
      }
    }
  }
  const game = new Game();
  let lastTime = 0;

  function animate(timestamp: number) {
    requestAnimationFrame(animate);
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    // console.log(deltaTime);
    game.render(ctx, deltaTime);

    // console.log("Animating...");
  }
  requestAnimationFrame(animate);
});
