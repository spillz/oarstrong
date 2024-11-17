//@ts-check

import { choose, Rect, Vec2 } from "./util";
import { baseSetIds, tileIds } from "./sprites";
import { KioskPickup } from "./kioskitems";
/**@typedef {import('./entity').Entity} Entity */
/**@typedef {import('./inventory').InventoryItem} InventoryItem */
/**@typedef {import('./player').Player} Player */
/**@typedef {import('./game').Game} Game */

/**@typedef {Vec2|[number,number]|number[]} VecLike */


export class Tile extends Rect {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     * @param {boolean} passable 
     * @param {boolean} climbable 
     */
    constructor(pos, sprite = null, passable = true, climbable = false) {
        super([pos[0], pos[1], 1, 1])
        /**@type {[number,number]} */
        this.sprite = sprite;
        /**@type {boolean} */
        this.passable = passable;
        /**@type {boolean} */
        this.climbable = climbable;
        /**@type {number} */
        this.climbSpeed = 1.0 / 300;
        /**@type {number} */
        this.hp = 100;
    }
    get standable() {
        return !this.passable || this.climbable
    }
    stoodOnBy(entity, vel) {
        return !this.standable;
    }
    bounds() {
        return new Rect([this.x, this.y, 1, 1]);
    }
    //manhattan distance
    dist(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    /**
     * 
     * @param {Game} game 
     */
    draw(game) {
        if (this.sprite != null) {
            game.sprites.base.draw(this.sprite, this.x, this.y);
        }
    }

    /**
     * 
     * @param {Game} game 
     * @param {Player} player 
     * @param {string} action 
     */
    playerInteract(game, player, action) {
    }
    /**
     * 
     * @param {Game} game 
     * @param {Entity} entity 
     * @param {string} action 
     */
    entityInteract(game, entity, action) {
    }
    /**
     * 
     * @param {Game} game 
     */
    initItems(game) {
    }
    /**
     * 
     * @param {Game} game 
     * @param {Vec2} pos 
     * @param {number} damage 
     * @param {string} type 
     */
    hitFrom(game, pos, damage, type) {
    }
}

export class Void extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        super(pos, sprite, true, false);
    };

}

export class BeachLower extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos, sprite, true, false);
    };
}

export class BeachUpper extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachUpper;
        }
        super(pos, sprite, true, false);
    };
}

export class Palm extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachUpper;
        }
        super(pos, sprite, false, false);
        this.palmSprite = baseSetIds.Palm;
    };
    bounds() {
        return new Rect([this.x + 0.25,  this.y + 0.1, 0.5, 0.8]);
    }
    draw(game) {
        super.draw(game);
        game.sprites.base.draw(this.palmSprite, this.x, this.y, false);
    }
    
}

export class WaterShallow extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos, sprite, true, false);
    }
    draw(game) {
        super.draw(game);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
    }
}

export class WaterDeep extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos, sprite, true, false);
    }
    draw(game) {
        super.draw(game);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
    }
}

export class Floor extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = tileIds.Floor;
        }
        super(pos, sprite, true, false);
    };
}

export class Wall extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {[number, number]} sprite 
     */
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = tileIds.Wall;
        }
        super(pos, sprite, false, false);
    }
    bounds() {
        return new Rect([this.x, this.y, 1, 0.25]);
    }
}

export class Ledge extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     */
    constructor(pos) {
        super(pos, tileIds.Ledge, true, false);
    };
    get standable() {
        return true;
    }
}

export class Entrance extends Floor {
    /**
     * 
     * @param {VecLike} pos 
     */
    constructor(pos) {
        super(pos);
    }
    /**@type {Tile['playerInteract']} */
    playerInteract(game, player, action) {
        if (player.isPlayer && action == 'up' && game.level == player.startLevel && 
            player.controlStates["up"] && !player.oldControlStates["up"]) {
            player.cycleSprite(game);
        }
    }
}

export class Exit extends Tile {
    /**
     * 
     * @param {VecLike} pos 
     * @param {boolean} locked 
     */
    constructor(pos, locked = false) {
        super(pos, locked ? tileIds.LockedExit : tileIds.Exit, true);
        this._locked = locked
    }

    draw(game) {
        if (game.competitiveMode && game.levelTime > game.startLevelTime / 2) {
            game.sprites.tiles.draw(tileIds.LockedExit, this.x, this.y);
            return;
        }
        if (this.sprite != null)
            game.sprites.tiles.draw(this.sprite, this.x, this.y);
    }

    set locked(val) {
        this.sprite = val ? tileIds.LockedExit : tileIds.Exit;
        this._locked = val;
    }

