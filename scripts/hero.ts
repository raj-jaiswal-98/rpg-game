import { UP, RIGHT, DOWN, LEFT } from "./input.js";
import { GameObject, Sprite } from "./gameObject.js";
import { TILE_SIZE, HALF_TILE } from "../main.js";
import { Pathfinder } from "./pathfinder.js";
import { CollisionChecker } from "./collision.js";
import { Toast } from "./toast.js";
import { VisualIndicator } from "./visualIndicator.js";

interface Position {
  x: number;
  y: number;
}

interface HeroConfig {
  game: Game;
  sprite: Sprite;
  position?: Position;
  scale?: number;
  name?: string;
  health?: number;
  maxHealth?: number;
  maxEnergy?: number;
  energy?: number;
  speed?: number;
  indicatorColor?: string;
  gender?: 'male' | 'female';
  familyId?: string;
  socialStatus?: number;
  fertilityMeter?: number;
  angerMeter?: number;
  isDead?: boolean;
}

interface Game {
  world: any;
  heroes: Hero[];
  activeHeroIndex: number;
  input: any;
  camera: any;
  eventUpdate: boolean;
  eventTimer: number;
  eventInterval: number;
  debug: boolean;
  isTileOccupied(row: number, col: number, excludeHero?: Hero): boolean;
}

export class Hero extends GameObject {
  game: Game;
  name: string;
  health: number;
  maxHealth: number;
  maxEnergy: number;
  energy: number;
  speed: number;
  indicatorColor: string;
  maxFrame: number;
  moving: boolean;
  targetPosition: Position | null;
  path: Position[];
  pathfinder: Pathfinder;
  collisionChecker: CollisionChecker;
  visualIndicator: VisualIndicator;
  isBlocked: boolean;
  waitTimer: number;
  blockedRetryCount: number;
  gender: 'male' | 'female';
  fertilityMeter: number;
  isReproducing: boolean;
  reproductionTimer: number;
  angerMeter: number;
  socialStatus: number;
  familyId: string;
  isDead: boolean;
  intendedFoodPos: Position | null;
  private readonly WAIT_THRESHOLD: number;
  private readonly REPRODUCTION_DURATION = 5000; // 5 seconds

  constructor({
    game,
    sprite,
    position,
    scale,
    name = "Laila",
    health = 100,
    maxHealth,
    maxEnergy = 100,
    energy = 50,
    speed = 75,
    indicatorColor = "255, 68, 68",
    gender = 'female',
    familyId = Math.random().toString(36).substr(2, 9),
    socialStatus = 0,
    fertilityMeter = 50,
    angerMeter = 0,
    isDead = false,
  }: HeroConfig) {
    super({ game, sprite, position, scale });
    this.game = game;
    this.name = name;
    this.maxHealth = maxHealth ?? health;
    this.health = health;
    this.maxEnergy = maxEnergy;
    this.energy = energy;
    this.speed = speed;
    this.indicatorColor = indicatorColor;
    this.gender = gender;
    this.familyId = familyId;
    this.socialStatus = socialStatus;
    this.fertilityMeter = fertilityMeter;
    this.angerMeter = angerMeter;
    this.isReproducing = false;
    this.isDead = isDead;
    this.intendedFoodPos = null;
    this.reproductionTimer = 0;
    this.maxFrame = 8;
    this.moving = false;
    
    console.log(`[HERO_INIT] ${this.name} initialized with Health: ${this.health}/${this.maxHealth}, Energy: ${this.energy}/${this.maxEnergy}`);
    this.targetPosition = null;
    this.path = [];
    this.isBlocked = false;
    this.waitTimer = 0;
    this.blockedRetryCount = 0;
    // Add 0-500ms jitter to prevent synchronized re-pathing
    this.WAIT_THRESHOLD = 1000 + Math.random() * 500;

    const isTileOccupied = (row: number, col: number) => {
      console.log(`[HERO_NAV] ${this.name} checking tile (${col}, ${row}) for occupancy.`);
      return (this.game as any).isTileOccupied(row, col, this);
    };

    // Initialize pathfinding and collision checking
    this.collisionChecker = new CollisionChecker({
      collisionLayer: this.game.world.level1.collisionLayer,
      getTile: this.game.world.getTile.bind(this.game.world),
      isTileOccupied,
    });
    this.pathfinder = new Pathfinder({
      collisionLayer: this.game.world.level1.collisionLayer,
      getTile: this.game.world.getTile.bind(this.game.world),
      isTileOccupied,
    });

    // Initialize visual indicator for target tile
    this.visualIndicator = new VisualIndicator(this.indicatorColor);
  }

