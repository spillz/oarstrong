//@ts-check
import { getRandomInt, Vec2 } from './util';
import { Entity } from './entity';
import { Boom, LiveDrone, LiveGrenade, LiveRocket, MonsterBoom, Reticle, SaberStrike, Shot, ShotFrags } from './entity_items';
import { entityItemIds } from './sprites';
import { Player } from './player';
import { Exit, Floor, Kiosk } from './tile';
/**@typedef {import('./game').Game} Game */


export class Inventory extends Array {
    /**
     * 
     * @param {Player} player 
     * @param {InventoryItem[]|null} items 
     */
    constructor(player, items = null) {
        super();
        this.player = player;
        if (items != null)
            for (let i of items)
                this.push(i);
    }
    /**
     * 
     * @param {Game} game 
     */
    setPositions(game) {
        let base = (game.camera.scrollable ? game.camera.viewPortW : game.dimW);
        for (let i = 0; i < this.length; i++) {
            this[i].pos.x = base + i % 4;
            this[i].pos.y = 5 + Math.floor(i / 4);
        }
    }
    /**
     * 
     * @param {Game} game 
     * @param {*} itemType 
     * @returns 
     */
    get(game, itemType) {
        for (let i = 0; i < this.length; i++)
            if (this[i] instanceof itemType) {
                return this[i];
            }
        let item = new itemType(this);
        this.add(game, item);
        return item;
    }
    contains(itemType) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] instanceof itemType) {
                return true;
            }
        }
        return false;
    }
    /**
     * 
     * @param {Game} game 
     * @param {InventoryItem} item 
     */
    add(game, item) {
        this.push(item);
        this.setPositions(game);
        item.registerHooks(this.player); //todo: deregistor hooks??
    }
    /**
     * 
     * @param {Game} game 
     * @param {InventoryItem} item 
     */
    remove(game, item) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] == item) {
                this.splice(i, 1);
                this.setPositions(game);
                return;
            }
        }
        //TODO: deregister hooks?? no items are removed yet so not a problem but it evenutally will be
    }
    randomExcluding(item) {
        let ipos = -1
        for (let i = 0; i < this.length; i++) {
            if (this[i] == item) {
                ipos = i;
                break;
            }
        }
        if (ipos < 0) {
            return null;
        }
        let i = getRandomInt(this.length - 1);
        return i < ipos ? this[i] : this[i + 1];
    }
}

export class ActiveInventory extends Inventory {
    next() {
        for (let i = 0; i < this.length; i++) {
            if (this[i].selected) {
                let next = this[i + 1 < this.length ? i + 1 : 0]
                this.select(next);
                return next;
            }
        }
    }
    activeItem() {
        for (let i = 0; i < this.length; i++) {
            if (this[i].selected) {
                return this[i];
            }
        }
        return null;
    }
    select(item) {
        for (let i of this) {
            i.selected = false;
        }
        item.selected = true;
    }
}


export class InventoryItem extends Entity {
    constructor(sprite) {
        super(null, sprite)
        this.selected = false;
        this.count = 0;
    }
    /**
     * 
     * @param {Game} game 
     * @param {Vec2} pos 
     * @param {Player} player 
     */
    drawIconsForPlayer(game, pos, player) {
        if (this.sprite.length === 2) {
            game.sprites.entitiesItems.draw(this.sprite, pos.x, pos.y);
        }
        if (this.selected) {
            if (entityItemIds.InventorySelector.length === 2)
                game.sprites.entitiesItems.draw(entityItemIds.InventorySelector, pos.x, pos.y);
        }
        const value = this.value(player);
        if (value !== null) {
            game.drawTileText("" + Math.floor(value), 0.5 * game.tileSize, pos, "White");
        }
    }
    /**
     * 
     * @param {Player} player 
     * @returns {number|null}
     */
    value(player) {
        return null;
    }
    update(game, millis, player) {
    }
    registerHooks(player) {
    }
}

