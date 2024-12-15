//@ts-check
import * as util from './util.js';
import * as controllers from './controllers.js';
import * as sprites from './sprites.js';
import * as tilemap from './tilemap.js';
import * as tile from './tile.js';
import * as entity from './entity.js';
import * as camera from './camera.js';
import * as inventory from './inventory.js';
import * as kioskitems from './kioskitems.js';
import * as map from './map.js';
import * as monster from './monster.js';
import * as players from './player.js';
import * as entityItems from './entity_items.js';
import * as menu from './menu.js';
import * as scores from './scores.js';
import { initSounds, initSpriteFiles } from './assets.js';

export class Game {
    /**@type {number|null} */
    timer_tick = null;
    FPSframes = 0;
    FPStime = 0;
    FPS = 0;
    updateTimes = new util.MathArray([]);
    drawTimes = new util.MathArray([]);
    updateMean = 0;
    updateMax = 0;
    drawMean = 0;
    drawMax = 0;

    fillScreen = false;
    prefDimW = 44;
    prefDimH = 26;
    dimW = this.prefDimW;
    dimH = this.prefDimH;
    uiWidth = 0; //width in tiles of non-game portion of screen
    uiHeight = 2; //height in tiles for non-game portion of screen
    gameOffsetX = 0;
    gameOffsetY = 0;
    startLevelTime = 60000;
    level = 1;
    maxHp = 3;

    /**@type {players.Player[]} */
    activePlayers = [];

    /**@type {tilemap.TileMap|null} */
    tiles = null; //tilemap for the level
    /**@type {monster.Monster[]|null} */
    monsters = null; //monsters in the level
    /**@type {entity.Entity[]|null} */
    items = null; //items in the level

    multiplayerEnabled = true;
    competitiveMode = false;
    sandboxMode = false;
    gameState = "loading";
    showFPS = false;
    cullOffCamera = true;
    cells = 0;
    cellsCollected = 0;
    startingHp = 3;
    numLevels = 30;
    shakeAmount = 0;
    shakeX = 0;
    shakeY = 0;
    numReady = 0;

    constructor() {

        /**@type {number} */
        this.initSounds();
        this.keyboard = new controllers.KeyboardController(this);
        this.touch = new controllers.TouchController(this);
        this.gamepadMgr = new controllers.GamepadManager(this);
        this.camera = new camera.Camera();
        this.tileSize = this.getTileScale() * 32;

        const spriteFiles = initSpriteFiles();
        this.sprites = {
            players: new sprites.SpriteSheet(this, spriteFiles.Players),
            monsters: new sprites.SpriteSheet(this, spriteFiles.Monsters),
            tiles: new sprites.SpriteSheet(this, spriteFiles.Tiles),
            entitiesItems: new sprites.SpriteSheet(this, spriteFiles.EntitiesItems),
            base: new sprites.SpriteSheet(this, spriteFiles.WaveStrong, 32),
        }

    }

    start() {
        window.onresize = (() => that.updateWindowSize());
        this.setupCanvas();

        let that = this;
        this.sprites.players.sheet.onload = (() => that.ready());
        this.sprites.monsters.sheet.onload = (() => that.ready());
        this.sprites.tiles.sheet.onload = (() => that.ready());
        this.sprites.entitiesItems.sheet.onload = (() => that.ready());

        this.mainMenu = new menu.MainMenu(this);
        this.optionsMenu = new menu.OptionsMenu(this);
        this.inGameMenu = new menu.InGameMenu(this);

    }

    ready() {
        this.numReady++;
        if (this.numReady >= 4) {
            this.gameState = 'title';
            this.update();
            //            let that=this;
            //            setInterval(()=>that.update(), 15);
        }
    }