  /**
   * Navigate towards a target tile by calculating and following the optimal path
   * @param targetPos Target position in pixels
   */
  navigateToTile(targetPos: Position): void {
    // Validate target is walkable
    if (!this.collisionChecker.isPositionWalkable(targetPos)) {
      return; // Already handled by caller with toast
    }

    // Set visual indicator for the target tile
    this.visualIndicator.setTarget(targetPos);

    // Reset blocked state
    this.isBlocked = false;
    this.waitTimer = 0;
    this.blockedRetryCount = 0;

    // Calculate path and start following it
    this.path = this.pathfinder.findPath(this.position, targetPos);
    if (this.path.length > 0) {
      this.targetPosition = this.path[0];
      const { row, col } = this.collisionChecker.getTileCoordinates(targetPos);
      console.log(`Path found! ${this.path.length} tiles to destination (${col}, ${row})`);
    } else {
      const { row, col } = this.collisionChecker.getTileCoordinates(targetPos);
      console.log(`No path found to tile (${col}, ${row})`);
      Toast.warning(`Can't reach tile (${col}, ${row}) - no path available`);
      this.visualIndicator.clear();
    }
  }

  /**
   * Attempt to move to the next tile in a given direction
   * @param dirX Horizontal direction (-1, 0, 1)
   * @param dirY Vertical direction (-1, 0, 1)
   * @param spriteY Sprite Y frame for animation
   * @returns true if move was valid and made, false otherwise
   */
  tryMove(dirX: number, dirY: number, spriteY: number): boolean {
    const nextX = this.destinationPosition.x + dirX * TILE_SIZE;
    const nextY = this.destinationPosition.y + dirY * TILE_SIZE;

    if (this.collisionChecker.canMoveTo(this.position, { x: nextX, y: nextY })) {
      this.destinationPosition.x = nextX;
      this.destinationPosition.y = nextY;
      this.sprite.y = spriteY;
      return true;
    }
    return false;
  }

  /**
   * Check if the hero has reached puberty/adulthood
   */
  isAdult(): boolean {
    return this.health >= 100 && this.scale >= 1;
  }

