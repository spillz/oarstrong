//@ts-check

import { randomRange, Vec2 } from "./util";
import { pickups } from "./sprites";
import { Drone, Fist, Glider, GrappleGun, Grenade, Gun, JetPack, PowerSaber, Rifle, RocketLauncher, Shield, Shotgun, Wrench } from "./inventory";
/**@typedef {import('./player').Player} Player */
/**@typedef {import('./game').Game} Game */

export class KioskPickup {
    /**
     * 
     * @param {Vec2} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite) {
        /**@type {Vec2} */
        this.pos = new Vec2(pos);
        /**@type {[number, number]} */
        this.sprite = sprite;
    }
    getDisplayX() {
        return this.pos.x + 4.0 / 16;
    }
    getDisplayY() {
        return this.pos.y + 2.0 / 16;
    }
    /**
     * 
     * @param {Game} game 
     */
    draw(game) {
        game.sprites.entitiesItems.drawScaled(this.sprite, this.getDisplayX(), this.getDisplayY(), 0.5);
    }
    /**
     * 
     * @param {Player} player 
     */
    activate(player) {
    }
}

export class HealthPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Health);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        player.maxHp += 1;
        player.hp = player.maxHp;
        this.dead = true;
    }
}

export class FistPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Fist);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Fist);
        let fist = player.inventory.get(Fist);
        if (upgrade) fist.upgrade(randomRange(1, 2));
        this.dead = true;
    }
}


export class GunPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Gun);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Gun);
        let gun = player.inventory.get(Gun);
        if (upgrade) gun.upgrade(randomRange(1, 2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }
}

export class ShotgunPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Shotgun);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Shotgun);
        let gun = player.inventory.get(Shotgun);
        if (upgrade) gun.upgrade(randomRange(1, 2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }
}

export class RiflePickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.AssaultRifle);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Rifle);
        let gun = player.inventory.get(Rifle);
        if (upgrade) gun.upgrade(randomRange(1, 2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }
}

export class RocketLauncherPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.RocketLauncher);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(RocketLauncher);
        let gun = player.inventory.get(RocketLauncher);
        if (upgrade) gun.upgrade(randomRange(1, 2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }
}


export class GrenadePickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Grenade);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Grenade);
        let grenade = player.inventory.get(Grenade);
        if (upgrade) grenade.upgrade(randomRange(1, 2));
        grenade.count += 3;
        this.dead = true;
    }
}

export class PowerSaberPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.VibroBlade);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(PowerSaber);
        let saber = player.inventory.get(PowerSaber);
        if (upgrade) saber.upgrade(randomRange(1, 2));
        this.dead = true;
    }
}


export class JetPackPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.JetPack);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(JetPack);
        let jetpack = player.inventory.get(JetPack);
        if (upgrade) jetpack.upgrade(randomRange(1, 2));
        jetpack.fuel = 10000;
        this.dead = true;
    }
}

export class WrenchPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Wrench);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Wrench);
        let wrench = player.inventory.get(Wrench);
        if (upgrade) wrench.upgrade(randomRange(1, 2));
        wrench.charges = wrench.maxCharges;
        this.dead = true;
    }
}

export class GrappleGunPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.GrappleGun);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(GrappleGun);
        let grapple = player.inventory.get(GrappleGun);
        if (upgrade) grapple.upgrade(randomRange(1, 2));
        this.dead = true;
    }
}

export class DronePickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Drone);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.inventory.contains(Drone);
        let drone = player.inventory.get(Drone);
        if (upgrade) drone.upgrade(randomRange(1, 2));
        this.dead = true;
    }

}

export class ShieldPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Shield);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.passiveInventory.contains(Shield);
        let shield = player.passiveInventory.get(Shield);
        if (upgrade) shield.upgrade(randomRange(1, 2));
        shield.charge = shield.maxCharge;
        this.dead = true;
    }

}

export class GliderPickup extends KioskPickup {
    /**
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, pickups.Glider);
    }
    /**@type {KioskPickup['activate']} */
    activate(player) {
        //        game.playSound("pickup");
        let upgrade = player.passiveInventory.contains(Glider);
        let glider = player.passiveInventory.get(Glider);
        if (upgrade) glider.upgrade(randomRange(1, 2));
        this.dead = true;
    }

}

