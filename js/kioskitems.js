//@ts-check

import { randomRange, Vec2 } from "./util";
import { entityItemIds } from "./sprites";
import { Drone, Fist, Glider, GrappleGun, Grenade, Gun, JetPack, PowerSaber, Rifle, RocketLauncher, Shield, Shotgun, Wrench } from "./inventory";
/**@typedef {import('./game').Game} Game */

export class KioskPickup {
    constructor(pos, sprite) {
        this.pos = new Vec2(pos);
        this.sprite = sprite;
    }
    getDisplayX() {
        return this.pos.x+4.0/16;
    }
    getDisplayY() {
        return this.pos.y+2.0/16;
    }
    /**
     * 
     * @param {Game} game 
     */
    draw(game) {
        game.sprites.entitiesItems.drawScaled(this.sprite, this.getDisplayX(), this.getDisplayY(), 0.5);
    }
}

export class HealthPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Health);
    }
    activate(player) {
//        game.playSound("pickup");
        player.maxHp += 1;
        player.hp = player.maxHp;
        this.dead = true;
    }    
}

export class FistPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Fist);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Fist);
        let fist = player.inventory.get(Fist);
        if(upgrade)
            fist.upgrade(randomRange(1,2));
        this.dead = true;
    }    
}


export class GunPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Gun);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Gun);
        let gun = player.inventory.get(Gun);
        if(upgrade)
            gun.upgrade(randomRange(1,2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }    
}

export class ShotgunPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Shotgun);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Shotgun);
        let gun = player.inventory.get(Shotgun);
        if(upgrade)
            gun.upgrade(randomRange(1,2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }    
}

export class RiflePickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.AssaultRifle);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Rifle);
        let gun = player.inventory.get(Rifle);
        if(upgrade)
            gun.upgrade(randomRange(1,2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }    
}

export class RocketLauncherPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.RocketLauncher);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(RocketLauncher);
        let gun = player.inventory.get(RocketLauncher);
        if(upgrade)
            gun.upgrade(randomRange(1,2));
        gun.ammo = gun.maxAmmo
        this.dead = true;
    }    
}


export class GrenadePickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Grenade);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Grenade);
        let grenade = player.inventory.get(Grenade);
        if(upgrade)
            grenade.upgrade(randomRange(1,2));
        grenade.count += 3;
        this.dead = true;
    }    
}

export class PowerSaberPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.VibroBlade);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(PowerSaber);
        let saber = player.inventory.get(PowerSaber);
        if(upgrade)
            saber.upgrade(randomRange(1,2));
        this.dead = true;
    }    
}


export class JetPackPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.JetPack);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(JetPack);
        let jetpack = player.inventory.get(JetPack);
        if(upgrade)
            jetpack.upgrade(randomRange(1,2));
        jetpack.fuel = 10000;
        this.dead = true;
    }    
}

export class WrenchPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Wrench);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Wrench);
        let wrench = player.inventory.get(Wrench);
        if(upgrade)
            wrench.upgrade(randomRange(1,2));
        wrench.charges = wrench.maxCharges;
        this.dead = true;
    }    
}

export class GrappleGunPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.GrappleGun);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(GrappleGun);
        let grapple = player.inventory.get(GrappleGun);
        if(upgrade)
            grapple.upgrade(randomRange(1,2));
        this.dead = true;
    }    
}

export class DronePickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Drone);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.inventory.contains(Drone);
        let drone = player.inventory.get(Drone);
        if(upgrade)
            drone.upgrade(randomRange(1,2));
        this.dead = true;
    }    

}

export class ShieldPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Shield);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.passiveInventory.contains(Shield);
        let shield = player.passiveInventory.get(Shield);
        if(upgrade)
            shield.upgrade(randomRange(1,2));
        shield.charge = shield.maxCharge;
        this.dead = true;
    }    

}

export class GliderPickup extends KioskPickup {
    constructor(pos) {
        super(pos, entityItemIds.Glider);
    }
    activate(player) {
//        game.playSound("pickup");
        let upgrade = player.passiveInventory.contains(Glider);
        let glider = player.passiveInventory.get(Glider);
        if(upgrade)
            glider.upgrade(randomRange(1,2));
        this.dead = true;
    }    

}