export class PassiveInventoryItem extends Entity {
    constructor(sprite) {
        super(null, sprite)
        this.selected = false;
        this.selectedTimer = 0;
        this.count = 0;
    }
    /**
     * 
     * @param {Player} player 
     * @returns {number|null}
     */
    value(player) {
        return null;
    }
    drawIconsForPlayer(game, pos, player) {
        if (this.sprite.length === 2) {
            game.sprites.entitiesItems.draw(this.sprite, pos.x, pos.y);
        }
        const value = this.value(player);
        if (value !== null) {
            game.drawTileText("" + Math.floor(value), 0.5 * game.tileSize, pos, "White"); // Text for hp level 
        }
    }
    registerHooks(player) {
    }
}

export class Fist extends InventoryItem {
    constructor() {
        super(entityItemIds.Fist);
        this.hitPower = 1;
        this.hitDamage = 0.5;
        this.stunTime = 2000;
        this.elapsed = 500;
        this.timer = 500;
    }
    value(player) {
        return null;
    }
    upgrade(upType) {
        if (upType == 1) {
            this.hitPower *= 1.2;
        }
        if (upType == 2) {
            this.hitDamage += 0.5;
        }
    }
    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @param {Player} player 
     * @returns 
     */
    update(game, millis, player) {
        super.update(game, millis, player);
        this.elapsed += millis;
        if (player.oldControlStates['use'] || !player.newControlStates['use']) {
            return;
        }
        if (this.elapsed < this.timer) {
            return;
        }
        player.use(game, 100);
        let monsters = game.monsters_with_other_players(player);
        let vt = (-(player.controlStates['up'] ? 1 : 0) + (player.controlStates['down'] ? 1 : 0)) * 0.5;
        let vt0 = vt === 0 ? 1 : 0;
        let hz = player.boundingBox.w * (player.facing * vt0 +
            (-(player.controlStates['left'] ? 1 : 0) + (player.controlStates['right'] ? 1 : 0)) * vt0);
        let sh = new Vec2([hz, vt]);
        let b = player.bounds().shift(sh);
        for (let m of monsters) {
            if (!m.dead && b.collide(m.hitBounds())) {
                m.facing = player.facing;
                m.falling = true;
                m.stun(this.stunTime);
                m.hitFrom(game, player.pos, this.hitDamage, this.hitPower);
                player.controller.vibrate(0.3, 0.5, 75);
                this.elapsed = 0;
                return; //only get to hit one monster
            }
        }
        game.tiles.closestTile(b).hitFrom(game, player.pos, 0.5, 'blunt');
    }
}


export class Gun extends InventoryItem {
    constructor() {
        super(entityItemIds.Gun);
        this.lastShotTime = 2000;
        this.reloadSpeed = 1000;
        this.shotDamage = 1;
        this.energyUse = 1;
        this.loaded = true;
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, 0, 0);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.reloadSpeed /= 2;
        }
        if (upType == 2) {
            this.shotDamage++;
        }
    }
    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @param {Player} player 
     * @returns 
     */
    update(game, millis, player) {
        super.update(game, millis, player);
        this.lastShotTime += millis;
        if (!player.controlStates['use']) {
            return;
        }
        // TODO: not allowing shots while falling or running seemed harsh. Maybe we can play around with an accuracy concept
        //        if(player.falling || player.controlStates['left'] || player.controlStates['right'] || !player.controlStates['use'])
        //            return;
        if (this.lastShotTime < this.reloadSpeed) {
            return;
        }
        if (!this.loaded) {
            game.playSound('gunReload');
            this.loaded = true;
        }
        let angle = player.facing < 0 ? 180 : 0;
        if (player.controlStates['up']) {
            if (player.controlStates['left'] && !player.controlStates['right']) {
                angle = 225;
            } else if (player.controlStates['right'] && !player.controlStates['left']) {
                angle = 315;
            } else
                angle = 270;
        } else if (player.controlStates['down']) {
            if (player.controlStates['left'] && !player.controlStates['right']) {
                angle = 135;
            } else if (player.controlStates['right'] && !player.controlStates['left']) {
                angle = 45;
            } else
                angle = 90;
        }
        player.use(game, 100);
        game.items.push(new Shot(player, this.shotDamage, angle, player.facing));
        if (this.shotDamage <= 1) {
            game.playSound('gunFire1');
        } else if (this.shotDamage <= 2) {
            game.playSound('gunFire2');
        } else {
            game.playSound('gunFire3');
        }
        player.controller.vibrate(this.shotDamage * 0.25, this.shotDamage * 0.25, 50);

        this.lastShotTime = 0;
        this.loaded = false;
    }
}

