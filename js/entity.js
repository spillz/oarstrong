class Entity {
    constructor(tile, sprite) {
        this.move(tile);
        this.isPlayer = false;
        this.sprite = sprite;
        this.vel = new Vec2([0, 0]);
        this.size = new Vec2([1, 1]);
        this.boundingBox = new Rect([0.25, 0.25, 0.5, 0.75]);
        this.hitBox = new Rect(this.boundingBox);
        this.facing = 1;
        this.falling = false;
        this.canFall = true;
        this.dead = false; //flag for removal
        this.oldPos = new Vec2(this.pos);
        this.oldVel = new Vec2(this.vel);

    }

    move(pos) {
        if (pos != null) {
            this.pos = new Vec2([pos[0], pos[1]]);
        }
        else {
            this.pos = new Vec2([-1, -1]);
        }
    }

    rotatedBoundingBox(rotatePt=null, angle = null, flipped = null, center=null, size=null) {
        //Rotates a bounding box to account for angle and flip of a sprite
        // angle -- amount of rotation in degrees (relative the the orientation 0 = right if not flipped, or left if flipped)
        // flipped -- true if sprite is flipped on x axis
        // rotatePt -- coordinates around which image is rotated (defaults to center of sprite)
        // center -- coordinates of the center of the bounding box to be rotated (defaults to center of this.boundingBox)
        // size -- size of the final bounding box (defaults to size of this.bound_box)
        flipped = flipped==null? this.getFlipped():flipped;
        angle = angle==null? this.angle:angle;
        if(rotatePt==null) {
            rotatePt = this.sprite.length==2? [0.5,0.5] : [0.5*this.sprite[2], 0.5*this.sprite[3]];
        }
        if(center==null) {
            center = [this.boundingBox[0]+this.boundingBox[2]/2, this.boundingBox[1]+this.boundingBox[3]/2];
        }
        if(size==null) {
            size = this.boundingBox.slice(2,4);
        }

        let dx = (center[0]-rotatePt[0])*(1-2*flipped);
        let dy = center[1]-rotatePt[1]; //TODO: Handle flipping?
        let c = Math.cos(angle/180*Math.PI);
        let s = Math.sin(angle/180*Math.PI);
        //Coordinates for the original upper left and low right points of the rect after rotation
        let adx = -(dx - dx*c + dy*s);
        let ady = -(dy - dx*s - dy*c);
        // Returns the rect with dimensions size, centered at the rotated center point.
        return new Rect([(center[0]-rotatePt[0])*(1-2*flipped)+rotatePt[0]+adx-size[0]/2, center[1]+ady-size[1]/2, size[0], size[1]]);

    }

    bounds(pos = null, bb=null) {
        if (pos == null) {
            pos = this.pos;
        }
        if (bb == null) {
            bb = this.boundingBox!=null? this.boundingBox: this.boundingBoxes[0];
        }
        return new Rect([pos[0] + bb[0], pos[1] + bb[1], bb[2], bb[3]]);
    }

    hitBounds(pos = null) {
        if (pos == null)
            pos = this.pos;
        return new Rect([pos[0] + this.hitBox[0], pos[1] + this.hitBox[1], this.hitBox[2], this.hitBox[3]]);
    }

    getDisplayX() {
        return this.pos.x;
    }

    getDisplayY() {
        return this.pos.y;
    }

    getFlipped() {
        return this.facing == -1;
    }

    draw() {
        game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
    }

    draw_bounds() {
        if(this.boundingBox !=null) {
            let r = this.bounds(this.pos, this.boundingBox);
            r[0] = r[0] * game.tileSize + game.shakeX + game.gameOffsetX;
            r[1] = r[1] * game.tileSize + game.shakeY + game.gameOffsetY;
            r[2] = r[2] * game.tileSize;
            r[3] = r[3] * game.tileSize;
            game.ctx.beginPath();
            game.ctx.lineWidth = game.tileSize / 16;
            game.ctx.strokeStyle = '#BAC3D9';
            game.ctx.rect(r[0], r[1], r[2], r[3]);
            game.ctx.stroke();
        }
        else {
            for(let b of this.boundingBoxes) {
                let r = this.bounds(this.pos, b);
                r[0] = r[0] * game.tileSize + game.shakeX + game.gameOffsetX;
                r[1] = r[1] * game.tileSize + game.shakeY + game.gameOffsetY;
                r[2] = r[2] * game.tileSize;
                r[3] = r[3] * game.tileSize;
                game.ctx.beginPath();
                game.ctx.lineWidth = game.tileSize / 16;
                game.ctx.strokeStyle = '#BAC3D9';
                game.ctx.rect(r[0], r[1], r[2], r[3]);
                game.ctx.stroke();
            }
        }

    }

    entityInteract(entity, action) {
    }

    entityCollide(entity) {
    }

    update(millis) {
    }

}

