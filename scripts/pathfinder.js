import { TILE_SIZE, COLS, ROWS } from "../main.js";
export class Pathfinder {
    constructor(config) {
        this.config = config;
    }
    /**
     * Find the shortest path between two positions using BFS algorithm
     * @param from Starting position (in pixels)
     * @param to Target position (in pixels)
     * @returns Array of positions representing the path, empty if no path exists
     */
    findPath(from, to) {
        const fromCol = Math.round(from.x / TILE_SIZE);
        const fromRow = Math.round(from.y / TILE_SIZE);
        const toCol = Math.round(to.x / TILE_SIZE);
        const toRow = Math.round(to.y / TILE_SIZE);
        // If already at target, return empty path
        if (fromRow === toRow && fromCol === toCol) {
            return [];
        }
        // BFS algorithm
        const queue = [
            { row: fromRow, col: fromCol, path: [] },
        ];
        const visited = new Set();
        visited.add(`${fromRow},${fromCol}`);
        // Check 4 directions: UP, DOWN, LEFT, RIGHT
        const directions = [
            { row: -1, col: 0, name: "UP" },
            { row: 1, col: 0, name: "DOWN" },
            { row: 0, col: -1, name: "LEFT" },
            { row: 0, col: 1, name: "RIGHT" },
        ];
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current)
                break;
            // Check if reached destination
            if (current.row === toRow && current.col === toCol) {
                return current.path.map((pos) => pos);
            }
            // Explore neighbors in all 4 directions
            for (const dir of directions) {
                const newRow = current.row + dir.row;
                const newCol = current.col + dir.col;
                const key = `${newRow},${newCol}`;
                // Check bounds
                if (newRow >= 0 &&
                    newRow < ROWS &&
                    newCol >= 0 &&
                    newCol < COLS &&
                    !visited.has(key)) {
                    // Check if tile is walkable (collision layer = 0 means no collision)
                    if (this.isWalkable(newRow, newCol)) {
                        visited.add(key);
                        const newPath = [
                            ...current.path,
                            {
                                x: newCol * TILE_SIZE,
                                y: newRow * TILE_SIZE,
                            },
                        ];
                        queue.push({ row: newRow, col: newCol, path: newPath });
                    }
                }
            }
        }
        // No path found
        return [];
    }
    /**
     * Check if a tile is walkable (not blocked by collision)
     * @param row Tile row
     * @param col Tile column
     * @returns true if walkable, false if blocked
     */
    isWalkable(row, col) {
        const tileValue = this.config.getTile(this.config.collisionLayer, row, col);
        if (tileValue !== 0)
            return false; // 0 = walkable
        // Check if another entity is occupying this tile
        if (this.config.isTileOccupied && this.config.isTileOccupied(row, col)) {
            return false;
        }
        return true;
    }
    /**
     * Check if a specific tile position is walkable
     * @param position Position in pixels
     * @returns true if walkable, false if blocked
     */
    isPositionWalkable(position) {
        const col = Math.round(position.x / TILE_SIZE);
        const row = Math.round(position.y / TILE_SIZE);
        return this.isWalkable(row, col);
    }
}
//# sourceMappingURL=pathfinder.js.map