export class Grenade extends InventoryItem {
    constructor() {
        super(entityItemIds.Grenade);
        this.damage = 3;
        this.radius = 1.5;
        this.energyUse = 1;
        this.alloyUse = 2;
        this.bioticUse = 1;
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, this.alloyUse, this.bioticUse);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.radius += 1;
        }
        if (upType == 2) {
            this.damage += 1;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        this.lastShotTime += millis;
        if (!player.resources.canUse(this.energyUse, this.alloyUse, this.bioticUse)) {
            return;
        }
        if (!player.controlStates['use']) {
            return;
        }
        if (player.oldControlStates['use']) {
            return;
        }
        let vel;
        if (player.controlStates['down']) {
            vel = player.vel.add([0, 0]);
        } else if (player.controlStates['up']) {
            vel = player.vel.add([player.facing * 1.0 / 250, -1.0 / 80]);
        } else {
            vel = player.vel.add([player.facing * 1.0 / 80, -1.0 / 300]);
        }
        game.items.push(new LiveGrenade(game, player, this.damage, this.radius, player.facing, vel));
        player.use(100);

        player.resources.use(this.energyUse, this.alloyUse, this.bioticUse);
        this.lastShotTime = 0;
    }
}

export class Wrench extends InventoryItem {
    breakTime = 1000;
    chargeTime = 5000;
    energyUse = 2;
    alloyUse = 0;
    bioticUse = 0;
    elapsed = 4000;
    timer = 2000;
    monsterBoom = true;
    boomTime = 2000;
    charges = 0;
    constructor() {
        super(entityItemIds.Wrench);
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, this.alloyUse, this.bioticUse);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.chargeTime /= 2;
        }
        if (upType == 2) {
            this.breakTime /= 2;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        this.elapsed += millis;
        if (player.falling) { // to make less effective, block use if moving: player.controlStates['left'] || player.controlStates['right']
            return;
        }
        if (player.oldControlStates['use'] || !player.newControlStates['use']) {
            return;
        }
        if (!player.resources.canUse(this.energyUse, this.alloyUse, this.bioticUse)) {
            return
        }
        if (this.elapsed < this.timer) {
            return;
        }
        let t = game.tiles.closestTile(player.bounds())
        if (player.controlStates['up']) {
            t = game.tiles.above(t.pos)
        }
        else if (player.controlStates['down']) {
            t = game.tiles.below(t.pos)
        }
        else if (player.facing == -1) {
            for (let m of game.monsters) {
                if (this.monsterBoom && player.bounds().shift([-player.boundingBox.w, 0]).collide(m.hitBounds())) {
                    player.use(100);
                    game.items.push(new MonsterBoom(m, player, this.boomTime, player.facing));
                    player.controller.vibrate(0.25, 0.25, 50);
                    player.resources.use(this.energyUse, this.alloyUse, this.bioticUse);
                    this.elapsed = -this.boomTime;
                    this.lastShotTime = 0;
                    return;
                }
            }
            t = game.tiles.leftOf(t.pos)
        }
        else if (player.facing == 1) {
            for (let m of game.monsters) {
                if (this.monsterBoom && player.bounds().shift([player.boundingBox.w, 0]).collide(m.hitBounds())) {
                    player.use(100);
                    game.items.push(new MonsterBoom(m, player, this.boomTime, player.facing));
                    player.controller.vibrate(0.25, 0.25, 50);
                    player.resources.use(this.energyUse, this.alloyUse, this.bioticUse);
                    this.elapsed = -this.boomTime;
                    this.lastShotTime = 0;
                    return;
                }
            }
            t = game.tiles.rightOf(t.pos)
        }
        if (t instanceof Floor || t instanceof Kiosk || t instanceof Exit) {
            return;
        }
        player.use(100);
        game.items.push(new Boom(t, this.breakTime));
        player.controller.vibrate(0.25, 0.25, 50);
        this.charges -= 1;
        this.elapsed = -this.breakTime;
        this.lastShotTime = 0;
    }
}

