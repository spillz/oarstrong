//@ts-check

import { initializeControlStates } from "./controllers";

import { ActiveInventory, Inventory } from "./inventory";
import { Rect, Timer, Vec2, choose } from "./util";
import { Monster } from "./monster";
import { baseSetIds, entityItemIds } from "./sprites";
import { Void } from "./tile";
/**@typedef {import('./game').Game} Game */


//Motion states
const STATE_WALK = 0;
const STATE_STUN = 1;
const STATE_DASH = 2;
const STATE_DODGE = 3;
const STATE_STAND = 4;
const STATE_DEAD = 5;


export class Player extends Monster {
    isPlayer = true;
    boundingBox = new Rect([0.25, 0.5, 0.5, 0.5]);
    hitBox = new Rect([0.25, 0.25, 0.5, 0.5]);
    dashBox = new Rect([0, 0.25, 1, 1]);
    immunityTimer = new Timer(1000, 1000);
    selectedTimer = new Timer(500, 500);
    hitTimer = new Timer(500, 500);
    stunTimer = new Timer(500, 500);
    jumpTimer = new Timer(0, 0);
    selectedSprite = null;
    escaped = false;
    running = false;
    climbing = false;
    aiming = false; //deactivates up/down player movement
    dropFromGame = false;
    startLevel = 0;
    lastVel = new Vec2([0, 0]);

    //Player Attributes
    maxHp = 4;
    topSpeed = 1.0 / 400;
    jumpSpeed = 1.0 / 135;
    maxFallSpeed = 1.0 / 50;
    airJumps = 0;
    wallJumps = 0;
    spikedBoots = 0;
    chips = 0;
    dead = false;

    //Game-related Attributes
    score = 0;
    deaths = 0;
    pause = 0;

    //Animation Attributes
    lastFacing = 0;
    lastFramePos = new Vec2([0, 0]);
    currentFrame = 0;
    useTimer = new Timer(0);

    // Hooks
    hookHitModifier = [];
    hookUpdate = [];

    activeState = STATE_STAND;
    stateTimer = new Timer();

    //State of controller
    controller = null;

    constructor(playerId = -1, tile = null) {
        super(tile, [0,playerId], 3);
        /**@type {ActiveInventory} */
        this.inventory = new ActiveInventory(this);
        /**@type {Inventory} */
        this.passiveInventory = new Inventory(this);

        /**@type {ReturnType<initializeControlStates>} */
        this.controlStates = { ...initializeControlStates() };
        /**@type {ReturnType<initializeControlStates>} */
        this.newControlStates = { ...initializeControlStates() };
        /**@type {ReturnType<initializeControlStates>} */
        this.oldControlStates = { ...initializeControlStates() };

        this.sprite = /**@type {[number, number]} */([0, 8]);
        this.setAnimationFrames();
        // this.cycleSprite();
    }
    dashBounds() {
        const dx = this.vel.x>0? 0.5 :
                   this.vel.x<0 ? -0.5: 0;
        const dy = this.vel.y>0? 0.5 :
                   this.vel.y<0 ? -0.5: 0;
        const dir = [this.pos.x + dx, this.pos.y + dy];
        return this.dashBox.shift(dir);
    }
    setAnimationFrames() {
        //Animation data
        const y = this.sprite[1]
        /**@type {{WALK_EW:Vec2[], WALK_N:Vec2[], WALK_S:Vec2[], DASH_EW:Vec2[], DASH_N:Vec2[], DASH_S:Vec2[], STAND:Vec2[]}} */
        this.animationFrames = {
            WALK_EW: [new Vec2([1, y]), new Vec2([2, y]),
                new Vec2([3, y]), new Vec2([3, y]),
                new Vec2([2, y]), new Vec2([1, y])],
            WALK_N: [new Vec2([6,y]), new Vec2([7,y]), new Vec2([7,y]), new Vec2([6,y])],
            WALK_S: [new Vec2([4,y]), new Vec2([5,y]), new Vec2([5,y]), new Vec2([4,y])],
            DASH_EW: [new Vec2([11,y]), new Vec2([12,y]), new Vec2([13,y])],
            DASH_N: [new Vec2([14,y]), new Vec2([15,y]), new Vec2([15,y]), new Vec2([14,y])],
            DASH_S: [new Vec2([12,y]), new Vec2([13,y]), new Vec2([13,y]), new Vec2([12,y])],
            STAND: [new Vec2([0,y])],
        };
    }
    /**
     * 
     * @param {Game} game 
     */
    cycleSprite(game) {
        let takenSprites = game.other_players(this).map(pl => pl.sprite[1]);
        while (true) {
            this.sprite[1]++;
            if (this.sprite[1] >= 4) this.sprite[1] = 0;
            if (takenSprites.includes(this.sprite[1])) continue;
            break;
        }
        this.setAnimationFrames();
    }

