class Behavior {
    update(player, millis) {

    }
    entry(player) {

    }
    exit(player) {

    }
    animate(player, millis) {

    }
}


class Walking extends Behavior { //Walking/running
    update(player, millis) {
        player.runCheck(millis);
        player.entityInteract();
        if(player.stunTimer.finished()) {
            player.walkCheck(millis, player.running);
            player.cycleInventoryCheck(millis);
        }
        if(!player.aiming) {
            player.tileInteract(millis)
            if(player.activeState!=this)
                return;
        }
        player.jumpCheck(millis);
    
        if(player.fallCheck()) player.setState(player.states.falling);
    }

}

class Falling  extends Behavior { //In midair (rising or falling), fixed gravity, direction changes allowed
    entry(player) {
        this.fromJump = !player.controlStates['jump'];
        this.initialFacing = player.facing;
    }

    exit(player) {
    }

    update(player, millis) {
        if(player.stunTimer.finished()) {
            player.entityInteract();
            let fast = this.initialFacing==player.facing && player.running;
            if(!fast) player.running=false;

            if(player.stunTimer.finished()) {
                player.walkCheck(millis, fast);
                player.cycleInventoryCheck(millis);
            }
                
            // jump
            if(this.fromJump && player.stateTimer.elapsed<100) {
                player.jumpCheck(millis);
            }

            // Tile interactions pressing up/down
            player.tileInteract(millis);

        }

        if(!player.jumpTimer.finished() && player.vel.y<0 && !player.controlStates['jump']) { //Kill the jump for early release
            player.vel.y *= 0.5 ** (millis/15);
        }

        // check we are still falling
        if(!player.fallCheck()) {
        //Vibrate -- hard coding velocity threshold
            if(Math.abs(player.vel.y)>0.01 && player.vel.y==0) {
                player.controller.vibrate(20*Math.abs(player.vel.y),20*Math.abs(player.vel.y),50);
            }
            player.vel.y = 0;
            player.setState(player.states.walking);
            return;
        } 
        if(player.vel.y>=0) { //check if falling onto a ledge
            for(let tbelow of game.tiles.contacters(player.bounds())) {
                if(tbelow.standable && game.tiles.above(tbelow).passable && !game.tiles.above(tbelow).climbable) {
                    let ycut = player.bounds().bottom
                    if(ycut>tbelow.y && ycut - player.vel.y*millis<=tbelow.y) {
                        player.pos.y -= ycut - tbelow.y;
                        player.vel.y = 0;
                        player.setState(player.states.walking);
                        return;
                    }
                }
            }
        }
        // gravity
        player.vel.y = Math.min(player.maxFallSpeed, player.vel.y + 1.0/4800*millis/15);
    }

}

class Climbing extends Behavior { //Climbing ladders, trees etc.
    update(player, millis) {
        if(!player.stunTimer.finished()) { //fall off climbable if stunned
            player.setState(player.states.falling);
            return;
        }

        player.entityInteract();

        if(player.controlStates['up']) player.vel.y = -player.topSpeed*0.75;
        else if(player.controlStates['down']) player.vel.y = player.topSpeed*0.75;
        else player.vel.y = 0;

        if(player.stunTimer.finished()) {
            player.walkCheck(millis);
            player.cycleInventoryCheck(millis);
            player.jumpCheck(millis);
        }

        let on_a_climbable=false;
        for(let t of game.tiles.colliders(player.bounds())) {
            if(t.climbable) {
                on_a_climbable = true;
                break;
            }
        }
        if(!on_a_climbable) {
            if(player.fallCheck(millis)) player.setState(player.states.falling);
            else player.setState(player.states.walking);
        }
    
    }

}

class Driving extends Behavior { //ignoring controls until notified otherwise -- delegates control to another entity
    entry(player) {
        this.vehicle = null; //controlling entity
    }
    update(player, millis) {
        player.entityInteract();

    }

}

class Dead extends Behavior { //ignoring controls until notified otherwise -- delegates control to another entity
    entry(player) {
        player.dead = true;
    }
    exit(player) {
        player.dead = false;
    }
    update(player, millis) {
        //friction
        if(player.vel.y==0) player.vel.x *= 0.95**(millis/15);
        // gravity
        player.vel.y = Math.min(player.maxFallSpeed, player.vel.y + 1.0/4800*millis/15);
    }

}