export class JetPack extends InventoryItem {
    constructor() {
        super(entityItemIds.JetPack);
        this.power = 1.0 / 400; //max velocity
        this.energyUse = 1 / 1000; //ten seconds of power
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, 0, 0) / 1000;
    }
    upgrade(upType) {
        if (upType == 1) {
            this.energyUse *= 0.9;
        }
        if (upType == 2) {
            this.power *= 1.2;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        if (!player.controlStates['use']) {
            return;
        }
        if (!player.resources.use(this.energyUse * millis, 0, 0)) {
            return;
        }
        player.controller.vibrate(0.15, 0.15, millis);
        if (player.controlStates['up']) {
            player.vel.y -= 1.0 / 2400 * millis / 15;
            player.vel.y = Math.max(player.vel.y, -this.power);
        } else {
            let t = game.tiles.closestTile(player.bounds());
            if (t.passable && !game.tiles.below(t).passable) {
                player.vel.y -= 1.0 / 2400 * millis / 15;
                player.vel.y = Math.max(player.vel.y, -this.power);

            } else {
                player.vel.y -= 1.0 / 2400 * millis / 15;
                player.vel.y = Math.max(player.vel.y, 0);
            }
        }
    }
}

export class GrappleGun extends InventoryItem { //aimable grappling hook. upgradable range, speed of retraction, refresh rate
    constructor() {
        super(entityItemIds.GrappleGun);
        this.grapple_vel = 1.0 / 60;
        this.power = 1.0 / 180;
        this.alloyUse = 1;
        this.angle = 0;
        this.activeLine = null;
        this.grappling = false;
    }
    value(player) {
        return player.resources.maxUse(0, this.alloyUse, 0);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.power *= 1.2;
        }
        if (upType == 2) {
            this.grapple_vel *= 1.2;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        if (this.activeLine != null) { //once line is active, the activeLine object tracks things
            return;
        }
        if (player.controlStates['use'] && !player.oldControlStates['use']) {
            if (player.resources.canUse(0, this.alloyUse, 0)) {
                this.angle = 270 //- 180*(player.facing<0);
                player.aiming = true;
                let reticle = new Reticle(player, this);
                game.items.push(reticle);
            }
        }
        if (!player.aiming) {
            return;
        }
        player.use(100);
        if (player.controlStates['use'] && player.controlStates['up']) {
            this.angle = this.angle - 3 * (millis / 15) * player.facing;
        }
        if (player.controlStates['use'] && player.controlStates['down']) {
            this.angle = this.angle + 3 * (millis / 15) * player.facing;
        }
        if (!player.controlStates['use'] && player.oldControlStates['use']) {
            player.aiming = false;
            this.grappling = true;
            // this.activeLine = new GrappleLine(player, this, this.angle, this.grapple_vel, this.power, this.alloyUse);
            // player.use(100);
            // game.items.push(this.activeLine);
            // game.playSound('grappleFire');
            // player.controller.vibrate(0.25,0.25,50);
        }
    }

}

