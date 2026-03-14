import { UP, RIGHT, DOWN, LEFT } from "./input.js";
import { GameObject } from "./gameObject.js";
import { TILE_SIZE } from "../main.js";
import { Pathfinder } from "./pathfinder.js";
import { CollisionChecker } from "./collision.js";
import { Toast } from "./toast.js";
import { VisualIndicator } from "./visualIndicator.js";
export class Hero extends GameObject {
    constructor({ game, sprite, position, scale, }) {
        super({ game, sprite, position, scale });
        this.speed = 75;
        this.maxFrame = 8;
        this.moving = false;
        this.targetPosition = null;
        this.path = [];
        // Initialize pathfinding and collision checking
        this.collisionChecker = new CollisionChecker({
            collisionLayer: this.game.world.level1.collisionLayer,
            getTile: this.game.world.getTile.bind(this.game.world),
        });
        this.pathfinder = new Pathfinder({
            collisionLayer: this.game.world.level1.collisionLayer,
            getTile: this.game.world.getTile.bind(this.game.world),
        });
        // Initialize visual indicator for target tile
        this.visualIndicator = new VisualIndicator();
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
        // Update visual indicator animation
        this.visualIndicator.update(deltaTime);
        // Handle mouse click to navigate to destination
        if (this.game.input.clickPosition) {
            // Convert raw screen click to world coordinates
            const worldClick = this.game.camera.screenToWorld(this.game.input.clickPosition);
            const targetPos = {
                x: Math.floor(worldClick.x / TILE_SIZE) * TILE_SIZE,
                y: Math.floor(worldClick.y / TILE_SIZE) * TILE_SIZE,
            };
            const { row, col } = this.collisionChecker.getTileCoordinates(targetPos);
            // Check if target tile is blocked
            if (!this.collisionChecker.isPositionWalkable(targetPos)) {
                Toast.error(`Cannot navigate to blocked tile (${col}, ${row})`);
            }
            else {
                // Target is walkable, proceed with navigation
                this.navigateToTile(targetPos);
            }
            this.game.input.clearClickPosition();
        }
        // Move towards current destination
        const distance = this.moveTowards(this.destinationPosition, scaledSpeed);
        const arrived = distance < scaledSpeed;
        if (arrived) {
            // Keyboard input takes priority - clear path and indicator when keyboard is used
            if (this.game.input.lastKey === UP) {
                if (this.tryMove(0, -1, 8)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving up...");
                }
            }
            else if (this.game.input.lastKey === RIGHT) {
                if (this.tryMove(1, 0, 11)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving right...");
                }
            }
            else if (this.game.input.lastKey === DOWN) {
                if (this.tryMove(0, 1, 10)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving down...");
                }
            }
            else if (this.game.input.lastKey === LEFT) {
                if (this.tryMove(-1, 0, 9)) {
                    this.path = [];
                    this.visualIndicator.clear();
                    console.log("Moving left...");
                }
            }
            // Follow calculated path if no keyboard input
            else if (this.path.length > 0) {
                this.followPath();
            }
            else {
                // Path complete, clear indicator
                this.visualIndicator.clear();
            }
        }
        // Update moving state
        if (this.game.input.keys.length > 0 || !arrived || this.path.length > 0) {
            this.moving = true;
        }
        else {
            this.moving = false;
        }
        // Update animation
        if (this.game.eventUpdate && this.moving) {
            this.sprite.x < this.maxFrame ? this.sprite.x++ : (this.sprite.x = 0);
        }
        else if (!this.moving) {
            this.sprite.x = 0;
        }
    }
    /**
     * Follow the calculated path one tile at a time
     */
    followPath() {
        if (this.path.length === 0)
            return;
        const nextTile = this.path[0];
        const { row: nextRow, col: nextCol } = this.collisionChecker.getTileCoordinates(nextTile);
        const { row: currentRow, col: currentCol } = this.collisionChecker.getTileCoordinates(this.position);
        // Move to the next tile in the path
        if (currentCol < nextCol) {
            this.tryMove(1, 0, 11); // Right
        }
        else if (currentCol > nextCol) {
            this.tryMove(-1, 0, 9); // Left
        }
        else if (currentRow < nextRow) {
            this.tryMove(0, 1, 10); // Down
        }
        else if (currentRow > nextRow) {
            this.tryMove(0, -1, 8); // Up
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
     * Draw the visual indicator for the target tile
     * @param ctx Canvas rendering context
     */
    drawTargetIndicator(ctx) {
        this.visualIndicator.draw(ctx);
    }
}
//# sourceMappingURL=hero.js.map