class Treasure extends Entity {
    constructor(tile) {
        super(tile, entityItemIds.Energy)
        this.pos
    }

    entityCollide(entity) {
        if (game.competitiveMode) {
            if (entity.isPlayer)
                entity.score += 1;
        } else {
            game.score++;
            game.cellsCollected++;
            entity.selectedTimer.reset(500);
            entity.selectedSprite = entityItemIds.Energy;
        }
        game.playSound("pickup1");
        this.dead = true;
    }

    // entityInteract(entity, action) {
    //     if (!this.dead) {
    //         game.score++;
    //         game.cellsCollected++;
    //         game.playSound("pickup1");
    //         this.dead = true;
    //     }
    // }
}

class Chips extends Entity {
    constructor(tile, value = 1) {
        super(tile, entityItemIds.Chips);
        this.value = value;
    }

    entityCollide(entity) {
        if (game.competitiveMode) {
            if (entity.isPlayer)
                entity.score += 0.2;
        } else {
            game.score++;
        }
        game.playSound("pickup2");
        let inv = entity.inventory.activeItem()
        entity.selectedTimer.reset(500);
        entity.selectedSprite = inv.sprite;
        entity.chips += this.value;
        this.dead = true;
    }

    entityInteract(entity, action) {
        if (!this.dead) {
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

class DeadPlayer extends Entity {
    constructor(player) {
        super(game.tiles.closestTile(player.bounds()), new Vec2([1, player.sprite]));
        this.elapsed = 0;
        this.timer = 3000;
    }
    update(millis) {
        this.elapsed += millis;
        if(this.elapsed>this.timer) this.dead = true;
        //todo: inherit player momentum, apply gravity (Or just use the player class and a drop timer)
    }
    draw() {
        game.sprites.players.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
    }
}

class Key extends Entity {
    constructor(tile, lockTile) {
        super(tile, entityItemIds.Key);
        this.lockTile = lockTile;
    }

    entityCollide(entity) {
        game.playSound("pickup2");
        this.lockTile.locked = false;
        this.dead = true;
    }
}

class DelayedSound extends Entity {
    constructor(sound, delay) {
        super(null, null);
        this.sound = sound;
        this.delay = delay;
        this.elapsed = 0;
    }
    update(millis) {
        this.elapsed += millis;
        if (this.elapsed > this.delay) {
            game.playSound(this.sound);
            this.dead = true;
        }
    }
    draw() {
    }
}


class BootsPickup extends Entity {
    constructor(pos, bootType) {
        bootSprites = { 0: entityItemIds.Boot1, 1: entityItemIds.Boot2, 2: entityItemIds.Boot3, 3: entityItemIds.Boot3 };
        super(tile, bootSprites[bootType]);
        this.bootType = bootType;
    }
    entityCollide(entity) {
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

class UpgradePickup extends Entity {
    constructor(pos, upgradeType) {
        upgradeSprites = { 0: entityItemIds.Pickup1, 1: entityItemIds.Pickup2 };
        super(tile, upgradeSprites[upgradeType]);
        this.upgradeType = upgradeType;
    }

    entityCollide(entity) {
        if (entity.isPlayer) {
            game.playSound("pickup2");
            entity.inventory.activeItem().upgrade(this.upgradeType)
            this.dead = true;
        }
    }
}


class MonsterBoom extends Entity {
    constructor(monster, player, timer = 250, facing) {
        super(null, -1)
        this.player = player;
        monster.vel.x = facing * Math.abs(monster.topSpeed * 5);
        monster.facing = facing;
        monster.drone = true;
        this.monster = monster;
        this.elapsed = 0;
        this.timer = timer;
        this.damage = monster.hp + 1;
    }

    draw() {
    }

    update(millis) {
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
                    m.hit(this.damage);
            for (let player of game.activePlayers)
                if (player.hitBounds().collide(bigRect))
                    player.hit(this.damage);
            this.dead = true;
            game.playSound('boom');
            //TODO: base intensity on distance from EACH player
            for(let p of game.activePlayers) {
                if(!p.dead) {
                    p.controller.vibrate(0.5,0.5,250);
                }
            }
        }
    }

}

class Boom extends Entity {
    constructor(tile, timer = 250) {
        super(tile, entityItemIds.Boom);
        this.timer = timer;
        this.elapsed = 0;
    }
    update(millis) {
        this.elapsed += millis;
        if (this.elapsed >= this.timer) {
            this.dead = true;
            let t = game.tiles.at(this.pos);
            if (!(t instanceof Floor || t instanceof Kiosk || t instanceof Exit))
                t.replace(Floor);
        }
    }
}

class Shot extends Entity {
    constructor(player, shotDamage = 1, angle = 0, facing = 1, speedRatio=1.0, pos=null) {
        super(null, entityItemIds.Shot1);
        this.player = player;
        this.pos = pos==null? new Vec2(player.pos):new Vec2(pos);
        this.facing = facing;
        this.pos.x += 0.2 * facing * (angle == 90) + 0.4 * Math.cos(Math.PI * angle / 180)
        this.pos.y += 0.4 * Math.sin(Math.PI * angle / 180)
        this.vel.x = speedRatio * 1.0 / 60 * Math.cos(Math.PI * angle / 180)
        this.vel.y = speedRatio * 1.0 / 60 * Math.sin(Math.PI * angle / 180)
        this.angle = angle - 180 * (facing < 0);
        if (shotDamage == 2)
            this.sprite = entityItemIds.Shot2;
        if (shotDamage >= 3)
            this.sprite = entityItemIds.Shot3;
        this.canFall = false;
        this.boundingBox = new Rect([7 / 16, 7 / 16, 2 / 16, 2 / 16]);
        this.shotDamage = shotDamage;
    }

    update(millis) {
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
            if(this.player.isPlayer) {
                monsters = monsters_with_other_players(this.player);
            } else {
                monsters = monsters_and_players(true, this.player);
            }
            // let monsters;
            // if(this.player.isPlayer) {
            //     monsters = monsters_with_other_players(this.player);
            // } else {
            //     monsters = game.activePlayers;
            // }
            for (let m of monsters) {
                if (!m.dead && this.bounds().collide(m.hitBounds())) {
                    m.hit(this.shotDamage);
                    this.dead = true;
                    break;
                }
            }
    }
    }
    draw() {
        game.sprites.entitiesItems.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0);
    }

}

class LiveGrenade extends Entity {
    constructor(player, damage = 3, radius = 2, facing = 1, base_vel = 1.0/80) {
        super(null, entityItemIds.LiveGrenade);
        this.boundingBox = new Rect([0.4, 0.4, 0.2, 0.2])
        this.player = player;
        this.pos = player.pos.add([facing * player.boundingBox.w * 0.75, 0]);
        let t = game.tiles.closestTile(this.bounds());
        if(!t.passable) { //Don't let player drop tiles inside of non-passable tiles
            if(facing>0 && this.bounds().right > t.x)
                this.pos.x -= this.bounds().right - t.x;
            if(facing<0 && this.bounds().x < t.right)
                this.pos.x += this.bounds().x - t.right;
        }
        this.facing = facing;
        this.vel = base_vel;
        this.damage = damage;
        this.radius = radius;
        this.canFall = true;
        this.damage = damage;
        this.timer = 2000;
        this.elapsed = 0;
    }
    update(millis) {
        this.elapsed += millis;
        if (this.pos.y > game.dimW + 4) {
            this.dead = true;
            return;
        }
        let player = this.player;
        if (this.elapsed >= this.timer || player != null && !player.dead && player.oldControlStates['use'] && !player.controlStates['use']) {
            if (this.elapsed < 250) { //cancel the attachment if player releases early
                this.player = null;
                return
            }
            let t0 = game.tiles.closestTile(this.bounds());
            if (t0 instanceof Void) {
                this.dead = true;
                return;
            }
            for (let t of game.tiles.iterRange(t0, this.radius))
                game.items.push(new Boom(t));
            for (let p of monsters_and_players()) {
                let d = t0.dist(p.pos); //TODO: This doesn't necessarily align center of player with center of rocket (ideally update pos for grenade/rocket bounds to save on expensive calcs)
                if (d <= this.radius) {
                    d = Math.max(0.1,d);
                    p.hit(this.damage*(1+(d<=0.5)));
                    p.stun(500*this.damage);
                    let dx = p.pos.x - t0.x;
                    let dy = p.pos.y - (t0.y + 1);
                    let power = 1/1600 + (this.radius-d)/3200;
                    p.vel.x += power*(dx/d);
                    p.vel.y += power*(dy/d);
                    p.falling = true;
                }
            }
            this.dead = true;
            game.playSound('boom');
            //TODO: base intensity on distance from EACH player
            for(let p of game.activePlayers) {
                if(!p.dead) {
                    p.controller.vibrate(0.5,0.5,250);
                }
            }
        }
        // if (this.falling)
            // this.vel.y = Math.min(1.0 / 50, this.vel.y + 1.0 / 3200 * millis / 15);
        // else
        this.vel.x *= 0.9/(millis/15); //slow with friction on the ground
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
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)
        if (this.vel.x == 0 && this.falling)
            this.vel.x = -old_velx / (2*millis/15);
        if (Math.abs(this.vel.x) < 1.0 / 3200) //stop if hitting a wall at slow speed
            this.vel.x = 0;
        if (this.vel.y == 0 && old_vely > 1.0 / 3200) //bounce unless going really slowly
            this.vel.y = -old_vely / (3*millis/15);
        if (this.pos.x <= -1 || this.pos.x >= game.tiles.dimW)
            this.vel.x = 0;
    }
}

class ShotFrags extends Entity {
    //    game.items.push(new Pellets(player, this.shotDamage, angle, player.facing));
    //TODO: this is just a flash of a 4 tile square image that instantly damages everything in collides
    //TODO: draw the 4 tiles as a single image
    //TODO: collision detection for a conic blast
    constructor(player, shotDamage = 3, shotRange = 2, angle = 0, facing = 1) {
        super(null, entityItemIds.Frag);
        this.player = player;
        this.pos = new Vec2(player.pos);
        this.facing = facing;
        this.pos.x += 1 + 0.2 * facing * (angle == 90); // + 0.5*Math.cos(Math.PI*angle/180);
        this.pos.y += -0.5; // + 0.5*Math.sin(Math.PI*angle/180);
        this.angle = angle - 180*(facing<0);
        this.boundingBox = null;
        this.boundingBoxes = [this.rotatedBoundingBox([-0.5,1], this.angle, this.facing<0, [0.5,1],[1,1]),
                                this.rotatedBoundingBox([-0.5,1], this.angle, this.facing<0, [1.5,0.5],[1,1]),
                                this.rotatedBoundingBox([-0.5,1], this.angle, this.facing<0, [1.5,1.5],[1,1]),
            ];
        this.shotDamage = shotDamage;
        this.elapsed = 0;
        this.timer = 100;
    }