export class RocketLauncher extends InventoryItem { //shoots explosive rockets
    constructor() {
        super(entityItemIds.RocketLauncher);
        this.lastShotTime = 6000;
        this.accelTime = 1000;
        this.reloadSpeed = 5000;
        this.rocketDamage = 3;
        this.energyUse = 2;
        this.alloyUse = 2;
        this.bioticUse = 1;
        this.blastRadius = 2;
        this.loaded = true;
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, this.alloyUse, this.bioticUse);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.reloadSpeed /= 2;
        }
        if (upType == 2) {
            this.rocketDamage++;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        this.lastShotTime += millis;
        if (this.lastShotTime < this.reloadSpeed) {
            return;
        }
        if (!player.resources.canUse(this.energyUse, this.alloyUse, this.bioticUse)) {
            return;
        }
        if (!this.loaded) {
            game.playSound('rocketReload');
            this.loaded = true;
        }
        if (player.controlStates['use'] && !player.oldControlStates['use']) {
            this.angle = player.facing < 0 ? 180 : 0;
            player.aiming = true;
            let reticle = new Reticle(player, this);
            game.items.push(reticle);
        }
        if (!player.aiming) {
            return;
        }
        player.use(100);
        if (player.controlStates['use'] && player.controlStates['up']) {
            this.angle = this.angle - 3 * (millis / 15) * player.facing;
        }
        if (player.controlStates['use'] && player.controlStates['down']) {
            this.angle = this.angle + 3 * (millis / 15) * player.facing;
        }
        if (!player.controlStates['use'] && player.oldControlStates['use']) {
            player.aiming = false;
            game.items.push(new LiveRocket(player, this.rocketDamage, this.blastRadius, this.angle, this.accelTime));
            player.resources.use(this.energyUse, this.alloyUse, this.bioticUse);
            this.lastShotTime = 0;
            this.loaded = false;
            game.playSound('rocketFire');
            player.controller.vibrate(0.75, 0.75, 150);
        }
    }
}

export class Rifle extends InventoryItem { //aimable long range attacks
    constructor() {
        super(entityItemIds.AssaultRifle);
        this.lastShotTime = 2000;
        this.reloadSpeed = 1000;
        this.shotDamage = 1;
        this.energyUse = 1;
        this.loaded = true;
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, 0, 0);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.reloadSpeed /= 2;
        }
        if (upType == 2) {
            this.shotDamage++;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        this.lastShotTime += millis;
        // TODO: not allowing shots while falling or running seemed harsh. Maybe we can play around with an accuracy concept
        //        if(player.falling || player.controlStates['left'] || player.controlStates['right'] || !player.controlStates['use'])
        //            return;
        if (this.lastShotTime < this.reloadSpeed) {
            return;
        }
        if (!player.resources.canUse(this.energyUse, 0, 0)) {
            return;
        }
        if (!this.loaded) {
            game.playSound('rifleReload');
            this.loaded = true;
        }
        if (player.controlStates['use'] && !player.oldControlStates['use']) {
            this.angle = player.facing < 0 ? 180 : 0;
            player.aiming = true;
            let reticle = new Reticle(player, this);
            game.items.push(reticle);
        }
        if (!player.aiming) {
            return;
        }
        player.use(100);
        if (player.controlStates['use'] && player.controlStates['up']) {
            this.angle = this.angle - 3 * (millis / 15) * player.facing;
        }
        if (player.controlStates['use'] && player.controlStates['down']) {
            this.angle = this.angle + 3 * (millis / 15) * player.facing;
        }
        if (!player.controlStates['use'] && player.oldControlStates['use']) {
            player.aiming = false;
            this.grappling = true;
            game.items.push(new Shot(player, this.shotDamage, this.angle, player.facing));
            player.resources.use(this.energyUse, 0, 0);
            this.lastShotTime = 0;
            this.loaded = false;
            game.playSound('rifleFire');
            player.controller.vibrate(this.shotDamage * 0.25, this.shotDamage * 0.25, 100);
        }
    }

}

export class Shotgun extends InventoryItem { //shoots pellets with a blastable radius
    constructor() {
        super(entityItemIds.Shotgun);
        this.lastShotTime = 2000;
        this.reloadSpeed = 1000;
        this.shotDamage = 2;
        this.shotRange = 2;
        this.energyUse = 1;
        this.alloyUse = 1;
        this.loaded = true;
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, this.alloyUse, 0);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.reloadSpeed *= 0.8;
        }
        if (upType == 2) {
            this.shotDamage++;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        this.lastShotTime += millis;
        if (this.lastShotTime < this.reloadSpeed) {
            return;
        }
        if (!player.resources.canUse(this.energyUse, this.alloyUse, 0)) {
            return;
        }
        if (!this.loaded) {
            game.playSound('shotgunReload');
            this.loaded = true;
        }
        if (!player.controlStates['use']) {
            return;
        }
        let angle = player.facing < 0 ? 180 : 0;
        if (player.controlStates['up']) {
            if (player.controlStates['left'] && !player.controlStates['right']) {
                angle = 225;
            } else if (player.controlStates['right'] && !player.controlStates['left']) {
                angle = 315;
            } else
                angle = 270;
        } else if (player.controlStates['down']) {
            if (player.controlStates['left'] && !player.controlStates['right']) {
                angle = 135;
            } else if (player.controlStates['right'] && !player.controlStates['left']) {
                angle = 45;
            } else
                angle = 90;
        }
        game.items.push(new ShotFrags(player, this.shotDamage, this.shotRange, angle, player.facing));
        player.resources.use(this.energyUse, this.alloyUse, 0);
        this.lastShotTime = 0;
        this.loaded = false;
        player.use(100);
        game.playSound('shotgunFire');
        player.controller.vibrate(this.shotDamage * 0.5, this.shotDamage * 0.5, 100);
    }

}

