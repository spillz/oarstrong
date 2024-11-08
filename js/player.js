//@ts-check

import { initializeControlStates } from "./controllers";

import { ActiveInventory, Inventory } from "./inventory";
import { Rect, Timer, Vec2, choose } from "./util";
import { Monster } from "./monster";
import { baseSetIds, entityItemIds } from "./sprites";
import { Void } from "./tile";
/**@typedef {import('./game').Game} Game */


// class Walking extends Behavior { //Walking/running
//     update(player, millis) {
//         player.runCheck(millis);
//         player.entityInteract();
//         if(player.stunTimer.finished()) {
//             player.walkCheck(millis, player.running);
//             player.cycleInventoryCheck(millis);
//         }
//         if(!player.aiming) {
//             player.tileInteract(millis)
//             if(player.activeState!=this)
//                 return;
//         }
//         player.jumpCheck(millis);
    
//         if(player.fallCheck()) player.setState(player.states.falling);
//     }

// }

// class Falling  extends Behavior { //In midair (rising or falling), fixed gravity, direction changes allowed
//     entry(player) {
//         this.fromJump = !player.controlStates['jump'];
//         this.initialFacing = player.facing;
//     }

//     exit(player) {
//     }

//     update(player, millis) {
//         if(player.stunTimer.finished()) {
//             player.entityInteract();
//             let fast = this.initialFacing==player.facing && player.running;
//             if(!fast) player.running=false;

//             if(player.stunTimer.finished()) {
//                 player.walkCheck(millis, fast);
//                 player.cycleInventoryCheck(millis);
//             }
                
//             // jump
//             if(this.fromJump && player.stateTimer.elapsed<100) {
//                 player.jumpCheck(millis);
//             }

//             // Tile interactions pressing up/down
//             player.tileInteract(millis);

//         }

//         if(!player.jumpTimer.finished() && player.vel.y<0 && !player.controlStates['jump']) { //Kill the jump for early release
//             player.vel.y *= 0.5 ** (millis/15);
//         }

//         // check we are still falling
//         if(!player.fallCheck()) {
//         //Vibrate -- hard coding velocity threshold
//             if(Math.abs(player.vel.y)>0.01 && player.vel.y==0) {
//                 player.controller.vibrate(20*Math.abs(player.vel.y),20*Math.abs(player.vel.y),50);
//             }
//             player.vel.y = 0;
//             player.setState(player.states.walking);
//             return;
//         } 
//         if(player.vel.y>=0) { //check if falling onto a ledge
//             for(let tbelow of game.tiles.contacters(player.bounds())) {
//                 if(tbelow.standable && game.tiles.above(tbelow).passable && !game.tiles.above(tbelow).climbable) {
//                     let ycut = player.bounds().bottom
//                     if(ycut>tbelow.y && ycut - player.vel.y*millis<=tbelow.y) {
//                         player.pos.y -= ycut - tbelow.y;
//                         player.vel.y = 0;
//                         player.setState(player.states.walking);
//                         return;
//                     }
//                 }
//             }
//         }
//         // gravity
//         player.vel.y = Math.min(player.maxFallSpeed, player.vel.y + 1.0/4800*millis/15);
//     }

// }

// class Climbing extends Behavior { //Climbing ladders, trees etc.
//     update(player, millis) {
//         if(!player.stunTimer.finished()) { //fall off climbable if stunned
//             player.setState(player.states.falling);
//             return;
//         }

//         player.entityInteract();

//         if(player.controlStates['up']) player.vel.y = -player.topSpeed*0.75;
//         else if(player.controlStates['down']) player.vel.y = player.topSpeed*0.75;
//         else player.vel.y = 0;

//         if(player.stunTimer.finished()) {
//             player.walkCheck(millis);
//             player.cycleInventoryCheck(millis);
//             player.jumpCheck(millis);
//         }