    update() {
        let updateStart = performance.now();
        this.gamepadMgr.update_gamepad_states();
        for (let s of Object.keys(controllers.controlStates))
            controllers.newControlStates[s] = controllers.oldControlStates[s] !== controllers.controlStates[s];
        for (let p of this.activePlayers) {
            for (let s of Object.keys(p.controlStates)) {
                p.newControlStates[s] = p.oldControlStates[s] !== p.controlStates[s];
            }
        }
        if (this.gameState == "dead" && !controllers.oldControlStates["dash"] && controllers.controlStates["dash"]) {
            this.gameState = "scores"
        }
        else if (this.gameState == "running" || this.gameState == "dead") {
            if (this.gameState == "running" && controllers.controlStates['menu'] && !controllers.oldControlStates['menu']) {
                this.gameState = "paused";
            }
            if (this.gameState == "running" && controllers.controlStates['dash'] && !controllers.oldControlStates['dash']) {
                if (controllers.lastController.player == null)
                    this.addPlayer();
            }
            let millis = 15;
            let n_timer_tick = Date.now();
            if (this.timer_tick != null) {
                millis = Math.min(n_timer_tick - this.timer_tick, 30); //maximum of 30 ms refresh
            }

            this.timer_tick = n_timer_tick;
            for (let player of this.activePlayers) {
                player.update(game, millis);
            }
            this.levelTime -= millis; //n_timer_tick - timer_tick; //use real elapsed time for the timer

            if (this.levelTime < 0 && this.levelTime + millis >= 0) {
                let i = 0;
                for (let t of this.tiles.iterRect(new util.Rect([1, this.tiles.dimH - 1, this.tiles.dimW - 2, 1]))) {
                    this.items.push(new entityItems.Boom(t, 1000 + i * 20));
                    i += 1;
                }
            }

            for (let i of this.items) {
                i.update(this, millis);
            }
            this.remove_dead(this.items)

            for (let m of this.monsters) {
                m.update(this, millis);
            }
            this.remove_dead(this.monsters);

            this.remove_dropped(this.activePlayers);
            let all_dead = true;
            for (let player of this.activePlayers) {
                if (!player.dead) {
                    all_dead = false;
                    break;
                }
            }

            if (!this.competitiveMode && all_dead && this.gameState != "dead") {
                this.keyboard.player = null;
                this.touch.player = null;
                this.gamepadMgr.release_all_players();
                scores.addScore(this.score, false);
                this.gameState = "dead";
                this.items.push(new entityItems.DelayedSound('gameOver', 1000));
            }

            let level_clear = true;
            for (let player of this.activePlayers) {
                if (!player.dead && !player.escaped) {
                    level_clear = false;
                    break;
                }
            }
            if (level_clear && this.gameState != "dead") {
                //                this.playSound("newLevel"); 
                if (this.level == this.numLevels) {
                    if (!this.competitiveMode)
                        scores.addScore(this.score, true);
                    this.gameState = "dead";
                    this.prefDimW = 22;
                    this.prefDimH = 13;
                    this.updateWindowSize();
                    this.showTitle();
                } else {
                    this.level++;
                    this.startLevel();
                }
            }
            this.spawnCounter -= millis;
            if (this.spawnCounter <= 0 && this.activePlayers.length>0) {
                this.spawnCounter = this.spawnRate;
                if (this.monsters.length < 20) {
                    map.spawnMonster(this, this.activePlayers[0].pos, true); //player.pos to stop spawning near the player
                }
            }
            this.updateTimes.push(performance.now() - updateStart);
            this.draw(millis);
        } else if (this.gameState === "title" || this.gameState === "options") {
            this.showTitle();
        } else if (this.gameState === "scores") {
            this.showTitle();
            if (!controllers.oldControlStates["dash"] && controllers.controlStates["dash"]) {
                this.gameState = "title"
            }
        } else if (this.gameState === "paused") {
            this.showTitle();
            if (this.gameState === "paused" && !controllers.oldControlStates["menu"] 
                && controllers.controlStates["menu"]) {
                this.gameState = "running";
            }
        }

        controllers.setOldControlStates(controllers.controlStates);
        for (let p of this.activePlayers) {
            p.oldControlStates = { ...p.controlStates };
        }
        let that = this;
        window.requestAnimationFrame(() => that.update());
    }

