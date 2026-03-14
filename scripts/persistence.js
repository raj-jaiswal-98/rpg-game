export class PersistenceManager {
    /**
     * Serializes and saves the given heroes to localStorage.
     */
    static saveHeroes(heroes) {
        try {
            const stateToSave = heroes.map(h => {
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
        }
        catch (error) {
            console.error("[PERSISTENCE] Failed to save heroes state:", error);
        }
    }
    /**
     * Serializes and saves the world state to localStorage.
     */
    static saveWorldState(game) {
        try {
            const worldState = {
                food: game.food.map((f) => ({
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
        }
        catch (error) {
            console.error("[PERSISTENCE] Failed to save world state:", error);
        }
    }
    /**
     * Loads and deserializes heroes from localStorage. Returns null if no save exists.
     */
    static loadHeroes() {
        try {
            const data = localStorage.getItem(this.HEROES_STORAGE_KEY);
            if (!data)
                return null;
            const parsedData = JSON.parse(data);
            console.log(`[PERSISTENCE] Loaded ${parsedData.length} heroes from localStorage.`);
            return parsedData;
        }
        catch (error) {
            console.error("[PERSISTENCE] Failed to load heroes state:", error);
            return null;
        }
    }
    /**
     * Loads and deserializes world state from localStorage. Returns null if no save exists.
     */
    static loadWorldState() {
        try {
            const data = localStorage.getItem(this.WORLD_STORAGE_KEY);
            if (!data)
                return null;
            const parsedData = JSON.parse(data);
            // Supply defaults for new properties if missing from older saves
            parsedData.autoSpawnEnabled = parsedData.autoSpawnEnabled ?? true;
            parsedData.spawnFrequencyMultiplier = parsedData.spawnFrequencyMultiplier ?? 1;
            console.log(`[PERSISTENCE] Loaded world state from localStorage.`);
            return parsedData;
        }
        catch (error) {
            console.error("[PERSISTENCE] Failed to load world state:", error);
            return null;
        }
    }
    /**
     * Clears the current save data.
     */
    static clearSave() {
        try {
            localStorage.removeItem(this.HEROES_STORAGE_KEY);
            localStorage.removeItem(this.WORLD_STORAGE_KEY);
            console.log("[PERSISTENCE] Cleared save data.");
        }
        catch (error) {
            console.error("[PERSISTENCE] Failed to clear save data:", error);
        }
    }
}
PersistenceManager.HEROES_STORAGE_KEY = 'rpg_game_heroes_state';
PersistenceManager.WORLD_STORAGE_KEY = 'rpg_game_world_state';
//# sourceMappingURL=persistence.js.map