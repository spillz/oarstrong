import { Vec2, Rect } from './util';
import { entityItemIds } from './sprites';
import { Exit, Floor, Kiosk, Tile, Void, Wall } from './tile';
import { Entity } from './entity';
import { Player } from './player';


export class Treasure extends Entity {
    constructor(tile) {
        super(tile, entityItemIds.Energy)
        this.pos
    }

    /**@type {Entity['entityCollide']} */
    entityCollide(game, entity) {
        if (game.competitiveMode) {
            if (entity instanceof Player) {
                entity.score += 1;
            }
        } else {
            game.score++;
            game.cellsCollected++;
            // entity.selectedTimer.reset(500);
            // entity.selectedSprite = entityItemIds.Energy;
        }
        game.playSound("pickup1");
        this.dead = true;
    }

    /**@type {Entity['entityInteract']} */
    entityInteract(game, entity, action) {
        if (!this.dead) {
            game.score++;
            game.cellsCollected++;
            game.playSound("pickup1");
            this.dead = true;
        }
    }
}

export class Chips extends Entity {
    constructor(tile, value = 1) {
        super(tile, entityItemIds.Chips);
        this.value = value;
    }

    /**@type {Entity['entityCollide']} */
    entityCollide(game, entity) {
        if (game.competitiveMode) {
            if (entity instanceof Player) entity.score += 0.2;
        } else {
            game.score++;
        }
        if (entity instanceof Player) {
            game.playSound("pickup2");
            let inv = entity.inventory.activeItem();
            entity.selectedTimer.reset(500);
            entity.selectedSprite = inv.sprite;
            entity.chips += this.value;
            this.dead = true;
        }
    }

    /**@type {Entity['entityInteract']} */
    entityInteract(game, entity, action) {
        if (!this.dead && entity instanceof Player) {
            game.score++;
            game.playSound("pickup2");
            let inv = entity.inventory.activeItem()
            entity.selectedTimer.reset(500);
            entity.selectedSprite = inv.sprite;
            entity.chips += this.value;
            this.dead = true;
        }
    }
}

export class DeadPlayer extends Entity {
    constructor(tile, player) {
        super(tile, [1, player.sprite[1]]);
        this.elapsed = 0;
        this.timer = 3000;
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        if (this.elapsed > this.timer) this.dead = true;
        //todo: inherit player momentum, apply gravity (Or just use the player class and a drop timer)
    }
    /**@type {Entity['draw']} */
    draw(game) {
        if (this.sprite.length === 2) {
            game.sprites.players.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        }
    }
}

class Key extends Entity {
    constructor(tile, lockTile) {
        super(tile, entityItemIds.Key);
        this.lockTile = lockTile;
    }

    /**@type {Entity['entityCollide']} */
    entityCollide(game, entity) {
        game.playSound("pickup2");
        this.lockTile.locked = false;
        this.dead = true;
    }
}

export class DelayedSound extends Entity {
    constructor(sound, delay) {
        super(null, null);
        this.sound = sound;
        this.delay = delay;
        this.elapsed = 0;
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        if (this.elapsed > this.delay) {
            game.playSound(this.sound);
            this.dead = true;
        }
    }
    draw() {
    }
}


export class BootsPickup extends Entity {
    /**
     * 
     * @param {Tile} tile 
     * @param {number} bootType 
     */
    constructor(tile, bootType) {
        let bootSprites = { 0: entityItemIds.Boot1, 1: entityItemIds.Boot2, 2: entityItemIds.Boot3, 3: entityItemIds.Boot3 };
        super(tile, bootSprites[bootType]);
        this.bootType = bootType;
    }
    /**@type {Entity['entityCollide']} */
    entityCollide(game, entity) {
        if (entity instanceof Player) {
            game.playSound("pickup2");
            if (this.bootType == 0)
                entity.jumpSpeed *= 1.2;
            else if (this.bootType == 1)
                entity.wallJumps += 1;
            else if (this.bootType == 2)
                entity.airJumps += 1;
            else if (this.bootType == 3)
                entity.spikedBoots += 1;
            this.dead = true;
        }
    }
}

export class UpgradePickup extends Entity {
    constructor(tile, upgradeType) {
        let upgradeSprites = { 0: entityItemIds.Pickup1, 1: entityItemIds.Pickup2 };
        super(tile, upgradeSprites[upgradeType]);
        this.upgradeType = upgradeType;
    }

