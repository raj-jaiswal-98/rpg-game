export class Camera {
    constructor(x = 0, y = 0, zoom = 1) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
    }
    /**
     * Translates a screen coordinate (e.g. mouse click relative to canvas)
     * into a world coordinate based on current camera pan and zoom.
     */
    screenToWorld(screenPos) {
        return {
            x: (screenPos.x / this.zoom) + this.x,
            y: (screenPos.y / this.zoom) + this.y,
        };
    }
    /**
     * Translates a world coordinate into a screen coordinate.
     */
    worldToScreen(worldPos) {
        return {
            x: (worldPos.x - this.x) * this.zoom,
            y: (worldPos.y - this.y) * this.zoom,
        };
    }
}
//# sourceMappingURL=camera.js.map