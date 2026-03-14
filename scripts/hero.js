import { UP, RIGHT, DOWN, LEFT } from "./input.js";
import { GameObject } from "./gameObject.js";
import { TILE_SIZE, HALF_TILE } from "../main.js";
import { Pathfinder } from "./pathfinder.js";
import { CollisionChecker } from "./collision.js";
import { Toast } from "./toast.js";
import { VisualIndicator } from "./visualIndicator.js";
export class Hero extends GameObject {
    constructor({ game, sprite, position, scale, name = "Laila", health = 100, maxEnergy = 100, energy = 50, speed = 75, indicatorColor = "255, 68, 68", gender = 'female', }) {
        super({ game, sprite, position, scale });
        this.REPRODUCTION_DURATION = 5000; // 5 seconds
        this.name = name;
        this.health = health;
        this.maxEnergy = maxEnergy;
        this.energy = energy;
        this.speed = speed;
        this.indicatorColor = indicatorColor;
        this.gender = gender;
        this.fertilityMeter = 50;
        this.isReproducing = false;
        this.reproductionTimer = 0;
        this.maxFrame = 8;
        this.moving = false;
        this.targetPosition = null;
        this.path = [];
        this.isBlocked = false;
        this.waitTimer = 0;
        this.blockedRetryCount = 0;
        // Add 0-500ms jitter to prevent synchronized re-pathing
        this.WAIT_THRESHOLD = 1000 + Math.random() * 500;
        const isTileOccupied = (row, col) => {
            if (!this.game || !this.game.heroes)
                return false;
            for (const other of this.game.heroes) {
                if (other === this)
                    continue;
                // Check other hero's current position
                const otherRow = Math.round(other.position.y / TILE_SIZE);
                const otherCol = Math.round(other.position.x / TILE_SIZE);
                if (row === otherRow && col === otherCol)
                    return true;
                // Check other hero's next immediate tile destination
                const destRow = Math.round(other.destinationPosition.y / TILE_SIZE);
                const destCol = Math.round(other.destinationPosition.x / TILE_SIZE);
                if (row === destRow && col === destCol)
                    return true;
            }
            return false;
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
    navigateToTile(targetPos) {
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
        }
        else {
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
    tryMove(dirX, dirY, spriteY) {
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
    update(deltaTime) {
        const scaledSpeed = this.speed * (deltaTime / 1000);
        const activeIndex = this.game.activeHeroIndex;
        const isActive = activeIndex !== -1 && this.game.heroes[activeIndex] === this;
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
            const { row, col } = this.collisionChecker.getTileCoordinates(targetPos);
            // Check if target tile is blocked by world or current positions of others
            if (!this.collisionChecker.isPositionWalkable(targetPos)) {
                Toast.error(`Cannot navigate to blocked tile (${col}, ${row})`);
            }
            else {
                // Also check if someone else is already targeting this EXACT tile
                let finalTargetBlocked = false;
                for (const other of this.game.heroes) {
                    if (other === this || !other.targetPosition)
                        continue;
                    const otherTargetRow = Math.round(other.targetPosition.y / TILE_SIZE);
                    const otherTargetCol = Math.round(other.targetPosition.x / TILE_SIZE);
                    if (row === otherTargetRow && col === otherTargetCol) {
                        finalTargetBlocked = true;
                        break;
                    }
                }
                if (finalTargetBlocked) {
                    Toast.error(`Another hero is already headed to tile (${col}, ${row})`);
                }
                else {
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
                    console.log("Moving up...");
                    this.isBlocked = false;
                    this.blockedRetryCount = 0;
                }
                else {
                    this.isBlocked = true;
                }
            }
            else if (isActive && this.game.input.lastKey === RIGHT) {
                if (this.tryMove(1, 0, 11)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving right...");
                    this.isBlocked = false;
                    this.blockedRetryCount = 0;
                }
                else {
                    this.isBlocked = true;
                }
            }
            else if (isActive && this.game.input.lastKey === DOWN) {
                if (this.tryMove(0, 1, 10)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving down...");
                    this.isBlocked = false;
                    this.blockedRetryCount = 0;
                }
                else {
                    this.isBlocked = true;
                }
            }
            else if (isActive && this.game.input.lastKey === LEFT) {
                if (this.tryMove(-1, 0, 9)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving left...");
                    this.isBlocked = false;
                    this.blockedRetryCount = 0;
                }
                else {
                    this.isBlocked = true;
                }
            }
            // Follow calculated path if no keyboard input
            else if (this.path.length > 0) {
                this.followPath(deltaTime);
            }
            else {
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
                if (this.energy < 0)
                    this.energy = 0;
            }
            else if (this.energy <= 0) {
                // Stop moving if no energy left
                this.moving = false;
                this.path = [];
                this.visualIndicator.clear();
            }
        }
        else {
            this.moving = false;
            // Passive energy regen when standing still? Maybe optional.
            if (this.energy < this.maxEnergy) {
                this.energy += deltaTime / 1000 * 2;
                if (this.energy > this.maxEnergy)
                    this.energy = this.maxEnergy;
            }
        }
        // Update animation
        if (this.game.eventUpdate && this.moving && !this.isBlocked && !this.isReproducing) {
            this.sprite.x < this.maxFrame ? this.sprite.x++ : (this.sprite.x = 0);
        }
        else if (!this.moving || this.isBlocked || this.isReproducing) {
            this.sprite.x = 0;
        }
        // Reproduction logic
        if (this.isReproducing) {
            this.reproductionTimer -= deltaTime;
            if (this.reproductionTimer <= 0) {
                this.isReproducing = false;
                this.fertilityMeter = 0;
            }
        }
        else if (!this.moving && this.energy > 50) {
            // Increase fertility when idle and energetic
            this.fertilityMeter += deltaTime / 1000 * 2; // +2 per second
            if (this.fertilityMeter > 100)
                this.fertilityMeter = 100;
        }
    }
    /**
     * Follow the calculated path one tile at a time
     * @param deltaTime Time elapsed since last frame
     */
    followPath(deltaTime) {
        if (this.path.length === 0)
            return;
        const nextTile = this.path[0];
        const { row: nextRow, col: nextCol } = this.collisionChecker.getTileCoordinates(nextTile);
        const { row: currentRow, col: currentCol } = this.collisionChecker.getTileCoordinates(this.position);
        // Move to the next tile in the path
        let moveSuccessful = false;
        if (currentCol < nextCol) {
            moveSuccessful = this.tryMove(1, 0, 11); // Right
        }
        else if (currentCol > nextCol) {
            moveSuccessful = this.tryMove(-1, 0, 9); // Left
        }
        else if (currentRow < nextRow) {
            moveSuccessful = this.tryMove(0, 1, 10); // Down
        }
        else if (currentRow > nextRow) {
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
                    }
                    else {
                        this.navigateToTile(finalTarget);
                    }
                }
                this.waitTimer = 0; // Reset timer after re-path attempt
            }
        }
        else {
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
     * Start reproduction activity
     */
    startReproducing() {
        this.isReproducing = true;
        this.reproductionTimer = this.REPRODUCTION_DURATION;
        this.moving = false;
        this.path = [];
        this.visualIndicator.clear();
    }
    /**
     * Draw the visual indicator for the target tile
     * @param ctx Canvas rendering context
     */
    drawTargetIndicator(ctx) {
        // Keep indicator drawn even if hero is not active, until target is reached
        this.visualIndicator.draw(ctx);
    }
    /**
     * Override draw to add the name above the hero's head
     */
    draw(ctx) {
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
        ctx.fillText(this.name, this.position.x + HALF_TILE, this.position.y - 10);
        ctx.restore();
    }
}
//# sourceMappingURL=hero.js.map