  update(deltaTime: number): void {
    const scaledSpeed = this.speed * (deltaTime / 1000);

    // Puberty/Growth System
    if (this.scale < 1) {
      // Scale increases with health: 25 HP -> 0.25 scale, 100 HP -> 1.0 scale
      const targetScale = Math.max(0.2, Math.min(1, this.health / 100));
      // Smoothly interpolate towards target scale (10% per frame or similar)
      this.scale += (targetScale - this.scale) * 0.1;
      if (this.scale > 1) this.scale = 1;

      // Update base Sprite.scale from GameObject
      (this as any).scale = this.scale;
      
      // Update dimensions for drawing and collision
      this.width = this.sprite.width * this.scale;
      this.height = this.sprite.height * this.scale;
      this.halfWidth = this.width / 2;
    }

    const activeIndex = (this.game as any).activeHeroIndex;
    const isActive = activeIndex !== -1 && (this.game as any).heroes[activeIndex] === this;

    // Update visual indicator animation
    this.visualIndicator.update(deltaTime);

    // Handle mouse click to navigate to destination
    if (isActive && this.game.input.clickPosition) {
      // Convert raw screen click to world coordinates
      const worldClick = this.game.camera.screenToWorld(this.game.input.clickPosition);

      const targetPos = {
        x: Math.floor(worldClick.x / TILE_SIZE) * TILE_SIZE,
        y: Math.floor(worldClick.y / TILE_SIZE) * TILE_SIZE,
      };

      this.intendedFoodPos = null; // Clear intended food if manually moved

      const { row, col } = this.collisionChecker.getTileCoordinates(targetPos);

      if (!this.collisionChecker.isPositionWalkable(targetPos)) {
        console.log(`[HERO_NAV] ${this.name} blocked from navigating to (${col}, ${row})`);
        Toast.error(`Cannot navigate to blocked tile (${col}, ${row})`);
      } else {
        console.log(`[HERO_NAV] ${this.name} starting navigation to (${col}, ${row})`);
        // Also check if someone else is already targeting this EXACT tile
        let finalTargetBlocked = false;
        for (const other of (this.game as any).heroes) {
          if (other === this || !other.targetPosition) continue;
          const otherTargetRow = Math.round(other.targetPosition.y / TILE_SIZE);
          const otherTargetCol = Math.round(other.targetPosition.x / TILE_SIZE);
          if (row === otherTargetRow && col === otherTargetCol) {
            finalTargetBlocked = true;
            break;
          }
        }

        if (finalTargetBlocked) {
          Toast.error(`Another hero is already headed to tile (${col}, ${row})`);
        } else {
          // Target is walkable and unreserved, proceed with navigation
          this.navigateToTile(targetPos);
        }
      }

      this.game.input.clearClickPosition();
    }

    // Move towards current destination
    const distance = this.moveTowards(this.destinationPosition, scaledSpeed);
    const arrived = distance < scaledSpeed;

    if (arrived) {
      // Keyboard input takes priority - clear path and indicator when keyboard is used
      if (isActive && this.game.input.lastKey === UP) {
        if (this.tryMove(0, -1, 8)) {
          this.path = [];
          this.visualIndicator.clear();
          this.intendedFoodPos = null; // Clear if manually moved
          console.log("Moving up...");
          this.isBlocked = false;
          this.blockedRetryCount = 0;
        } else {
          this.isBlocked = true;
        }
      } else if (isActive && this.game.input.lastKey === RIGHT) {
        if (this.tryMove(1, 0, 11)) {
          this.path = [];
          this.visualIndicator.clear();
          this.intendedFoodPos = null; // Clear if manually moved
          console.log("Moving right...");
          this.isBlocked = false;
          this.blockedRetryCount = 0;
        } else {
          this.isBlocked = true;
        }
      } else if (isActive && this.game.input.lastKey === DOWN) {
        if (this.tryMove(0, 1, 10)) {
          this.path = [];
          this.visualIndicator.clear();
          this.intendedFoodPos = null; // Clear if manually moved
          console.log("Moving down...");
          this.isBlocked = false;
          this.blockedRetryCount = 0;
        } else {
          this.isBlocked = true;
        }
      } else if (isActive && this.game.input.lastKey === LEFT) {
        if (this.tryMove(-1, 0, 9)) {
          this.path = [];
          this.visualIndicator.clear();
          this.intendedFoodPos = null; // Clear if manually moved
          console.log("Moving left...");
          this.isBlocked = false;
          this.blockedRetryCount = 0;
        } else {
          this.isBlocked = true;
        }
      }
      // Follow calculated path if no keyboard input
      else if (this.path.length > 0) {
        this.followPath(deltaTime);
      } else {
        // Path complete, clear indicator
        this.isBlocked = false;
        this.blockedRetryCount = 0;
        this.visualIndicator.clear();
      }
    }

    // Update moving state and drain energy
    if ((isActive && this.game.input.keys.length > 0) || !arrived || this.path.length > 0) {
      this.moving = true;
      if (this.energy > 0 && !this.isBlocked) {
        // Drain energy subtly (e.g., 5 energy units per second) only if actually moving
        this.energy -= deltaTime / 1000 * 5;
        if (this.energy < 0) this.energy = 0;
      } else if (this.energy <= 0 && !this.isBlocked) {
        // Use health to move if out of energy
        this.takeDamage(deltaTime / 1000 * 5); // 5 health per second for moving without energy
      }
    } else {
      this.moving = false;
    }

    // Update animation
    if (this.game.eventUpdate && this.moving && !this.isBlocked && !this.isReproducing) {
      this.sprite.x < this.maxFrame ? this.sprite.x++ : (this.sprite.x = 0);
    } else if (!this.moving || this.isBlocked || this.isReproducing) {
      this.sprite.x = 0;
    }

    // Reproduction logic
    if (this.isReproducing) {
      this.reproductionTimer -= deltaTime;
      if (this.reproductionTimer <= 0) {
        this.isReproducing = false;
        this.fertilityMeter = 0;
        // Reproduction toll
        this.energy = 20;
        this.health = this.health / 2;
      }
    } else if (!this.moving && this.energy > 50) {
      // Increase fertility when idle and energetic
      this.fertilityMeter += deltaTime / 1000 * 2; // +2 per second
      if (this.fertilityMeter > 100) this.fertilityMeter = 100;

      // Decay anger when idle and fed
      this.angerMeter -= deltaTime / 1000 * 1;
      if (this.angerMeter < 0) this.angerMeter = 0;
    }

    // Passive anger increase and health decay when hungry
    if (this.energy <= 0) {
      this.angerMeter += deltaTime / 1000 * 5; // Hunger breeds anger
      this.takeDamage(deltaTime / 1000 * 5); // Starvation: lose 5 health per second
    } else if (this.energy < 20) {
      this.angerMeter += deltaTime / 1000 * 5; // Hunger breeds anger
    }
    if (this.angerMeter > 100) this.angerMeter = 100;
  }

