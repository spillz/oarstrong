//@ts-check
/**@typedef {import('./game').Game} Game */

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {[number, number]} 
 */
function pos(x, y) {
    return [x, y];
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @returns {[number, number, number, number]} 
 */
function rect(x, y, w, h) {
    return [x, y, w, h];
}


export class SpriteSheet {
    /**
     * 
     * @param {Game} game
     * @param {string} src_file 
     * @param {number} spriteSize 
     */
    constructor(game, src_file, spriteSize = 16) {
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
    draw(spriteLoc, x, y, flipx = false) {
        let flipped = flipx ? -1 : 1;
        if (flipx) {
            this.game.ctx.scale(-1, 1);
        }
        this.game.ctx.drawImage(
            this.sheet,
            spriteLoc[0] * this.spriteSize,
            spriteLoc[1] * this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            flipped * (x * this.game.tileSize + this.game.shakeX + this.game.gameOffsetX),
            y * this.game.tileSize + this.game.shakeY + this.game.gameOffsetY,
            flipped * this.game.tileSize,
            this.game.tileSize
        );
        if (flipx) {
            this.game.ctx.scale(-1, 1);
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
    drawScaled(spriteLoc, x, y, scale, flipx = false) {
        let flipped = flipx ? -1 : 1;
        if (flipx) {
            this.game.ctx.scale(-1, 1);
        }
        this.game.ctx.drawImage(
            this.sheet,
            spriteLoc[0] * this.spriteSize,
            spriteLoc[1] * this.spriteSize,
            this.spriteSize,
            this.spriteSize,
            flipped * (x * this.game.tileSize + this.game.shakeX + this.game.gameOffsetX),
            y * this.game.tileSize + this.game.shakeY + this.game.gameOffsetY,
            flipped * this.game.tileSize * scale,
            this.game.tileSize * scale
        );
        if (flipx) {
            this.game.ctx.scale(-1, 1);
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
    drawRotated(spriteLoc, x, y, angle, flipx = false, anchor = 'center') {
        const game = this.game;
        game.ctx.save();
        //        let flipped = 1 - 2*flipx;
        if (anchor == 'center') {
            anchor = [game.tileSize / 2, game.tileSize / 2];
        } else {
            anchor = [anchor[0] * game.tileSize, anchor[1] * game.tileSize];
        }
        game.ctx.translate(x * game.tileSize + game.shakeX + game.gameOffsetX + anchor[0],
            y * game.tileSize + game.shakeY + game.gameOffsetY + anchor[1]);
        game.ctx.rotate(angle * Math.PI / 180);
        if (flipx) {
            game.ctx.scale(-1, 1);
        }
        game.ctx.translate(-anchor[0], -anchor[1]);
        game.ctx.drawImage(
            this.sheet,
            spriteLoc[0] * this.spriteSize,
            spriteLoc[1] * this.spriteSize,
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
    drawRotatedMultitile(spriteLoc, x, y, angle, flipx = false, anchor = 'center') { //same as drawRotated but spriteloc is 4-item array referencing the sprite location: [x,y,w,h]
        const game = this.game;
        game.ctx.save();
        let tw = spriteLoc[2];
        let th = spriteLoc[3];
        //        let flipped = 1 - 2*flipx;
        if (anchor == 'center') {
            anchor = [tw * game.tileSize / 2, th * game.tileSize / 2];
        } else {
            anchor = [anchor[0] * game.tileSize, anchor[1] * game.tileSize];
        }
        game.ctx.translate(x * game.tileSize + game.shakeX + game.gameOffsetX + anchor[0],
            y * game.tileSize + game.shakeY + game.gameOffsetY + anchor[1]);
        game.ctx.rotate(angle * Math.PI / 180);
        if (flipx) {
            game.ctx.scale(-1, 1);
        }
        game.ctx.translate(-anchor[0], -anchor[1]);
        game.ctx.drawImage(
            this.sheet,
            spriteLoc[0] * this.spriteSize,
            spriteLoc[1] * this.spriteSize,
            this.spriteSize * tw,
            this.spriteSize * th,
            0,
            0,
            game.tileSize * tw,
            game.tileSize * th
        );
        game.ctx.restore();
    }
}

export const monsterRowLocIds = Object.freeze({
    OneEye: 0,
    TwoEye: 1,
    Tank: 2,
    Eater: 3,
    Jester: 4,
});

export const baseSetIds = {
    BeachUpper: pos(4, 1),
    BeachLower: pos(9, 1),
    Water: pos(10, 1),
    Jelly: pos(11, 1),
    Cannonball: pos(12, 1),
    Wall: pos(13, 1),
    WallEnd: pos(13, 0),
    Pillar1: pos(6, 1),
    Pillar2: pos(7, 1),
    Pillar3: pos(8, 1),
    PlayerCharacter1: pos(10, 6),
    PlayerCharacter2: pos(11, 6),
    PlayerCharacter3: pos(12, 6),
    PlayerCharacter4: pos(13, 6),
    Slash: pos(10, 7),
    Strike: pos(10, 7),
}

export const bigSetIds = Object.freeze({
    Boss1: rect(0, 3, 3, 3),
});

export const tileIds = Object.freeze({
    KioskScreen: pos(0, 0),
    KioskDispenser: pos(0, 1),
    Floor: pos(1, 0),
    Wall: pos(2, 0),
    Ledge: pos(3, 0),
    Ladder: pos(4, 0),
    Exit: pos(5, 0),
    LockedExit: pos(6, 0),
    TrapBlock: pos(7, 0),
    Pillar: pos(8, 0),
    Lights: pos(0, 1),
    FlowerBox: pos(1, 1),
    PlantBox: pos(1, 2),
    TreeTop: pos(2, 1),
    TrunkBox: pos(2, 2),
    AppleTreeTop: pos(3, 1),
    Trunk: pos(3, 2),
    BerryBush: pos(4, 1),
    Bush: pos(4, 2),
    VineBranchRight: pos(5, 1),
    VineUp: pos(5, 2),
    VineRightUp: pos(6, 1),
    VineLeftUp: pos(6, 2),
    VineTerminator: pos(7, 1),
    VineBranchLeft: pos(7, 2),
    VineLeft: pos(10, 2),
    VineRight: pos(11, 2),
    PineBox: pos(8, 1),
    VineBox: pos(8, 2),
    PineTop: pos(9, 1),
    PineMid: pos(9, 2),
    WaterTankLeft: pos(10, 1),
    WaterTankRight: pos(11, 1),
    LockerClosed: pos(0, 3),
    LockerOpen: pos(1, 3),
    RazorWireLeft: pos(2, 3),
    RazorWire: pos(3, 3),
    RazorWireRight: pos(4, 3),
    RazorWirePost: pos(5, 3),
    ShotWall1: pos(6, 3),
    ShotWall2: pos(7, 3),
    BlastedLadder1: pos(8, 3),
    BlastedLadder2: pos(9, 3),
    BlastedWall1: pos(10, 3),
    BlastedWall2: pos(11, 3),
    Debris1: pos(12, 3),
    BlastedPillar: pos(13, 3),
    BluePrint: pos(0, 4),
    Potions: pos(1, 4),
    Burner: pos(2, 4),
    Desk: pos(7, 4),
    Chair: pos(8, 4),
    CryoBottom: pos(3, 4),
    CryoTop: pos(4, 4),
    CryoMiddle: pos(5, 4),
    SuspendedWiresPlatform: pos(6, 4),
    SuspendedWiresVert: pos(6, 5),
    SuspendedWiresEnd: pos(6, 6),
    Dirt1: pos(0, 5),
    Dirt2: pos(0, 6),
    Dirt3: pos(1, 6),
    Drill1: pos(1, 5),
    Drill2: pos(2, 6),
    Drill3: pos(3, 6),
    DirtLeft: pos(2, 5),
    DirtBottom: pos(3, 5),
    DirtRight: pos(4, 5),
    DirtTop: pos(5, 5),
});

export const entityItemIds = Object.freeze({
    Chips: pos(0, 0),
    Energy: pos(1, 0),
    Key: pos(2, 0),
    LiveGrenade: pos(3, 0),
    Shot1: pos(4, 0),
    Shot2: pos(5, 0),
    Shot3: pos(6, 0),
    Boom: pos(7, 0),
    Drone1: pos(8, 0),
    Drone2: pos(9, 0),
    Platform: pos(10, 0),
    TrapBlade: pos(11, 0),
    GunTurretBase: pos(12, 0),
    GunTurretBarrel: pos(13, 0),
    LiveRocket: pos(14, 0),
    LiveVibroBlade: pos(15, 0),
    Reticle: pos(16, 0),
    Strike: pos(17, 0),
    InventorySelector: pos(0, 1),
    Gun: pos(1, 1),
    Grenade: pos(2, 1),
    Wrench: pos(3, 1),
    JetPack: pos(4, 1),
    Fist: pos(5, 1),
    GrappleGun: pos(6, 1),
    Glider: pos(7, 1),
    Shotgun: pos(8, 1),
    RocketLauncher: pos(9, 1),
    Shield: pos(10, 1),
    Drone: pos(11, 1),
    VibroBlade: pos(12, 1),
    AssaultRifle: pos(13, 1),
    ClimbingGlove: pos(14, 1),
    Boot1: pos(0, 2),
    Boot2: pos(1, 2),
    Boot3: pos(2, 2),
    Health: pos(0, 3),
    Pickup1: pos(1, 3),
    Pickup2: pos(2, 3),
    Frag: rect(30, 0, 2, 2), // 2x2 textu)e
});


export const pickups = Object.freeze({
    Health: pos(0, 3),
    Gun: pos(1, 1),
    Grenade: pos(2, 1),
    Wrench: pos(3, 1),
    JetPack: pos(4, 1),
    Fist: pos(5, 1),
    GrappleGun: pos(6, 1),
    Glider: pos(7, 1),
    Shotgun: pos(8, 1),
    RocketLauncher: pos(9, 1),
    Shield: pos(10, 1),
    Drone: pos(11, 1),
    VibroBlade: pos(12, 1),
    AssaultRifle: pos(13, 1),
    ClimbingGlove: pos(14, 1),
});