    update(millis) {
        if (this.elapsed == 0) {
            let monsters = monsters_with_other_players(this.player);
            for (let m of monsters) {
                for(let b of this.boundingBoxes) {
                    if(!m.dead && this.bounds(this.pos, b).collide(m.hitBounds())) {
                        m.hit(this.shotDamage);
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
    draw() {
        game.sprites.entitiesItems.drawRotatedMultitile(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0, [-0.5,1]); 
    }
}

class LiveRocket extends Entity {
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

    update(millis) {
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
            if (this.vel.x == 0 && old_velx != 0)
                collision = true;
            if (this.vel.y == 0 && old_vely != 0)
                collision = true;
            let monsters = monsters_with_other_players(this.player);
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
                for(let p of game.activePlayers) {
                    if(!p.dead) {
                        p.controller.vibrate(1.0,1.0,350);
                    }
                }
                for (let t of game.tiles.iterRange(t0, this.radius)) {
                    game.items.push(new Boom(t));
                }
                for (let p of monsters_and_players()) {
                    let d = this.pos.dist(p.pos);
                    if (d <= this.radius) {
                        d = Math.max(0.1,d);
                        p.hit(this.damage*(1+(d<=0.5)));
                        p.stun(500*this.damage);
                        let dx = p.pos.x - this.pos.x;
                        let dy = p.pos.y - (this.pos.y + 1);
                        let power = 1/1600 + (this.radius-d)/3200;
                        p.vel.x += power*(dx/d);
                        p.vel.y += power*(dy/d);
                        p.falling = true;
                    }
                }
                this.dead = true;
                return;
            }
        }
    }
    draw() {
        game.sprites.entitiesItems.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0);
    }
}

class LiveDrone extends Entity {
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
    update(millis) {
        this.elapsed += millis;
        let player = this.player
        // drone dies if
        // * out of bounds
        // * runs out of flight time
        // * player dies, exits level, releases use button
        if (player.activeState!=player.states.driving) {
            this.dead=true;
            return;
        }
        if (this.elapsed > this.timer || !player.controlStates['use'] || player.dead
            || player.escaped || this.pos.y < -4 || this.pos.y > game.dimH + 4
            || this.pos.x < -4 || this.pos.x > game.dimW + 4) {
            this.inventoryItem.live = false;
            player.setState(player.states.falling);
            this.dead=true;
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
        if (!player.controlStates['left'] && !player.controlStates['right'] && !player.controlStates['up'] && !player.controlStates['down']) {
            this.vel.x = this.vel.y = 0;
        }

        //TODO: check for collision with power pills/fuel cells and carry them

        //execute movement with collision detection
        let old_vely = this.vel.y;
        let old_velx = this.vel.x;
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)

        // check for a collision -- TODO: bounce if going slowly enough
        let collision = false;
        if (this.vel.x == 0 && old_velx != 0)
            collision = true;
        if (this.vel.y == 0 && old_vely != 0)
            collision = true;
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
            for (let m of monsters_with_other_players(player)) {
                if (t0.dist(m.pos) <= this.radius) {
                    m.hit(this.damage);
                }
            }
            player.controller.vibrate(0.2,0.2,100);
            this.inventoryItem.live = false;
            this.inventoryItem.lastBuildTime = 0;
            this.dead = true;
            player.setState(player.states.falling);
            return;
        }
    }
    //TODO: Draw drone with a simple Drone1/Drone2 animation loop and left/right tilt with sideways motion
}

class SaberStrike extends Entity {
    constructor(pos, facing, angle = 0) {
        super(null, entityItemIds.LiveVibroBlade);
        this.angle = angle;
        this.facing = facing;
        this.pos = new Vec2([pos.x+0.75, pos.y]); // + 0.5 * Math.sin(Math.PI * angle / 180)
        this.angle -= facing < 0 ? 180 : 0;
        this.elapsed = 0;
        this.lifeTime = 100;
//        this.boundingBox = new Rect([0,0.25,0.75,0.5])
        this.boundingBox = this.rotatedBoundingBox([-0.25, 0.5]);
    }
    update(millis) {
        this.elapsed += millis;
        // drone dies if
        // * out of bounds
        // * runs out of flight time
        // * player dies, exits level, releases use button
        if (this.elapsed > this.lifeTime) {
            this.dead = true;
        }
    }
    draw() {
        game.sprites.entitiesItems.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0, [-0.25, 0.5]);
    }
}

class Reticle extends Entity {
    constructor(player, aimable) {
        super(null, entityItemIds.Reticle);
        this.player = player;
        this.aimable = aimable;
        let angle = aimable.angle;
        this.pos = new Vec2([player.pos.x + Math.cos(Math.PI * angle / 180),
        player.pos.y + Math.sin(Math.PI * angle / 180)])
    }
    update(millis) {
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

class GrappleLine extends Entity { // TODO: This is unfinished copy
    constructor(player, invItem, angle, vel, power, alloyUse) {
        super(null, -1);
        this.player = player;
        this.invItem = invItem;
        this.pos = player.pos.add([player.facing * player.boundingBox.w * 0.75, 0]);
        this.power = power;
        this.alloyUse = alloyUse;
        this.attached = false;
        this.vel.x = vel * Math.cos(Math.PI * angle / 180)
        this.vel.y = vel * Math.sin(Math.PI * angle / 180)
        this.boundingBox = new Rect([0.45, 0.45, 0.1, 0.1])
        this.timer = 2000;
        this.elapsed = 0;
        this.sound = game.playSound('grappleRetract', 0, true, false);
    }
    update(millis) {
        this.elapsed += millis;
        let player = this.player;
        if (!this.attached && this.elapsed > this.timer || this.pos.y < -4 || this.pos.y > game.dimH + 4
            || this.pos.x < -4 || this.pos.x > game.dimW + 4) {
            this.dead = true;
            this.invItem.activeLine = null;
            this.sound.pause();
            return;
        }
        if (player.escaped || player.dead || !player.stunTimer.finished() ||
            !(player.inventory.activeItem() instanceof GrappleGun)
            || (!player.controlStates['jump'] && player.oldControlStates['jump'] && player.falling)) {
            this.dead = true;
            this.invItem.activeLine = null;
            this.sound.pause();
            return;
        }
        if (!this.attached) {
            //execute movement with collision detection
            let old_vely = this.vel.y;
            let old_velx = this.vel.x;
            game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)

            let collision = false;
            if (this.vel.x == 0 && old_velx != 0)
                collision = true;
            if (this.vel.y == 0 && old_vely != 0)
                collision = true;

            if (collision) {
                this.vel.x = this.vel.y = 0;
                if(this.player.resources.use(0, this.alloyUse, 0)) {
                    this.attached = true;
                }
            }
        } else {
            if (player.controlStates['use']) { //Move toward the grapple point
                this.sound.play();
//                player.setState(player.states.driving);
                let dx = player.pos.x - this.pos.x;
                let dy = player.pos.y - this.pos.y;
                let hypot = (dx ** 2 + dy ** 2) ** 0.5;
                let vel = new Vec2([0, 0]);
                vel.x = -this.power * dx / hypot;
                vel.y = -this.power * dy / hypot;
                player.vel = vel;
                player.controller.vibrate(0.1,0.1,millis);
                //                player.pos = player.pos.add(vel).mul(millis/15);
            } else {
//                player.setState(player.states.falling);
                this.sound.pause();
            }
            if (this.falling) {
                let dy = player.pos.y - this.pos.y;
                if (dy > 0) { // player is underneath the anchor point, suspend (swing)
                    this.falling = false;
                    this.vel.y = 0;
                }
                //TODO: Swing!
            }
        }
    }
    draw() {
        let ctx = game.ctx;
        ctx.beginPath();
        ctx.moveTo((this.player.pos.x + 0.5) * game.tileSize + game.shakeX + game.gameOffsetX, (this.player.pos.y + 0.5) * game.tileSize + game.shakeY + game.gameOffsetY);
        ctx.lineWidth = game.tileSize / 16;
        ctx.strokeStyle = '#BAC3D9';
        ctx.lineTo((this.pos.x + 0.5) * game.tileSize + game.shakeX + game.gameOffsetX, (this.pos.y + 0.5) * game.tileSize + game.shakeY + game.gameOffsetY);
        ctx.stroke();
    }
}

class MovingPlatform extends Entity {
    constructor(terminal1, terminal2) {
        super(null, entityItemIds.Platform);
        this.terminal1 = terminal1;
        this.terminal2 = terminal2;
        this.pos = terminal1.pos;
        this.facing = 1// 2*(terminal1.pos.x < terminal2.pos.x) - 1;
        this.playersRiding = [];
        this.power = 1.0/400;
        let dx = terminal2.pos.x - terminal1.pos.x;
        let dy = terminal2.pos.y - terminal1.pos.y;
        let hypot = (dx ** 2 + dy ** 2) ** 0.5;
        this.vel = new Vec2([0, 0]);
        this.vel.x = this.power * dx / hypot;
        this.vel.y = this.power * dy / hypot;
        this.boundingBox = new Rect([0,0,1,3.0/16]);
    }
    update(millis) {
        let scale = this.facing*millis;
        this.pos = this.pos.add(this.vel.scale(scale));
        if(this.bounds().collide(this.terminal1) && this.facing<0 || this.bounds().collide(this.terminal2) && this.facing>0) {
            this.facing *= -1;
        }
        let pr = []
        for(let p of game.activePlayers) {
            let b=p.bounds()
            b.y+=b.h*0.8;
            b.h = b.h*0.2;
            if(this.playersRiding.includes(p)) {
                if(p.controlStates['down'] || p.vel.y!=0 || !b.collide(this.bounds().shift([0,-0.01]))) {
                    p.setState(p.states.falling);
                    continue;
                }
                pr.push(p);
                let old_vel = p.vel;
                p.vel = new Vec2(this.vel.scale(this.facing));
                game.tiles.move(p, millis);
                p.vel = old_vel;

                p.runCheck(millis);
                p.entityInteract();
                if(p.stunTimer.finished()) {
                    p.walkCheck(millis, p.running);
                    p.cycleInventoryCheck(millis);
                }
                if(!p.aiming) {
                    p.tileInteract(millis)
                    if(p.activeState!=p.states.driving)
                        continue;
                }
                p.jumpCheck(millis);
        
            }
            else if(p.vel.y>0 && b.collide(this.bounds().shift([0,-0.01])) && !p.controlStates['down']) {
                pr.push(p);
                p.setState(p.states.driving);
                p.vel.y = 0;
                p.pos.y = this.pos.y-1;
            }
        }
        this.playersRiding = pr;
    }
    draw() {
        game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
    }
}

class TrapBlade extends Entity {
    constructor(platform) {
        super(null, entityItemIds.TrapBlade);
        this.platform = platform;
        if(platform.type == 'static') {
            this.pos = new Vec2(this.platform.shift([0,-1]));
        } else {
            this.pos = new Vec2(this.platform);
        }
        this.facing = 1// 2*(terminal1.pos.x < terminal2.pos.x) - 1;
        this.boundingBox = new Rect([0.125, 0.25, 0.75, 0.75]);
        this.elapsed = 0;
    }
    update(millis) {
        let plat = this.platform;
        if(game.tiles.at(plat.pos)!=plat) {
            this.dead=true;
        }
        this.elapsed+=millis;
        if(plat.type=='contact') {
            if(this.pos.y==plat.y && this.vel.y==0) { 
                for(let pl of game.activePlayers) {
                    if(pl.bounds().collide(game.tiles.at(plat).shift([0,-1]))) {
                        this.vel.y = -1.0/plat.extendTime;
                        this.elapsed = 0;
                        break;
                    }
                }    
            } else if(this.pos.y==plat.y-1 && this.elapsed>=plat.extendedTime) {
                this.vel.y = 1.0/plat.extendTime;
                this.elapsed = 0;
            }
        } else if(plat.type=='cycling') {
            if(this.pos.y==plat.y-1 && this.elapsed>=plat.extendedTime) {
                this.vel.y = 1.0/plat.extendTime;
                this.elapsed = 0;
            }    
            if(this.pos.y==plat.y && this.elapsed>=plat.retractedTime) {
                this.vel.y = -1.0/plat.extendTime;
                this.elapsed = 0;
            }

        }
        for(let pl of monsters_and_players()) {
            if(this.bounds().collide(pl.bounds()) && !pl.stunned) {
                pl.hit(plat.damage, 2*(pl.pos.x>this.pos.x)-1);
                if(!pl.isPlayer) {
                    pl.stun(500);
                }
            }
        }
        let vel = this.vel.y*(this.elapsed>plat.contactDelay || plat.type!='contact');
        this.pos.y = Math.min(Math.max(this.pos.y+vel*millis, plat.y-1),plat.y);
        if(this.pos.y==plat.y-1 && this.vel.y<0|| this.pos.y==plat.y && this.vel.y>0) {
            this.vel.y = 0;
        }
    }
    drawAsTile() {
        game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
    }
    draw () {        
    }
}

class ActiveDrill extends Entity {
    constructor(pos, angle=0) {
        super(null, tileIds.Drill1);
        this.facing = 1;
        this.pos = new Vec2(pos);
        this.angle = angle;
        //        let a = this.facing>0?this.angle:this.angle+180;
        this.accel = this.topSpeed/20;
        this.vel.x = this.vel.y = 0;
        this.topSpeed = 1.0/50;
        this.active = true;
        this.target = null;
        this.elapsed = 0;
    }
    setTarget() {
        let t=game.tiles.closestTile(this.bounds());
        this.target = null;
        let candidates = shuffle([[game.tiles.below(t),180], [game.tiles.leftOf(t),270], [game.tiles.rightOf(t),90]]);
        for(let pair of candidates) { //[game.tiles.above(t),0], 
            if(pair[0] instanceof DirtPile) {
                this.target = pair[0];
                this.angle = pair[1];
                break;
            }
        }
        if(this.target==null) {
            for(let pair of candidates) { //[game.tiles.above(t),0], 
                if(pair[0] instanceof Floor) {
                    this.target = pair[0];
                    this.angle = pair[1];
                    break;
                }
            }    
        }
        if(this.target==null) {
            this.vel.y = this.vel.x = 0;
            this.angle = 0;
            this.active = false;
            return;
        }
        switch(this.angle) {
            case 0:
                this.vel.y = -this.topSpeed;
                this.vel.x = 0;
                break;
            case 90:
                this.vel.y = 0;
                this.vel.x = this.topSpeed;
                break;
            case 180:
                this.vel.y = this.topSpeed;
                this.vel.x = 0;
                break;
            case 270:
                this.vel.y = 0;
                this.vel.x = -this.topSpeed;
                break;
        }

    }
    update(millis) {
        if(!this.active) {
            for(let p of game.activePlayers) {
                if(p.controlStates['up'] && p.bounds().collide(this.bounds())) {
                    this.active = true;
                }
            }
            return;
        }
        this.elapsed += millis;
        if(this.elapsed>100) {
            this.sprite = this.sprite==tileIds.Drill1? tileIds.Drill2: (this.sprite==tileIds.Drill2? tileIds.Drill3: tileIds.Drill1);
            this.elapsed = 0;
        }
        if(this.target==null) this.setTarget();
        if(this.target==null) return;
        let d0 = this.pos.dist(this.target);
        this.pos = this.pos.add(this.vel.scale(millis/15));
        let d1 = this.pos.dist(this.target);
        if(d1>d0) {
            this.pos.x = this.target.x;
            this.pos.y = this.target.y;
            this.target.replace(Floor);
            this.setTarget();
        }
    }
    draw() {
        game.sprites.tiles.drawRotated(this.sprite, this.getDisplayX(), this.getDisplayY(), this.angle, this.facing < 0, [0.5, 0.5]);
    }

}