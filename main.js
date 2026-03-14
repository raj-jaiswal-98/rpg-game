import { Input } from "./scripts/input.js";
import World from "./scripts/world.js";
import { Hero } from "./scripts/hero.js";
import { Camera } from "./scripts/camera.js";
import { Food } from "./scripts/food.js";
import { PersistenceManager } from "./scripts/persistence.js";
// Make Food available to the spawner until we refactor into modules etc.
window.Food = Food;
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
            this.food = [];
            this.autoSpawnEnabled = true;
            this.spawnFrequencyMultiplier = 1;
            this.world = new World();
            this.activeHeroIndex = -1;
            // Helper to generate a random walkable coordinate
            const getRandomSafePosition = () => {
                let row, col;
                let attempts = 0;
                do {
                    row = Math.floor(Math.random() * ROWS);
                    col = Math.floor(Math.random() * COLS);
                    attempts++;
                } while ((this.world.getTile(this.world.level1.collisionLayer, row, col) === 1 || this.isTileOccupied(row, col)) && attempts < 100);
                return { x: col * TILE_SIZE, y: row * TILE_SIZE };
            };
            const savedHeroes = PersistenceManager.loadHeroes();
            if (savedHeroes && savedHeroes.length > 0) {
                this.heroes = savedHeroes.map(data => new Hero({
                    game: this,
                    name: data.name,
                    health: data.health,
                    maxHealth: data.maxHealth,
                    maxEnergy: data.maxEnergy,
                    energy: data.energy,
                    speed: data.speed,
                    indicatorColor: data.indicatorColor,
                    gender: data.gender,
                    familyId: data.familyId,
                    socialStatus: data.socialStatus,
                    position: { ...data.position },
                    scale: data.scale,
                    fertilityMeter: data.fertilityMeter,
                    angerMeter: data.angerMeter,
                    isDead: data.isDead,
                    sprite: {
                        image: document.getElementById(data.spriteId || (data.gender === 'male' ? 'hero1' : 'hero2')),
                        x: 0,
                        y: 0,
                        width: 64,
                        height: 64,
                    }
                }));
            }
            else {
                this.heroes = [
                    new Hero({
                        game: this,
                        name: "Majnu Kumar",
                        health: 50,
                        maxHealth: 100,
                        energy: 50,
                        speed: 80,
                        sprite: {
                            image: document.getElementById("hero1"),
                            x: 0,
                            y: 0,
                            width: 64,
                            height: 64,
                        },
                        position: getRandomSafePosition(),
                        scale: 1,
                        indicatorColor: "119, 212, 255", // Cyan for Majnu
                        gender: 'male',
                        familyId: 'Kumar',
                    }),
                    new Hero({
                        game: this,
                        name: "Laila Kumari",
                        health: 50,
                        maxHealth: 100,
                        energy: 50,
                        speed: 70,
                        sprite: {
                            image: document.getElementById("hero2"),
                            x: 0,
                            y: 0,
                            width: 64,
                            height: 64
                        },
                        position: getRandomSafePosition(),
                        scale: 1,
                        indicatorColor: "224, 179, 255", // Purple for Laila
                        gender: 'female',
                        familyId: 'Kumar',
                    }),
                    new Hero({
                        game: this,
                        name: "Adam Smith",
                        health: 50,
                        maxHealth: 100,
                        energy: 50,
                        speed: 75,
                        sprite: {
                            image: document.getElementById("hero1"),
                            x: 0,
                            y: 0,
                            width: 64,
                            height: 64
                        },
                        position: getRandomSafePosition(),
                        scale: 1,
                        indicatorColor: "255, 100, 100",
                        gender: 'male',
                        familyId: 'Smith',
                    }),
                    new Hero({
                        game: this,
                        name: "Eve Jones",
                        health: 50,
                        maxHealth: 100,
                        energy: 50,
                        speed: 75,
                        sprite: {
                            image: document.getElementById("hero2"),
                            x: 0,
                            y: 0,
                            width: 64,
                            height: 64
                        },
                        position: getRandomSafePosition(),
                        scale: 1,
                        indicatorColor: "255, 150, 200",
                        gender: 'female',
                        familyId: 'Jones',
                    })
                ];
            }
            // Auto-save every 5 seconds
            setInterval(() => {
                PersistenceManager.saveHeroes(this.heroes);
                PersistenceManager.saveWorldState(this);
            }, 5000);
            this.input = new Input();
            this.camera = new Camera(0, 0, 1);
            this.eventUpdate = false;
            this.eventTimer = 0;
            this.eventInterval = 50;
            this.debug = true; // Set to true for diagnostics
            // Load world state
            const savedWorld = PersistenceManager.loadWorldState();
            if (savedWorld) {
                this.camera.x = savedWorld.camera.x;
                this.camera.y = savedWorld.camera.y;
                this.camera.zoom = savedWorld.camera.zoom;
                this.activeHeroIndex = savedWorld.activeHeroIndex;
                this.autoSpawnEnabled = savedWorld.autoSpawnEnabled;
                this.spawnFrequencyMultiplier = savedWorld.spawnFrequencyMultiplier;
                // Restore food
                savedWorld.food.forEach((fData) => {
                    const imgId = fData.type === 'fastfood' ? "food-burger" : "food-meal";
                    const foodImg = document.getElementById(imgId);
                    if (foodImg) {
                        this.food.push(new window.Food({
                            game: this,
                            type: fData.type,
                            sprite: { image: foodImg, x: 0, y: 0, width: 64, height: 64 },
                            position: { x: fData.position.x, y: fData.position.y }
                        }));
                    }
                });
                console.log(`[WORLD] Restored ${this.food.length} food items and camera settings.`);
            }
        }
        render(ctx, deltaTime) {
            this.heroes.forEach(h => h.update(deltaTime));
            ctx.save();
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x, -this.camera.y);
            this.world.drawBackground(ctx);
            this.food.forEach(f => f.draw(ctx));
            this.heroes.forEach(h => h.draw(ctx));
            this.heroes.forEach(h => h.drawTargetIndicator(ctx));
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
        spawnFood(type) {
            try {
                console.log(`[WORLD_FOOD] spawnFood execution started for type: ${type}`);
                // Find safe position
                let row, col;
                let attempts = 0;
                do {
                    row = Math.floor(Math.random() * ROWS);
                    col = Math.floor(Math.random() * COLS);
                    const isBlocked = this.world.getTile(this.world.level1.collisionLayer, row, col) === 1;
                    const hasFood = this.food.some(f => Math.round(f.position.y / TILE_SIZE) === row && Math.round(f.position.x / TILE_SIZE) === col);
                    const hasHero = this.isTileOccupied(row, col);
                    if (!isBlocked && !hasFood && !hasHero)
                        break;
                    attempts++;
                } while (attempts < 100);
                if (attempts >= 100) {
                    console.warn("[WORLD_FOOD] Could not find empty tile to spawn food after 100 attempts");
                    return;
                }
                const imgId = type === 'fastfood' ? "food-burger" : "food-meal";
                const foodImg = document.getElementById(imgId);
                if (!foodImg) {
                    console.error(`[WORLD_FOOD] Could not find image element with ID: ${imgId}`);
                    return;
                }
                const food = new window.Food({
                    game: this,
                    type: type,
                    sprite: {
                        image: foodImg,
                        x: 0,
                        y: 0,
                        width: 64,
                        height: 64
                    },
                    position: { x: col * TILE_SIZE, y: row * TILE_SIZE }
                });
                this.food.push(food);
                console.log(`[WORLD_FOOD] Success! Food ${type} added at col:${col}, row:${row}. Total food now: ${this.food.length}`);
            }
            catch (error) {
                console.error("[WORLD_FOOD] Critical error in spawnFood:", error);
            }
        }
        async spawnHero(gender) {
            // Find safe position
            let row, col;
            let attempts = 0;
            do {
                row = Math.floor(Math.random() * ROWS);
                col = Math.floor(Math.random() * COLS);
                attempts++;
            } while ((this.world.getTile(this.world.level1.collisionLayer, row, col) === 1 || this.isTileOccupied(row, col)) && attempts < 100);
            if (attempts >= 100) {
                console.warn("[WORLD_HERO] Could not find empty tile to spawn hero");
                return;
            }
            const g = gender || (Math.random() > 0.5 ? 'male' : 'female');
            const spriteId = g === 'male' ? "hero1" : "hero2";
            // Get name from API or fallback
            let name = g === 'male' ? "New Guy" : "New Girl";
            let familyId = Math.random().toString(36).substr(2, 9);
            try {
                const response = await fetch(`https://randomuser.me/api/?gender=${g}&nat=us`);
                const data = await response.json();
                const n = data.results[0].name;
                name = `${n.first} ${n.last}`;
                familyId = n.last;
            }
            catch (e) {
                console.error("Failed to fetch name for manual spawn:", e);
            }
            const newHero = new Hero({
                game: this,
                name: name,
                health: 100,
                energy: 100,
                speed: 70 + Math.random() * 20,
                sprite: {
                    image: document.getElementById(spriteId),
                    x: 0,
                    y: 0,
                    width: 64,
                    height: 64,
                },
                position: { x: col * TILE_SIZE, y: row * TILE_SIZE },
                scale: 1,
                gender: g,
                familyId: familyId,
                indicatorColor: g === 'male' ? "119, 212, 255" : "224, 179, 255"
            });
            this.heroes.push(newHero);
            window.updateInfoPanelLayout();
            console.log(`[WORLD_HERO] Manually spawned ${name} at (${col}, ${row})`);
        }
        isTileOccupied(row, col, excludeHero) {
            if (!this.heroes)
                return false;
            // Check for heroes
            for (const hero of this.heroes) {
                if (hero === excludeHero || hero.isDead)
                    continue;
                const hRow = Math.round(hero.position.y / TILE_SIZE);
                const hCol = Math.round(hero.position.x / TILE_SIZE);
                if (hRow === row && hCol === col)
                    return true;
                const dRow = Math.round(hero.destinationPosition.y / TILE_SIZE);
                const dCol = Math.round(hero.destinationPosition.x / TILE_SIZE);
                if (dRow === row && dCol === col)
                    return true;
            }
            return false;
        }
    }
    const game = new Game();
    window.game = game; // Expose for easier console debugging
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
    // Set up spawn controls
    document.getElementById("spawn-small-meal")?.addEventListener("click", () => {
        console.log("UI_CLICK: Spawn Small Meal button pressed");
        try {
            game.spawnFood('fastfood');
            console.log("UI_CLICK: game.spawnFood('fastfood') call completed");
        }
        catch (e) {
            console.error("UI_CLICK_ERROR: Failed to call spawnFood:", e);
        }
    });
    document.getElementById("spawn-large-meal")?.addEventListener("click", () => {
        console.log("UI_CLICK: Spawn Large Meal button pressed");
        try {
            game.spawnFood('meal');
            console.log("UI_CLICK: game.spawnFood('meal') call completed");
        }
        catch (e) {
            console.error("UI_CLICK_ERROR: Failed to call spawnFood:", e);
        }
    });
    document.getElementById("spawn-random-hero")?.addEventListener("click", () => {
        console.log("UI_CLICK: Spawn Random Hero button pressed");
        try {
            game.spawnHero();
            console.log("UI_CLICK: game.spawnHero() call completed");
        }
        catch (e) {
            console.error("UI_CLICK_ERROR: Failed to call spawnHero:", e);
        }
    });
    const autoSpawnBtn = document.getElementById("toggle-auto-spawn");
    autoSpawnBtn?.addEventListener("click", () => {
        game.autoSpawnEnabled = !game.autoSpawnEnabled;
        if (autoSpawnBtn) {
            autoSpawnBtn.innerText = game.autoSpawnEnabled ? "Pause Auto-Spawn" : "Resume Auto-Spawn";
            autoSpawnBtn.style.background = game.autoSpawnEnabled ? "#660033" : "#006633";
            autoSpawnBtn.style.borderColor = game.autoSpawnEnabled ? "#ff0066" : "#00ff66";
        }
        console.log(`[WORLD_AUTO_SPAWN] Automatic food spawning ${game.autoSpawnEnabled ? 'resumed' : 'paused'}`);
    });
    document.getElementById("food-spawn-rate")?.addEventListener("input", (e) => {
        const target = e.target;
        game.spawnFrequencyMultiplier = parseFloat(target.value);
        console.log(`[WORLD_AUTO_SPAWN] Spawn frequency multiplier set to: ${game.spawnFrequencyMultiplier}`);
    });
    const infoPanel = document.getElementById("info-panel");
    const updateInfoPanelLayout = () => {
        if (infoPanel) {
            // Group heroes by familyId
            const families = {};
            game.heroes.forEach((hero, index) => {
                const fId = hero.familyId || "Unknown";
                if (!families[fId])
                    families[fId] = [];
                // Store original index for DOM IDs
                hero._originalIndex = index;
                families[fId].push(hero);
            });
            let htmlContent = '';
            for (const [fId, members] of Object.entries(families)) {
                htmlContent += `
        <div class="family-group">
          <div class="family-header">Family: ${fId}</div>
          ${members.map((hero) => {
                    const index = hero._originalIndex;
                    const isActive = index === game.activeHeroIndex;
                    return `
            <div class="hero-info ${isActive ? 'active-hero' : ''}" id="hero-info-${index}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <h3 style="margin: 0;">${hero.name}</h3>
                <button class="active-toggle-btn ${isActive ? 'is-active' : ''}" id="hero-btn-${index}" data-index="${index}">
                  ${isActive ? 'Active' : (game.activeHeroIndex === -1 ? 'Select' : 'Set Active')}
                </button>
              </div>
              
              <div class="stat-row" title="Health">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <div class="stat-bar-container"><div class="stat-bar-fill health-fill" id="hp-bar-${index}" style="width: ${(hero.health / hero.maxHealth) * 100}%"></div></div>
              </div>
              <div class="stat-row" title="Energy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ed573" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                <div class="stat-bar-container"><div class="stat-bar-fill energy-fill" id="en-bar-${index}" style="width: ${hero.energy}%"></div></div>
              </div>
              <div class="stat-row" title="Fertility">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e0b3ff" stroke-width="2"><circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/></svg>
                <div class="stat-bar-container"><div class="stat-bar-fill fertility-fill" id="fr-bar-${index}" style="width: ${hero.fertilityMeter}%"></div></div>
              </div>
              <div class="stat-row" title="Anger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffa502" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                <div class="stat-bar-container"><div class="stat-bar-fill anger-fill" id="an-bar-${index}" style="background-color: #ff3333; width: ${hero.angerMeter}%"></div></div>
              </div>
              <div class="stat-row" title="Social Status">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e90ff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <div class="stat-bar-container"><div class="stat-bar-fill social-fill" id="ss-bar-${index}" style="width: ${hero.socialStatus}%"></div></div>
              </div>
              <div id="hero-status-${index}" style="color: #ffcc00; font-size: 0.8em; margin-top: 4px; font-weight: bold;"></div>
            </div>
            `;
                }).join('')}
        </div>
        `;
            }
            infoPanel.innerHTML = htmlContent;
        }
    };
    window.updateInfoPanelLayout = updateInfoPanelLayout;
    // Initialize Info Panel HTML once
    updateInfoPanelLayout();
    // Use event delegation for the toggle buttons outside the loop
    if (infoPanel) {
        infoPanel.addEventListener('click', (e) => {
            const target = e.target.closest('.active-toggle-btn');
            console.log("Clicked info panel, button found:", !!target);
            if (target) {
                // Stop the click from registering as a map movement click underneath the UI
                e.stopPropagation();
                const index = parseInt(target.getAttribute('data-index') || "0");
                // Toggle off if clicking the already-active hero, otherwise set to new index
                if (game.activeHeroIndex === index) {
                    console.log(`Toggling OFF active hero (was index ${index})`);
                    game.activeHeroIndex = -1;
                }
                else {
                    console.log(`Setting active hero to index ${index}`);
                    game.activeHeroIndex = index;
                    // Clear any stale inputs that were queued while no hero was active
                    game.input.clearClickPosition();
                    game.input.keys = [];
                    console.log(`Active hero changed to: ${game.heroes[index].name} (Index ${index})`);
                }
            }
        });
    }
    function animate(timestamp) {
        requestAnimationFrame(animate);
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        game.render(ctx, deltaTime);
        // Food Spawning logic (Random intervals)
        if (game.eventUpdate && game.autoSpawnEnabled && game.spawnFrequencyMultiplier > 0) {
            if (Math.random() < 0.05 * game.spawnFrequencyMultiplier)
                game.spawnFood('fastfood');
            if (Math.random() < 0.01 * game.spawnFrequencyMultiplier)
                game.spawnFood('meal');
        }
        // Reproduction System Loop
        // Only adults can reproduce
        const readyHeroes = game.heroes.filter(h => h.isAdult() && h.fertilityMeter >= 80 && !h.isReproducing);
        // Sort by social status to give preference
        readyHeroes.sort((a, b) => b.socialStatus - a.socialStatus);
        const males = readyHeroes.filter(h => h.gender === 'male');
        const females = readyHeroes.filter(h => h.gender === 'female');
        for (const male of males) {
            for (const female of females) {
                // Check if they are already reproducing together (implicit via timer)
                if (male.isReproducing || female.isReproducing)
                    continue;
                const maleTile = { x: Math.round(male.position.x / TILE_SIZE), y: Math.round(male.position.y / TILE_SIZE) };
                const femaleTile = { x: Math.round(female.position.x / TILE_SIZE), y: Math.round(female.position.y / TILE_SIZE) };
                const dist = Math.abs(maleTile.x - femaleTile.x) + Math.abs(maleTile.y - femaleTile.y);
                if (dist === 1) {
                    // Adjacent and ready!
                    male.startReproducing(female);
                    female.startReproducing(male);
                    // Fetch name from API
                    async function getRandomName(gender, surname) {
                        try {
                            const response = await fetch(`https://randomuser.me/api/?gender=${gender}&nat=us`);
                            const data = await response.json();
                            const nameData = data.results[0].name;
                            return `${nameData.first} ${surname}`;
                        }
                        catch (e) {
                            console.error("Failed to fetch name from API:", e);
                            return gender === 'male' ? "Junior " + surname : "Mini " + surname;
                        }
                    }
                    // Child spawn callback (simulated after duration)
                    setTimeout(async () => {
                        const gender = Math.random() > 0.5 ? 'male' : 'female';
                        const name = await getRandomName(gender, male.familyId);
                        const spriteId = gender === 'male' ? "hero1" : "hero2";
                        // Find a nearby empty tile for the baby
                        const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }];
                        let babyPos = { x: male.position.x, y: male.position.y };
                        for (const d of directions) {
                            const testRow = maleTile.y + d.y;
                            const testCol = maleTile.x + d.x;
                            const isBlocked = game.world.getTile(game.world.level1.collisionLayer, testRow, testCol) === 1;
                            if (!isBlocked && !game.isTileOccupied(testRow, testCol)) {
                                babyPos = { x: testCol * TILE_SIZE, y: testRow * TILE_SIZE };
                                break;
                            }
                        }
                        const baby = new Hero({
                            game: game,
                            name: name,
                            health: 25,
                            maxHealth: 100,
                            energy: 50,
                            speed: 60,
                            sprite: {
                                image: document.getElementById(spriteId),
                                x: 0,
                                y: 0,
                                width: 64,
                                height: 64,
                            },
                            position: babyPos,
                            scale: 0.25,
                            gender: gender,
                            familyId: male.familyId,
                            indicatorColor: gender === 'male' ? "119, 212, 255" : "224, 179, 255"
                        });
                        game.heroes.push(baby);
                        updateInfoPanelLayout();
                        console.log(`[WORLD_REPRO] A new hero was born: ${name}! Family ID: ${male.familyId}`);
                    }, 5000);
                }
                else if (!male.moving && !female.moving) {
                    // Find a tile adjacent to female for male to move to
                    const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                    for (const d of directions) {
                        const targetTileX = femaleTile.x + d.x;
                        const targetTileY = femaleTile.y + d.y;
                        if (targetTileX >= 0 && targetTileX < COLS && targetTileY >= 0 && targetTileY < ROWS) {
                            const isBlocked = game.world.getTile(game.world.level1.collisionLayer, targetTileY, targetTileX) === 1;
                            if (!isBlocked && !game.isTileOccupied(targetTileY, targetTileX)) {
                                male.navigateToTile({ x: targetTileX * TILE_SIZE, y: targetTileY * TILE_SIZE });
                                break;
                            }
                        }
                    }
                }
            }
        }
        // Remove dead heroes from list and update layout if needed
        const initialCount = game.heroes.length;
        game.heroes = game.heroes.filter(h => !h.isDead);
        if (game.heroes.length !== initialCount && infoPanel) {
            updateInfoPanelLayout();
        }
        game.heroes.forEach((hero, index) => {
            const isActive = index === game.activeHeroIndex;
            // Update Info Panel stats dynamically
            if (infoPanel) {
                // Sync visual bars
                const hpBar = document.getElementById(`hp-bar-${index}`);
                if (hpBar) {
                    const maxH = hero.maxHealth || 100;
                    hpBar.style.width = (hero.health / maxH * 100) + "%";
                }
                const enBar = document.getElementById(`en-bar-${index}`);
                if (enBar)
                    enBar.style.width = hero.energy + "%";
                const frBar = document.getElementById(`fr-bar-${index}`);
                if (frBar)
                    frBar.style.width = hero.fertilityMeter + "%";
                const anBar = document.getElementById(`an-bar-${index}`);
                if (anBar)
                    anBar.style.width = hero.angerMeter + "%";
                const ssBar = document.getElementById(`ss-bar-${index}`);
                if (ssBar)
                    ssBar.style.width = hero.socialStatus + "%";
                const statusEl = document.getElementById(`hero-status-${index}`);
                if (statusEl) {
                    statusEl.innerText = hero.isReproducing ? "Engaging in reproduction..." : "";
                }
                // Update UI dynamic styling
                const infoDiv = document.getElementById(`hero-info-${index}`);
                if (infoDiv) {
                    if (isActive)
                        infoDiv.classList.add('active-hero');
                    else
                        infoDiv.classList.remove('active-hero');
                }
                const btn = document.getElementById(`hero-btn-${index}`);
                if (btn) {
                    if (isActive) {
                        btn.classList.add('is-active');
                        btn.innerText = 'Active';
                    }
                    else {
                        btn.classList.remove('is-active');
                        btn.innerText = game.activeHeroIndex === -1 ? 'Select' : 'Set Active';
                    }
                }
            }
            // --- Autonomous Hero Logic ---
            if (!hero.moving && !hero.isReproducing) {
                // Priority 1: Survival (Food Seeking)
                const isStarving = hero.energy < 60; // Increased to seek energy earlier
                const isInjured = hero.health < 75;
                // Priority 0: Insane Mode (If anger > 80)
                if (hero.angerMeter > 80) {
                    hero.intendedFoodPos = null; // Drop everything else
                    let closestTarget = null;
                    // 1. Check food
                    game.food.forEach(f => {
                        const d = Math.hypot(f.position.x - hero.position.x, f.position.y - hero.position.y);
                        if (!closestTarget || d < closestTarget.distance) {
                            closestTarget = { type: 'food', entity: f, distance: d };
                        }
                    });
                    // 2. Check heroes
                    game.heroes.forEach(h => {
                        if (h !== hero && !h.isDead) {
                            const d = Math.hypot(h.position.x - hero.position.x, h.position.y - hero.position.y);
                            if (!closestTarget || d < closestTarget.distance) {
                                if (h.familyId === hero.familyId) {
                                    closestTarget = { type: 'family', entity: h, distance: d };
                                }
                                else {
                                    closestTarget = { type: 'enemy', entity: h, distance: d };
                                }
                            }
                        }
                    });
                    if (closestTarget) {
                        const ct = closestTarget;
                        if (game.eventUpdate)
                            console.log(`[HERO_AI] ${hero.name} is INSANE (Anger > 80)! Seeking closest target: ${ct.type}`);
                        if (ct.type === 'food') {
                            hero.intendedFoodPos = ct.entity.position;
                            hero.navigateToTile(ct.entity.position);
                        }
                        else if (ct.type === 'family') {
                            const target = ct.entity;
                            const dist = Math.abs(hero.position.x - target.position.x) + Math.abs(hero.position.y - target.position.y);
                            if (dist <= TILE_SIZE * 1.5) {
                                hero.socialize(0.5); // Fast socialize to cool down
                                target.socialize(0.5);
                            }
                            else {
                                hero.navigateToTile(target.position);
                            }
                        }
                        else if (ct.type === 'enemy') {
                            const target = ct.entity;
                            const dist = Math.abs(hero.position.x - target.position.x) + Math.abs(hero.position.y - target.position.y);
                            if (dist <= TILE_SIZE * 1.5) {
                                hero.attack(target);
                            }
                            else {
                                hero.navigateToTile(target.position);
                            }
                        }
                    }
                    else {
                        // Calm down slowly if no targets exist
                        hero.angerMeter -= 5;
                    }
                }
                // Priority 1: Survival (Food Seeking)
                else if ((isStarving || isInjured) && game.food.length > 0) {
                    // Find closest food
                    let closestFood = game.food[0];
                    let minDist = Infinity;
                    game.food.forEach(f => {
                        const d = Math.hypot(f.position.x - hero.position.x, f.position.y - hero.position.y);
                        if (d < minDist) {
                            minDist = d;
                            closestFood = f;
                        }
                    });
                    if (game.eventUpdate) {
                        console.log(`[HERO_AI] ${hero.name} prioritizing survival (health/energy). Seeking ${closestFood.type} at (${closestFood.position.x / TILE_SIZE}, ${closestFood.position.y / TILE_SIZE})`);
                    }
                    else if (!hero.moving) {
                        // Log once when they start moving toward food if we aren't in an event update frame
                        console.log(`[HERO_AI] ${hero.name} found nearest food and has started moving towards it.`);
                    }
                    hero.intendedFoodPos = closestFood.position;
                    hero.navigateToTile(closestFood.position);
                }
                // Priority 2: Socialization & Reproduction (Only if healthy & energetic)
                else if (hero.energy > 75 && hero.health >= 75) {
                    hero.intendedFoodPos = null;
                    let closestFriend = null;
                    let minDist = Infinity;
                    // Find closest hero who is also idle and willing to socialize
                    game.heroes.forEach(h => {
                        if (h !== hero && !h.isDead && h.energy > 75 && h.health >= 75 && !h.isReproducing) {
                            const d = Math.hypot(h.position.x - hero.position.x, h.position.y - hero.position.y);
                            if (d < minDist) {
                                minDist = d;
                                closestFriend = h;
                            }
                        }
                    });
                    if (closestFriend) {
                        const friend = closestFriend;
                        const dist = Math.hypot(friend.position.x - hero.position.x, friend.position.y - hero.position.y);
                        if (dist < TILE_SIZE * 1.5) {
                            hero.socialize(0.1); // Small increase per frame while near
                            friend.socialize(0.1);
                            if (game.eventUpdate)
                                console.log(`[HERO_AI] ${hero.name} is socializing with ${friend.name}`);
                        }
                        else {
                            hero.navigateToTile(friend.position);
                            if (game.eventUpdate && !hero.moving) {
                                console.log(`[HERO_AI] ${hero.name} is heading to socialize with ${friend.name}`);
                            }
                        }
                    }
                    else if (Math.random() < 0.01) {
                        // Random walk / Explore
                        const targetX = Math.floor(Math.random() * COLS) * TILE_SIZE;
                        const targetY = Math.floor(Math.random() * ROWS) * TILE_SIZE;
                        hero.navigateToTile({ x: targetX, y: targetY });
                    }
                }
                // Priority 3: Conflict (If angry)
                else if (hero.angerMeter > 80) {
                    hero.intendedFoodPos = null; // Reset if switching priorities
                    const target = game.heroes.find(h => h !== hero && h.familyId !== hero.familyId && !h.isDead);
                    if (target) {
                        if (game.eventUpdate)
                            console.log(`[HERO_AI] ${hero.name} is angry. Hunting ${target.name}`);
                        const dist = Math.abs(hero.position.x - target.position.x) + Math.abs(hero.position.y - target.position.y);
                        if (dist <= TILE_SIZE) {
                            hero.attack(target);
                        }
                        else {
                            hero.navigateToTile(target.position);
                        }
                    }
                }
            }
        });
        // --- Global Food Consumption (More robust) ---
        game.food = game.food.filter(f => {
            let consumed = false;
            game.heroes.forEach(h => {
                if (!consumed && !h.isDead) {
                    const dist = Math.hypot(f.position.x - h.position.x, f.position.y - h.position.y);
                    if (dist < TILE_SIZE * 0.8) { // Increased radius for reliability
                        h.eat(f.type);
                        h.intendedFoodPos = null;
                        consumed = true;
                        // Trigger anger in rivals who were targeting this food
                        game.heroes.forEach(rival => {
                            if (rival !== h && !rival.isDead && rival.intendedFoodPos && rival.intendedFoodPos.x === f.position.x && rival.intendedFoodPos.y === f.position.y) {
                                rival.angerMeter += 40;
                                if (rival.angerMeter > 100)
                                    rival.angerMeter = 100;
                                console.log(`[HERO_AI] ${rival.name} is furious! ${h.name} ate their targeted food!`);
                                rival.intendedFoodPos = null; // Targeted food is gone
                            }
                        });
                    }
                }
            });
            return !consumed;
        });
    }
    requestAnimationFrame(animate);
    window.addEventListener("beforeunload", () => {
        PersistenceManager.saveHeroes(game.heroes);
        PersistenceManager.saveWorldState(game);
    });
});
//# sourceMappingURL=main.js.map