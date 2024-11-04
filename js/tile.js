class Tile extends Rect {
    constructor(x, y, sprite=null, passable=true, climbable=false){
        super([x,y,1,1])
        this.sprite = sprite;
        this.passable = passable;
        this.climbable = climbable;
        this.climbSpeed = 1.0/300;
        this.hp = 100;
    }
    get standable() {
        return !this.passable || this.climbable
    }
    stoodOnBy(entity, vel) {
        return !this.standable;
    }
    replace(newTileType, ...extraArgs){
        return game.tiles.set(this.pos, newTileType, ...extraArgs);
    }
    bounds() {
        return new Rect([this.x, this.y, 1, 1]);
    }
    //manhattan distance
    dist(other){
        return Math.abs(this.x-other.x)+Math.abs(this.y-other.y);
    }

    getNeighbor(dx, dy){
        return game.tiles.at([this.x + dx, this.y + dy])
    }

    getAdjacentNeighbors(){
        return shuffle([
            this.getNeighbor(0, -1),
            this.getNeighbor(0, 1),
            this.getNeighbor(-1, 0),
            this.getNeighbor(1, 0)
        ]);
    }

    getAdjacentPassableNeighbors(){
        return this.getAdjacentNeighbors().filter(t => t.passable);
    }

    getConnectedTiles(){
        let connectedTiles = [this];
        let frontier = [this];
        while(frontier.length){
            let neighbors = frontier.pop()
                                .getAdjacentPassableNeighbors()
                                .filter(t => !connectedTiles.includes(t));
            connectedTiles = connectedTiles.concat(neighbors);
            frontier = frontier.concat(neighbors);
        }
        return connectedTiles;
    }

    draw(){
        if(this.sprite!=null) {
            game.sprites.base.draw(this.sprite, this.x, this.y);
        }
    }

    entityInteract(entity, action) {
    }
    initItems() {
    }
    hit(damage, type) {
    }
}

class Void extends Tile {
    constructor(pos, sprite=null){
        super(pos[0], pos[1], sprite, true, false);
    };

}

class BeachLower extends Tile {
    constructor(pos, sprite=null){
        if(sprite==null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos[0], pos[1], sprite, true, false);
    };
}

class BeachUpper extends Tile {
    constructor(pos, sprite=null){
        if(sprite==null) {
            sprite = baseSetIds.BeachUpper;
        }
        super(pos[0], pos[1], sprite, true, false);
    };
}

class WaterShallow extends Tile {
    constructor(pos, sprite=null) {
        if(sprite==null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos[0], pos[1], sprite, true, false);
    }
    draw() {
        super.draw();
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
    }
}

class WaterDeep extends Tile {
    constructor(pos, sprite=null) {
        if(sprite==null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos[0], pos[1], sprite, true, false);
    }
    draw() {
        super.draw();
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
    }
}

class Floor extends Tile{
    constructor(pos, sprite=null){
        if(sprite==null) {
            sprite = tileIds.Floor;
        }
        super(pos[0], pos[1], sprite, true, false);
    };
}

class Wall extends Tile{
    constructor(pos, sprite=null){
        if(sprite==null) {
            sprite = tileIds.Wall;
        }
        super(pos[0], pos[1], sprite, false, false);
    }
    bounds() {
        return new Rect([this.x, this.y, 1, 0.25]);
    }
}

class Ledge extends Tile{
    constructor(pos){
        super(pos[0], pos[1], tileIds.Ledge, true, false);
    };
    get standable() {
        return true;
    }
}

class DisappearingWall extends Wall {
    constructor(pos, sprite=null){
        super(pos, sprite);
        this.triggered = false;
    }
    stoodOnBy(entity, vel) {
        if(entity.isPlayer && !this.triggered) {
            game.items.push(new Boom(this, 2000));
            this.triggered = true;
        }
        return !this.standable;
    }
    hit(damage, type) {
        if(!this.triggered && (type=='blunt' || type=='cut')) {
            game.items.push(new Boom(this, 2000));
            this.triggered = true;
        }
    }
}

class Ladder extends Tile {
    constructor(pos, sprite=null){
        if(sprite==null) {
            sprite = tileIds.Ladder;
        }
        super(pos[0], pos[1], sprite, true, true);
    };

    entityInteract(entity, action) { //This will start or stop climbing. the actual motion is handled by the player object
        if(entity.isPlayer && (action == 'up' || action == 'down')) {
            entity.setState(entity.states.climbing);
        }
    }

}

