import { Hero } from "./hero.js";

export interface SavedWorldState {
  food: { type: 'fastfood' | 'meal'; position: { x: number; y: number } }[];
  camera: { x: number; y: number; zoom: number };
  activeHeroIndex: number;
  autoSpawnEnabled: boolean;
  spawnFrequencyMultiplier: number;
}

// We extract just the data needed to recreate a hero
export interface SavedHeroState {
  name: string;
  health: number;
  maxHealth: number;
  maxEnergy: number;
  energy: number;
  speed: number;
  indicatorColor: string;
  gender: 'male' | 'female';
  familyId: string;
  socialStatus: number;
  position: { x: number; y: number };
  scale: number;
  fertilityMeter: number;
  angerMeter: number;
  isDead: boolean;
  spriteId: string; // "hero1" or "hero2" to restore the correct image
}

export class PersistenceManager {
  private static readonly HEROES_STORAGE_KEY = 'rpg_game_heroes_state';
  private static readonly WORLD_STORAGE_KEY = 'rpg_game_world_state';

  /**
   * Serializes and saves the given heroes to localStorage.
   */
  static saveHeroes(heroes: Hero[]): void {
    try {
      const stateToSave: SavedHeroState[] = heroes.map(h => {
        return {
          name: h.name,
          health: h.health,
          maxHealth: h.maxHealth,
          maxEnergy: h.maxEnergy,
          energy: h.energy,
          speed: h.speed,
          indicatorColor: h.indicatorColor,
          gender: h.gender,
          familyId: h.familyId,
          socialStatus: h.socialStatus,
          position: { x: h.position.x, y: h.position.y },
          scale: h.scale,
          fertilityMeter: h.fertilityMeter,
          angerMeter: h.angerMeter,
          isDead: h.isDead,
          // Extract sprite ID from image element ID if possible, or infer from gender
          spriteId: h.sprite.image ? h.sprite.image.id : (h.gender === 'male' ? 'hero1' : 'hero2'),
        };
      });

      localStorage.setItem(this.HEROES_STORAGE_KEY, JSON.stringify(stateToSave));
      console.log(`[PERSISTENCE] Saved ${heroes.length} heroes to localStorage.`);
    } catch (error) {
      console.error("[PERSISTENCE] Failed to save heroes state:", error);
    }
  }

  /**
   * Serializes and saves the world state to localStorage.
   */
  static saveWorldState(game: any): void {
    try {
      const worldState: SavedWorldState = {
        food: game.food.map((f: any) => ({
          type: f.type,
          position: { x: f.position.x, y: f.position.y }
        })),
        camera: { x: game.camera.x, y: game.camera.y, zoom: game.camera.zoom },
        activeHeroIndex: game.activeHeroIndex,
        autoSpawnEnabled: game.autoSpawnEnabled,
        spawnFrequencyMultiplier: game.spawnFrequencyMultiplier
      };
      localStorage.setItem(this.WORLD_STORAGE_KEY, JSON.stringify(worldState));
      console.log(`[PERSISTENCE] Saved world state to localStorage.`);
    } catch (error) {
      console.error("[PERSISTENCE] Failed to save world state:", error);
    }
  }

  /**
   * Loads and deserializes heroes from localStorage. Returns null if no save exists.
   */
  static loadHeroes(): SavedHeroState[] | null {
    try {
      const data = localStorage.getItem(this.HEROES_STORAGE_KEY);
      if (!data) return null;

      const parsedData = JSON.parse(data) as SavedHeroState[];
      console.log(`[PERSISTENCE] Loaded ${parsedData.length} heroes from localStorage.`);
      return parsedData;
    } catch (error) {
      console.error("[PERSISTENCE] Failed to load heroes state:", error);
      return null;
    }
  }

  /**
   * Loads and deserializes world state from localStorage. Returns null if no save exists.
   */
  static loadWorldState(): SavedWorldState | null {
    try {
      const data = localStorage.getItem(this.WORLD_STORAGE_KEY);
      if (!data) return null;

      const parsedData = JSON.parse(data) as SavedWorldState;
      // Supply defaults for new properties if missing from older saves
      parsedData.autoSpawnEnabled = parsedData.autoSpawnEnabled ?? true;
      parsedData.spawnFrequencyMultiplier = parsedData.spawnFrequencyMultiplier ?? 1;

      console.log(`[PERSISTENCE] Loaded world state from localStorage.`);
      return parsedData;
    } catch (error) {
      console.error("[PERSISTENCE] Failed to load world state:", error);
      return null;
    }
  }

  /**
   * Clears the current save data.
   */
  static clearSave(): void {
    try {
      localStorage.removeItem(this.HEROES_STORAGE_KEY);
      localStorage.removeItem(this.WORLD_STORAGE_KEY);
      console.log("[PERSISTENCE] Cleared save data.");
    } catch (error) {
      console.error("[PERSISTENCE] Failed to clear save data:", error);
    }
  }
}
