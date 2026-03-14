import { ROWS, COLS, TILE_SIZE } from "../main.js";
// prettier-ignore
const collisionLayerArray = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // Row 0: Top border
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, // Row 1
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 2
    1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 3
    1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, // Row 4
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 5
    1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, // Row 6
    1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, // Row 7
    1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, // Row 8
    1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, // Row 9
    1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, // Row 10
    1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, // Row 11
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 12
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 13
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 14
    1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, // Row 15
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 16
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 17
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // Row 18
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 // Row 19: Bottom border
];
export default class World {
    constructor() {
        this.level1 = {
            waterLayer: [],
            groundLayer: [],
            collisionLayer: collisionLayerArray,
            backgroundLayer: document.getElementById("backgroundLevel1"),
            foregroundLayer: document.getElementById("foregroundLevel1"),
        };
    }
    getTile(array, row, col) {
        return array[row * COLS + col];
    }
    drawBackground(ctx) {
        ctx.drawImage(this.level1.backgroundLayer, 0, 0);
    }
    drawForeground(ctx) {
        ctx.drawImage(this.level1.foregroundLayer, 0, 0);
    }
    drawCollisionGrid(ctx) {
        ctx.strokeStyle = "orange";
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.getTile(this.level1.collisionLayer, row, col) === 1) {
                    ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    drawGrid(ctx) {
        ctx.strokeStyle = "black";
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}
//# sourceMappingURL=world.js.map