class Entrance extends Floor {
    constructor(pos){
        super(pos);
    }
    entityInteract(entity, action) {
//        if(game.level>1) return;
        if(entity.isPlayer && action=='up' && game.level==entity.startLevel && entity.controlStates["up"] && !entity.oldControlStates["up"]){
            entity.cycleSprite();
        }
    }
}

class Exit extends Tile{
    constructor(pos, locked=false){
        super(pos[0], pos[1], locked?tileIds.LockedExit:tileIds.Exit, true);
        this._locked=locked
    }

    draw(){
        if(game.competitiveMode && game.levelTime>game.startLevelTime/2) {
            game.sprites.tiles.draw(tileIds.LockedExit, this.x, this.y);
            return;
        }
        if(this.sprite!=null)
            game.sprites.tiles.draw(this.sprite, this.x, this.y);
    }
    
    set locked(val){
        this.sprite = val?tileIds.LockedExit:tileIds.Exit;
        this._locked = val;
    }

    entityInteract(entity, action) {
        if(game.competitiveMode && game.levelTime>game.startLevelTime/2)
            return;
        if(entity.isPlayer && action == 'up' && entity.controlStates["up"] && !entity.oldControlStates["up"]){
            entity.escaped = true;
            game.playSound('exitLevel');
            if(game.competitiveMode)
                entity.score += 2;
        }
    }
}

class Kiosk extends Tile {

}

class KioskScreen extends Kiosk {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.KioskScreen, true, false); 
        this.items = [];
        this.activeItem = -1;
        this.used = new Set();
    }
    draw() {
        super.draw();
        if(this.activeItem!=null)
            this.activeItem.draw();
    }
}

class KioskDispenser extends Kiosk {
    constructor(pos, kioskScreen) {
        super(pos[0], pos[1], tileIds.KioskDispenser, true, false); 
        this.items = [];
        this.activeItem = -1;
        this.used = new Set();
        this.screen = kioskScreen;
    }
    setItems(items) {
        this.items = items.map(Item => new Item(this.screen))
//        this.items = [];
//        for(let i of items)
//            this.items.push(new i(this.screen));
        this.activeItem = -1;
        this.screen.activeItem = this.activeItem>=0? this.items[this.activeItem]: null;
    }
    entityInteract(entity, action) {
        if(!entity.isPlayer)
            return;
        if(this.used.has(entity))
            return;
        if(action=="down" && entity.controlStates["down"] && !entity.oldControlStates["down"]) {
            game.playSound('kioskInteract');
            this.activeItem = this.activeItem<this.items.length-1? this.activeItem+1:0;
        }
        if(this.activeItem>=0 && action=="up" && entity.controlStates["up"] && !entity.oldControlStates["up"]) {
            if(this.items.length==0)
                return;
            this.items[this.activeItem].activate(entity);
//            this.items.splice(this.activeItem,1);
//            this.activeItem = this.activeItem>0? this.activeItem-1:0;
            this.used.add(entity);
            this.activeItem = -1;
            game.playSound('kioskDispense');
        }
        this.screen.activeItem = this.activeItem>=0? this.items[this.activeItem]: null;
    }
}

class PlatformJunction extends Tile {
    constructor(pos, firstTile=null){
        super(pos[0], pos[1], tileIds.Floor, true, false);
        this.firstTile = firstTile;
    }
    initItems() {
        if(this.firstTile!=null) {
            game.items.push(new MovingPlatform(this, this.firstTile));
        }
    }
}

class GunPlatformJunction extends Tile {
    constructor(pos){
        super(pos[0], pos[1], tileIds.Wall, false, false);
    }
    initItems() {
        if(game.tiles.below(this).passable) {
            game.monsters.push(new GunPlatform(this));
        }
    }
}

class TrapBlock extends Tile {
    constructor(pos, type = null){
        super(pos[0], pos[1], tileIds.TrapBlock, false, false);
        if(type == null) {
            type = choose(['cycling', 'contact', 'static']);
        }
        this.type = type;
        this.extendedTime = 2000; //cycle time or time that the trap is exended
        this.retractedTime = 2000; //cycle time or time that the trap is exended
        this.extendTime = 500;
        this.contactDelay = 500;
        this.timeOffset = 0;
        this.boundingBox = new Rect([0.25,0.5,0.5,0.5])
        this.triggered = false;
        this.trap = null;
        this.damage = 1;
    }
    initItems() {
        if(game.tiles.above(this).passable) {
            this.trap = new TrapBlade(this);
            game.items.push(this.trap);
        }
    }
    stoodOnBy(entity, vel) {
        if(entity.isPlayer && !this.triggered && this.trap!=null) {
            this.trap.triggered = true;
        }
        return !this.standable;
    }
    draw() {
        if(this.trap!=null) {
            this.trap.drawAsTile(); //Render the blade beneath the tile -- this is a bit of a kludge
        }
        super.draw()
    }
}

