//@ts-check

import { randomRange, Rect, Timer, Vec2 } from "./util";
import { baseSetIds, bigSetIds, monsterRowLocIds } from "./sprites";
import { Tile, Void, Wall } from "./tile";
import { Entity } from "./entity";
import { CrabShot, FlakShot } from "./entity_items";
/**@typedef {import('./game').Game} Game */

export class Monster extends Entity {
    /**
     * 
     * @param {Tile} tile 
     * @param {[number,number]|[number,number,number,number]} sprite 
     * @param {number} hp 
     */
    constructor(tile, sprite, hp = 1) {
        super(tile, sprite);
        /**@type {number}*/
        this.hp = hp;
        /**@type {number}*/
        this.maxHp = hp;
        /**@type {number}*/
        this.facing = randomRange(0, 1) * 2 - 1;
        /**@type {number}*/
        this.topSpeed = 1.0 / 600;
        /**@type {number}*/
        this.jumpSpeed = 1.0 / 350;
        /**@type {number}*/
        this.maxFallSpeed = 1.0 / 50;
        /**@type {number}*/
        this.hitDamage = 1.0;
        /**@type {number}*/
        this.spawnTimer = 1000;
        /**@type {number}*/
        this.spawnElapsed = 0.0;
        /**@type {Timer}*/
        this.stunTimer = new Timer(0, 0);
        /**@type {Timer}*/
        this.hitTimer = new Timer(0, 0);
        /**@type {Rect}*/
        this.boundingBox = new Rect([0.25, 0.5, 0.5, 0.5]);
        /**@type {Rect}*/
        this.hitBox = new Rect([0.25, 0.2, 0.5, 0.8])
        /**@type {boolean}*/
        this.drone = false;
        /**@type {boolean}*/
        this.climbing = false;
        /**@type {boolean}*/
        this.falling = false; //spawn in falling so it doesn't get stuck on ladders etc
        /**@type {boolean}*/
        this.dying = false;
        /**@type {number}*/
        this.intelLevel = 1;
        /**@type {number}*/
        this.elevation = 0;
        /**@type {string}*/
        this.stance = 'aggressive' //passive, aggressive, targeting, perhaps other options
    }
    getDisplayY() {
        return super.getDisplayY() - this.elevation;
    }