export class PowerSaber extends InventoryItem { //hit multiple enemies, longer range than the fist, special moves
    constructor() {
        super(entityItemIds.VibroBlade);
        this.hitPower = 0.25;
        this.hitDamage = 1;
        this.chargeBonus = 1;
        this.chargeTime = 1000;
        this.chargeElapsed = 0;
        this.charged = false;
        this.energyUse = 2;
        this.stunTime = 500;
        this.elapsed = 500;
        this.timer = 500;
        // this.sound = game.playSound('saberCharge', 0, true, false);
    }
    value(player) {
        return player.resources.maxUse(this.energyUse, 0, 0);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.chargeTime *= 0.9;
        }
        if (upType == 2) {
            this.chargeBonus += 1.0;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        this.elapsed += millis;
        if (this.elapsed < this.timer) {
            return;
        }
        if (player.controlStates['use'] && player.resources.canUse(this.energyUse, 0, 0)) {
            this.chargeElapsed += millis;
            player.use(100);
            if (!this.charged && this.chargeElapsed > this.chargeTime) {
                // this.sound.currentTime = 0;
                // this.sound.play();
                this.charged = true;
            }
            if (this.charged) {
                player.controller.vibrate(0.1, 0.1, millis);
            }
            return;
        }
        if (player.oldControlStates['use'] && !player.controlStates['use']) {
            player.use(100);
            let angle = player.facing < 0 ? 180 : 0;
            if (player.controlStates['up']) {
                if (player.controlStates['left']) {
                    angle = 225;
                } else
                    if (player.controlStates['right']) {
                        angle = 315;
                    }
                angle = 270;
            }
            if (player.controlStates['down']) {
                if (player.controlStates['left']) {
                    angle = 135;
                } else
                    if (player.controlStates['right']) {
                        angle = 45;
                    }
                angle = 90;
            }
            let strike = new SaberStrike(player.pos, player.facing, angle);
            game.items.push(strike);
            let hitDamage = this.hitDamage;
            if (this.chargeElapsed > this.chargeTime && player.resources.canUse(this.energyUse, 0, 0)) {
                hitDamage += this.chargeBonus;
                player.resources.use(this.energyUse, 0, 0);
            }
            let monsters = game.monsters_with_other_players(player);
            let hit = false;
            for (let m of monsters) {
                if (!m.dead && strike.bounds().collide(m.hitBounds())) {
                    m.facing = player.facing;
                    m.falling = true;
                    m.stun(this.stunTime);
                    m.hitFrom(game, player.pos, hitDamage, this.hitPower);
                    player.controller.vibrate(0.5, 0.5, 100);
                    hit = true;
                }
            }
            if (!hit) {
                game.tiles.closestTile(strike.bounds()).hitFrom(game, player.pos, hitDamage, 'cut');
            }
            // this.sound.pause();
            this.charged = false;
            this.elapsed = 0;
            this.chargeElapsed = 0;
        }
    }
}