class Tree extends Tile {
    constructor(pos, type, map, height=3, level=1) {
        //TODO: This manipulates the map unlike all other tile class constructors
        let sprite;
        let climbable;
        let t = map.above(pos);
        switch(type) {
            case 'apple':
                sprite = level==1? tileIds.TrunkBox : (level==height || !t.passable ? tileIds.AppleTreeTop: tileIds.Trunk);
                climbable = level==height-1;
                break;
            case 'maple':
                sprite = level==1? tileIds.TrunkBox : (level==height || !t.passable ? tileIds.TreeTop: tileIds.Trunk);
                climbable = level==height-1;
                break;
            case 'pine':
                sprite = level==1? tileIds.PineBox : (level==height || !t.passable ? tileIds.PineTop: tileIds.PineMid);
                climbable = level<height;
                break;
        }
        super(pos[0], pos[1], sprite, true, climbable);
        this.climingLevel = 1;
        this.treeAbove = (level<height && t.passable)? map.set(t, Tree, type, map, height, level+1) : null;
    }
    destroy() {
        if(this.treeAbove != null) {
            this.treeAbove.destroy();
        }
    }
}

class Vine extends Tile {
    constructor(pos, map, sprite, level=1) {
        sprite = level>1? sprite: tileIds.VineTerminator;
        super(pos[0], pos[1], sprite, true, true);
        this.climingLevel = 0;
        this.branches = [];
        if(level<=1) {
            return;
        }
        let t;
        switch(sprite) {
            case tileIds.VineBox:
            case tileIds.VineUp:
            case tileIds.VineLeftUp:
            case tileIds.VineRightUp:
                t = map.above(pos);
                if(t.passable && !(t instanceof Vine)) {
                    let options = [tileIds.VineTerminator];
                    let t0 = map.above(t)
                    if(t0.passable && !(t0 instanceof Vine) ) {
                        options = [tileIds.VineUp];
                        t0 = map.at([t[0]-1,t[1]])
                        if(t0.passable && !(t0 instanceof Vine))
                            options.push(tileIds.VineBranchLeft);
                        t0 = map.at([t[0]+1,t[1]])
                        if(t0.passable && !(t0 instanceof Vine))
                            options.push(tileIds.VineBranchRight);
                    }
                    let spr = shuffle(options)[0];
                    t = (t.passable)? map.set(t, Vine, map, spr, level-1) : null;
                    if (t!=null)
                        this.branches.push(t);
                }
                break;
            case tileIds.VineBranchLeft:
                t = map.above(pos);
                t = (t.passable)? map.set(t, Vine, map, tileIds.VineUp, level-1) : null
                if (t!=null)
                    this.branches.push(t);
                t = map.leftOf(pos);
                t = (t.passable)? map.set(t, Vine, map, tileIds.VineLeftUp, level) : null
                if (t!=null)
                    this.branches.push(t);
                break;
            case tileIds.VineBranchRight:
                t = map.above(pos);
                t = (t.passable)? map.set(t, Vine, map, tileIds.VineUp, level-1) : null;
                this.branches.push(t);
                t = map.rightOf(pos);
                t = (t.passable)? map.set(t, Vine, map, tileIds.VineRightUp, level) : null;
                this.branches.push(t);
                break;
        }
    }
    entityInteract(entity, action) { //This will start or stop climbing. the actual motion is handled by the player object
        if(entity.isPlayer && (action == 'up' || action == 'down')) {
            entity.setState(entity.states.climbing);
        }
    }
}

class Bush extends Tile { //bounce if you land on it ?
    constructor(pos, sprite=null, map=null, size=1) {
        if(sprite==null) {
            sprite = choose([tileIds.Bush, tileIds.BerryBush]);
        }
        super(pos[0], pos[1], sprite, false, false);
        this.hp = 1;
        if(map!=null && size>1) {
            for(let t of map.iterRange(pos, size)) {
                if(t.passable) {
                    map.set(t, Bush, sprite, map, 1);
                }
            }
        }
    }
    stoodOnBy(entity, vel) {
        if(vel.y>0.5*entity.jumpSpeed && !entity.controlStates['down']) {
            if(entity.isPlayer && entity.controlStates['jump']) {
                entity.vel.y = Math.min(-1.2*vel.y, 2.0*entity.jumpSpeed);
            } else {
                entity.vel.y = -0.8*vel.y;
            }
            return true;
        }
    }
    hit(damage, type) {
        if(type=='blunt' || type=='cut') {
            this.hp -= damage;
            if(this.hp<=0) {
                this.replace(Floor);
            }
        }
    }
}

