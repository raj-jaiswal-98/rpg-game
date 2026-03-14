import { describe, it, expect } from "vitest";
import { Camera } from "./camera";

describe("Camera Coordinate Mapping", () => {
  it("should map 1:1 when camera is at 0,0 with 1x zoom", () => {
    const camera = new Camera(0, 0, 1);
    const screenPos = { x: 100, y: 150 };
    const worldPos = camera.screenToWorld(screenPos);
    
    expect(worldPos.x).toBe(100);
    expect(worldPos.y).toBe(150);
    
    const backToScreen = camera.worldToScreen(worldPos);
    expect(backToScreen.x).toBe(100);
    expect(backToScreen.y).toBe(150);
  });

  it("should offset coordinates based on pan (x,y)", () => {
    const camera = new Camera(50, 20, 1);
    
    // A click at 0,0 on screen should map to 50,20 in the world
    const worldPos = camera.screenToWorld({ x: 0, y: 0 });
    expect(worldPos.x).toBe(50);
    expect(worldPos.y).toBe(20);

    // An object at 100,100 in world should appear at 50,80 on screen
    const screenPos = camera.worldToScreen({ x: 100, y: 100 });
    expect(screenPos.x).toBe(50);
    expect(screenPos.y).toBe(80);
  });

  it("should scale coordinates based on zoom", () => {
    const camera = new Camera(0, 0, 2); // 2x zoom
    
    // Clicking at 100,100 on the 2x zoomed screen maps to 50,50 in the actual world
    const worldPos = camera.screenToWorld({ x: 100, y: 100 });
    expect(worldPos.x).toBe(50);
    expect(worldPos.y).toBe(50);

    // An object at 50,50 in world should appear at 100,100 on the 2x zoomed screen
    const screenPos = camera.worldToScreen({ x: 50, y: 50 });
    expect(screenPos.x).toBe(100);
    expect(screenPos.y).toBe(100);
  });

  it("should handle both pan and zoom correctly", () => {
    const camera = new Camera(20, 30, 2); // Pan + 2x zoom
    
    // A click at 100, 100 on screen maps to what world pos?
    // worldX = (100 / 2) + 20 = 70
    // worldY = (100 / 2) + 30 = 80
    const worldPos = camera.screenToWorld({ x: 100, y: 100 });
    expect(worldPos.x).toBe(70);
    expect(worldPos.y).toBe(80);

    // Round trip
    const screenPos = camera.worldToScreen(worldPos);
    expect(screenPos.x).toBe(100);
    expect(screenPos.y).toBe(100);
  });
});