  /**
   * Follow the calculated path one tile at a time
   * @param deltaTime Time elapsed since last frame
   */
  private followPath(deltaTime: number): void {
    if (this.path.length === 0) return;

    const nextTile = this.path[0];
    const { row: nextRow, col: nextCol } = this.collisionChecker.getTileCoordinates(nextTile);
    const { row: currentRow, col: currentCol } = this.collisionChecker.getTileCoordinates(this.position);

    // Move to the next tile in the path
    let moveSuccessful = false;
    if (currentCol < nextCol) {
      moveSuccessful = this.tryMove(1, 0, 11); // Right
    } else if (currentCol > nextCol) {
      moveSuccessful = this.tryMove(-1, 0, 9); // Left
    } else if (currentRow < nextRow) {
      moveSuccessful = this.tryMove(0, 1, 10); // Down
    } else if (currentRow > nextRow) {
      moveSuccessful = this.tryMove(0, -1, 8); // Up
    }

    if (!moveSuccessful) {
      this.isBlocked = true;
      this.waitTimer += deltaTime;

      // If blocked for long enough, try to re-path
      if (this.waitTimer >= this.WAIT_THRESHOLD) {
        this.blockedRetryCount++;
        console.log(`${this.name} is blocked (Retry ${this.blockedRetryCount}). Attempting to re-path...`);

        const finalTarget = this.visualIndicator.getTarget();
        if (finalTarget) {
          // If we've retried many times, maybe the path is truly blocked
          if (this.blockedRetryCount > 3) {
            console.log(`${this.name} is permanently blocked. Giving up move.`);
            this.visualIndicator.clear();
            this.path = [];
            this.isBlocked = false;
            this.blockedRetryCount = 0;
          } else {
            this.navigateToTile(finalTarget);
          }
        }
        this.waitTimer = 0; // Reset timer after re-path attempt
      }
    } else {
      this.isBlocked = false;
      this.waitTimer = 0;
      this.blockedRetryCount = 0;
    }

    // Remove the current tile from path once we move to it
    const { row: newRow, col: newCol } = this.collisionChecker.getTileCoordinates(this.destinationPosition);
    if (newRow === nextRow && newCol === nextCol) {
      this.path.shift();
      if (this.path.length > 0) {
        this.targetPosition = this.path[0];
      }
    }
  }

  /**
   * Take damage and check for death
   */
  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      console.log(`${this.name} has died.`);
      Toast.error(`${this.name} has died.`);
      
