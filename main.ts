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
    activeHeroIndex!: number;
    input!: Input;
    camera!: Camera;
    eventUpdate!: boolean;
    eventTimer!: number;
    eventInterval!: number;
    debug!: boolean;

    constructor() {
      this.world = new World();
      this.activeHeroIndex = -1;

      // Helper to generate a random walkable coordinate
      const getRandomSafePosition = (): Position => {
         let row, col;
         do {
            row = Math.floor(Math.random() * ROWS);
            col = Math.floor(Math.random() * COLS);
         } while (this.world.getTile(this.world.level1.collisionLayer, row, col) === 1);
         return { x: col * TILE_SIZE, y: row * TILE_SIZE };
      };

      this.heroes = [
        new Hero({
          game: this,
          name: "Majnu",
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
          position: getRandomSafePosition(),
          scale: 1,
          indicatorColor: "119, 212, 255", // Cyan for Majnu
          gender: 'male',
        }),
        new Hero({
          game: this,
          name: "Laila",
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
          position: getRandomSafePosition(),
          scale: 1,
          indicatorColor: "224, 179, 255", // Purple for Laila
          gender: 'female',
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

  const updateInfoPanelLayout = () => {
    if (infoPanel) {
      infoPanel.innerHTML = game.heroes.map((hero, index) => {
        const isActive = index === game.activeHeroIndex;
        return `
        <div class="hero-info ${isActive ? 'active-hero' : ''}" id="hero-info-${index}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h3 style="margin: 0;">${hero.name}</h3>
            <button class="active-toggle-btn ${isActive ? 'is-active' : ''}" id="hero-btn-${index}" data-index="${index}">
              ${isActive ? 'Active' : (game.activeHeroIndex === -1 ? 'Select' : 'Set Active')}
            </button>
          </div>
          <p><span>Health:</span> <span class="stat-value" id="hero-health-${index}">${Math.floor(hero.health)}</span></p>
          <p><span>Energy:</span> <span class="stat-value" id="hero-energy-${index}">${Math.floor(hero.energy)}</span></p>
          <p><span>Speed:</span> <span class="stat-value" id="hero-speed-${index}">${hero.moving ? Math.floor(hero.speed) : 0}</span></p>
          <p><span>Fertility:</span> <span class="stat-value" id="hero-fertility-${index}">${Math.floor(hero.fertilityMeter)}%</span></p>
          <div id="hero-status-${index}" style="color: #ffcc00; font-size: 0.8em; margin-top: 4px; font-weight: bold;"></div>
        </div>
      `}).join('');
    }
  };

  // Initialize Info Panel HTML once
  updateInfoPanelLayout();

  // Use event delegation for the toggle buttons outside the loop
  if (infoPanel) {
    infoPanel.addEventListener('click', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.active-toggle-btn') as HTMLElement;
      console.log("Clicked info panel, button found:", !!target);
      
      if (target) {
        // Stop the click from registering as a map movement click underneath the UI
        e.stopPropagation();
        
        const index = parseInt(target.getAttribute('data-index') || "0");
        
        // Toggle off if clicking the already-active hero, otherwise set to new index
        if (game.activeHeroIndex === index) {
          console.log(`Toggling OFF active hero (was index ${index})`);
          game.activeHeroIndex = -1;
        } else {
          console.log(`Setting active hero to index ${index}`);
          game.activeHeroIndex = index;
          
          // Clear any stale inputs that were queued while no hero was active
          game.input.clearClickPosition();
          game.input.keys = [];
          
          console.log(`Active hero changed to: ${game.heroes[index].name} (Index ${index})`);
        }
      }
    });
  }

  function animate(timestamp: number) {
    requestAnimationFrame(animate);
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    game.render(ctx, deltaTime);

    // Reproduction System Loop
    const readyHeroes = game.heroes.filter(h => h.fertilityMeter >= 80 && !h.isReproducing);
    const males = readyHeroes.filter(h => h.gender === 'male');
    const females = readyHeroes.filter(h => h.gender === 'female');

    for (const male of males) {
      for (const female of females) {
        // Check if they are already reproducing together (implicit via timer)
        if (male.isReproducing || female.isReproducing) continue;

        const maleTile = { x: Math.round(male.position.x / TILE_SIZE), y: Math.round(male.position.y / TILE_SIZE) };
        const femaleTile = { x: Math.round(female.position.x / TILE_SIZE), y: Math.round(female.position.y / TILE_SIZE) };
        
        const dist = Math.abs(maleTile.x - femaleTile.x) + Math.abs(maleTile.y - femaleTile.y);
        
        if (dist === 1) {
          // Adjacent and ready!
          male.startReproducing();
          female.startReproducing();
          
          // Child spawn callback (simulated after duration)
          setTimeout(() => {
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const name = gender === 'male' ? "Junior " + male.name : "Mini " + female.name;
            const spriteId = gender === 'male' ? "hero1" : "hero2";
            
            // Find a nearby empty tile for the baby
            const directions = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
            let babyPos = { x: male.position.x, y: male.position.y };
            for (const d of directions) {
              const testRow = maleTile.y + d.y;
              const testCol = maleTile.x + d.x;
              if (game.world.getTile(game.world.level1.collisionLayer, testRow, testCol) === 0) {
                 babyPos = { x: testCol * TILE_SIZE, y: testRow * TILE_SIZE };
                 break;
              }
            }

            const baby = new Hero({
              game: game,
              name: name,
              health: 50,
              energy: 50,
              speed: 60,
              sprite: {
                image: document.getElementById(spriteId) as HTMLImageElement,
                x: 0,
                y: 0,
                width: 64,
                height: 64,
              },
              position: babyPos,
              scale: 0.5,
              gender: gender,
              indicatorColor: gender === 'male' ? "119, 212, 255" : "224, 179, 255"
            });
            
            game.heroes.push(baby);
            updateInfoPanelLayout();
            console.log(`A new hero was born: ${name}!`);
          }, 5000);
        } else if (!male.moving && !female.moving) {
           // Find a tile adjacent to female for male to move to
           const directions = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
           for (const d of directions) {
             const targetTileX = femaleTile.x + d.x;
             const targetTileY = femaleTile.y + d.y;
             if (targetTileX >= 0 && targetTileX < COLS && targetTileY >= 0 && targetTileY < ROWS) {
               if (game.world.getTile(game.world.level1.collisionLayer, targetTileY, targetTileX) === 0) {
                 male.navigateToTile({ x: targetTileX * TILE_SIZE, y: targetTileY * TILE_SIZE });
                 break;
               }
             }
           }
        }
      }
    }

    // Update Info Panel stats dynamically without destroying nodes
    if (infoPanel) {
      game.heroes.forEach((hero, index) => {
        const isActive = index === game.activeHeroIndex;

        // Update stats
        const healthEl = document.getElementById(`hero-health-${index}`);
        if (healthEl) healthEl.innerText = Math.floor(hero.health).toString();

        const energyEl = document.getElementById(`hero-energy-${index}`);
        if (energyEl) energyEl.innerText = Math.floor(hero.energy).toString();

        const speedEl = document.getElementById(`hero-speed-${index}`);
        if (speedEl) speedEl.innerText = (hero.moving ? Math.floor(hero.speed) : 0).toString();

        const fertilityEl = document.getElementById(`hero-fertility-${index}`);
        if (fertilityEl) fertilityEl.innerText = Math.floor(hero.fertilityMeter) + "%";

        const statusEl = document.getElementById(`hero-status-${index}`);
        if (statusEl) {
          statusEl.innerText = hero.isReproducing ? "Engaging in reproduction..." : "";
        }

        // Update UI dynamic styling
        const infoDiv = document.getElementById(`hero-info-${index}`);
        if (infoDiv) {
          if (isActive) infoDiv.classList.add('active-hero');
          else infoDiv.classList.remove('active-hero');
        }

        const btn = document.getElementById(`hero-btn-${index}`);
        if (btn) {
          if (isActive) {
            btn.classList.add('is-active');
            btn.innerText = 'Active';
          } else {
            btn.classList.remove('is-active');
            btn.innerText = game.activeHeroIndex === -1 ? 'Select' : 'Set Active';
          }
        }
      });
    }
  }
  requestAnimationFrame(animate);

});
