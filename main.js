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
window.addEventListener("load", function () {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    class Game {
        constructor() {
            this.world = new World();
            this.hero = new Hero({
                game: this,
                sprite: {
                    image: document.getElementById("hero1"),
                    x: 0,
                    y: 0,
                    width: 64,
                    height: 64,
                },
                position: { x: 1 * TILE_SIZE, y: 2 * TILE_SIZE },
                scale: 1,
            });
            // this.hero2 = new Hero({
            //     game: this,
            //     sprite:{
            //         image: document.getElementById('hero2'),
            //         x: 0,
            //         y: 0,
            //         width: 64,
            //         height: 64
            //     },
            //     position: { x: 3 * TILE_SIZE, y: 19 * TILE_SIZE },
            // });
            this.input = new Input();
            this.camera = new Camera(0, 0, 1);
            this.eventUpdate = false;
            this.eventTimer = 0;
            this.eventInterval = 50;
            this.debug = false;
        }
        render(ctx, deltaTime) {
            this.hero.update(deltaTime);
            ctx.save();
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x, -this.camera.y);
            this.world.drawBackground(ctx);
            this.hero.draw(ctx);
            this.hero.drawTargetIndicator(ctx);
            this.world.drawForeground(ctx);
            ctx.restore();
            if (this.eventTimer < this.eventInterval) {
                this.eventTimer += deltaTime;
                this.eventUpdate = false;
            }
            else {
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
        const zoomSlider = document.getElementById("camera-zoom");
        if (zoomSlider)
            zoomSlider.value = "1";
    });
    document.getElementById("camera-zoom")?.addEventListener("input", (e) => {
        const target = e.target;
        game.camera.zoom = parseFloat(target.value);
    });
    function animate(timestamp) {
        requestAnimationFrame(animate);
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        // console.log(deltaTime);
        game.render(ctx, deltaTime);
        // console.log("Animating...");
    }
    requestAnimationFrame(animate);
});
//# sourceMappingURL=main.js.map