      // Family Vengeance
      if (this.game && (this.game as any).heroes) {
        let mourningFamily = false;
        (this.game as any).heroes.forEach((h: Hero) => {
          if (h !== this && !h.isDead && h.familyId === this.familyId) {
            h.angerMeter += 25;
            if (h.angerMeter > 100) h.angerMeter = 100;
            mourningFamily = true;
          }
        });
        if (mourningFamily) {
          console.log(`[HERO_AI] Family of ${this.name} mourns their loss. Anger +25!`);
        }
      }
    }
  }

  /**
   * Attack another hero
   */
  attack(target: Hero): void {
    if (this.isDead || target.isDead || this.familyId === target.familyId) return;

    console.log(`${this.name} is attacking ${target.name}!`);
    
    // Attacking takes a toll on the attacker
    this.energy -= 10;
    if (this.energy < 0) this.energy = 0;
    this.takeDamage(5); // Small health drain
    
    // Deal damage to target
    target.takeDamage(40);
    
    this.angerMeter = 0; // Venting anger instantly neutralizes it

    // Social penalty for aggression
    this.socialStatus -= 15;
    if (this.socialStatus < 0) this.socialStatus = 0;
  }

  /**
   * Consume food to restore health and energy
   */
  eat(foodType: 'fastfood' | 'meal'): void {
    const energyGain = foodType === 'fastfood' ? 30 : 100;

    if (this.health < this.maxHealth * 0.75) {
      // Priority: restore health first
      this.health += energyGain;
      if (this.health > this.maxHealth) {
        const overflow = this.health - this.maxHealth;
        this.health = this.maxHealth;
        this.energy += overflow;
      }
    } else {
      // Split gain
      this.health += energyGain * 0.4;
      this.energy += energyGain * 0.6;
      if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    if (this.energy > 100) this.energy = 100;
    this.angerMeter -= 50; // Eating significantly reduces anger
    if (this.angerMeter < 0) this.angerMeter = 0;
  }

  /**
   * Increase social status through interaction
   */
  socialize(amount: number): void {
    this.socialStatus += amount;
    if (this.socialStatus > 100) this.socialStatus = 100;
    
    // Socializing reduces anger
    this.angerMeter -= (amount * 10);
    if (this.angerMeter < 0) this.angerMeter = 0;
  }

  /**
   * Start reproduction activity
   */
  startReproducing(partner?: Hero): void {
    if (!this.isAdult()) return; // Cannot reproduce until puberty
    if (partner && !partner.isAdult()) return;

    this.isReproducing = true;
    this.reproductionTimer = this.REPRODUCTION_DURATION;
    
    // Reproduction significantly decreases anger
    this.angerMeter -= 50;
    if (this.angerMeter < 0) this.angerMeter = 0;
    this.moving = false;
    this.path = [];
    this.visualIndicator.clear();
    // Partners share family link
    if (partner) partner.familyId = this.familyId;
  }

  /**
   * Draw the visual indicator for the target tile
   * @param ctx Canvas rendering context
   */
  drawTargetIndicator(ctx: CanvasRenderingContext2D): void {
    // Keep indicator drawn even if hero is not active, until target is reached
    this.visualIndicator.draw(ctx);
  }

  /**
   * Override draw to add the name above the hero's head
   */
  draw(ctx: CanvasRenderingContext2D): void {
    super.draw(ctx);

    // Draw name
    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2;
    // Position text just above the character's bounding box center
    ctx.fillText(
      this.name,
      this.position.x + HALF_TILE,
      this.position.y - 10
    );
    ctx.restore();

    // Draw reproduction heart animation
    if (this.isReproducing) {
      const pulse = Math.sin(Date.now() / 150) * 0.2 + 1; // Pulse between 0.8 and 1.2
      ctx.save();
      ctx.translate(this.position.x + HALF_TILE, this.position.y - 30);
      ctx.scale(pulse, pulse);
      
      // Draw Heart SVG (or custom path)
      ctx.fillStyle = "#ff4757";
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-5, -5, -15, 0, 0, 15);
      ctx.bezierCurveTo(15, 0, 5, -5, 0, 5);
      ctx.fill();
      ctx.restore();
    }
  }
}
