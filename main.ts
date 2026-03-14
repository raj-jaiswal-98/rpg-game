import { Input } from "./scripts/input.js";
import World from "./scripts/world.js";
import { Hero } from "./scripts/hero.js";
import { Camera } from "./scripts/camera.js";

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
  heroes: Hero[];
  input: Input;
  camera: Camera;
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
    heroes!: Hero[];
    input!: Input;
    camera!: Camera;
    eventUpdate!: boolean;
    eventTimer!: number;
    eventInterval!: number;
    debug!: boolean;

    constructor() {
      this.world = new World();
      this.heroes = [
        new Hero({
          game: this,
          name: "Hero 1",
          health: 100,
          energy: 100,
          speed: 80,
          sprite: {
            image: document.getElementById("hero1") as HTMLImageElement,
            x: 0,
            y: 0,
            width: 64,
            height: 64,
          },
          position: { x: 1 * TILE_SIZE, y: 2 * TILE_SIZE },
          scale: 1,
        }),
        new Hero({
          game: this,
          name: "Hero 2",
          health: 120,
          energy: 90,
          speed: 70,
          sprite: {
             image: document.getElementById("hero2") as HTMLImageElement,
             x: 0,
             y: 0,
             width: 64,
             height: 64
          },
          position: { x: 3 * TILE_SIZE, y: 19 * TILE_SIZE },
          scale: 1,
        })
      ];
      this.input = new Input();
      this.camera = new Camera(0, 0, 1);

      this.eventUpdate = false;
      this.eventTimer = 0;
      this.eventInterval = 50;
      this.debug = false;
    }
    render(ctx: CanvasRenderingContext2D, deltaTime: number) {
      this.heroes.forEach(h => h.update(deltaTime));
      
      ctx.save();
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      this.world.drawBackground(ctx);
      this.heroes.forEach(h => h.draw(ctx));
      this.heroes.forEach(h => h.drawTargetIndicator(ctx));
      this.world.drawForeground(ctx);

      ctx.restore();

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

  // Set up camera UI controls
  const panSpeed = 20;

  document.getElementById("camera-up")?.addEventListener("click", () => game.camera.y -= panSpeed);
  document.getElementById("camera-down")?.addEventListener("click", () => game.camera.y += panSpeed);
  document.getElementById("camera-left")?.addEventListener("click", () => game.camera.x -= panSpeed);
  document.getElementById("camera-right")?.addEventListener("click", () => game.camera.x += panSpeed);
  document.getElementById("camera-reset")?.addEventListener("click", () => {
    game.camera.x = 0;
    game.camera.y = 0;
    game.camera.zoom = 1;
    const zoomSlider = document.getElementById("camera-zoom") as HTMLInputElement;
    if (zoomSlider) zoomSlider.value = "1";
  });

  document.getElementById("camera-zoom")?.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    game.camera.zoom = parseFloat(target.value);
  });

  const infoPanel = document.getElementById("info-panel") as HTMLDivElement;

  function animate(timestamp: number) {
    requestAnimationFrame(animate);
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    game.render(ctx, deltaTime);

    // Update Info Panel
    if (infoPanel) {
      infoPanel.innerHTML = game.heroes.map(hero => `
        <div class="hero-info">
          <h3>${hero.name}</h3>
          <p><span>Health:</span> <span class="stat-value">${Math.floor(hero.health)}</span></p>
          <p><span>Energy:</span> <span class="stat-value">${Math.floor(hero.energy)}</span></p>
          <p><span>Speed:</span> <span class="stat-value">${Math.floor(hero.speed)}</span></p>
        </div>
      `).join('');
    }
  }
  requestAnimationFrame(animate);
});