class Escaped extends Behavior { //ignoring controls until notified otherwise -- delegates control to another entity
    entry(player) {
        player.escaped = true;
    }
    exit(player) {
        player.escaped = false;
    }
    update(player, millis) {

    }

}



class Player extends Monster{
    constructor(playerId=-1, tile=null){
        super(tile, playerId, 3);
        this.isPlayer = true;
        this.boundingBox = new Rect([0.25,0.5,0.5,0.5]);
        this.immunityTimer = new Timer(1000,1000);
        this.selectedTimer = new Timer(500, 500);
        this.hitTimer = new Timer(500,500);
        this.stunTimer = new Timer(500,500);
        this.jumpTimer = new Timer(0,0);
        this.selectedSprite = null;
        this.inventory = new ActiveInventory(this);
        this.passiveInventory = new Inventory(this);
        this.escaped = false;
        this.running = false;
        this.climbing = false;
        this.aiming = false; //deactivates up/down player movement
        this.dropFromGame = false;
        this.startLevel = game.level;
        this.lastVel = new Vec2(this.vel);
        this.resources = new Resources();

        //Player Attributes
        this.maxHp = 4;
        this.topSpeed = 1.0/400;
        this.jumpSpeed = 1.0/135;
        this.maxFallSpeed = 1.0/50;
        this.airJumps = 0;
        this.wallJumps = 0;
        this.spikedBoots = 0;
        this.chips = 0; 
        this.dead = false;

        //Game-related Attributes
        this.score = 0;
        this.deaths = 0;
        this.pause = 0;

        //Animation Attributes
        this.lastFacing = this.facing;
        this.lastFramePos = 0;
        this.currentFrame = 0;
        this.useTimer = new Timer(0);

        // Hooks
        this.hookHitModifier = [];
        this.hookUpdate = [];

        //Motion states
        this.states = {
            walking: new Walking(this),
            falling: new Falling(this),
            climbing: new Climbing(this),
            driving: new Driving(this),
            escaped: new Escaped(this),
            dead: new Dead(this),
        }
        this.activeState = this.states.walking;
        this.stateTimer = new TimerUnlimited();
        

        //State of controller
        this.controller = null;
        this.controlStates = {...controlStates0};
        this.newControlStates = {...controlStates0};
        this.oldControlStates = {...controlStates0};

        this.cycleSprite();
    }
    setWalkFrames() {
        //Animation data
        this.walkFrames = [new Vec2([2,this.sprite]), new Vec2([3,this.sprite]), 
            new Vec2([4,this.sprite]), new Vec2([3,this.sprite]), 
            new Vec2([2,this.sprite]), new Vec2([5,this.sprite]), 
            new Vec2([6,this.sprite]), new Vec2([5,this.sprite])];
    }
    cycleSprite() {
        let takenSprites = other_players(this).map(pl => pl.sprite);
        while(true) {
            this.sprite++;
            if(this.sprite>=4) this.sprite = 0;    
            if(takenSprites.includes(this.sprite)) continue;
            break;
        }
        this.setWalkFrames();    
    }
    set falling(fall) {
 //       if(fall && this.activeState!=this.states.falling) this.setState(this.states.falling);
 //       if(!fall && this.activeState!=this.states.walking) this.setState(this.states.walking);
    }
    get falling() {
        return this.activeState==this.states.falling;
    }

    //Player states
    // Standing
    // Walking
    // Running
    // Jumping (same as falling?)
    // Falling
    // Climbing
    // Using
    // Interacting
    // Stunned
    // Dead

    //substates
    // Facing, Falling, Using, Interacting? <- e.g., can be both dead and falling

    die(){
        if(this.dead)
            return;
        this.dead = true;
        this.hp = 0;
        this.deaths++;
        let deathSound = choose(['dead1','dead2','dead3','dead4','dead5','dead6','dead7','dead8']);
        this.setState(this.states.dead);
        game.playSound(deathSound);
    }

    revive() {
        this.dead = false;
        this.setState(this.states.walking);
        this.hp = game.competitiveMode?this.maxHp:1;
    }

    hit(damage, knockbackScale=0) {
        if(game.competitiveMode && game.levelTime>this.startLevelTime-3000) //can't be hit in competitive mode in the first 3 seconds
            return;
        if(!this.dead && !this.escaped && this.immunityTimer.finished()) {
            for(let i of this.hookHitModifier) {
                [damage, knockbackScale] = i.hitModifier(damage, knockbackScale);
            }
            super.hit(damage, knockbackScale);
            this.immunityTimer.reset();
            game.playSound("hit1");                                              
        }
    }

