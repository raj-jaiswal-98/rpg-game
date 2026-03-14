import { ROWS, COLS, TILE_SIZE } from "../main.js";

const collisionLayerArray = [
    1,1,1,1,1,1,1,1,1,1,1,1,1,0,1, // Top border (with dummy 0)
    1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,1,0,1,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,1,0,0,1,0,0,0,0,0,0,0,1,
    1,0,0,0,1,1,1,1,1,1,0,0,0,0,1,
    1,0,0,0,1,1,1,1,1,1,0,0,1,1,1,
    1,0,0,0,1,1,1,1,1,1,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,
    1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,1,0,0,0,1,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1  // Bottom border (with dummy 0)
];

export default class World{
    constructor(){
        this.level1 = {
            waterLayer: [],
            groundLayer: [],
            collisionLayer: collisionLayerArray,
            backgroundLayer: document.getElementById('backgroundLevel1'),
            foregroundLayer: document.getElementById('foregroundLevel1'),
        };
    }
    getTile(array, row, col){
        return array[row * COLS + col];
    }
    drawBackground(ctx){
        ctx.drawImage(this.level1.backgroundLayer, 0, 0);
    }
    drawForeground(ctx){
        ctx.drawImage(this.level1.foregroundLayer, 0, 0);
    }
    drawCollisionGrid(ctx){
        ctx.strokeStyle = 'orange';
        for(let row = 0; row < ROWS; row++) {
            for(let col = 0; col < COLS; col++) {
                if(this.getTile(this.level1.collisionLayer, row, col) === 1){
                ctx.strokeRect(
                    col * TILE_SIZE, 
                    row * TILE_SIZE, 
                    TILE_SIZE, 
                    TILE_SIZE
                ); }
            }
        }
    }
    drawGrid(ctx){
        ctx.strokeStyle = 'black';
        for(let row = 0; row < ROWS; row++) {
            for(let col = 0; col < COLS; col++) {
                ctx.strokeRect(
                    col * TILE_SIZE, 
                    row * TILE_SIZE, 
                    TILE_SIZE, 
                    TILE_SIZE
                );
            }
        }
    }
}