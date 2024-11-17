//@ts-check
import { Vec2, Rect } from './util';
import { Tile } from './tile';
/**@typedef {import('./game').Game} Game */

export class Entity {
    /**
     * 
     * @param {Tile} tile 
     * @param {[number, number]|[number,number,number,number]} sprite 
     */
    constructor(tile, sprite) {
        /**@type {Vec2} */
        this.pos = new Vec2([0, 0]);
        /**@type {Vec2} */
        this.vel = new Vec2([0, 0]);
        /**@type {Vec2} */
        this.oldVel = new Vec2([0, 0]);
        /**@type {number} */
        this.angle = 0;
        /**@type {boolean} */
        this.isPlayer = false;
        /**@type {Vec2} */
        this.size = new Vec2([1, 1]);
        /**@type {Rect} */
        this.boundingBox = new Rect([0.25, 0.25, 0.5, 0.5]);
        /**@type {Rect[]} */
        this.boundingBoxes = [];
        /**@type {number} */
        this.facing = 1;
        /**@type {boolean} */
        this.falling = false;
        /**@type {boolean} */
        this.canFall = true;
        /**@type {boolean} */
        this.dead = false; //flag for removal
        /**@type {[number, number]|[number,number,number,number]} */
        this.sprite = sprite;
        /**@type {Rect} */
        this.hitBox = new Rect(this.boundingBox);

        this.move(tile);
        /**@type {Vec2} */
        this.oldPos = new Vec2(this.pos);
    }

    /**
     * 
     * @param {number[]|Vec2|Rect} pos 
     */
    move(pos) {
        if (pos !== null) {
            this.pos = new Vec2([pos[0], pos[1]]);
        }
        else {
            this.pos = new Vec2([-1, -1]);
        }
    }

    rotatedBoundingBox(rotatePt = null, angle = null, flipped = null, center = null, size = null) {
        //Rotates a bounding box to account for angle and flip of a sprite
        // angle -- amount of rotation in degrees (relative the the orientation 0 = right if not flipped, or left if flipped)
        // flipped -- true if sprite is flipped on x axis
        // rotatePt -- coordinates around which image is rotated (defaults to center of sprite)
        // center -- coordinates of the center of the bounding box to be rotated (defaults to center of this.boundingBox)
        // size -- size of the final bounding box (defaults to size of this.bound_box)
        flipped = flipped == null ? this.getFlipped() : flipped;
        angle = angle == null ? this.angle : angle;
        if (rotatePt == null) {
            rotatePt = this.sprite.length == 2 ? [0.5, 0.5] : [0.5 * this.sprite[2], 0.5 * this.sprite[3]];
        }
        if (center == null) {
            center = [this.boundingBox[0] + this.boundingBox[2] / 2, this.boundingBox[1] + this.boundingBox[3] / 2];
        }
        if (size == null) {
            size = this.boundingBox.slice(2, 4);
        }

        let dx = (center[0] - rotatePt[0]) * (1 - 2 * flipped);
        let dy = center[1] - rotatePt[1]; //TODO: Handle flipping?
        let c = Math.cos(angle / 180 * Math.PI);
        let s = Math.sin(angle / 180 * Math.PI);
        //Coordinates for the original upper left and low right points of the rect after rotation
        let adx = -(dx - dx * c + dy * s);
        let ady = -(dy - dx * s - dy * c);
        // Returns the rect with dimensions size, centered at the rotated center point.
        return new Rect([(center[0] - rotatePt[0]) * (1 - 2 * flipped) + rotatePt[0] + adx - size[0] / 2, center[1] + ady - size[1] / 2, size[0], size[1]]);

    }

    bounds(pos = null, bb = null) {
        if (pos == null) {
            pos = this.pos;
        }
        if (bb == null) {
            bb = this.boundingBox != null ? this.boundingBox : this.boundingBoxes[0];
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

    /**
     * 
     * @param {Game} game 
     */
    draw(game) {
        game.sprites.base.draw([this.sprite[0], this.sprite[1]], this.getDisplayX(), this.getDisplayY(), this.getFlipped());
    }

    draw_bounds(game) {
        if (this.boundingBox != null) {
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
            for (let b of this.boundingBoxes) {
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

    /**
     * 
     * @param {Game} game 
     * @param {Entity} entity 
     * @param {'up'|'down'} action
     */
    entityInteract(game, entity, action) {
    }

    /**
     * 
     * @param {Game} game 
     * @param {Entity} entity 
     */
    entityCollide(game, entity) {
    }

    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    update(game, millis) {
    }

}

