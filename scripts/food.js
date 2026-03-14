import { GameObject } from "./gameObject.js";
export class Food extends GameObject {
    constructor({ game, sprite, position, type, }) {
        super({ game, sprite, position, scale: 0.5 });
        this.age = 0;
        console.log(`[DEBUG] Food instance created. Sprite image src: ${this.sprite.image.src}`);
        this.type = type;
        this.eatTime = type === 'fastfood' ? 2000 : 5000;
        this.energyValue = type === 'fastfood' ? 30 : 100;
        this.isSpawning = true;
        this.maxAge = type === 'fastfood' ? 30000 : 45000; // 30s for fastfood, 45s for meals
    }
    get isExpired() {
        return this.age >= this.maxAge;
    }
    update(deltaTime) {
        this.age += deltaTime;
    }
    draw(ctx) {
        ctx.save();
        // Flickering effect when within 5 seconds of expiring
        const timeLeft = this.maxAge - this.age;
        if (timeLeft < 5000) {
            // Faster flicker as it gets closer to 0
            const flickerRate = Math.max(50, timeLeft / 10);
            if (Math.floor(Date.now() / flickerRate) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }
        // Simple pulse effect for spawning
        if (this.isSpawning) {
            const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
            ctx.translate(this.position.x + 16, this.position.y + 16);
            ctx.scale(pulse, pulse);
            ctx.translate(-(this.position.x + 16), -(this.position.y + 16));
        }
        super.draw(ctx);
        ctx.restore();
    }
}
//# sourceMappingURL=food.js.map