class Monster extends Entity{
    constructor(tile, sprite, hp=1){
        super(tile, sprite);
        this.hp = hp;
        this.maxHp = hp;
        this.facing = randomRange(0,1)*2-1;
        this.topSpeed = 1.0/600;
        this.jumpSpeed = 1.0/350;
        this.maxFallSpeed = 1.0/50;
        this.hitDamage = 1.0;
        this.spawnTimer = 1000;
        this.spawnElapsed = 0.0;
        this.stunTimer = new Timer(0, 0);
        this.hitTimer = new Timer(0, 0);
        this.boundingBox = new Rect([0.25,0.5,0.5,0.5]);
        this.hitBox = new Rect([0.25,0.2,0.5,0.8])
        this.drone = false;
        this.climbing = false;
        this.falling = false; //spawn in falling so it doesn't get stuck on ladders etc
        this.dying = false;
        this.intelLevel = 1;
        this.stance = 'aggressive' //passive, aggressive, targeting, perhaps other options
        // this.oldFalling = new Vec2(this.falling);

    }

    draw(){
        game.sprites.monsters.draw([1*this.dying, this.sprite], this.getDisplayX(),  this.getDisplayY(), this.getFlipped());
        if(!this.hitTimer.finished()) {
            game.sprites.entitiesItems.draw(entityItemIds.Strike, this.getDisplayX(),  this.getDisplayY(), this.getFlipped())
        }
    }

    die(){
        this.stun();
        this.dying = true;
    }

    death() {
        this.dead=true;
        if(!this.isPlayer) {
            let t = game.tiles.closestTile(this.bounds());
            if(t instanceof Void)
                return;
            let c = new Chips(t);
            c.pos = this.pos;
            game.items.push(c);
        }

    }

    heal(damage){
        this.hp = Math.min(game.maxHp, this.hp+damage);
    }

    tile_pos(){
        return new Vec2([Math.round(this.pos.x), Math.ceil(this.pos.y)]);
    }

    stun(time = 2000) {
        if(!this.dying) {
            this.stunTimer.reset(time);
        }
    }