//         let on_a_climbable=false;
//         for(let t of game.tiles.colliders(player.bounds())) {
//             if(t.climbable) {
//                 on_a_climbable = true;
//                 break;
//             }
//         }
//         if(!on_a_climbable) {
//             if(player.fallCheck(millis)) player.setState(player.states.falling);
//             else player.setState(player.states.walking);
//         }
    
//     }

// }

// class Driving extends Behavior { //ignoring controls until notified otherwise -- delegates control to another entity
//     entry(player) {
//         this.vehicle = null; //controlling entity
//     }
//     update(player, millis) {
//         player.entityInteract();

//     }

// }

// class Dead extends Behavior { //ignoring controls until notified otherwise -- delegates control to another entity
//     entry(player) {
//         player.dead = true;
//     }
//     exit(player) {
//         player.dead = false;
//     }
//     update(player, millis) {
//         //friction
//         if(player.vel.y==0) player.vel.x *= 0.95**(millis/15);
//         // gravity
//         player.vel.y = Math.min(player.maxFallSpeed, player.vel.y + 1.0/4800*millis/15);
//     }

// }

// class Escaped extends Behavior { //ignoring controls until notified otherwise -- delegates control to another entity
//     entry(player) {
//         player.escaped = true;
//     }
//     exit(player) {
//         player.escaped = false;
//     }
//     update(player, millis) {

//     }

// }

//Motion states
const STATE_WALK  = 0;
const STATE_STUN  = 1;
const STATE_DASH  = 2;
const STATE_DODGE = 3;
const STATE_STAND = 4;
const STATE_DEAD  = 5


export class Player extends Monster {
    isPlayer = true;
    boundingBox = new Rect([0.25,0.5,0.5,0.5]);
    immunityTimer = new Timer(1000,1000);
    selectedTimer = new Timer(500, 500);
    hitTimer = new Timer(500,500);
    stunTimer = new Timer(500,500);
    jumpTimer = new Timer(0,0);
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
    topSpeed = 1.0/400;
    jumpSpeed = 1.0/135;
    maxFallSpeed = 1.0/50;
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
    lastFramePos = 0;
    currentFrame = 0;
    useTimer = new Timer(0);

    // Hooks
    hookHitModifier = [];
    hookUpdate = [];

    activeState = STATE_STAND;
    stateTimer = new Timer();
    
    //State of controller
    controller = null;

    constructor(playerId=-1, tile=null){
        super(tile, playerId, 3);
        /**@type {ActiveInventory} */
        this.inventory = new ActiveInventory(this);
        /**@type {Inventory} */
        this.passiveInventory = new Inventory(this);

        /**@type {ReturnType<initializeControlStates>} */
        this.controlStates = {...initializeControlStates()};
        /**@type {ReturnType<initializeControlStates>} */
        this.newControlStates = {...initializeControlStates()};
        /**@type {ReturnType<initializeControlStates>} */
        this.oldControlStates = {...initializeControlStates()};
    
        // this.cycleSprite();
    }
    setWalkFrames() {
        //Animation data
        this.walkFrames = [new Vec2([2,this.sprite]), new Vec2([3,this.sprite]), 
            new Vec2([4,this.sprite]), new Vec2([3,this.sprite]), 
            new Vec2([2,this.sprite]), new Vec2([5,this.sprite]), 
            new Vec2([6,this.sprite]), new Vec2([5,this.sprite])];
    }
    /**
     * 
     * @param {Game} game 
     */
    cycleSprite(game) {
        let takenSprites = game.other_players(this).map(pl => pl.sprite[1]);
        while(true) {
            this.sprite[1]++;
            if(this.sprite[1]>=4) this.sprite[1] = 0;    
            if(takenSprites.includes(this.sprite[1])) continue;
            break;
        }
        this.setWalkFrames();    
    }

