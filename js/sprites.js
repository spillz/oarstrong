//@ts-check
/**@typedef {import('./game').Game} Game */

export class SpriteSheet {
    /**
     * 
     * @param {Game} game
     * @param {string} src_file 
     * @param {number} spriteSize 
     */
    constructor(game, src_file, spriteSize=16) {
        this.spriteSize = spriteSize;
        this.sheet = new Image();
        this.sheet.src = src_file;
        this.game = game;
    }
    /**
     * 
     * @param {[number, number]} spriteLoc 
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} flipx 
     */
    draw(spriteLoc, x, y, flipx=false){
        let flipped = flipx? -1 : 1;
        if(flipx) {
            this.game.ctx.scale(-1,1);
        }
        this.game.ctx.drawImage(
            this.sheet,
            spriteLoc[0]*this.spriteSize,
            spriteLoc[1]*this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            flipped*(x*this.game.tileSize + this.game.shakeX + this.game.gameOffsetX),
            y*this.game.tileSize  + this.game.shakeY + this.game.gameOffsetY,
            flipped*this.game.tileSize,
            this.game.tileSize
        );
        if(flipx) {
            this.game.ctx.scale(-1,1);
        }
    }
    /**
     * 
     * @param {[number, number]} spriteLoc 
     * @param {number} x 
     * @param {number} y 
     * @param {number} scale
     * @param {boolean} flipx 
     */
    drawScaled(spriteLoc, x, y, scale, flipx=false){
        let flipped = flipx? -1 : 1;
        if(flipx) {
            this.game.ctx.scale(-1,1);
        }
        this.game.ctx.drawImage(
            this.sheet,
            spriteLoc[0]*this.spriteSize,
            spriteLoc[1]*this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            flipped*(x*this.game.tileSize + this.game.shakeX + this.game.gameOffsetX),
            y*this.game.tileSize  + this.game.shakeY + this.game.gameOffsetY,
            flipped*this.game.tileSize*scale,
            this.game.tileSize*scale
        );
        if(flipx) {
            this.game.ctx.scale(-1,1);
        }
    }
    /**
     * 
     * @param {[number, number]} spriteLoc 
     * @param {number} x 
     * @param {number} y 
     * @param {number} angle
     * @param {boolean} flipx 
     * @param {'center'|[number, number]} anchor
     */
    drawRotated(spriteLoc, x, y, angle, flipx=false, anchor='center'){
        const game = this.game;
        game.ctx.save();
//        let flipped = 1 - 2*flipx;
        if(anchor == 'center') {
            anchor = [game.tileSize/2,game.tileSize/2];
        } else {
            anchor = [anchor[0]*game.tileSize, anchor[1]*game.tileSize];
        }
        game.ctx.translate(x*game.tileSize + game.shakeX + game.gameOffsetX + anchor[0], 
                        y*game.tileSize + game.shakeY + game.gameOffsetY + anchor[1]);
        game.ctx.rotate(angle * Math.PI / 180);
        if(flipx) {
            game.ctx.scale(-1,1);
        }
        game.ctx.translate(-anchor[0], -anchor[1]);
        game.ctx.drawImage(
            this.sheet,
            spriteLoc[0]*this.spriteSize,
            spriteLoc[1]*this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            0, //-game.tileSize+anchor[0],
            0, //-game.tileSize+anchor[1],
            game.tileSize,
            game.tileSize
        );
        game.ctx.restore();
    }
    /**
     * 
     * @param {[number, number, number, number]} spriteLoc 
     * @param {number} x 
     * @param {number} y 
     * @param {number} angle
     * @param {boolean} flipx 
     * @param {'center'|[number, number]} anchor
     */
    drawRotatedMultitile(spriteLoc, x, y, angle, flipx=false, anchor='center'){ //same as drawRotated but spriteloc is 4-item array referencing the sprite location: [x,y,w,h]
        const game = this.game;
        game.ctx.save();
        let tw = spriteLoc[2];
        let th = spriteLoc[3];
//        let flipped = 1 - 2*flipx;
        if(anchor == 'center') {
            anchor = [tw*game.tileSize/2,th*game.tileSize/2];
        } else {
            anchor = [anchor[0]*game.tileSize, anchor[1]*game.tileSize];
        }
        game.ctx.translate(x*game.tileSize + game.shakeX + game.gameOffsetX + anchor[0], 
                        y*game.tileSize + game.shakeY + game.gameOffsetY + anchor[1]);
        game.ctx.rotate(angle * Math.PI / 180);
        if(flipx) {
            game.ctx.scale(-1,1);
        }
        game.ctx.translate(-anchor[0], -anchor[1]);
        game.ctx.drawImage(
            this.sheet,
            spriteLoc[0]*this.spriteSize,
            spriteLoc[1]*this.spriteSize,
            this.spriteSize*tw,
            this.spriteSize*th,
            0,
            0,
            game.tileSize*tw,
            game.tileSize*th
        );
        game.ctx.restore();
    }
}