    /**@type {Entity['entityCollide']} */
    entityCollide(game, entity) {
        if (entity instanceof Player) {
            game.playSound("pickup2");
            entity.inventory.activeItem().upgrade(this.upgradeType)
            this.dead = true;
        }
    }
}


export class MonsterBoom extends Entity {
    constructor(monster, player, timer = 250, facing) {
        super(null, entityItemIds.Boom);
        this.player = player;
        monster.vel.x = facing * Math.abs(monster.topSpeed * 5);
        monster.facing = facing;
        monster.drone = true;
        this.monster = monster;
        this.elapsed = 0;
        this.timer = timer;
        this.damage = monster.hp + 1;
    }

    /**@type {Entity['draw']} */
    draw(game) {
    }

    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        let player = this.player;
        if (this.elapsed >= this.timer || player != null && !player.dead && player.oldControlStates['use'] && !player.controlStates['use']) {
            if (this.elapsed < 250) { //cancel the attachment if player releases early
                this.player = null;
                return
            }
            let t = game.tiles.closestTile(this.monster.bounds());
            let t0 = game.tiles.leftOf(t);
            let t1 = game.tiles.rightOf(t);
            if (!(t instanceof Wall))
                game.items.push(new Boom(t));
            if (!(t0 instanceof Wall))
                game.items.push(new Boom(t0));
            if (!(t1 instanceof Wall))
                game.items.push(new Boom(t1));
            let bigRect = new Rect([t0.x, t0.y, 3, 1]);
            for (let m of game.monsters)
                if (m.hitBounds().collide(bigRect))
                    m.hit(game, this.damage);
            for (let player of game.activePlayers)
                if (player.hitBounds().collide(bigRect))
                    player.hit(game, this.damage);
            this.dead = true;
            game.playSound('boom');
            //TODO: base intensity on distance from EACH player
            for (let p of game.activePlayers) {
                if (!p.dead) {
                    p.controller.vibrate(0.5, 0.5, 250);
                }
            }
        }
    }

}

export class Boom extends Entity {
    constructor(tile, timer = 250) {
        super(tile, entityItemIds.Boom);
        this.timer = timer;
        this.elapsed = 0;
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        if (this.elapsed >= this.timer) {
            this.dead = true;
            let t = game.tiles.at(this.pos);
            if (!(t instanceof Floor || t instanceof Kiosk || t instanceof Exit))
                t.replace(Floor);
        }
    }
}

export class Shot extends Entity {
    constructor(player, shotDamage = 1, angle = 0, facing = 1, speedRatio = 1.0, pos = null) {
        super(null, entityItemIds.Shot1);
        this.player = player;
        this.pos = pos == null ? new Vec2(player.pos) : new Vec2(pos);
        this.facing = facing;
        this.pos.x += 0.2 * facing * (angle == 90 ? 1 : 0) + 0.4 * Math.cos(Math.PI * angle / 180)
        this.pos.y += 0.4 * Math.sin(Math.PI * angle / 180)
        this.vel.x = speedRatio * 1.0 / 60 * Math.cos(Math.PI * angle / 180)
        this.vel.y = speedRatio * 1.0 / 60 * Math.sin(Math.PI * angle / 180)
        this.angle = angle - 180 * (facing < 0 ? 1 : 0);
        if (shotDamage == 2)
            this.sprite = entityItemIds.Shot2;
        if (shotDamage >= 3)
            this.sprite = entityItemIds.Shot3;
        this.canFall = false;
        this.boundingBox = new Rect([7 / 16, 7 / 16, 2 / 16, 2 / 16]);
        this.shotDamage = shotDamage;
    }

    /**@type {Entity['update']} */
    update(game, millis) {
        let velx = this.vel.x;
        let vely = this.vel.y;
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)
        if (this.vel.x != velx || this.vel.y != vely) {
            this.dead = true;
        } else if (this.pos.x <= -1 || this.pos.x >= game.tiles.dimW) {
            this.dead = true;
        } else if (this.pos.y <= -1 || this.pos.y >= game.tiles.dimH) {
            this.dead = true;
        } else {
            let monsters;
            if (this.player.isPlayer) {
                monsters = game.monsters_with_other_players(this.player);
            } else {
                monsters = game.monsters_and_players(true, this.player);
            }
            // let monsters;
            // if(this.player.isPlayer) {
            //     monsters = monsters_with_other_players(this.player);
            // } else {
            //     monsters = game.activePlayers;
            // }
            for (let m of monsters) {
                if (!m.dead && this.bounds().collide(m.hitBounds())) {
                    m.hit(game, this.shotDamage);
                    this.dead = true;
                    break;
                }
            }
        }
    }
    /**@type {Entity['draw']} */
    draw(game) {
        if (this.sprite.length === 2) {
            game.sprites.entitiesItems.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0);
        }
    }

}