    /**
     * 
     * @param {Game} game 
     */
    draw(game) {
        game.sprites.monsters.draw([this.dying ? 1 : 0, this.sprite[1]], this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        if (!this.hitTimer.finished()) {
            if (baseSetIds.Strike.length === 2) {
                game.sprites.entitiesItems.draw(baseSetIds.Strike, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
            }
        }
    }

    /**
     * 
     * @param {Game} game 
     */
    die(game) {
        this.stun();
        this.dying = true;
    }

    /**
     * 
     * @param {Game} game 
     * @returns 
     */
    death(game) {
        this.dead = true;
        if (!this.isPlayer) {
            let t = game.tiles.closestTile(this.bounds());
            if (t instanceof Void) return;
            game.addChips(t, 1);
        }

    }

    heal(damage) {
        this.hp = Math.min(this.maxHp, this.hp + damage);
    }

    tile_pos() {
        return new Vec2([Math.round(this.pos.x), Math.ceil(this.pos.y)]);
    }

    stun(time = 2000) {
        if (!this.dying) {
            this.stunTimer.reset(time);
        }
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @returns 
     */
    update(game, millis) {
        this.spawnElapsed += millis;
        // this.oldFalling = new Vec2(this.falling);
        if (this.spawnElapsed < this.spawnTimer)
            return;

        this.hitTimer.tick(millis);
        this.stunTimer.tick(millis);
        let stunned = !this.stunTimer.finished();
        if (!stunned) {
            if (this.dying) {
                this.death(game);
                return;
            }
        }
        if (this.dying) {
            this.vel = this.vel.scale(0.9**(millis/15));
        }

        // //Targeting
        // if (!stunned && !this.drone) {
        //     if (this.stance == 'targeting') {
        //         let npl, npd;
        //         [npl, npd] = game.nearestPlayer(this.pos);
        //         if (npl != null) {
        //             let dx = Math.abs(npl.pos.x - this.pos.x);
        //             let dy = Math.abs(npl.pos.y - this.pos.y);
        //             if (dx >= 2 && dy <= 1.5) {
        //                 this.facing = this.pos.x < npl.pos.x ? 1 : -1;
        //             }
        //             else if (!this.falling && this.vel.x == 0) {
        //                 this.facing = -this.facing;
        //             }
        //         }
        //     }
        //     else if (!this.falling && this.vel.x == 0) { //hit an obstacle turn around
        //         // this.facing = -this.facing;
        //     }
        //     if (!this.falling || Math.abs(this.vel.x) < this.topSpeed) {
        //         this.vel.x = this.facing * this.topSpeed;
        //     }
        // }
        //Slow down if stunned and not falling
        if (stunned && !this.drone && !this.falling) {
            this.vel.x /= 1.5 * millis / 15;
        }

        // //Core movement logic
        // if (!stunned && !this.drone && game.levelTime > 0 && !this.falling) {
        //     let b = this.bounds();
        //     let p;
        //     p = game.tiles.closestPos(this.pos.add([0, 0]));
        //     let p0 = p.add([0, 1]);
        //     let p1 = p0.add([this.facing, 0]);
        //     let p2 = p;
        //     let p3 = p2.add([this.facing, 0]);
        //     if ((this.facing * (this.pos.x - p.x) <= 0) && !(game.tiles.at(p0).standable)) { //about to fall
        //         if (this.intelLevel > 1 && game.tiles.at(p2).passable && game.tiles.at(p3).passable && game.tiles.at(p1) instanceof Wall) { //clear to jump
        //             this.vel.y = -1.0 / 400;
        //             this.vel.x = this.facing * this.jumpSpeed;
        //         } else {
        //             let p4 = p0.add([0, 1]);
        //             if (this.stance == 'targeting') {
        //                 let [pl, d] = game.nearestPlayer(this.pos);
        //                 if (pl != null && pl.pos.y > this.pos.y) {
        //                     if (game.tiles.at(p4).passable && game.tiles.below(p4).tile.passable) {
        //                         this.vel.x = 0;
        //                     }
        //                 }
        //             }
        //             else if (game.tiles.at(p4).passable) {//stop so I don't fall if there is more than a one tile drop
        //                 this.vel.x = 0;
        //             }
        //         }
        //     } else { //jump up
        //         let p3 = p.add([this.facing, 0]); //tile in front
        //         let p4 = p.add([0, -1]); //tile above
        //         let p5 = p4.add([this.facing, 0]); //tile in front of tile above
        //         if (this.stance == 'targeting') {
        //             let [pl, d] = game.nearestPlayer(this.pos);
        //             if (pl !== null && pl.pos.y < this.pos.y) { //jump up to player
        //                 if (!game.tiles.at(p3).passable && game.tiles.at(p5).passable && game.tiles.rightOf(p5).tile.passable) {
        //                     this.vel.y = -1.0 / 200;
        //                     this.vel.x = this.facing * this.jumpSpeed;
        //                 }
        //             }
        //             else if (((this.facing < 0) && (this.pos.x <= p.x) || (this.facing > 0) && (this.pos.x >= p.x))
        //                 && !game.tiles.at(p3).passable && game.tiles.at(p4).passable && game.tiles.at(p5).passable) {
        //                 this.vel.y = -1.0 / 200;
        //                 this.vel.x = this.facing * this.jumpSpeed;
        //             }
        //         }
        //         else if (((this.facing < 0) && (this.pos.x <= p.x) || (this.facing > 0) && (this.pos.x >= p.x))
        //             && !game.tiles.at(p3).passable && game.tiles.at(p4).passable && game.tiles.at(p5).passable) {
        //             this.vel.y = -1.0 / 200;
        //             this.vel.x = this.facing * this.jumpSpeed;
        //         }

        //     }
        // }

        //Fall/Apply gravity
        // check falling -- monster falls unless in contact with a block below them
        if (this.canFall) {
            // if(this.falling)
            //     this.vel.y = Math.min(this.maxFallSpeed, this.vel.y + 1.0/4800*millis/15);
            // this.falling = true;
            // for(let t of game.tiles.contacters(this.bounds()))
            //     if(t.standable && t.y==this.bounds().bottom) { //TODO: this should be some sort of tile-specific standing on class
            //         this.falling=false;
            //         break;
            //     }
        }

        game.tiles.move(this, millis); //TODO: handle large moves that step beyond one space

        //Hit player
        if (!stunned) {
            for (let player of game.activePlayers)
                if (player.hitBounds().collide(this.bounds())) {
                    player.hitFrom(game, this.pos, this.hitDamage, this.hitDamage);
                    player.stun(500 * this.hitDamage);
                }
        }

        if (this.pos.y > game.tiles.dimH) {
            this.die(game);
        }

    }

    /**
     * 
     * @param {Game} game
     * @param {Vec2} pos 
     * @param {number} damage 
     * @param {number} knockbackScale 
     */
    hitFrom(game, pos, damage, knockbackScale = 0) {
        //TODO: eventually need to add type of damage
        //        if(this.shield>0){           
        //            return;                                                             
        //        }
        this.hp -= damage;
        if (damage > 0) this.hitTimer.reset(200);
        if (this.hp <= 0) this.die(game);

        const dist = this.pos.dist(pos);
        if (dist > 0) {
            const delta = this.pos.add(pos.scale(-1)).scale(1 / dist);

            this.vel.x = knockbackScale * 1.0 / 200 * delta[0];
            this.vel.y = knockbackScale * 1.0 / 200 * delta[1];
        }
        this.falling = true;
        //TODO: Move this to player
        //         if(this instanceof Player){
        //             game.playSound("hit1");                                              
        //             this.controller.vibrate(0.5,0.5,100);
        //         }else{
        // //            this.stance = 'aggressive'                                                       
        //             game.playSound("hit2");                                              
        //         }
    }

    tile_collide(tile) {
        return tile.bounds.collide(this.bounds());
    }

    monster_collide(monster) {
        return monster.bounds.collide(this.bounds());
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     * @returns 
     */
    fallCheck(game, millis) {
        // check falling -- monsters is falling unless they are in contact with a block below them
        // let isFalling = true;
        // for(let t of game.tiles.contacters(this.bounds())) {
        //     if(t.standable && this.vel.y>=0 && t.y==this.bounds().bottom && game.tiles.above(t).passable) { //TODO: this should be some sort of tile-specific standing on class
        //         isFalling=t.stoodOnBy(this, this.lastVel);
        //         break;
        //     }
        // }
        // return isFalling;
        return false;
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} radius 
     */
    fallBoom(game, radius) {
        this.die(game);
        game.playSound('boom');
        for (let t of game.tiles.iterRange(game.tiles.closestPos(this.pos), radius)) {
            if (!(t instanceof Wall)) {
                game.addBoom(t, 0.5);
            }
        }
        for (let m of game.monsters) {
            if (this.pos.dist(m.pos) <= radius) {
                m.hitFrom(game, this.pos, this.hitDamage * 3);
            }
        }
        for (let player of game.activePlayers) {
            if (this.pos.dist(player.pos) <= radius) {
                player.hitFrom(game, this.pos, this.hitDamage * 3);
            }
        }
    }
}

export class Oarstrong extends Monster {
    constructor(tile) {
        super(tile, [0,monsterRowLocIds.OneEye], 1);
        this.hp = 10;
        this.topSpeed = 0.5 * this.topSpeed;
        this.fallOrigin = null;
        /**@type {Vec2} */
        this.leapDestination = new Vec2([0,0]);
        /**@type {Timer} */
        this.attackTimer = new Timer(10000, Math.random()*5000);
        /**@type {'passive'|'preLeap'|'leap'|'postLeap'} */
        this.stance = 'passive';
        this.immune = true;
    }
    /** @type {Monster['draw']} */
    draw(game) {
        if (this.dead) {
            return;
        } 
        game.sprites.base.drawRotatedMultitile(bigSetIds.OarstrongShadow, this.getDisplayX()+0.5, this.getDisplayY()+2.25+this.elevation, 0, this.getFlipped());
        if (this.stance === 'passive') {
            game.sprites.base.drawRotatedMultitile(bigSetIds.Oarstrong1, this.getDisplayX(), this.getDisplayY(), 0, this.getFlipped());
        } else if (this.stance === 'preLeap') {
            game.sprites.base.drawRotatedMultitile(bigSetIds.Oarstrong3, this.getDisplayX(), this.getDisplayY(), 0, this.getFlipped());
        } else if (this.stance === 'leap') {
            game.sprites.base.drawRotatedMultitile(bigSetIds.Oarstrong1, this.getDisplayX(), this.getDisplayY(), 0, this.getFlipped());
        } else if (this.stance === 'postLeap') {
            game.sprites.base.drawRotatedMultitile(bigSetIds.Oarstrong2, this.getDisplayX(), this.getDisplayY(), 0, this.getFlipped());
        }
    }
    /** @type {Monster['update']} */
    update(game, millis) {
        super.update(game, millis);
        if (this.dead) return;
        if (this.stance==='passive') {
            this.attackTimer.tick(millis);
            if (this.attackTimer.finished()) {
                this.immune = true;
                this.stance = 'preLeap';
                this.attackTimer.reset(1000);
            }
        } else if (this.stance==='preLeap') {
            this.attackTimer.tick(millis);
            if (this.attackTimer.finished()) {
                this.stance = 'leap';
                this.attackTimer.reset(1000);
                const [player, id] = game.nearestPlayer(this.pos);
                if (player!==null) {
                    const dist = player.pos.dist(this.pos);
                    if (dist<=10) {
                        this.leapDestination = new Vec2(player.pos);
                    } else {
                        this.leapDestination = this.pos.add(player.pos.subtract(this.pos).scale(10/dist));
                    }
                    this.vel = this.leapDestination.subtract(this.pos).scale(10/dist/1000);
                    this.attackTimer.reset(1000*10/dist);
                }
            }
        } else if (this.stance==='leap') {
            this.attackTimer.tick(millis);
            const frac = this.attackTimer.elapsed/this.attackTimer.timer;
            const h = 2
            this.elevation = -4 * h * frac * frac + 4 * h * frac;
            if (this.vel.dist([0,0])<=0.0001 || this.pos.dist(this.leapDestination)<=0.1 || this.attackTimer.finished()) {
                this.vel = new Vec2([0,0]);
                this.stance = 'postLeap';
                this.attackTimer.reset(1000);
                this.elevation = 0;
            }
        } else if (this.stance==='postLeap') {
            this.attackTimer.tick(millis);
            if (this.attackTimer.finished()) {
                this.immune = false;
                this.stance = 'passive';
                this.attackTimer.reset(5000);
                this.vel = new Vec2([0,0]);
            }
        }
    }
}

export class Jelly extends Monster {
    constructor(tile) {
        super(tile, [0,monsterRowLocIds.OneEye], 1);
        this.hp = 1;
        this.topSpeed = 0.5 * this.topSpeed;
        this.fallOrigin = null;
        this.stance = 'passive'
    }
    /** @type {Monster['draw']} */
    draw(game) {
        if (baseSetIds.Jelly.length === 2) {
            game.sprites.base.draw(baseSetIds.Jelly, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        }
        if (!this.hitTimer.finished()) {
            if (baseSetIds.Slash.length === 2) {
                game.sprites.base.draw(baseSetIds.Slash, this.getDisplayX(), this.getDisplayY(), this.getFlipped())
            }
        }
    }

    /** @type {Monster['update']} */
    update(game, millis) {
        super.update(game, millis);
    }
}


export class Crabby extends Monster {
    constructor(tile) {
        super(tile, [0,monsterRowLocIds.OneEye], 1);
        this.hp = 1;
        this.topSpeed = 0.5 * this.topSpeed;
        this.fallOrigin = null;
        this.stance = 'passive'
        this.launchTimer = new Timer(10000, Math.random()*5000);
        this.launching = 0;
    }
    /** @type {Monster['draw']} */
    draw(game) {
        if (baseSetIds.Crab.length === 2) {
            game.sprites.base.draw(baseSetIds.Crab, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        }
    }

    /** @type {Monster['update']} */
    update(game, millis) {
        super.update(game, millis);
        if (this.dead) return;
        this.launchTimer.tick(millis);
        if (this.launchTimer.finished()) {
            if(this.launching<=2) {
                this.launchTimer.reset(500);
                const player = game.activePlayers[0];
                const [dx, dy] = this.pos.scale(-1).add(player.pos);
                let angle = Math.atan2(dy, dx)*180/Math.PI;
                angle = Math.round(angle/45)*45
                game.items.push(new CrabShot(game.tiles.at(this.tile_pos()), null, angle));
            } else {
                this.launching = 0;
                this.launchTimer.reset(2000-0*Math.random())
            }
            this.launching++;
        }
    }
}

export class FlakBomb extends Monster {
    constructor(tile) {
        super(tile, [0,monsterRowLocIds.OneEye], 1);
        this.hp = 10;
        this.topSpeed = 0.5 * this.topSpeed;
        this.fallOrigin = null;
        this.stance = 'passive'
        this.launchTimer = new Timer(250);
        this.launching = 0;
        this.firingAngle = 0;
        this.hitDamage = 0;
        this.spawnTimer = 0;
    }
    /** @type {Monster['draw']} */
    draw(game) {
        if (bigSetIds.FlakBomb.length === 4) {
            game.sprites.base.drawRotatedMultitile(bigSetIds.FlakBomb, this.getDisplayX(), this.getDisplayY(), 0, this.getFlipped());
        }
    }

    /** @type {Monster['stun']} */
    stun(time = 2000) {
    }

    /** @type {Monster['update']} */
    update(game, millis) {
        super.update(game, millis);
        if (this.dead) return;


        this.firingAngle += millis/15;
        if (this.firingAngle >= 360) this.firingAngle = 0;
        this.launchTimer.tick(millis);
        if (this.launchTimer.finished()) {
            game.items.push(new FlakShot(game.tiles.at(this.tile_pos()), null, this.firingAngle));
            this.launchTimer.reset();
        }
    }

    /**
     * 
     * @param {Game} game
     * @param {Vec2} pos 
     * @param {number} damage 
     * @param {number} knockbackScale 
     */
    hitFrom(game, pos, damage, knockbackScale = 0) {
        this.hp -= damage;
        if (damage > 0) this.hitTimer.reset(200);
        if (this.hp <= 0) this.die(game);
    }

}

