//@ts-check

import { Tile, Void } from "./tile.js";
import { shuffle, Vec2 } from "./util";


export class TileStepper {
    /**
     * 
     * @param {TileMap} tilemap 
     * @param {Tile} tile 
     * @param {Vec2} pos 
     */
    constructor(tilemap, tile, pos) {
        this.tilemap = tilemap;
        this.tile = tile;
        this.pos = pos;
    }
    /**
     * 
     * @param {number} dx 
     * @param {number} dy 
     * @returns 
     */
    move(dx, dy) {
        const pos = new Vec2([this.pos[0]+dx,this.pos[1]+dy]);
        const tile = this.tilemap.at(pos);
        return new TileStepper(this.tilemap, tile, pos);
    }
    left() {
        return this.move(-1, 0);
    }
    right() {
        return this.move(1, 0);
    }
    above() {
        return this.move(0,-1);
    }
    below() {
        return this.move(0, 1);
    }
    replace(tile, ...extraArgs) {
        this.tilemap.set(this.pos, tile, ...extraArgs);
        this.tile = tile;
        return this;
    }
    /**
     * 
     * @param {number} dx 
     * @param {number} dy 
     * @returns 
     */
    getNeighbor(dx, dy){
        return this.move(dx, dy);
    }

    getAdjacentNeighbors(){
        return shuffle([
            this.getNeighbor(0, -1),
            this.getNeighbor(0, 1),
            this.getNeighbor( -1, 0),
            this.getNeighbor(1, 0)
        ]);
    }

    getAdjacentPassableNeighbors(){
        return this.getAdjacentNeighbors().filter(t => t.tile.passable);
    }

