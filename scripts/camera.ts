export interface Position {
  x: number;
  y: number;
}

export class Camera {
  x: number;
  y: number;
  zoom: number;

  constructor(x: number = 0, y: number = 0, zoom: number = 1) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
  }

  /**
   * Translates a screen coordinate (e.g. mouse click relative to canvas)
   * into a world coordinate based on current camera pan and zoom.
   */
  screenToWorld(screenPos: Position): Position {
    return {
      x: (screenPos.x / this.zoom) + this.x,
      y: (screenPos.y / this.zoom) + this.y,
    };
  }

  /**
   * Translates a world coordinate into a screen coordinate.
   */
  worldToScreen(worldPos: Position): Position {
    return {
      x: (worldPos.x - this.x) * this.zoom,
      y: (worldPos.y - this.y) * this.zoom,
    };
  }
}
