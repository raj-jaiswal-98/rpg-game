import { HALF_TILE, TILE_SIZE } from "../main.js";
export class GameObject {
    constructor({ game, sprite, position, scale, }) {
        this.game = game;
        this.sprite = sprite;
        this.position = position ?? { x: 0, y: 0 };
        this.scale = scale ?? 1;
        this.destinationPosition = { x: this.position.x, y: this.position.y };
        this.distanceToTravel = { x: 0, y: 0 };
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;
        this.halfWidth = this.width / 2;
    }
    moveTowards(destinationPosition, speed) {
        this.distanceToTravel.x = destinationPosition.x - this.position.x;
        this.distanceToTravel.y = destinationPosition.y - this.position.y;
        // let distance = Math.sqrt(
        //     this.distanceToTravel.x * this.distanceToTravel.x +
        //     this.distanceToTravel.y * this.distanceToTravel.y
        // );
        let distance = Math.hypot(this.distanceToTravel.x, this.distanceToTravel.y);
        if (distance < speed) {
            //if close enough, snap to destination
            this.position.x = destinationPosition.x;
            this.position.y = destinationPosition.y;
        }
        else {
            //move towards destination
            const stepX = this.distanceToTravel.x / distance;
            const stepY = this.distanceToTravel.y / distance;
            this.position.x += stepX * speed;
            this.position.y += stepY * speed;
            //update remaining distance to travel
            this.distanceToTravel.x = destinationPosition.x - this.position.x;
            this.distanceToTravel.y = destinationPosition.y - this.position.y;
            distance = Math.hypot(this.distanceToTravel.x, this.distanceToTravel.y);
        }
        return distance;
    }
    draw(ctx) {
        ctx.fillStyle = "transparent";
        ctx.fillRect(this.position.x, this.position.y, TILE_SIZE, TILE_SIZE);
        // ctx.strokeStyle = "yellow";
        // ctx.strokeRect(
        //   this.destinationPosition.x,
        //   this.destinationPosition.y,
        //   TILE_SIZE,
        //   TILE_SIZE,
        // );
        if (this.game.debug) {
            console.log(`[GAME_DRAW] Drawing ${this.sprite.image.id} at (${this.position.x}, ${this.position.y}) source: (${this.sprite.x}, ${this.sprite.y}) size: ${this.sprite.width}x${this.sprite.height}`);
        }
        ctx.drawImage(this.sprite.image, this.sprite.x * this.sprite.width, this.sprite.y * this.sprite.height, this.sprite.width, this.sprite.height, this.position.x + HALF_TILE - this.halfWidth, this.position.y + TILE_SIZE - this.height, this.width, this.height);
    }
}
//# sourceMappingURL=gameObject.js.map