    getConnectedTiles(){
        /**@type {TileStepper[]} */
        let connectedTiles = [this];
        /**@type {TileStepper[]} */
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
}

/**
 * @extends {Array<Array<Tile>>}
 */
export class TileMap extends Array {
    /**
     * 
     * @param {number} dimW 
     * @param {number} dimH 
     */
    constructor(dimW, dimH) {
        super()
        const zero = new Vec2([0,0])
        /**@type {Tile} */
        this.startTile = new Void(zero);
        /**@type {Tile} */
        this.kioskTile = new Void(zero);
        /**@type {Tile} */
        this.endTile = new Void(zero);
        /** @type {number} */
        this.dimW = dimW
        /** @type {number} */
        this.dimH = dimH
        for(let i=0;i<dimW;i++) {
            this[i] = [];
            for(let j=0;j<dimH;j++)
                this[i][j] = new Tile(i,j);
        }
    }
    isValidPos(vec){
        if(vec!=null&&vec[0]>=0&&vec[0]<this.dimW&&vec[1]>=0&&vec[1]<this.dimH)
            return true;
        return false;
    }
    at(vec) {
        if(this.isValidPos(vec))
            return this[vec[0]][vec[1]];
        return new Void(vec);
    }
    set(vec, tileType, ...extraArgs) {
        if(!this.isValidPos(vec))
            return null;
        let t = new tileType(vec, ...extraArgs);
        this[vec[0]][vec[1]] = t;
        return t;
    }
    fillRect(rect, tileType) {
        for(let p of this.iterRectPos(rect))
            this.set(p, tileType);
    }
    fillCircle(pos, radius, tileType) {
        for(let p of this.iterRange(pos, radius)) {
            this.set(p, tileType)
        }
    }
    leftOf(vec) {
        return new TileStepper(this, this.at([vec[0], vec[1]]), vec).left();
    }
    rightOf(vec) {
        return new TileStepper(this, this.at([vec[0], vec[1]]), vec).right();
    }
    above(vec) {
        return new TileStepper(this, this.at([vec[0], vec[1]]), vec).above();
    }
    below(vec) {
        return new TileStepper(this, this.at([vec[0], vec[1]]), vec).below();
    }
    *iterAllPos() {
        for(let i=0;i<this.dimW;i++)
            for(let j=0;j<this.dimH;j++)
                yield new Vec2([i,j]);
    }
    *iterRectPos(rect) {
        for(let i=Math.max(rect.x,0);i<Math.min(rect.right, this.dimW);i++)
            for(let j=Math.max(rect.y,0);j<Math.min(rect.bottom, this.dimH);j++) 
                yield new Vec2([i,j]);
    }
    *iterAll() {
        for(let i=0;i<this.dimW;i++)
            for(let j=0;j<this.dimH;j++)
                yield this.at([i,j]);
    }
    *iterRect(rect) {
        for(let i=rect.x;i<rect.right;i++)
            for(let j=rect.y;j<rect.bottom;j++) {
                let tile = this.at([i,j]);
                if(!(tile instanceof Void))
                    yield tile;
            }
    }
    *iterRectBorder(rect) {
        for(let i=rect.x;i<rect.right;i++) {
            let tile = this.at([i,rect.y]);
            if(!(tile instanceof Void))
                yield tile;
            tile = this.at([i,rect.bottom-1]);
            if(!(tile instanceof Void))
                yield tile;
        }
        for(let j=rect.y;j<rect.bottom;j++) {
            let tile = this.at([rect.x,j]);
            if(!(tile instanceof Void))
                yield tile;
            tile = this.at([rect.right-1,j]);
            if(!(tile instanceof Void))
                yield tile;
            }
    }
    *iterRange(pos, radius) {
        for(let i=Math.floor(pos[0]-radius);i<=Math.ceil(pos[0]+radius);i++)
            for(let j=Math.floor(pos[1]-radius);j<=Math.ceil(pos[1]+radius);j++)
                if(Math.hypot(pos[0]-i,pos[1]-j)<=radius) {
                    let tile = this.at([i,j]);
                    if(!(tile instanceof Void))
                        yield tile;
                }
    }
    *colliders(rect) { 
        for(let tile of this.iterRange([rect.center_x-0.5,rect.center_y-0.5], 1.5)) //TODO: Assumes that object is bounded within a 1 tile high and wide
            if(tile.collide(rect))
                yield tile;
    }
    *contacters(rect) {
        for(let tile of this.iterRange([rect.center_x-0.5,rect.center_y-0.5], 1.5)) //TODO: Assumes that object is bounded within a 1 tile high and wide
            if(tile.contact(rect))
                yield tile;
    }
    *iterRandom(rect = null, ttype=null, nntype=null, maxn = 1) {
        let iter = rect==null ? this.iterAllPos() : this.iterRectPos(rect);
        for (let pos of shuffle(Array.from(iter)))
            if(ttype==null || this.at(pos) instanceof ttype)
                if(nntype==null || !(this.numNeighbors(pos, nntype)<=maxn))
                    yield pos;
    }
    hasNeighbors(pos, ntype) {
        for(let n of this.iterRange(pos, 1.5))
            if(this.at(n) instanceof ntype)
                return true;
        return false;
    }
    numNeighbors(pos, ntype, radius=1.5) {
        let count = 0
        for(let n of this.iterRange(pos, radius))
            if(this.at(n) instanceof ntype)
                count+=1;
        return count;
    }
    closestTile(rect) {
        return this.at([Math.round(rect.center_x-0.5),Math.round(rect.center_y-0.5)]);
    }
    closestPos(rect) {
        return new Vec2([Math.round(rect.x),Math.round(rect.y)]);
    }
    move(monster, millis=15, vel=null) { //TODO: probably belongs in monster class
        if(vel==null) {
            vel = new Vec2(monster.vel);
        }
        let new_posy = monster.pos.add([0,vel.y*millis]);
        let new_boundsy = monster.bounds(new_posy);
        for(let tile of this.colliders(new_boundsy)) {
            if(tile.passable)
                continue;
            if(vel.y>0 && new_boundsy.bottom>tile.y) {//collide below
                new_posy.y -= new_boundsy.bottom - tile.y;
                vel.y = 0;
                monster.vel.y = 0;
                new_boundsy = monster.bounds(new_posy)
            }
            if(vel.y<0 && new_boundsy.y<tile.bottom) {//collide above
                new_posy.y += tile.bottom - new_boundsy.y;
                vel.y = 0;
                monster.vel.y = 0;
                new_boundsy = monster.bounds(new_posy)
            }
        }
        let new_posx = new_posy.add([vel.x*millis,0]);
        let new_boundsx = monster.bounds(new_posx);
        for(let tile of this.colliders(new_boundsx)) {
            if(tile.passable)
                continue;
            if(vel.x>0 && new_boundsx.right>tile.x) {//collide right
                new_posx.x -= new_boundsx.right - tile.x;
                vel.x = 0;
                monster.vel.x = 0;
                new_boundsx = monster.bounds(new_posx)
            }
            if(vel.x<0 && new_boundsx.x<tile.right) {//collide left
                new_posx.x += tile.right - new_boundsx.x;
                vel.x = 0;
                monster.vel.x = 0;
                new_boundsx = monster.bounds(new_posx)
            }
        }
        monster.pos = new Vec2([new_posx.x,new_posy.y])
    }
}
