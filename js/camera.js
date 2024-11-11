//@ts-check
import { Vec2, Rect } from "./util";
import { Player } from "./player";

export class Camera extends Rect {
    constructor() {
        super([0, 0, 14, 8]);
        /**@type {boolean} */
        this.scrollable = true;
        /**@type {Player|null} */
        this.focusPlayer = null;
    }
    get viewPortH() {
        return this.h;
    }
    set viewPortH(val) {
        this.h = val;
    }
    get viewPortW() {
        return this.w;
    }
    set viewPortW(val) {
        this.w = val;
    }
    get pos() {
        return new Vec2([-this.x, -this.y])
    }
    set pos(vec) {
        if (vec != null) {
            this.x = -vec.x;
            this.y = -vec.y;
        } else {
            this.x = null;
            this.y = null;
        }
    }
    /**
     * 
     * @param {number} millis 
     */
    update(game, millis) {
        if (this.scrollable) {
            let numPlayers = 0;
            let posx = 0;
            let posy = 0;
            for (let p of game.activePlayers) {
                // Loop over active players (not dead or escaped) and update focusPlayer and collect average x, y position
                if (!p.dead && !p.escaped) {
                    if (this.focusPlayer == null || this.focusPlayer.dead || this.focusPlayer.escaped) this.focusPlayer = p;
                    if (p.controlStates['camera'] && !p.oldControlStates['camera']) this.focusPlayer = p;
                    posx += p.pos.x;
                    posy += p.pos.y;
                    numPlayers++;
                }
            }
            if (this.focusPlayer === null) {
                this.focusPlayer = game.activePlayers[0]; //TODO: If all players drop, potentially this is an empty list
            }
            if (numPlayers > 0) {
                posx /= numPlayers;
                posy /= numPlayers;
            }
            if (numPlayers == 0) {
                posx = this.focusPlayer.pos.x;
                posy = this.focusPlayer.pos.y;
            }
            if (numPlayers > 1 && (Math.abs(this.focusPlayer.pos.x - posx) > this.viewPortW / 2 - 1 || Math.abs(this.focusPlayer.pos.y - posy) > this.viewPortH / 2 - 1)) {
                posx = this.focusPlayer.pos.x;
                posy = this.focusPlayer.pos.y;
            }
            let sx = (-posx - 0.5 + this.viewPortW / 2);
            let sy = (-posy - 0.5 + this.viewPortH / 2);
            sx = Math.max(Math.min(sx, 0), -game.dimW + this.viewPortW);
            sy = Math.max(Math.min(sy, 0), -game.dimH + this.viewPortH);
            if (this.x == null || this.y == null) {
                this.pos = new Vec2([sx, sy]);
            }
            else {
                let dx = sx - this.pos.x;
                let dy = sy - this.pos.y;
                let k = 0.2 * (millis / 15);
                let m = Math.max(Math.abs(dx), Math.abs(dy));
                if (this.pos != null && m > k) {
                    this.pos = new Vec2([this.pos.x + dx * k / m, this.pos.y + dy * k / m]);
                } else {
                    this.pos = new Vec2([sx, sy]);
                }
            }
            game.shakeX = Math.floor(-this.x * game.tileSize);
            game.shakeY = Math.floor(-this.y * game.tileSize);
        }
    }
    draw() {

    }
}