    update(millis){
        this.spawnElapsed += millis;
        // this.oldFalling = new Vec2(this.falling);
        if(this.spawnElapsed<this.spawnTimer)
            return;

        this.hitTimer.tick(millis);
        this.stunTimer.tick(millis);
        let stunned = !this.stunTimer.finished();
        if(!stunned) {
            if(this.dying) {
                this.death();
                return;
            }
        }

        //Targeting
        if(!stunned && !this.drone) {
            if(this.stance=='targeting') {
                let npl, npd;
                [npl, npd] = nearestPlayer(this.pos);
                if(npl!=null) { 
                    let dx = Math.abs(npl.pos.x-this.pos.x);
                    let dy = Math.abs(npl.pos.y-this.pos.y);
                    if(dx>=2 && dy<=1.5) {
                        this.facing = this.pos.x<npl.pos.x?1:-1;
                    }
                    else if(!this.falling && this.vel.x==0) {
                        this.facing = -this.facing;
                    }
                } 
            } 
            else if(!this.falling && this.vel.x==0) { //hit an obstacle turn around
                this.facing = -this.facing;
                }
            if(!this.falling || Math.abs(this.vel.x)<this.topSpeed) {
                this.vel.x = this.facing*this.topSpeed;
            }
        }
        //Slow down if stunned and not falling
        if(stunned && !this.drone && !this.falling) {
            this.vel.x /= 1.5*millis/15;
        }

        //Core movement logic
        if(!stunned && !this.drone && game.levelTime>0 && !this.falling) {
            let b = this.bounds();
            let p;
            p = game.tiles.closestPos(this.pos.add([0,0]));
            let p0 = p.add([0,1]);
            let p1 = p0.add([this.facing,0]);
            let p2 = p;
            let p3 = p2.add([this.facing,0]);
            if((this.facing*(this.pos.x-p.x)<=0) && !(game.tiles.at(p0).standable)) { //about to fall
                if(this.intelLevel>1 && game.tiles.at(p2).passable && game.tiles.at(p3).passable && game.tiles.at(p1) instanceof Wall) { //clear to jump
                    this.vel.y = -1.0/400;
                    this.vel.x = this.facing*this.jumpSpeed;
                } else {
                    let p4 = p0.add([0,1]);
                    if(this.stance=='targeting') {
                        let [pl,d] = nearestPlayer(this.pos);
                        if(pl!=null && pl.pos.y>this.pos.y) {
                            if(game.tiles.at(p4).passable && game.tiles.below(p4).passable) {
                                this.vel.x = 0;
                            }
                        }     
                    }
                    else if(game.tiles.at(p4).passable) {//stop so I don't fall if there is more than a one tile drop
                        this.vel.x = 0;
                    }
                }
            } else { //jump up
                let p3 = p.add([this.facing,0]); //tile in front
                let p4 = p.add([0,-1]); //tile above
                let p5 = p4.add([this.facing,0]); //tile in front of tile above
                if(this.stance=='targeting') {
                    let [pl,d] = nearestPlayer(this.pos);
                    if(pl!==null && pl.pos.y<this.pos.y) { //jump up to player
                        if(!game.tiles.at(p3).passable && game.tiles.at(p5).passable && game.tiles.rightOf(p5).passable) {
                            this.vel.y = -1.0/200;
                            this.vel.x = this.facing*this.jumpSpeed;
                        } 
                    } 
                    else if(((this.facing<0)&&(this.pos.x<=p.x) || (this.facing>0)&&(this.pos.x>=p.x))
                    && !game.tiles.at(p3).passable && game.tiles.at(p4).passable && game.tiles.at(p5).passable) {
                       this.vel.y = -1.0/200;
                       this.vel.x = this.facing*this.jumpSpeed;
                   }
                }
                else if(((this.facing<0)&&(this.pos.x<=p.x) || (this.facing>0)&&(this.pos.x>=p.x))
                 && !game.tiles.at(p3).passable && game.tiles.at(p4).passable && game.tiles.at(p5).passable) {
                    this.vel.y = -1.0/200;
                    this.vel.x = this.facing*this.jumpSpeed;
                }

            }
        }

        //Fall/Apply gravity
        // check falling -- monster falls unless in contact with a block below them
        if(this.canFall) {
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
        if(!stunned) {
            for(let player of game.activePlayers)
                if(player.hitBounds().collide(this.bounds())) {
                    player.hit(this.hitDamage*(this.stance!='passive'),this.hitDamage*(this.pos.x<player.pos.x?1:-1));
                    player.stun(500*this.hitDamage);
                }
        }

        if(this.pos.y>game.tiles.dimH) {
            this.die();
        }

    }

    tryMove(dx, dy){

        let newTile = this.tile.getNeighbor(dx,dy);
        if(newTile.passable){
            this.lastMove = [dx,dy];
            if(!newTile.monster){
                this.move(newTile);
            }
            return true;
        }
    }

    hit(damage, knockbackScale=0){
        //TODO: eventually need to add type of damage
//        if(this.shield>0){           
//            return;                                                             
//        }
        this.hp -= damage;
        if(damage>0) this.hitTimer.reset(200);
        if(this.hp <= 0)
            this.die();
        this.vel.y=-1.0/400;
        this.vel.x = knockbackScale*1.0/200;
        this.falling = true;
        if(this.isPlayer){
            game.playSound("hit1");                                              
            this.controller.vibrate(0.5,0.5,100);
        }else{
//            this.stance = 'aggressive'                                                       
            game.playSound("hit2");                                              
        }
    }

    tile_collide(tile) {
        return tile.bounds.collide(self.bounds());
    }

    monster_collide(monster) {
        return monster.bounds.collide(self.bounds());
    }

    fallCheck(millis) {
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

    fallBoom(radius) {
        this.die();
        game.playSound('boom');
        for(let t of game.tiles.iterRange(game.tiles.closestPos(this.pos),radius))
            if(!(t instanceof Wall))
                game.items.push(new Boom(t));
        for(let m of game.monsters)
            if(this.pos.dist(m.pos)<=radius)
                m.hit(this.hitDamage*3);
        for(let player of game.activePlayers)
            if(this.pos.dist(player.pos)<=radius)
                player.hit(this.hitDamage*3);
    }
}

class Jelly extends Monster {
    constructor(tile){
        super(tile, monsterRowLocIds.OneEye, 1);
        this.hp = 1;
        this.topSpeed = 0.5*this.topSpeed;
        this.fallOrigin = null;
        this.stance='passive'
    }

    draw(){
        game.sprites.base.draw(baseSetIds.Jelly, this.getDisplayX(),  this.getDisplayY(), this.getFlipped());
        if(!this.hitTimer.finished()) {
            game.sprites.base.draw(baseSetIds.Slash, this.getDisplayX(),  this.getDisplayY(), this.getFlipped())
        }
    }

    update(millis) {
        let wasFalling = this.falling;
        let oldVel = this.vel.y;
        super.update(millis);
        if(this.falling && (!wasFalling || this.fallOrigin==null) || (oldVel<0)&&(this.vel.y>=0))
            this.fallOrigin = new Vec2(this.pos);
        if(!this.falling && wasFalling) {
            let distance = this.pos.y - this.fallOrigin.y;
            if(distance>=2) this.stun(3000);
            if(distance>=3) this.fallBoom(1.5);
        }
    }

}

class OneEye extends Monster{
    constructor(tile){
        super(tile, monsterRowLocIds.OneEye, 1);
        this.hp = 1;
        this.topSpeed = 0.75*this.topSpeed;
        this.fallOrigin = null;
        this.stance='passive'
    }

    update(millis) {
        let wasFalling = this.falling;
        let oldVel = this.vel.y;
        super.update(millis);
        if(this.falling && (!wasFalling || this.fallOrigin==null) || (oldVel<0)&&(this.vel.y>=0))
            this.fallOrigin = new Vec2(this.pos);
        if(!this.falling && wasFalling) {
            let distance = this.pos.y - this.fallOrigin.y;
            if(distance>=2) this.stun(3000);
            if(distance>=3) this.fallBoom(1.5);
        }
    }

}

class TwoEye extends Monster{
    constructor(tile){
        super(tile, monsterRowLocIds.TwoEye, 2);
        this.intelLevel = 2;
        this.fallOrigin = null;
    }

    update(millis) {
        let wasFalling = this.falling;
        let oldVel = this.vel.y;
        let [p,d] = nearestPlayer(this.pos);
        if(p==null && this.stance=='targeting') { //everyone is dead
            this.stance = 'aggressive';
            this.topSpeed /= 1.5;
        } else if(d<5 && this.stance!='targeting') {
            this.stance = 'targeting';
            this.topSpeed *= 1.5;
        }
        super.update(millis);
        if(this.falling && (!wasFalling || this.fallOrigin==null) || (oldVel<0)&&(this.vel.y>=0))
            this.fallOrigin = new Vec2(this.pos);
        if(!this.falling && wasFalling) {
            let distance = this.pos.y - this.fallOrigin.y;
            if(distance>=2) this.stun(3000);
            if(distance>=3) this.fallBoom(1.5);
        }
    }


}

class Tank extends Monster{
    constructor(tile){
        super(tile, monsterRowLocIds.Tank, 6);
        this.topSpeed = 0.4*this.topSpeed;
        this.intelLevel = 2;
        this.homePos = new Vec2(this.pos);
        this.targetPos = new Vec2(this.pos);
        this.shotTimer = new Timer(3000);
    }

    update(millis) {
        this.shotTimer.tick(millis);
        this.hitTimer.tick(millis);
        this.stunTimer.tick(millis);
        //TODO: handle death, gravity on death, fix shooting angle, clear damage marker etc. 

        let stunned = !this.stunTimer.finished();
        if(!stunned && this.dying) {
                this.death();
                return;
        }


        //Fall if dying
        if(this.dying) {
            if(this.fallCheck(millis)) this.vel.y = Math.min(this.maxFallSpeed, this.vel.y + 1.0/4800*millis/15);
            game.tiles.move(this, millis);
            return;
        } 
        //Move
        game.tiles.move(this, millis);
        let d1 = this.pos.dist(this.targetPos);
        if(d1<=0.001) {
            this.pos = new Vec2(this.targetPos);
            let p = game.tiles.closestPos(this.pos);
            let target = choose([game.tiles.leftOf(p), game.tiles.rightOf(p), 
                game.tiles.above(p), game.tiles.below(p)].filter(v => v.passable && this.homePos.dist(v.pos)<10))
            if(target!=null) this.targetPos = new Vec2(target);
            else this.targetPos = new Vec2(this.pos);
        }
        this.vel.x = clamp(this.targetPos.x-this.pos.x,-this.topSpeed,this.topSpeed);
        this.vel.y = clamp(this.targetPos.y-this.pos.y,-this.topSpeed,this.topSpeed);
        //Shoot
        if(this.shotTimer.finished()) {
            let [np, nd] = nearestPlayer(this.pos); //TODO: use line of sight check
            if(np!=null && nd<10) {
                let dx = np.pos.x - this.pos.x;
                let dy = np.pos.y - this.pos.y;
                let targetAngle = Math.atan2(dy, dx)*180/Math.PI;
                game.items.push(new Shot(this, this.damage, targetAngle, this.facing, 0.5, this.pos));
                game.playSound('rifleFire');
                this.shotTimer.reset();
            }
        }
        //Player collision
        if(this.stunTimer.finished()) {
            for(let player of game.activePlayers)
                if(player.hitBounds().collide(this.bounds())) {
                    player.hit(0,this.hitDamage*(this.pos.x<player.pos.x?1:-1));
                    player.stun(500*this.hitDamage);
                }
        }

    }

}

class Eater extends Monster{
    constructor(tile){
        super(tile, monsterRowLocIds.Eater, 4);
        this.intelLevel = 3;
    }

    getFlipped() {
        return this.facing==1;
    }

}

class Jester extends Monster{
    constructor(tile){
        super(tile, monsterRowLocIds.Jester, 4);
        this.intelLevel = 4;
    }
}


class GunPlatform extends Monster {
//    constructor(pos, damage=1, reloadTime=5000, facing=1, angle = 0) {
    constructor(attachedTile, damage=1, reloadTime=5000, facing=1, angle = 90, hp=1){
        super(null, entityItemIds.GunTurretBase, hp);
        this.attachedTile = attachedTile;
        this.pos = new Vec2(attachedTile.shift([0,15.0/16]));
        this.facing = facing;
        this.angle = angle;
        this.shotTimer = new Timer(2000, 0);
        this.reloadTime = reloadTime;
        this.damage = damage;
        this.boundingBox = new Rect([0.25,0,0.5,0.5])
        this.hitBox = new Rect([0.25,0,0.5,0.6])
        this.barrelOffset = -6.0/16;
    }
    update(millis) {
        this.shotTimer.tick(millis);
        this.hitTimer.tick(millis);
        if(game.tiles.at(this.attachedTile)!=this.attachedTile) {
            this.die();
            return;
        }
        let bpos = this.pos.add([0,this.barrelOffset]);
        let [np, nd] = nearestPlayer(bpos); //TODO: use line of sight check
        if(np==null || nd>10) {
            return;
        }
        let dx = np.pos.x - this.pos.x;
        let dy = np.pos.y - this.pos.y - this.barrelOffset;
        if(dy>=0 && dy<=6) {
            let targetAngle = Math.acos(dx/nd)*180/Math.PI;
            if(this.angle<targetAngle) {
                this.angle = Math.min(targetAngle, this.angle + 0.5*millis/15);
            } else {
                this.angle = Math.max(targetAngle, this.angle - 0.5*millis/15);
            }
            this.angle = Math.max(Math.min(this.angle, 180), 0);
            if(this.angle==targetAngle && this.shotTimer.finished()) {
                game.items.push(new Shot(this, this.damage, this.angle, this.facing, 0.5, bpos));
                game.playSound('gunFire2');
                this.shotTimer.reset();
            }
       }
    }
    die(){
        this.dying = true;
        this.death();
    }
   draw() {
        game.sprites.entitiesItems.drawRotated(entityItemIds.GunTurretBarrel, this.getDisplayX(), this.getDisplayY(), this.angle, false, [0.5, 2.0/16]);
        game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), false);
        if(this.hitTime>0) {
            game.sprites.entitiesItems.draw(entityItemIds.Strike, this.getDisplayX(),  this.getDisplayY(), this.getFlipped())
        }
    }

}