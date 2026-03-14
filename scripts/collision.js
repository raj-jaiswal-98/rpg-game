import { TILE_SIZE, COLS, ROWS } from "../main.js";
/**
 * Collision utilities for world interaction
 */
export class CollisionChecker {
    constructor(world) {
        this.world = world;
    }
    /**
     * Check if a tile at given row/col is walkable
     * @param row Tile row (0-19)
     * @param col Tile column (0-14)
     * @returns true if walkable (collision value = 0), false if blocked
     */
    isTileWalkable(row, col) {
        // Bounds check
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
            return false;
        }
        const tileValue = this.world.getTile(this.world.collisionLayer, row, col);
        return tileValue === 0; // 0 = walkable, 1 = blocked/collision
    }
    /**
     * Check if a position (in pixels) is walkable
     * @param position Position with x, y in pixels
     * @returns true if walkable, false if blocked
     */
    isPositionWalkable(position) {
        const col = Math.round(position.x / TILE_SIZE);
        const row = Math.round(position.y / TILE_SIZE);
        return this.isTileWalkable(row, col);
    }
    /**
     * Get the tile coordinates from a pixel position
     * @param position Position in pixels
     * @returns Object with row and col
     */
    getTileCoordinates(position) {
        return {
            row: Math.round(position.y / TILE_SIZE),
            col: Math.round(position.x / TILE_SIZE),
        };
    }
    /**
     * Get the pixel position of a tile
     * @param row Tile row
     * @param col Tile column
     * @returns Position in pixels
     */
    getTilePosition(row, col) {
        return {
            x: col * TILE_SIZE,
            y: row * TILE_SIZE,
        };
    }
    /**
     * Validate if a move from one position to another would avoid collisions
     * @param fromPosition Starting position (pixels)
     * @param toPosition Destination position (pixels)
     * @returns true if destination is walkable, false if blocked
     */
    canMoveTo(fromPosition, toPosition) {
        return this.isPositionWalkable(toPosition);
    }
}
//# sourceMappingURL=collision.js.map