    use(millis) {
        this.useTimer.reset(millis);
    }

    draw() {
        if(this.escaped) 
            return;
        let sprite;
        if(this.dead) {
            sprite = new Vec2([1, this.sprite]);
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else if(!this.useTimer.finished()) {
            sprite = new Vec2([4, this.sprite]);
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else if(this.activeState==this.states.falling) {
            sprite = new Vec2([4, this.sprite]);
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else if(this.activeState==this.states.climbing) {
            if(this.currentFrame<8) {
                this.currentFrame=8;
                this.lastFramePos = this.pos.y;
            }
            if(this.currentFrame>=8 && Math.floor(Math.abs(this.pos.y-this.lastFramePos)*8)) {
                this.currentFrame = this.currentFrame!=8 ? 8:9;
                this.lastFramePos = this.pos.y;
            }
            sprite = new Vec2([this.currentFrame, this.sprite]);
        }
        else if(this.vel.x==0) {
            sprite = new Vec2([0, this.sprite]);
            this.currentFrame = 0;
            this.lastFramePos = this.pos.x;
        }
        else {
            if(this.facing!=this.lastFacing) {
                this.currentFrame = 0;
                this.lastFramePos = this.pos.x;
            } else if(this.facing*(this.pos.x-this.lastFramePos)*8>=1) {
                this.currentFrame+=Math.floor(this.facing*(this.pos.x-this.lastFramePos)*8);
                this.lastFramePos = this.pos.x;
            }
            this.currentFrame = this.currentFrame%this.walkFrames.length;
            sprite = this.walkFrames[this.currentFrame];
        }
        //Show recently activated item
        if(!this.selectedTimer.finished()) {
            game.sprites.entitiesItems.drawScaled(this.selectedSprite, this.pos.x+0.25,  this.pos.y-0.25, 0.5);
        }
        //Show player in current state
        game.sprites.players.draw(sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        //TODO: Show inventory attachment
        //this.inventory.activeItem().drawInPlay(this.currentFrame);
        if(!this.hitTimer.finished()) {
            game.sprites.entitiesItems.draw(entityItemIds.Strike, this.getDisplayX(),  this.getDisplayY(), this.getFlipped())
        }
        this.lastFacing = this.facing;
    }

    drawHUD(pos) {
        if(game.competitiveMode) {
            drawTileText(""+Math.floor(this.score), 0.5*game.tileSize, pos, "White"); // Text for hp game.level 
            pos = pos.add([1,0]);
        }
        game.sprites.players.draw([1*this.dead,this.sprite], pos.x, pos.y);
        let pos1 = pos.add([1,0]);
        game.sprites.entitiesItems.draw(entityItemIds.Health, pos1.x,pos1.y); //Draw hp game.level
        drawTileText(""+Math.ceil(this.hp), 0.5*game.tileSize, pos1, "White"); // Text for hp game.level 
        let pos2 = pos1.add([1,0]);
        this.resources.drawHUD(pos2, this);
    }

    update(millis){  
        if(this.escaped)
            return;
        let oldVel = new Vec2(this.vel);
        let oldPos = new Vec2(this.pos);
        this.immunityTimer.tick(millis);
        this.stateTimer.tick(millis);
        this.jumpTimer.tick(millis);
        this.hitTimer.tick(millis);
        this.useTimer.tick(millis);
        this.stunTimer.tick(millis);
        this.selectedTimer.tick(millis);

        //Updates based on player state
        this.activeState.update(this, millis);

        //Inventory item updates -- only the active item and items with explicit update hooks
        this.inventory.activeItem().update(millis, this);
        for(let hu of this.hookUpdate) {
            hu.update(millis, this);
        }

        if(this.activeState != this.states.dead && this.pos.y>game.tiles.dimH+3) {
            this.die();
        }

        this.lastVel = new Vec2(this.vel);
        //Move player
        game.tiles.move(this, millis); //TODO: there are some weird edge cases here when the collision involves diagonal moves (or large moves)



    }

    walkCheck(millis, running) {
        // left
        if(this.controlStates['left']) {
            this.vel.x = Math.max(-this.topSpeed*(running? 2.0:1.0), this.vel.x - 1.0/1600*millis/15);
            this.facing = -1;
        }
        else {
            if(this.vel.x<0)
                this.vel.x = 0;
        }

        // right
        if(this.controlStates['right']) {
            this.vel.x = Math.min(this.topSpeed*(running? 2.0:1.0), this.vel.x + 1.0/1600*millis/15);
            this.facing = 1;
        }
        else {
            if(this.vel.x>0)
                this.vel.x = 0;
        }
        // up
        if(this.controlStates['up']) {
            this.vel.y = Math.max(-this.topSpeed*(running? 2.0:1.0), this.vel.y - 1.0/1600*millis/15);
            // this.facing = -1;
        }
        else {
            if(this.vel.y<0)
                this.vel.y = 0;
        }

        // down
        if(this.controlStates['down']) {
            this.vel.y = Math.min(this.topSpeed*(running? 2.0:1.0), this.vel.y + 1.0/1600*millis/15);
            // this.facing = 1;
        }
        else {
            if(this.vel.y>0)
                this.vel.y = 0;
        }
    }

    cycleInventoryCheck(millis) {
        //cycle inventory
        if(this.controlStates["cycle"] && !this.oldControlStates["cycle"]) {
            let item = this.inventory.next();
            this.selectedTimer.reset(500);
            this.selectedSprite = item.sprite;
            this.aiming = false;
            this.use(0);
        }   
    }

    fallCheck(millis) {
        // check falling -- player is falling unless they are in contact with a block below them
        // let isFalling = true;
        // for(let t of game.tiles.contacters(this.bounds())) {
        //     if(t.standable && this.vel.y>=0 && t.y==this.bounds().bottom && game.tiles.above(t).passable) { //TODO: this should be some sort of tile-specific standing on class
        //         isFalling=t.stoodOnBy(this, this.lastVel);
        //         if(!isFalling) break;
        //     }
        // }
        // return isFalling;
        return false;
    }

    runCheck() {
        // running
        if(!this.controlStates['run']) this.running = false;
        else this.running = true;
    }

    jumpCheck() {
        // jump
        if(!this.oldControlStates['jump'] && this.controlStates['jump']){
            this.vel.y = -this.jumpSpeed;
            this.setState(this.states.falling);
            this.jumpTimer.reset(200);
            return;
        }
    }

    entityInteract() {
        for(let k=0;k<game.items.length;k++) {
            if(this.bounds().collide(game.items[k].bounds())) {
                game.items[k].entityCollide(this);
                if(!this.aiming) {
                    if(this.controlStates['up']) {
                        game.items[k].entityInteract(this, 'up');
                    }
                    if(this.controlStates['down']) {
                        game.items[k].entityInteract(this, 'down');
                    }
                }
            }
        }

    }

    tileInteract(millis) {
        if(this.controlStates['up']) {
            let t=game.tiles.closestTile(this.bounds());
            if(!(t instanceof Void)) {
                t.entityInteract(this,'up');
            }
        }
        if(this.controlStates['down']) {
            let t=game.tiles.closestTile(this.bounds());
            if(!(t instanceof Void)) {
                t.entityInteract(this,'down');
                let tdown = game.tiles.below(t);
                if(!(tdown instanceof Void) && tdown.y==this.bounds().bottom) //can interact with things below you that you are standing on like ladders
                {
                    tdown.entityInteract(this,'down');
                }
            }
            let adj = 0 //fall if standing on a standable and pressed down
            for(let tbelow of game.tiles.contacters(this.bounds())) { //TODO: more efficient to just check for the one or two tiles the player could be standing on
                if(this.bounds().bottom==tbelow.y) {
                    if(tbelow.standable && tbelow.passable) {
                        //If the tile is standable but passable we'll allow the play to nudge down
                        adj = 1;
                    } else if(!tbelow.passable && this.bounds().bottom==tbelow.y && game.tiles.above(tbelow).passable){
                        //Standing on a tile that's not passable and the tile above it is passable means we shouldn't fall through  
                        //so we won't nudge and break immediately.
                        adj = 0;
                        break;
                    }
    
                }
            }
            //Apply the nudge
            this.pos.y += adj*0.01;
        }
    }

    setState(state) {
        this.activeState.exit(this);
        this.activeState = state;
        this.activeState.entry(this);
        this.stateTimer.reset();
    }
}
