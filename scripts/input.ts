export const UP = "UP";
export const DOWN = "DOWN";
export const LEFT = "LEFT";
export const RIGHT = "RIGHT";

export interface ClickPosition {
  x: number;
  y: number;
}

export class Input {
  keys: string[];
  clickPosition: ClickPosition | null;
  canvas: HTMLCanvasElement | null;

  constructor() {
    this.keys = [];
    this.clickPosition = null;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;

    window.addEventListener("keydown", (e) => {
      // console.log(e);
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        this.keyPressed(UP);
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        this.keyPressed(DOWN);
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        this.keyPressed(LEFT);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        this.keyPressed(RIGHT);
      }
    });

    window.addEventListener("keyup", (e) => {
      // console.log(e);
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        this.keyReleased(UP);
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        this.keyReleased(DOWN);
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        this.keyReleased(LEFT);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        this.keyReleased(RIGHT);
      }
    });

    if (this.canvas) {
      this.canvas.addEventListener("click", (e) => {
        this.handleCanvasClick(e);
      });
      this.canvas.addEventListener("touchend", (e) => {
        this.handleCanvasTouch(e);
      });
    }
  }

  handleCanvasClick(e: MouseEvent): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.clickPosition = { x, y };
    console.log("Clicked at pixel position:", x, y);
  }

  handleCanvasTouch(e: TouchEvent): void {
    if (!this.canvas || !e.changedTouches.length) return;
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.clickPosition = { x, y };
    console.log("Touched at pixel position:", x, y);
  }

  clearClickPosition(): void {
    this.clickPosition = null;
  }

  keyPressed(key: string): void {
    if (this.keys.indexOf(key) === -1) {
      this.keys.unshift(key);
    }
    console.log(key);
  }
  keyReleased(key: string): void {
    const index = this.keys.indexOf(key);
    if (index === -1) return;
    this.keys.splice(index, 1);
  }
  get lastKey(): string {
    return this.keys[0];
  }
}