export const monsterRowLocIds = {
    OneEye: 0,
    TwoEye: 1,
    Tank: 2,
    Eater: 3,
    Jester: 4,
}

/**@type {{[id:string]:[number,number]}} */
export const baseSetIds = {
    BeachUpper: [4,1],
    BeachLower: [9,1],
    Water: [10,1],
    Jelly: [11,1],
    Cannonball: [12,1],
    Wall: [13,1],
    WallEnd: [13,0],
    Pillar1: [6,1],
    Pillar2: [7,1],
    Pillar3: [8,1],
    PlayerCharacter1: [10,6],
    PlayerCharacter2: [11,6],
    PlayerCharacter3: [12,6],
    PlayerCharacter4: [13,6],
    Slash: [10,7],
}

/**@type {{[id:string]:[number,number,number,number]}} */
export const bigSetIds = {
    Boss1: [0,3,3,3],
}

/**@type {{[id:string]:[number,number]}} */
export const tileIds = {
    KioskScreen: [0,0],
    KioskDispenser: [0,1],
    Floor: [1,0],
    Wall: [2,0],
    Ledge: [3,0],
    Ladder: [4,0],
    Exit: [5,0],
    LockedExit: [6,0],
    TrapBlock: [7,0],
    Pillar: [8,0],
    Lights: [0,1],
    FlowerBox: [1,1],
    PlantBox: [1,2],
    TreeTop: [2,1],
    TrunkBox: [2,2],
    AppleTreeTop: [3,1],
    Trunk: [3,2],
    BerryBush: [4,1],
    Bush: [4,2],
    VineBranchRight: [5,1],
    VineUp: [5,2],
    VineRightUp: [6,1],
    VineLeftUp: [6,2],
    VineTerminator: [7,1],
    VineBranchLeft: [7,2],
    VineLeft: [10,2],
    VineRight: [11,2],
    PineBox: [8,1],
    VineBox: [8,2],
    PineTop: [9,1],
    PineMid: [9,2],
    WaterTankLeft: [10,1],
    WaterTankRight: [11,1],
    LockerClosed: [0,3],
    LockerOpen: [1,3],
    RazorWireLeft: [2,3],
    RazorWire: [3,3],
    RazorWireRight: [4,3],
    RazorWirePost: [5,3],
    ShotWall1: [6,3],
    ShotWall2: [7,3],
    BlastedLadder1: [8,3],
    BlastedLadder2: [9,3],
    BlastedWall1: [10,3],
    BlastedWall2: [11,3],
    Debris1: [12,3],
    BlastedPillar: [13,3],
    BluePrint: [0,4],
    Potions: [1,4],
    Burner: [2,4],
    Desk: [7,4],
    Chair: [8,4],
    CryoBottom: [3,4],
    CryoTop: [4,4],
    CryoMiddle: [5,4],
    SuspendedWiresPlatform: [6,4],
    SuspendedWiresVert: [6,5],
    SuspendedWiresEnd: [6,6],
    Dirt1: [0,5],
    Dirt2: [0,6],
    Dirt3: [1,6],
    Drill1: [1,5],
    Drill2: [2,6],
    Drill3: [3,6],
    DirtLeft: [2,5],
    DirtBottom: [3,5],
    DirtRight: [4,5],
    DirtTop: [5,5],

}

/**@type {{[id:string]:[number,number]|[number,number,number,number]}} */
export const entityItemIds = {
    Chips: [0,0],
    Energy: [1,0],
    Key: [2,0],
    LiveGrenade: [3,0],
    Shot1: [4,0],
    Shot2: [5,0],
    Shot3: [6,0],
    Boom: [7,0],
    Drone1: [8,0],
    Drone2: [9,0],
    Platform: [10,0],
    TrapBlade: [11,0],
    GunTurretBase: [12,0],
    GunTurretBarrel: [13,0],
    LiveRocket: [14,0],
    LiveVibroBlade: [15,0],
    Reticle: [16,0],
    Strike: [17,0],
    InventorySelector: [0,1],
    Gun: [1,1],
    Grenade: [2,1],
    Wrench: [3,1],
    JetPack: [4,1],
    Fist: [5,1],
    GrappleGun: [6,1],
    Glider: [7,1],
    Shotgun: [8,1],
    RocketLauncher: [9,1],
    Shield: [10,1],
    Drone: [11,1],
    VibroBlade: [12,1],
    AssaultRifle: [13,1],
    ClimbingGlove: [14,1],
    Boot1: [0,2],
    Boot2: [1,2],
    Boot3: [2,2],
    Health: [0,3],
    Pickup1: [1,3],
    Pickup2: [2,3],
    Frag: [30,0,2,2], // 2x2 texture
}