export class LiveGrenade extends Entity {
    /**
     * 
     * @param {Tile} tile 
     * @param {Player} player 
     * @param {number} damage 
     * @param {number} radius 
     * @param {number} facing 
     * @param {number} base_vel 
     */
    constructor(tile, player, damage = 3, radius = 2, facing = 1, base_vel = 1.0 / 80) {
        super(null, entityItemIds.LiveGrenade);
        this.boundingBox = new Rect([0.4, 0.4, 0.2, 0.2])
        this.player = player;
        this.pos = player.pos.add([facing * player.boundingBox.w * 0.75, 0]);
        let t = tile;
        if (!t.passable) { //Don't let player drop tiles inside of non-passable tiles
            if (facing > 0 && this.bounds().right > t.x) this.pos.x -= this.bounds().right - t.x;
            if (facing < 0 && this.bounds().x < t.right) this.pos.x += this.bounds().x - t.right;
        }
        this.facing = facing;
        this.vel = new Vec2([0, base_vel]);
        this.damage = damage;
        this.radius = radius;
        this.canFall = true;
        this.damage = damage;
        this.timer = 2000;
        this.elapsed = 0;
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        if (this.pos.y > game.dimW + 4) {
            this.dead = true;
            return;
        }
        let player = this.player;
        if (this.elapsed >= this.timer || player != null && !player.dead && player.oldControlStates['use']
            && !player.controlStates['use']) {
            if (this.elapsed < 250) { //cancel the attachment if player releases early
                this.player = null;
                return
            }
            let t0 = game.tiles.closestTile(this.bounds());
            if (t0 instanceof Void) {
                this.dead = true;
                return;
            }
            for (let t of game.tiles.iterRange(t0, this.radius)) {
                game.items.push(new Boom(t));
            }
            for (let p of game.monsters_and_players()) {
                let d = t0.dist(p.pos); //TODO: This doesn't necessarily align center of player with center of rocket (ideally update pos for grenade/rocket bounds to save on expensive calcs)
                if (d <= this.radius) {
                    d = Math.max(0.1, d);
                    p.hit(game, this.damage * (1 + (d <= 0.5 ? 1 : 0)));
                    p.stun(500 * this.damage);
                    let dx = p.pos.x - t0.x;
                    let dy = p.pos.y - (t0.y + 1);
                    let power = 1 / 1600 + (this.radius - d) / 3200;
                    p.vel.x += power * (dx / d);
                    p.vel.y += power * (dy / d);
                    p.falling = true;
                }
            }
            this.dead = true;
            game.playSound('boom');
            //TODO: base intensity on distance from EACH player
            for (let p of game.activePlayers) {
                if (!p.dead) {
                    p.controller.vibrate(0.5, 0.5, 250);
                }
            }
        }
        // if (this.falling)
        // this.vel.y = Math.min(1.0 / 50, this.vel.y + 1.0 / 3200 * millis / 15);
        // else
        this.vel.x *= 0.9 / (millis / 15); //slow with friction on the ground
        if (this.canFall) {
            this.falling = true;
            for (let t of game.tiles.contacters(this.bounds()))
                if (!t.passable && t.y == this.bounds().bottom) { //TODO: this should be some sort of tile-specific standing on class
                    this.falling = false;
                    break;
                }
        }
        let old_vely = this.vel.y;
        let old_velx = this.vel.x;
        //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)
        game.tiles.move(this, millis);
        if (this.vel.x == 0 && this.falling) this.vel.x = -old_velx / (2 * millis / 15);
        //stop if hitting a wall at slow speed
        if (Math.abs(this.vel.x) < 1.0 / 3200) this.vel.x = 0;
        //bounce unless going really slowly
        if (this.vel.y == 0 && old_vely > 1.0 / 3200) this.vel.y = -old_vely / (3 * millis / 15);
        if (this.pos.x <= -1 || this.pos.x >= game.tiles.dimW) this.vel.x = 0;
    }
}