    draw(millis) {
        let drawStart = performance.now();
        if (this.gameState === "running" || this.gameState === "dead") {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.screenshake();
            this.camera.update(game, millis);

            let cx = 0;
            let cy = 0;
            let cr = this.tiles.dimW;
            let cb = this.tiles.dimH;
            if (this.cullOffCamera) {
                cx = Math.floor(this.camera.x);
                cy = Math.floor(this.camera.y);
                cr = Math.ceil(this.camera.right);
                cb = Math.ceil(this.camera.bottom);
            }
            for (let i = cx; i < cr; i++) {
                for (let j = cy; j < cb; j++) {
                    this.tiles.at([i, j]).draw(game);
                }
            }
            const allItems = [...this.activePlayers, ...this.monsters, ...this.items];
            allItems.sort((a, b) => a.pos[1]-b.pos[1])
            if (this.cullOffCamera) {
                let cam = this.camera;
                for (let i of allItems) {
                    if (cam.shrinkBorders(-2).collide(new util.Rect([i.pos.x, i.pos.y, 1, 1]))) i.draw(this);
                }
            } else {
                for (let i = 0; i < this.items.length; i++) {
                    this.items[i].draw(this);
                }
            }
            // if (this.cullOffCamera) {
            //     let cam = this.camera;
            //     for (let m of this.monsters) {
            //         if (cam.collide(new util.Rect([m.pos.x, m.pos.y, 1, 1]))) m.draw(this);
            //     }
            //     for (let p of this.activePlayers) {
            //         if (cam.collide(new util.Rect([p.pos.x, p.pos.y, 1, 1]))) p.draw(this);
            //     }
            //     for (let i of this.items) {
            //         if (cam.collide(new util.Rect([i.pos.x, i.pos.y, 1, 1]))) i.draw(this);
            //     }
            // } else {
            //     for (let i = 0; i < this.monsters.length; i++) {
            //         this.monsters[i].draw(this);
            //     }

            //     for (let player of this.activePlayers) {
            //         player.draw(this);
            //     }

            //     for (let i = 0; i < this.items.length; i++) {
            //         this.items[i].draw(this);
            //     }
            // }

            // for(let i=0;i<this.items.length;i++){
            //     this.items[i].draw_bounds();
            // }


            this.shakeX = 0;
            this.shakeY = 0;
            const W = this.camera.scrollable ? this.camera.viewPortW : this.dimW;
            const H = this.camera.scrollable ? this.camera.viewPortH : this.dimH;
            //Draw time left
            let timerColor = (!this.competitiveMode || this.levelTime > this.startLevelTime - 10000) ? "DarkSeaGreen" : "DarkOrange";
            this.drawText("Lvl " + this.level + " Time " + Math.ceil(this.levelTime / 1000) + " Scr " + this.score, this.tileSize * 3 / 8, true, this.tileSize * 3 / 4, timerColor);

            let hud_pos = [new util.Vec2([0, 0]), new util.Vec2([W - 6, 0]), new util.Vec2([0, H - 1]), new util.Vec2([W - 6, H - 1])];
            let p = 0;
            for (let player of this.activePlayers) {
                let hp = hud_pos[p];
                player.drawHUD(game, hp);
                let i = 0;
                for (let item of player.inventory) {
                    item.draw(game, hp.add([3 + i + (this.competitiveMode ? 1 : 0), 0]), player);
                    i++;
                }
                for (let item of player.passiveInventory) {
                    item.draw(game, hp.add([3 + i + (this.competitiveMode ? 1 : 0), 0]), player);
                    i++;
                }
                p++;
            }
            this.drawTimes.push(performance.now() - drawStart);
            if (this.showFPS) {
                this.FPSframes += 1;
                this.FPStime += millis;
                if (this.FPStime > 1000) {
                    this.FPS = Math.round(10 * 1000 * this.FPSframes / this.FPStime) / 10
                    this.FPStime = 0;
                    this.FPSframes = 0;
                    this.updateMean = Math.round(this.updateTimes.mean() * 100) / 100;
                    this.updateMax = Math.round(this.updateTimes.max() * 100) / 100;
                    this.updateTimes = new util.MathArray([]);
                    this.drawMean = Math.round(this.drawTimes.mean() * 100) / 100;
                    this.drawMax = Math.round(this.drawTimes.max() * 100) / 100;
                    this.drawTimes = new util.MathArray([]);
                }
                let cull = this.cullOffCamera ? "CULL" : "";
                this.drawText("FPS: " + this.FPS + "  Update: " + this.updateMean + "ms (peak " + this.updateMax + ")  Draw: " + this.drawMean + "ms (peak " + this.drawMax + ") " + cull, this.tileSize * 3 / 8, true, this.tileSize * (H - 0.25) + this.gameOffsetY, "DarkSeaGreen");
            }
        }
    }