    /**@type {Monster['die']} */
    die(game) {
        if (this.dead)
            return;
        this.dead = true;
        this.hp = 0;
        this.deaths++;
        let deathSound = choose(['dead1', 'dead2', 'dead3', 'dead4', 'dead5', 'dead6', 'dead7', 'dead8']);
        this.setState(game, STATE_DEAD);
        game.playSound(deathSound);
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} state 
     */
    enterState(game, state) {
        switch (state) {
            case STATE_DASH:
                if (this.vel.x>0) this.vel.x = 1/50;
                if (this.vel.x<0) this.vel.x = -1/50;
                if (this.vel.y>0) this.vel.y = 1/50;
                if (this.vel.y<0) this.vel.y = -1/50;
                const v = this.vel.dist([0, 0]);
                if (v>0) {
                    this.vel = this.vel.scale(1 / 50 / v);
                }
                break;
        }
        this.activeState = state;
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} state 
     */
    exitState(game, state) {

    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    updateState(game, millis) {
        switch (this.activeState) {
            case STATE_STAND:
            case STATE_WALK:
                //this.runCheck(millis);
                this.entityInteract(game);
                if (this.stunTimer.finished()) {
                    this.moveCheck(game, millis, this.running);
                    this.cycleInventoryCheck(game, millis);
                    if((this.vel.x!==0 || this.vel.y!==0)) {
                        if (!this.oldControlStates['dodge']  && this.controlStates['dodge'] ) {
                            this.setState(game, STATE_DODGE);
                            return;
                        } else if (!this.oldControlStates['dash'] && this.controlStates['dash']) {
                            this.setState(game, STATE_DASH);
                            return;
                        }    
                    }
                }
                this.tileInteract(game, millis)
                break;
            case STATE_STUN:
                if (this.stunTimer.finished()) {
                    this.entityInteract(game);
                    this.setState(game, STATE_WALK);

                    if (this.stunTimer.finished()) {
                        this.moveCheck(game, millis, false);
                        this.cycleInventoryCheck(game, millis);
                    }

                    // Tile interactions pressing up/down
                    this.tileInteract(game, millis);

                }

                if (!this.jumpTimer.finished() && this.vel.y < 0 && !this.controlStates['dash']) { //Kill the jump for early release
                    this.vel.y *= 0.5 ** (millis / 15);
                }
                break;
            case STATE_DASH:
                this.entityInteract(game);
                for (let m of game.monsters) {
                    if (m.hitBounds().collide(this.dashBounds())) {
                        m.hitFrom(game, this.pos, 1, 2);
                        m.stun();
                    }
                }
                if (this.stateTimer.elapsed>100) {
                    this.setState(game, STATE_STAND);
                }
                break;
            case STATE_DODGE:
                this.entityInteract(game);
                if (this.stunTimer.finished()) {
                    this.moveCheck(game, millis, true);
                    this.cycleInventoryCheck(game, millis);
                }
                if (!this.oldControlStates['dash'] && this.controlStates['dash'] 
                    && (this.vel.x!==0 || this.vel.y!==0)) {
                    this.setState(game, STATE_DASH);
                }
                this.tileInteract(game, millis);
                if (this.stateTimer.elapsed>500) {
                    this.setState(game, STATE_STAND);
                }
                break;
            case STATE_DEAD:
                this.driftCheck(game, millis, false);
                break;
        }
    }

    /**
     * 
     * @param {Game} game 
     */
    revive(game) {
        this.dead = false;
        this.setState(game, STATE_WALK);
        this.hp = game.competitiveMode ? this.maxHp : 1;
    }

    /**@type {Monster['hitFrom']} */
    hitFrom(game, pos, damage, knockbackScale = 0) {
        if (!this.dead && !this.escaped && this.activeState!==STATE_DODGE && this.immunityTimer.finished()) {
            for (let i of this.hookHitModifier) {
                [damage, knockbackScale] = i.hitModifier(damage, knockbackScale);
            }
            super.hitFrom(game, pos, damage, knockbackScale);
            this.immunityTimer.reset();
            game.playSound("hit1");
        }
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    use(game, millis) {
        this.useTimer.reset(millis);
    }

    /**@type {Monster['draw']} */
    draw(game) {
        const activeAnimation = this.vel.x!==0 ? (this.activeState===STATE_DASH ? this.animationFrames.DASH_EW: this.animationFrames.WALK_EW) :
            this.vel.y > 0 ? (this.activeState===STATE_DASH ? this.animationFrames.DASH_S: this.animationFrames.WALK_S) :
            this.vel.y < 0 ? (this.activeState===STATE_DASH ? this.animationFrames.DASH_N: this.animationFrames.WALK_N) :
            this.animationFrames.STAND;
        let flip = this.getFlipped();
        if (this.escaped)
            return;
        let sprite = [0, 0];
        if (this.dead) {
            sprite = [1, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = new Vec2(this.pos);
        }
        else if (!this.useTimer.finished()) {
            sprite = [4, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = new Vec2(this.pos);
        }
        else if (this.activeState === STATE_STUN) {
            sprite = [4, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = new Vec2(this.pos);
        }
        else if (this.activeState === STATE_DODGE) {
            sprite = activeAnimation[0];
            this.currentFrame = 0;
            this.lastFramePos = new Vec2(this.pos);
        }
        else if (this.vel.x === 0) {
            sprite = activeAnimation[this.currentFrame % activeAnimation.length];
            if (this.pos.dist(this.lastFramePos) * 8 >= 1) {
                this.currentFrame += Math.floor(this.pos.dist(this.lastFramePos) * 8);
                this.lastFramePos = new Vec2(this.pos);
            }
            flip = (this.currentFrame % activeAnimation.length) >= 2;
        }
        else {
            if (this.facing !== this.lastFacing) {
                this.currentFrame = 0;
                this.lastFramePos = new Vec2(this.pos);
            } else if (this.pos.dist(this.lastFramePos) * 8 >= 1) {
                this.currentFrame += Math.floor(this.pos.dist(this.lastFramePos) * 8);
                this.lastFramePos = new Vec2(this.pos);
            }
            this.currentFrame = this.currentFrame % activeAnimation.length;
            sprite = activeAnimation[this.currentFrame];
        }
        //Show recently activated item
        if (!this.selectedTimer.finished()) {
            game.sprites.entitiesItems.drawScaled(this.selectedSprite, this.pos.x + 0.25, this.pos.y - 0.25, 0.5);
        }
        //Show player in current state
        game.sprites.base.draw([sprite[0], sprite[1]], this.getDisplayX(), this.getDisplayY(), flip);
        //TODO: Show inventory attachment
        //this.inventory.activeItem().drawInPlay(this.currentFrame);
        if (!this.hitTimer.finished()) {
            if (baseSetIds.Strike.length === 2)
                game.sprites.base.draw(baseSetIds.Strike, this.getDisplayX(), this.getDisplayY(), this.getFlipped())
        }
        this.lastFacing = this.facing;
    }

    /**
     * 
     * @param {Game} game 
     * @param {Vec2} pos 
     */
    drawHUD(game, pos) {
        if (game.competitiveMode) {
            game.drawTileText("" + Math.floor(this.score), 0.5 * game.tileSize, pos, "White"); // Text for hp game.level 
            pos = pos.add([1, 0]);
        }
        game.sprites.players.draw([this.dead ? 1 : 0, this.sprite[1]], pos.x, pos.y);
        let pos1 = pos.add([1, 0]);
        if (entityItemIds.Health.length === 2) {
            game.sprites.entitiesItems.draw(entityItemIds.Health, pos1.x, pos1.y); //Draw hp game.level
        }
        game.drawTileText("" + Math.ceil(this.hp), 0.5 * game.tileSize, pos1, "White"); // Text for hp game.level 
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @returns 
     */
    update(game, millis) {
        if (this.escaped)
            return;
        let oldVel = new Vec2(this.vel);
        let oldPos = new Vec2(this.pos);
        this.immunityTimer.tick(millis);
        this.stateTimer.tick(millis);
        this.jumpTimer.tick(millis);
        this.hitTimer.tick(millis);
        this.useTimer.tick(millis);
        this.stunTimer.tick(millis);
        this.selectedTimer.tick(millis);

        //Updates based on player state
        this.updateState(game, millis);

        //Inventory item updates -- only the active item and items with explicit update hooks
        this.inventory.activeItem().update(game, millis, this);
        for (let hu of this.hookUpdate) {
            hu.update(game, millis, this);
        }

        if (this.activeState != STATE_DEAD && this.pos.y > game.tiles.dimH + 3) {
            this.die(game);
        }

        this.lastVel = new Vec2(this.vel);
        //Move player
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)

    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @param {boolean} dodging 
     */
    driftCheck(game, millis, dodging) {
        const driftScale = 1.0/6400;
        this.vel.x = this.vel.x>0? Math.max(this.vel.x - driftScale*millis/15, 0) : Math.min(this.vel.x + driftScale*millis/15, 0);
        this.vel.y = this.vel.y>0? Math.max(this.vel.y - driftScale*millis/15, 0) : Math.min(this.vel.y + driftScale*millis/15, 0);
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @param {boolean} dodging 
     */
    moveCheck(game, millis, dodging) {
        // left
        if (this.controlStates['left']) {
            this.vel.x = Math.max(-this.topSpeed * (dodging ? 2.0 : 1.0), this.vel.x - 1.0 / 1600 * millis / 15);
            this.facing = -1;
        }
        else if (!dodging && this.vel.x < 0) {
            this.vel.x = 0;
        }
        // right
        if (this.controlStates['right']) {
            this.vel.x = Math.min(this.topSpeed * (dodging ? 2.0 : 1.0), this.vel.x + 1.0 / 1600 * millis / 15);
            this.facing = 1;
        }
        else if (!dodging && this.vel.x > 0) {
            this.vel.x = 0;
        }
        // up
        if (this.controlStates['up']) {
            this.vel.y = Math.max(-this.topSpeed * (dodging ? 2.0 : 1.0), this.vel.y - 1.0 / 1600 * millis / 15);
        }
        else if (!dodging && this.vel.y < 0) {
            this.vel.y = 0;
        }

        // down
        if (this.controlStates['down']) {
            this.vel.y = Math.min(this.topSpeed * (dodging ? 2.0 : 1.0), this.vel.y + 1.0 / 1600 * millis / 15);
        }
        else if (!dodging && this.vel.y > 0) {
            this.vel.y = 0;
        }
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    cycleInventoryCheck(game, millis) {
        //cycle inventory
        if (this.controlStates["cycle"] && !this.oldControlStates["cycle"]) {
            let item = this.inventory.next();
            this.selectedTimer.reset(500);
            this.selectedSprite = item.sprite;
            this.aiming = false;
            this.use(game, 0);
        }
    }
    /**
     * 
     * @param {Game} game 
     */
    entityInteract(game) {
        for (let k = 0; k < game.items.length; k++) {
            if (this.bounds().collide(game.items[k].bounds())) {
                game.items[k].entityCollide(game, this);
                if (!this.aiming) {
                    if (this.controlStates['up']) {
                        game.items[k].entityInteract(game, this, 'up');
                    }
                    if (this.controlStates['down']) {
                        game.items[k].entityInteract(game, this, 'down');
                    }
                }
            }
        }

    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    tileInteract(game, millis) {
        if (this.controlStates['up']) {
            let t = game.tiles.closestTile(this.bounds());
            if (!(t instanceof Void)) {
                t.entityInteract(game, this, 'up');
            }
        }
        if (this.controlStates['down']) {
            let t = game.tiles.closestTile(this.bounds());
            if (!(t instanceof Void)) {
                t.entityInteract(game, this, 'down');
                let tdown = game.tiles.below(t.pos);
                if (!(tdown instanceof Void) && tdown.tile.y == this.bounds().bottom) //can interact with things below you that you are standing on like ladders
                {
                    tdown.tile.entityInteract(game, this, 'down');
                }
            }
            let adj = 0 //fall if standing on a standable and pressed down
            for (let tbelow of game.tiles.contacters(this.bounds())) { //TODO: more efficient to just check for the one or two tiles the player could be standing on
                if (this.bounds().bottom == tbelow.y) {
                    if (tbelow.standable && tbelow.passable) {
                        //If the tile is standable but passable we'll allow the play to nudge down
                        adj = 1;
                    } else if (!tbelow.passable && this.bounds().bottom == tbelow.y && game.tiles.above(tbelow.pos).tile.passable) {
                        //Standing on a tile that's not passable and the tile above it is passable means we shouldn't fall through  
                        //so we won't nudge and break immediately.
                        adj = 0;
                        break;
                    }

                }
            }
            //Apply the nudge
            this.pos.y += adj * 0.01;
        }
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} state 
     */
    setState(game, state) {
        this.exitState(game, this.activeState);
        this.enterState(game, state);
        this.stateTimer.reset();
    }
}