export class ShotFrags extends Entity {
    //    game.items.push(new Pellets(player, this.shotDamage, angle, player.facing));
    //TODO: this is just a flash of a 4 tile square image that instantly damages everything in collides
    //TODO: draw the 4 tiles as a single image
    //TODO: collision detection for a conic blast
    constructor(player, shotDamage = 3, shotRange = 2, angle = 0, facing = 1) {
        super(null, entityItemIds.Frag);
        this.player = player;
        this.pos = new Vec2(player.pos);
        this.facing = facing;
        this.pos.x += 1 + 0.2 * facing * (angle == 90 ? 1 : 0); // + 0.5*Math.cos(Math.PI*angle/180);
        this.pos.y += -0.5; // + 0.5*Math.sin(Math.PI*angle/180);
        this.angle = angle - 180 * (facing < 0 ? 1 : 0);
        this.boundingBox = null;
        this.boundingBoxes = [this.rotatedBoundingBox([-0.5, 1], this.angle, this.facing < 0, [0.5, 1], [1, 1]),
        this.rotatedBoundingBox([-0.5, 1], this.angle, this.facing < 0, [1.5, 0.5], [1, 1]),
        this.rotatedBoundingBox([-0.5, 1], this.angle, this.facing < 0, [1.5, 1.5], [1, 1]),
        ];
        this.shotDamage = shotDamage;
        this.elapsed = 0;
        this.timer = 100;
    }

    /**@type {Entity['update']} */
    update(game, millis) {
        if (this.elapsed == 0) {
            let monsters = game.monsters_with_other_players(this.player);
            for (let m of monsters) {
                for (let b of this.boundingBoxes) {
                    if (!m.dead && this.bounds(this.pos, b).collide(m.hitBounds())) {
                        m.hit(game, this.shotDamage);
                        break;
                    }
                }
            }
        }
        //TODO: also damage walls
        this.elapsed += millis;
        if (this.elapsed < this.timer)
            return;
        this.dead = true;
    }
    /**@type {Entity['draw']} */
    draw(game) {
        if (this.sprite.length === 4) {
            game.sprites.entitiesItems.drawRotatedMultitile(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0, [-0.5, 1]);
        }
    }
}

export class LiveRocket extends Entity {
    //TODO: use the shot logic with a grenade/drone like boom on impact
    constructor(player, damage = 1, radius = 1, angle = 0, facing = 1, accelTime = 1000) {
        super(null, entityItemIds.LiveRocket);
        this.player = player;
        this.pos = new Vec2(player.pos);
        this.pos.x += 0.25 * Math.cos(Math.PI * angle / 180);
        this.pos.y += 0.25 * Math.sin(Math.PI * angle / 180);
        this.facing = facing;
        this.angle = angle;
        //        let a = this.facing>0?this.angle:this.angle+180;
        this.vel.x = this.vel.y = 0;
        this.x_inc = 1.0 / 720 * Math.cos(Math.PI * angle / 180);
        this.y_inc = 1.0 / 720 * Math.sin(Math.PI * angle / 180);
        this.canFall = false;
        this.damage = damage;
        this.radius = radius;
        this.boundingBox = new Rect([7 / 16, 7 / 16, 2 / 16, 2 / 16]);
        this.elapsed = 0;
        this.accelTime = 300;
    }

    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        if (this.elapsed <= this.accelTime) {
            this.vel.x += this.x_inc * (millis / 15);
            this.vel.y += this.y_inc * (millis / 15);
        }
        let old_velx = this.vel.x;
        let old_vely = this.vel.y;
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)
        if (this.pos.x <= -4 || this.pos.x >= 4 + game.tiles.dimW) {
            this.dead = true;
        } else if (this.pos.y <= -4 || this.pos.y >= 4 + game.tiles.dimH) {
            this.dead = true;
        } else {
            // check for a collision
            let collision = false;
            if (this.vel.x == 0 && old_velx != 0) collision = true;
            if (this.vel.y == 0 && old_vely != 0) collision = true;
            let monsters = game.monsters_with_other_players(this.player);
            for (let m of monsters) {
                if (m.hitBounds().collide(this.bounds())) {
                    collision = true;
                    break;
                }
            }

            // explodes on collision with a blast radius
            if (collision) {
                let t0 = game.tiles.closestTile(this.bounds());
                game.playSound('boomBig');
                //TODO: base intensity on distance from EACH player
                for (let p of game.activePlayers) {
                    if (!p.dead) {
                        p.controller.vibrate(1.0, 1.0, 350);
                    }
                }
                for (let t of game.tiles.iterRange(t0, this.radius)) {
                    game.items.push(new Boom(t));
                }
                for (let p of game.monsters_and_players()) {
                    let d = this.pos.dist(p.pos);
                    if (d <= this.radius) {
                        d = Math.max(0.1, d);
                        p.hit(game, this.damage * (1 + (d <= 0.5 ? 1 : 0)));
                        p.stun(500 * this.damage);
                        let dx = p.pos.x - this.pos.x;
                        let dy = p.pos.y - (this.pos.y + 1);
                        let power = 1 / 1600 + (this.radius - d) / 3200;
                        p.vel.x += power * (dx / d);
                        p.vel.y += power * (dy / d);
                        p.falling = true;
                    }
                }
                this.dead = true;
                return;
            }
        }
    }
    /**@type {Entity['draw']} */
    draw(game) {
        if (this.sprite.length === 2) {
            game.sprites.entitiesItems.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0);
        }
    }
}