    setupCanvas() {
        this.canvas = document.querySelector("canvas");

        this.canvas.width = window.innerWidth; //this.tileSize*(this.dimW);
        this.canvas.height = window.innerHeight; //this.tileSize*(this.dimH);
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        if (this.camera.scrollable) {
            this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize * this.camera.viewPortW) / 2);
            this.gameOffsetY = Math.floor((window.innerHeight - this.tileSize * this.camera.viewPortH) / 2);

        } else {
            this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize * this.dimW) / 2);
            this.gameOffsetY = Math.floor((window.innerHeight - this.tileSize * this.dimH) / 2);
        }

    }

    getTileScale() {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        let scale;
        if (this.camera.scrollable) {
            scale = sh / (this.camera.viewPortH + this.uiHeight) / 32;
        } else {
            scale = Math.min(sh / (this.prefDimH + this.uiHeight) / 32, sw / (this.prefDimW + this.uiWidth) / 32);
        }
        if (!this.fillScreen) { //pixel perfect scaling
            scale = Math.floor(scale);
        }
        return scale;
    }

    fitMaptoTileSize(scale) {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        if (this.camera.scrollable) {
            this.camera.viewPortH = sh / scale; // (sh/scale - this.uiHeight);
            this.camera.viewPortW = sw / scale; //(sw/scale - this.uiWidth);    
            //            this.dimW = this.prefDimW;
            //            this.dimH = this.prefDimH;
        } else {
            this.dimH = Math.floor(sh / scale);
            this.dimW = Math.floor(sw / scale);
            //            this.dimH = Math.floor(sh/scale - this.uiHeight);
            //            this.dimW = Math.floor(sw/scale - this.uiWidth);    
            this.camera.viewPortH = this.dimH;
            this.camera.viewPortW = this.dimW;
        }
    }

    updateWindowSize() {
        if (this.competitiveMode) {
            this.camera.scrollable = false;
        } else {
            this.camera.scrollable = true;
            this.camera.viewPortW = 14;
            this.camera.viewPortH = 8;
        }

        this.tileSize = this.getTileScale() * 32;
        this.fitMaptoTileSize(this.tileSize);
        this.setupCanvas();
        this.mainMenu.updateWindowSize(this);
        this.optionsMenu.updateWindowSize(this);
    }


    initSounds() {
        this.sounds = initSounds();
    }

    playSound(soundName, ctime = 0, loop = false, play = true) {
        this.sounds[soundName].currentTime = ctime;
        this.sounds[soundName].loop = loop;
        if (play) {
            this.sounds[soundName].play();
        }
        return this.sounds[soundName];
    }

    showTitle() {
        this.ctx.fillStyle = 'rgba(0,0,0,.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        game.drawText("Oarstrong", 2 * this.tileSize, true, this.canvas.height / 2 - 3.5 * this.tileSize, "DarkSeaGreen");
        game.drawText("by Evan Moore", this.tileSize, true, this.canvas.height / 2 - 2 * this.tileSize, "DarkOrange");

        if (this.gameState === "title") {
            this.mainMenu.update(this, 0);
            this.mainMenu.draw(this);
        } else if (this.gameState === "options") {
            this.optionsMenu.update(this, 0);
            this.optionsMenu.draw(this);
        } else if (this.gameState === "paused") {
            this.inGameMenu.update(this, 0);
            this.inGameMenu.draw(this);
        } else if (this.gameState === "scores") {
            scores.drawScores(this);
        }
    }

    addPlayer() {
        let player = new players.Player();
        player.inventory.setPositions(this);
        player.passiveInventory.setPositions(this);
        player.hp = this.startingHp;
        player.maxHp = this.startingHp;
        let startingItems;
        if (this.sandboxMode) {
            startingItems = [new inventory.Wrench(), new inventory.Fist(), new inventory.PowerSaber(), new inventory.Grenade(),
            new inventory.Gun(), new inventory.Shotgun(), new inventory.Rifle(), new inventory.RocketLauncher(),
            new inventory.JetPack(), new inventory.Drone(), new inventory.GrappleGun()];
            startingItems[0].count = 4;
            startingItems[3].count = 5;
            for (let i of [new inventory.Shield(), new inventory.Glider()]) {
                player.passiveInventory.add(i);
            }
        } else {
            startingItems = [new inventory.Fist()];
            if (this.competitiveMode) {
                startingItems[0].hitDamage = 1;
            }
        }
        for (let i of startingItems) {
            player.inventory.add(i);
        }
        player.inventory.select(player.inventory[0]);
        player.pos = this.tiles.startTile.pos;
        player.controller = controllers.lastController;
        controllers.lastController.attach_to_player(player);
        this.activePlayers.push(player);
    }

    startGame() {
        this.timer_tick = null;
        this.level = 1;
        this.score = 0;
        this.cellsCollected = 2;
        this.activePlayers = [];
        let player = new players.Player();
        this.activePlayers.push(player);
        // single player attach all controllers to this player
        if (this.multiplayerEnabled) {
            controllers.lastController.attach_to_player(player);
        } else {
            this.keyboard.attach_to_player(player);
            this.touch.attach_to_player(player);
            this.gamepadMgr.attach_all_to_player(player);
        }
        player.hp = this.startingHp;
        player.maxHp = this.startingHp;
        let startingItems;
        if (this.sandboxMode) {
            startingItems = [new inventory.Wrench(), new inventory.Fist(), new inventory.PowerSaber(), new inventory.Grenade(),
            new inventory.Gun(), new inventory.Shotgun(), new inventory.Rifle(), new inventory.RocketLauncher(),
            new inventory.JetPack(), new inventory.Drone(), new inventory.GrappleGun()];
            startingItems[0].count = 4;
            startingItems[3].count = 5;
            for (let i of [new inventory.Shield(), new inventory.Glider()]) {
                player.passiveInventory.add(i);
            }
        }
        else {
            startingItems = [new inventory.Fist()];
            if (this.competitiveMode) {
                startingItems[0].hitDamage = 1;
            }
        }
        for (let i of startingItems) {
            player.inventory.add(i);
        }
        player.inventory.select(player.inventory[0]);
        this.startLevel();

        this.gameState = "running";
    }

    startLevel() {
        this.spawnRate = 10000;
        this.spawnCounter = this.spawnRate;
        this.levelTime = this.startLevelTime;
        this.camera.pos = null;

        let cc = this.competitiveMode ? 1 : this.cellsCollected;

        map.generateLevel(game);

        for (let player of this.activePlayers) {
            player.pos = this.tiles.startTile.pos;
            player.escaped = false;
            if (player.dead) {
                player.revive(this);
            }

            let addon = 1 + Math.floor(this.level / 10);
            if (this.sandboxMode && this.level > 1 && !player.dead) {
                let inventory = player.inventory;
                inventory[0].ammo += 2 * addon;
                inventory[1].charges += addon;
                inventory[2].count += addon;
                inventory[3].fuel += 1000 * addon;
                inventory[0].ammo = Math.min(inventory[0].ammo, inventory[0].maxAmmo);
                inventory[1].charges = Math.min(inventory[1].charges, inventory[1].maxCharges);
                inventory[2].count = Math.min(inventory[2].count, inventory[2].maxCount);
                inventory[3].fuel = Math.min(inventory[3].fuel, inventory[3].maxFuel);
            }
        }
        let items = util.shuffle([kioskitems.FistPickup, kioskitems.PowerSaberPickup, kioskitems.GrenadePickup, kioskitems.GunPickup,
        kioskitems.RiflePickup, kioskitems.ShotgunPickup, kioskitems.RocketLauncherPickup, kioskitems.JetPackPickup,
        kioskitems.WrenchPickup, kioskitems.GrappleGunPickup, kioskitems.DronePickup, kioskitems.ShieldPickup, kioskitems.GliderPickup]).slice(0, cc)
        items.push(kioskitems.HealthPickup);
        const kiosk = this.tiles.kioskTile
        if (kiosk instanceof tile.KioskDispenser) kiosk.setItems(items);
    }

    screenshake() {
        if (this.shakeAmount) {
            this.shakeAmount--;
        }
        let shakeAngle = Math.random() * Math.PI * 2;
        this.shakeX = Math.round(Math.cos(shakeAngle) * this.shakeAmount);
        this.shakeY = Math.round(Math.sin(shakeAngle) * this.shakeAmount);
    }

    drawText(text, size, centered, textY, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = size + "px monospace";
        let textX;
        if (centered) {
            textX = (this.canvas.width - this.ctx.measureText(text).width) / 2;
        } else {
            textX = this.canvas.width - this.uiWidth * (this.tileSize - 1);
        }

        this.ctx.fillText(text, textX, textY);
    }

    drawTileText(text, text_size, pos, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = text_size + "px monospace";
        let textY = (pos.y + 1 - (1 - text_size / this.tileSize) / 2) * this.tileSize + this.gameOffsetY + this.shakeY;
        let textX = (pos.x + (1 - this.ctx.measureText(text).width / this.tileSize) / 2) * this.tileSize + this.gameOffsetX + this.shakeX;
        this.ctx.fillText(text, textX, textY);
    }

    /**
     * 
     * @param {util.Vec2} pos 
     * @returns {[players.Player|null, number]}
     */
    nearestPlayer(pos) {
        let bestd = 1e9;
        /**@type {players.Player|null} */
        let bestp = null;
        for (let p of this.activePlayers) {
            if (!p.dead) {
                let d = p.pos.dist(pos);
                bestp = d < bestd ? p : bestp;
                bestd = d < bestd ? d : bestd;
            }
        }
        return [bestp, bestd];
    }
    /**
     * 
     * @param {boolean} forcePlayers 
     * @param {monster.Monster|null} exclude 
     * @returns 
     */
    monsters_and_players(forcePlayers = true, exclude = null) {
        if (!forcePlayers && (!this.competitiveMode || this.levelTime > this.startLevelTime - 10000)) {
            return this.monsters.filter(m => m !== exclude);
        }
        return this.monsters.concat(this.activePlayers).filter(m => m !== exclude);
    }

    /**
     * 
     * @param {players.Player} player 
     * @returns 
     */
    monsters_with_other_players(player) {
        if (!this.competitiveMode || this.levelTime > this.startLevelTime - 10000) {
            return this.monsters;
        }
        let i = this.activePlayers.indexOf(player);
        let pl = this.activePlayers.slice(0, i).concat(this.activePlayers.slice(i + 1));
        let all = this.monsters.concat(pl);
        return all;
    }

    /**
     * 
     * @param {players.Player} player 
     * @returns 
     */
    other_players(player) {
        let i = this.activePlayers.indexOf(player);
        return this.activePlayers.slice(0, i).concat(this.activePlayers.slice(i + 1));
    }

    /**
     * 
     * @param {entity.Entity[]} items 
     * @param {entity.Entity} item 
     * @returns 
     */
    remove(items, item) {
        for (let i = 0; i < items.length; i++) {
            if (items[i] == item) {
                items.splice(i, 1);
                return;
            }
        }
    }

    /**
     * 
     * @param {entity.Entity[]} items 
     * @returns 
     */
    remove_dead(items) {
        for (let k = items.length - 1; k >= 0; k--) {
            if (items[k].dead) items.splice(k, 1);
        }
    }

    /**
     * 
     * @param {players.Player[]} players 
     */
    remove_dropped(players) {
        for (let k = players.length - 1; k >= 0; k--) {
            if (players[k].dropFromGame) {
                players[k].controller.attach_to_player();
                this.items.push(new entityItems.DeadPlayer(players[k]));
                players.splice(k, 1);
            }
        }
    }
    /**
     * 
     * @param {tile.Tile} tile 
     */
    addGunPlatform(tile) {
        return;
        // this.monsters.push(new monster.GunPlatform(tile));
    }
    /**
     * 
     * @param {tile.Tile} tile 
     * @param {number} value
     */
    addChips(tile, value) {
        const chips = new entityItems.Chips(tile, value)
        this.items.push(chips);
        return chips;
    }
    /**
     * 
     * @param {tile.Tile} tile 
     * @param {number} timer 
     */
    addBoom(tile, timer) {
        const boom = new entityItems.Boom(tile, timer)
        this.items.push(boom);
        return boom;
    }
    /**
     * 
     * @param {tile.Tile} tile 
     */
    addTrapBlade(tile) {
        const trapBlade = new entityItems.TrapBlade(tile)
        this.items.push(trapBlade);
        return trapBlade;
    }
}


var game = new Game();
game.start();