class WaterTank extends Tile {
    constructor(pos, map, direction=1, firstHalf=null) {
        if(firstHalf!=null) {
            sprite = direction>0? tileIds.WaterTankRight: tileIds.WaterTankLeft;
            super(pos[0], pos[1], sprite, true, false);
            this.otherHalf = firstHalf;
            return;
        }
        if(direction>0) {
            sprite = tileIds.WaterTankLeft;
            super(pos[0], pos[1], sprite, true, false);    
            let t = map.rightOf(pos);
            if(t.passable) {
                this.otherHalf = map.set(t, WaterTank, map, direction, this);
            }
        } else {
            sprite = tileIds.WaterTankRight;
            super(pos[0], pos[1], sprite, true, false);    
            let t = map.leftOf(pos);
            this.otherHalf = map.set(t, WaterTank, map, direction, this);
        }
    }
    destroy(map) {
        map.replace(this, Floor);
        if(map.at(this.otherHalf) == this.otherHalf) {
            oh.destroy(map);
        }
    }
    get standable() {
        return true;
    }

}

class Locker extends Tile {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.LockerClosed, true, false); 
        this.used = new Set();
    }
    entityInteract(entity, action) {
        if(!entity.isPlayer)
            return;
        if(this.used.has(entity))
            return;
        if(action=="up" && entity.controlStates["up"] && !entity.oldControlStates["up"]) {
            game.playSound('rocketReload');
            entity.resources.replenish(true, true, true);
            this.used.add(entity);            
        }
        let numUsed=0;
        for(let p of game.activePlayers) {
            if(this.used.has(p)) {
                numUsed++;
            }
        }
        if(numUsed == game.activePlayers.length) {
            this.sprite = tileIds.LockerOpen;
        }
    }

}

class RazorWire extends Tile {

}

class Schematics extends Tile {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.BluePrint, true, false); 
    }
}

class PotionDesk extends Tile {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.Potions, true, false); 
        this.used = false;
    }
}

class BurnerDesk extends Tile {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.Burner, true, false); 
        this.active = false;
    }
}

class CryoChamber extends Tile {
    constructor(pos, map, height=1, maxSize=3, allTiles=null) {
        if(!map.above(pos).passable) {
            maxSize = height;
        }
        let sprite = height==1? tileIds.CryoBottom : (height==maxSize? tileIds.CryoTop: tileIds.CryoMiddle);
        super(pos[0], pos[1], sprite, true, false);
        this.canStand = maxSize==height;
        if(allTiles == null) {
            allTiles = [];
        } 
        allTiles.push(this);
        this.allTiles = allTiles;
        if(height<maxSize) {
            let t = map.above(pos);
            if(t.passable) {
                map.set(t, CryoChamber, map, height+1, maxSize);
            }
        }
    }
    destroy(map) {
        for(let t of this.allTiles) {
            map.replace(t, Floor);
        }
    }
    get standable() {
        return this.canStand;
    }

}

class DirtPile extends Wall {
    constructor(pos, map=null, sprite=null) {
        if(sprite==null) {
            sprite = choose([tileIds.Dirt1, tileIds.Dirt2, tileIds.Dirt3]);
        }
        super(pos, sprite);
        this.hp = getRandomInt(1,6)/2;
        if(map!=null) {
            let b = map.below(pos);
            if(b.y<=map.dimH && b.passable) b.replace(DirtPile, map);
            let bl = map.leftOf(b);
            if(bl.y<=map.dimH && bl.passable) bl.replace(DirtPile, map);
            let br = map.rightOf(b);
            if(br.y<=map.dimH && br.passable) br.replace(DirtPile, map);
        }
    }
    hit(damage, type) {
        if(type=='blunt') {
            this.hp -= damage;
            if(this.hp<=0) {
                this.replace(Floor);
            }
        }
    }

}

class DrillBlock extends Floor {
    constructor(pos) {
        super(pos);
        this.activated = false;
    }
    entityInteract(entity, action) { 
        if(!this.activated && entity.isPlayer && action == 'up') {
            game.items.push(new ActiveDrill(this));
            this.activated = true;
        }
    }
    draw() {
        super.draw();
        if(!this.activated) game.sprites.tiles.draw(tileIds.Drill1, this.x, this.y);
    }
}