export class LiveDrone extends Entity {
    constructor(player, invItem) {
        super(null, entityItemIds.Drone1);
        this.player = player;
        this.inventoryItem = invItem;
        this.pos = player.pos.add([player.facing * player.boundingBox.w * 0.75, 0]);
        this.facing = player.facing;
        this.vel = new Vec2([0, 0]);
        this.damage = invItem.damage;
        this.radius = invItem.radius;
        this.boundingBox = new Rect([0.4, 0.4, 0.2, 0.2])
        this.timer = invItem.flightTime;
        this.elapsed = 0;
        player.setState(player.states.driving);
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        let player = this.player
        // drone dies if
        // * out of bounds
        // * runs out of flight time
        // * player dies, exits level, releases use button
        if (player.activeState != player.states.driving) {
            this.dead = true;
            return;
        }
        if (this.elapsed > this.timer || !player.controlStates['use'] || player.dead
            || player.escaped || this.pos.y < -4 || this.pos.y > game.dimH + 4
            || this.pos.x < -4 || this.pos.x > game.dimW + 4) {
            this.inventoryItem.live = false;
            player.setState(player.states.falling);
            this.dead = true;
            return;
        }

        //TODO: Must immobilize player movement -- i.e., ignore player controls while drone is in flight
        // Control the drone
        if (player.controlStates['up']) {
            this.vel.y = Math.min(1.0 / 50, this.vel.y - 1.0 / 3200 * millis / 15);
        }
        if (player.controlStates['down']) {
            this.vel.y = Math.min(1.0 / 50, this.vel.y + 1.0 / 3200 * millis / 15);
        }
        if (player.controlStates['left']) {
            this.vel.x = Math.min(1.0 / 50, this.vel.x - 1.0 / 3200 * millis / 15);
        }
        if (player.controlStates['right']) {
            this.vel.x = Math.min(1.0 / 50, this.vel.x + 1.0 / 3200 * millis / 15);
        }
        //TODO: Maybe more fun if you can't stop it! Comment below out if so.
        if (!player.controlStates['left'] && !player.controlStates['right']
            && !player.controlStates['up'] && !player.controlStates['down']) {
            this.vel.x = this.vel.y = 0;
        }

        //TODO: check for collision with power pills/fuel cells and carry them

        //execute movement with collision detection
        let old_vely = this.vel.y;
        let old_velx = this.vel.x;
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)

        // check for a collision -- TODO: bounce if going slowly enough
        let collision = false;
        if (this.vel.x == 0 && old_velx != 0) collision = true;
        if (this.vel.y == 0 && old_vely != 0) collision = true;
        for (let m of game.monsters) {
            if (m.hitBounds().collide(this.bounds())) {
                collision = true;
                break;
            }
        }

        // explodes on collision with a blast radius
        if (collision) {
            let t0 = game.tiles.closestTile(this.bounds());
            for (let t of game.tiles.iterRange(t0, this.radius)) {
                game.items.push(new Boom(t));
            }
            for (let m of game.monsters_with_other_players(player)) {
                if (t0.dist(m.pos) <= this.radius) {
                    m.hit(game, this.damage);
                }
            }
            player.controller.vibrate(0.2, 0.2, 100);
            this.inventoryItem.live = false;
            this.inventoryItem.lastBuildTime = 0;
            this.dead = true;
            player.setState(player.states.falling);
            return;
        }
    }
    //TODO: Draw drone with a simple Drone1/Drone2 animation loop and left/right tilt with sideways motion
}