    /**@type {Tile['playerInteract']} */
    playerInteract(game, player, action) {
        if (game.competitiveMode && game.levelTime > game.startLevelTime / 2)
            return;
        if (action == 'up' && player.controlStates["up"] && !player.oldControlStates["up"]) {
            player.escaped = true;
            game.playSound('exitLevel');
            if (game.competitiveMode)
                player.score += 2;
        }
    }
}

export class Kiosk extends Tile {

}

export class KioskScreen extends Kiosk {
    /**
     * 
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, tileIds.KioskScreen, true, false);
        /**@type {KioskPickup[]} */
        this.items = [];
        /**@type {KioskPickup|null} */
        this.activeItem = null;
        /**@type {Set<Player>} */
        this.used = new Set();
    }
    draw(game) {
        super.draw(game);
        if(this.activeItem!=null)
            this.activeItem.draw(game);
    }
}

export class KioskDispenser extends Kiosk {
    /**
     * 
     * @param {VecLike} pos 
     * @param {KioskScreen} kioskScreen 
     */
    constructor(pos, kioskScreen) {
        super(pos, tileIds.KioskDispenser, true, false);
        /**@type {KioskPickup[]} */
        this.items = [];
        /**@type {number|null} */
        this.activeItem = -1;
        /**@type {Set<Player>} */
        this.used = new Set();
        /**@type {KioskScreen} */
        this.screen = kioskScreen;
    }
    setItems(items) {
        this.items = items.map(Item => new Item(this.screen))
        //        this.items = [];
        //        for(let i of items)
        //            this.items.push(new i(this.screen));
        this.activeItem = -1;
        this.screen.activeItem = this.activeItem >= 0 ? this.items[this.activeItem] : null;
    }
    /**
     * 
     * @param {Game} game 
     * @param {Player} player 
     * @param {string} action 
     * @returns 
     */
    playerInteract(game, player, action) {
        if (this.used.has(player))
            return;
        if (action == "down" && player.controlStates["down"] && !player.oldControlStates["down"]) {
            game.playSound('kioskInteract');
            this.activeItem = this.activeItem < this.items.length - 1 ? this.activeItem + 1 : 0;
        }
        if (this.activeItem >= 0 && action == "up" && player.controlStates["up"] && !player.oldControlStates["up"]) {
            if (this.items.length == 0)
                return;
            this.items[this.activeItem].activate(player);
            //            this.items.splice(this.activeItem,1);
            //            this.activeItem = this.activeItem>0? this.activeItem-1:0;
            this.used.add(player);
            this.activeItem = -1;
            game.playSound('kioskDispense');
        }
        this.screen.activeItem = this.activeItem >= 0 ? this.items[this.activeItem] : null;
    }
}

export class GunPlatformJunction extends Tile {
    /**
     * 
     * @param {Vec2} pos 
     */
    constructor(pos) {
        super(pos, tileIds.Wall, false, false);
    }
    /**
     * 
     * @param {Game} game 
     */
    initItems(game) {
        if (game.tiles.below(this.pos).tile.passable) {
            game.addGunPlatform(this);
        }
    }
}

export class TrapBlock extends Tile {
    /**
     * 
     * @param {Vec2} pos 
     * @param {'cycling'|'contact'|'static'} type 
     */
    constructor(pos, type = null) {
        super(pos, tileIds.TrapBlock, false, false);
        if (type == null) {
            type = choose(['cycling', 'contact', 'static']);
        }
        this.type = type;
        this.extendedTime = 2000; //cycle time or time that the trap is exended
        this.retractedTime = 2000; //cycle time or time that the trap is exended
        this.extendTime = 500;
        this.contactDelay = 500;
        this.timeOffset = 0;
        this.boundingBox = new Rect([0.25, 0.5, 0.5, 0.5])
        this.triggered = false;
        this.trap = null;
        this.damage = 1;
    }
    /**@type {Tile['initItems']} */
    initItems(game) {
        if (game.tiles.above(this.pos).tile.passable) {
            this.trap = game.addTrapBlade(this);
        }
    }
    /**@type {Tile['stoodOnBy']} */
    stoodOnBy(entity, vel) {
        if (entity.isPlayer && !this.triggered && this.trap != null) {
            this.trap.triggered = true;
        }
        return !this.standable;
    }
    /**@type {Tile['draw']} */
    draw(game) {
        if (this.trap != null) {
            this.trap.drawAsTile(game); //Render the blade beneath the tile -- this is a bit of a kludge
        }
        super.draw(game);
    }
}