    /**@type {Monster['die']} */
    die(game){
        if(this.dead)
            return;
        this.dead = true;
        this.hp = 0;
        this.deaths++;
        let deathSound = choose(['dead1','dead2','dead3','dead4','dead5','dead6','dead7','dead8']);
        this.setState(game, STATE_DEAD);
        game.playSound(deathSound);
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} state 
     */
    enterState(game, state) {

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
        switch(this.activeState) {
            case STATE_STAND:
                break;
            case STATE_WALK:
                break;
            case STATE_STUN:
                break;
            case STATE_DASH:
                break;
            case STATE_DODGE:
                break;
            case STATE_DEAD:
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
        this.hp = game.competitiveMode?this.maxHp:1;
    }

    /**@type {Monster['hit']} */
    hit(game, damage, knockbackScale=0) {
        if(!this.dead && !this.escaped && this.immunityTimer.finished()) {
            for(let i of this.hookHitModifier) {
                [damage, knockbackScale] = i.hitModifier(damage, knockbackScale);
            }
            super.hit(game, damage, knockbackScale);
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
        if(this.escaped) 
            return;
        let sprite = [0,0];
        if(this.dead) {
            sprite = [1, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else if(!this.useTimer.finished()) {
            sprite = [4, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else if(this.activeState==STATE_STUN) {
            sprite = [4, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else if(this.vel.x==0) {
            sprite = [0, this.sprite[1]];
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else {
            if(this.facing!=this.lastFacing) {
                this.currentFrame = 0;
                this.lastFramePos = this.pos.x;
            } else if(this.facing*(this.pos.x-this.lastFramePos)*8>=1) {
                this.currentFrame+=Math.floor(this.facing*(this.pos.x-this.lastFramePos)*8);
                this.lastFramePos = this.pos.x;
            }
            this.currentFrame = this.currentFrame%this.walkFrames.length;
            sprite = this.walkFrames[this.currentFrame];
        }
        //Show recently activated item
        if(!this.selectedTimer.finished()) {
            game.sprites.entitiesItems.drawScaled(this.selectedSprite, this.pos.x+0.25,  this.pos.y-0.25, 0.5);
        }
        //Show player in current state
        game.sprites.players.draw([sprite[0],sprite[1]], this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        //TODO: Show inventory attachment
        //this.inventory.activeItem().drawInPlay(this.currentFrame);
        if(!this.hitTimer.finished()) {
            if (baseSetIds.Strike.length===2)
            game.sprites.base.draw(baseSetIds.Strike, this.getDisplayX(),  this.getDisplayY(), this.getFlipped())
        }
        this.lastFacing = this.facing;
    }

    /**
     * 
     * @param {Game} game 
     * @param {Vec2} pos 
     */
    drawHUD(game, pos) {
        if(game.competitiveMode) {
            game.drawTileText(""+Math.floor(this.score), 0.5*game.tileSize, pos, "White"); // Text for hp game.level 
            pos = pos.add([1,0]);
        }
        game.sprites.players.draw([this.dead?1:0,this.sprite[1]], pos.x, pos.y);
        let pos1 = pos.add([1,0]);
        if (entityItemIds.Health.length===2) {
            game.sprites.entitiesItems.draw(entityItemIds.Health, pos1.x,pos1.y); //Draw hp game.level
        }
        game.drawTileText(""+Math.ceil(this.hp), 0.5*game.tileSize, pos1, "White"); // Text for hp game.level 
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @returns 
     */
    update(game, millis){  
        if(this.escaped)
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
        for(let hu of this.hookUpdate) {
            hu.update(game, millis, this);
        }

        if(this.activeState != STATE_DEAD && this.pos.y>game.tiles.dimH+3) {
            this.die(game);
        }

        this.lastVel = new Vec2(this.vel);
        //Move player
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)



    }

    walkCheck(game, millis, running) {
        // left
        if(this.controlStates['left']) {
            this.vel.x = Math.max(-this.topSpeed*(running? 2.0:1.0), this.vel.x - 1.0/1600*millis/15);
            this.facing = -1;
        }
        else {
            if(this.vel.x<0)
                this.vel.x = 0;
        }

        // right
        if(this.controlStates['right']) {
            this.vel.x = Math.min(this.topSpeed*(running? 2.0:1.0), this.vel.x + 1.0/1600*millis/15);
            this.facing = 1;
        }
        else {
            if(this.vel.x>0)
                this.vel.x = 0;
        }
        // up
        if(this.controlStates['up']) {
            this.vel.y = Math.max(-this.topSpeed*(running? 2.0:1.0), this.vel.y - 1.0/1600*millis/15);
            // this.facing = -1;
        }
        else {
            if(this.vel.y<0)
                this.vel.y = 0;
        }

        // down
        if(this.controlStates['down']) {
            this.vel.y = Math.min(this.topSpeed*(running? 2.0:1.0), this.vel.y + 1.0/1600*millis/15);
            // this.facing = 1;
        }
        else {
            if(this.vel.y>0)
                this.vel.y = 0;
        }
    }

    cycleInventoryCheck(game, millis) {
        //cycle inventory
        if(this.controlStates["cycle"] && !this.oldControlStates["cycle"]) {
            let item = this.inventory.next();
            this.selectedTimer.reset(500);
            this.selectedSprite = item.sprite;
            this.aiming = false;
            this.use(game, 0);
        }   
    }

    fallCheck(game, millis) {
        // check falling -- player is falling unless they are in contact with a block below them
        // let isFalling = true;
        // for(let t of game.tiles.contacters(this.bounds())) {
        //     if(t.standable && this.vel.y>=0 && t.y==this.bounds().bottom && game.tiles.above(t).passable) { //TODO: this should be some sort of tile-specific standing on class
        //         isFalling=t.stoodOnBy(this, this.lastVel);
        //         if(!isFalling) break;
        //     }
        // }
        // return isFalling;
        return false;
    }

    runCheck(game) {
        // running
        if(!this.controlStates['run']) this.running = false;
        else this.running = true;
    }

    jumpCheck(game) {
        // jump
        if(!this.oldControlStates['jump'] && this.controlStates['jump']){
            this.vel.y = -this.jumpSpeed;
            this.setState(game, STATE_DODGE);
            this.jumpTimer.reset(200);
            return;
        }
    }

    entityInteract(game) {
        for(let k=0;k<game.items.length;k++) {
            if(this.bounds().collide(game.items[k].bounds())) {
                game.items[k].entityCollide(game, this);
                if(!this.aiming) {
                    if(this.controlStates['up']) {
                        game.items[k].entityInteract(game, this, 'up');
                    }
                    if(this.controlStates['down']) {
                        game.items[k].entityInteract(game, this, 'down');
                    }
                }
            }
        }

    }

    tileInteract(game, millis) {
        if(this.controlStates['up']) {
            let t=game.tiles.closestTile(this.bounds());
            if(!(t instanceof Void)) {
                t.entityInteract(this,'up');
            }
        }
        if(this.controlStates['down']) {
            let t=game.tiles.closestTile(this.bounds());
            if(!(t instanceof Void)) {
                t.entityInteract(this,'down');
                let tdown = game.tiles.below(t);
                if(!(tdown instanceof Void) && tdown.y==this.bounds().bottom) //can interact with things below you that you are standing on like ladders
                {
                    tdown.entityInteract(this,'down');
                }
            }
            let adj = 0 //fall if standing on a standable and pressed down
            for(let tbelow of game.tiles.contacters(this.bounds())) { //TODO: more efficient to just check for the one or two tiles the player could be standing on
                if(this.bounds().bottom==tbelow.y) {
                    if(tbelow.standable && tbelow.passable) {
                        //If the tile is standable but passable we'll allow the play to nudge down
                        adj = 1;
                    } else if(!tbelow.passable && this.bounds().bottom==tbelow.y && game.tiles.above(tbelow).passable){
                        //Standing on a tile that's not passable and the tile above it is passable means we shouldn't fall through  
                        //so we won't nudge and break immediately.
                        adj = 0;
                        break;
                    }
    
                }
            }
            //Apply the nudge
            this.pos.y += adj*0.01;
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