export class SaberStrike extends Entity {
    constructor(pos, facing, angle = 0) {
        super(null, entityItemIds.LiveVibroBlade);
        this.angle = angle;
        this.facing = facing;
        this.pos = new Vec2([pos.x + 0.75, pos.y]); // + 0.5 * Math.sin(Math.PI * angle / 180)
        this.angle -= facing < 0 ? 180 : 0;
        this.elapsed = 0;
        this.lifeTime = 100;
        //        this.boundingBox = new Rect([0,0.25,0.75,0.5])
        this.boundingBox = this.rotatedBoundingBox([-0.25, 0.5]);
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        this.elapsed += millis;
        // drone dies if
        // * out of bounds
        // * runs out of flight time
        // * player dies, exits level, releases use button
        if (this.elapsed > this.lifeTime) {
            this.dead = true;
        }
    }
    /**@type {Entity['draw']} */
    draw(game) {
        if (this.sprite.length === 2) {
            game.sprites.entitiesItems.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0, [-0.25, 0.5]);
        }
    }
}

export class Reticle extends Entity {
    constructor(player, aimable) {
        super(null, entityItemIds.Reticle);
        this.player = player;
        this.aimable = aimable;
        let angle = aimable.angle;
        this.pos = new Vec2([player.pos.x + Math.cos(Math.PI * angle / 180),
        player.pos.y + Math.sin(Math.PI * angle / 180)])
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        if (!this.player.aiming) {
            this.dead = true;
            return;
        }
        let player = this.player;
        let angle = this.aimable.angle;
        this.pos = new Vec2([player.pos.x + Math.cos(Math.PI * angle / 180),
        player.pos.y + Math.sin(Math.PI * angle / 180)])
    }
}


export class TrapBlade extends Entity {
    constructor(platform) {
        super(null, entityItemIds.TrapBlade);
        this.platform = platform;
        this.triggered = false;
        if (platform.type == 'static') {
            this.pos = new Vec2(this.platform.shift([0, -1]));
        } else {
            this.pos = new Vec2(this.platform);
        }
        this.facing = 1// 2*(terminal1.pos.x < terminal2.pos.x) - 1;
        this.boundingBox = new Rect([0.125, 0.25, 0.75, 0.75]);
        this.elapsed = 0;
    }
    /**@type {Entity['update']} */
    update(game, millis) {
        let plat = this.platform;
        if (game.tiles.at(plat.pos) != plat) {
            this.dead = true;
        }
        this.elapsed += millis;
        if (plat.type == 'contact') {
            if (this.pos.y == plat.y && this.vel.y == 0) {
                for (let pl of game.activePlayers) {
                    if (pl.bounds().collide(game.tiles.at(plat).shift([0, -1]))) {
                        this.vel.y = -1.0 / plat.extendTime;
                        this.elapsed = 0;
                        break;
                    }
                }
            } else if (this.pos.y == plat.y - 1 && this.elapsed >= plat.extendedTime) {
                this.vel.y = 1.0 / plat.extendTime;
                this.elapsed = 0;
            }
        } else if (plat.type == 'cycling') {
            if (this.pos.y == plat.y - 1 && this.elapsed >= plat.extendedTime) {
                this.vel.y = 1.0 / plat.extendTime;
                this.elapsed = 0;
            }
            if (this.pos.y == plat.y && this.elapsed >= plat.retractedTime) {
                this.vel.y = -1.0 / plat.extendTime;
                this.elapsed = 0;
            }

        }
        for (let pl of game.monsters_and_players()) {
            if (this.bounds().collide(pl.bounds())) {
                pl.hit(plat.damage, 1);
                if (!pl.isPlayer) {
                    pl.stun(500);
                }
            }
        }
        let vel = this.elapsed > plat.contactDelay || plat.type !== 'contact' ? this.vel.y : 0;
        this.pos.y = Math.min(Math.max(this.pos.y + vel * millis, plat.y - 1), plat.y);
        if (this.pos.y == plat.y - 1 && this.vel.y < 0 || this.pos.y == plat.y && this.vel.y > 0) {
            this.vel.y = 0;
        }
    }
    /**
     * 
     * @param {Game} game 
     */
    drawAsTile(game) {
        if (this.sprite.length === 2) {
            game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        }
    }
    /**@type {Entity['draw']} */
    draw(game) {
    }
}