export class Drone extends InventoryItem { //flying assistant
    constructor() {
        super(entityItemIds.Drone);
        this.lastBuildTime = 11000;
        this.buildTime = 5000;
        this.flightTime = 5000;
        this.live = false;
        this.liveDrone = null;
        this.alloyUse = 1;
        this.bioticUse = 1;
        this.damage = 1;
        this.radius = 1;
        this.reloadSpeed = 2000;
    }
    value(player) {
        if (this.live) {
            return Math.ceil((this.liveDrone.timer - this.liveDrone.elapsed) / 1000);
        } else {
            const time = Math.ceil(Math.max(this.buildTime - this.lastBuildTime, 0) / 1000);
            return time > 0 ? time : player.resources.maxUse(0, this.alloyUse, this.bioticUse);
        }
    }
    upgrade(upType) {
        if (upType == 1) {
            this.reloadSpeed *= 0.8;
        }
        if (upType == 2) {
            this.flightTime += 1000;
        }
    }
    update(game, millis, player) {
        super.update(game, millis, player);
        if (this.live) {
            return;
        }
        this.lastBuildTime += millis;
        if (this.lastBuildTime < this.buildTime) {
            return;
        }
        if (!player.controlStates['use']) {
            return;
        }
        if (this.lastShotTime < this.reloadSpeed) {
            return;
        }
        if (!player.resources.canUse(0, this.alloyUse, this.bioticUse)) {
            return;
        }
        player.resources.use(0, this.alloyUse, this.bioticUse);
        this.liveDrone = new LiveDrone(player, this);
        game.items.push(this.liveDrone);
        player.controller.vibrate(0.1, 0.1, millis);
        this.live = true;
        this.lastShotTime = 0;
    }
}

export class ClimbingGloves extends InventoryItem { //climb walls and ceiling

}


//Passive Items
export class Glider extends PassiveInventoryItem { //hold jump button in the air to descend slowly
    constructor() {
        super(entityItemIds.Glider);
        this.glide_coef = 0.15; //max velocity
        this.arrestRate = 1; //how quickly speed is arrested
    }
    value(player) {
        return null;
    }
    upgrade(upType) {
        if (upType == 1) {
            this.arrestRate += 1;
        }
        if (upType == 2) {
            this.glide_coef *= 0.85;
        }
    }
    registerHooks(player) {
        player.hookUpdate.push(this);
    }
    update(game, millis, player) {
        if (!player.controlStates['jump'])// && !player.controlStates['jump'])
            return;

        let mfs = this.glide_coef * player.maxFallSpeed
        if (player.vel.y > mfs) {
            player.vel.y = Math.min(mfs, player.vel.y - (1.0 / 1000) * (1 + this.arrestRate) * millis / 15);
            player.controller.vibrate(0.05, 0.1, millis);
        }
    }
}

export class Boots extends PassiveInventoryItem { //jump height, double jump, wall jump, flip, roll, speed?
    //TODO: Not clear if this should be one item or multiple items and whether they can all work together or compete
}

export class Dog extends PassiveInventoryItem { //walking companion, attacks enemies

}

export class Shield extends PassiveInventoryItem { //prevents damage, recharges, counterattacks
    constructor() {
        super(entityItemIds.Shield);
        this.elapsed = 0;
        this.chargeTime = 5000; //ms per point of damage absorption recovered
        this.maxCharge = 1; //how much damage it soaks
        this.charge = 1;
        this.passive = true;
    }
    value(player) {
        return Math.floor(this.charge);
    }
    upgrade(upType) {
        if (upType == 1) {
            this.maxCharge += 1;
        }
        if (upType == 2) {
            this.chargeTime *= 0.9;
        }
    }
    registerHooks(player) {
        player.hookHitModifier.push(this);
        player.hookUpdate.push(this);
    }
    hitModifier(damage, knockbackScale = 0) {
        let damage_absorbed = Math.floor(Math.min(damage, this.charge));
        damage -= damage_absorbed;
        this.charge -= damage_absorbed;
        return [damage, knockbackScale];
    }
    update(game, millis, player) {
        if (this.charge < this.maxCharge) {
            this.elapsed += millis;
        }
        if (this.elapsed > this.chargeTime) {
            this.charge += 1;
            player.controller.vibrate(0.1, 0.0, millis);
            this.charge = Math.max(this.charge, this.maxCharge);
            this.elapsed = 0;
        }
    }
}


