
//MONSTER AI
//Target/objective, e.g., nearest player, a waypoint on a job.
// -- uses pathfinding
// -- not updated every frame
//Current action
// -- velocity, facing, walking/running, jumping, firing
// -- updated every frame
//Current actions determined by current state
// -- Walking
// -- Flying
// -- Falling
// -- Dead
//Player interact


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
    ///TARGETING/FACING LOGIC
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


    //SLOW DOWN IF STUNNED
    if(stunned && !this.drone && !this.falling) {
        this.vel.x /= 1.5*millis/15;
    }




    //MOVEMENT LOGIC -- CHOP THIS UP AND MAKE IT FLEXIBLE
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
r                }
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

    //APPLY GRAVITY AND CHECK FALL STATE
    // check falling -- monster falls unless in contact with a block below them
    if(this.canFall) {
        if(this.falling)
            this.vel.y = Math.min(this.maxFallSpeed, this.vel.y + 1.0/4800*millis/15);
        this.falling = true;
        for(let t of game.tiles.contacters(this.bounds()))
            if(t.standable && t.y==this.bounds().bottom) { //TODO: this should be some sort of tile-specific standing on class
                this.falling=false;
                break;
            }
    }

    game.tiles.move(this, millis); //TODO: handle large moves that step beyond one space

    //PLAYER COLLISION
    if(!stunned) {
        for(let player of game.activePlayers)
            if(player.hitBounds().collide(this.bounds())) {
                player.hit(this.hitDamage*(this.stance!='passive'),this.hitDamage*(this.pos.x<player.pos.x?1:-1));
                player.stun(500*this.hitDamage);
            }
    }

    //OUT OF BOUNDS DEATH
    if(this.pos.y>game.tiles.dimH) {
        this.die();
    }

}
