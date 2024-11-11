//@ts-check

import { choose, Rect, Vec2 } from "./util";
import { baseSetIds, tileIds } from "./sprites";
import { InventoryItem } from "./inventory";
import { Entity } from "./entity";
import { TrapBlade } from "./entity_items";
import { Player } from "./player";
/**@typedef {import('./game').Game} Game */

export class Tile extends Rect {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {[number, number]} sprite 
     * @param {boolean} passable 
     * @param {boolean} climbable 
     */
    constructor(x, y, sprite = null, passable = true, climbable = false) {
        super([x, y, 1, 1])
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
    constructor(pos, sprite = null) {
        super(pos[0], pos[1], sprite, true, false);
    };

}

export class BeachLower extends Tile {
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos[0], pos[1], sprite, true, false);
    };
}

export class BeachUpper extends Tile {
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachUpper;
        }
        super(pos[0], pos[1], sprite, true, false);
    };
}

export class WaterShallow extends Tile {
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos[0], pos[1], sprite, true, false);
    }
    draw(game) {
        super.draw(game);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
    }
}

export class WaterDeep extends Tile {
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = baseSetIds.BeachLower;
        }
        super(pos[0], pos[1], sprite, true, false);
    }
    draw(game) {
        super.draw(game);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
        game.sprites.base.draw(baseSetIds.Water, this.x, this.y);
    }
}

export class Floor extends Tile {
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = tileIds.Floor;
        }
        super(pos[0], pos[1], sprite, true, false);
    };
}

export class Wall extends Tile {
    constructor(pos, sprite = null) {
        if (sprite == null) {
            sprite = tileIds.Wall;
        }
        super(pos[0], pos[1], sprite, false, false);
    }
    bounds() {
        return new Rect([this.x, this.y, 1, 0.25]);
    }
}

export class Ledge extends Tile {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.Ledge, true, false);
    };
    get standable() {
        return true;
    }
}

export class Entrance extends Floor {
    constructor(pos) {
        super(pos);
    }
    /**
     * 
     * @param {Game} game 
     * @param {Entity} entity 
     * @param {string} action 
     */
    entityInteract(game, entity, action) {
        //        if(game.level>1) return;
        if (entity instanceof Player) {
            if (entity.isPlayer && action == 'up' && game.level == entity.startLevel && entity.controlStates["up"] && !entity.oldControlStates["up"]) {
                entity.cycleSprite(game);
            }

        }
    }
}

export class Exit extends Tile {
    constructor(pos, locked = false) {
        super(pos[0], pos[1], locked ? tileIds.LockedExit : tileIds.Exit, true);
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

    entityInteract(game, entity, action) {
        if (game.competitiveMode && game.levelTime > game.startLevelTime / 2)
            return;
        if (entity.isPlayer && action == 'up' && entity.controlStates["up"] && !entity.oldControlStates["up"]) {
            entity.escaped = true;
            game.playSound('exitLevel');
            if (game.competitiveMode)
                entity.score += 2;
        }
    }
}

export class Kiosk extends Tile {

}

export class KioskScreen extends Kiosk {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.KioskScreen, true, false);
        /**@type {InventoryItem[]} */
        this.items = [];
        /**@type {InventoryItem|null} */
        this.activeItem = null;
        this.used = new Set();
    }
    draw(game) {
        super.draw(game);
        // if(this.activeItem!=null)
        //     this.activeItem.draw(game);
    }
}

export class KioskDispenser extends Kiosk {
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
        this.screen.activeItem = this.activeItem >= 0 ? this.items[this.activeItem] : null;
    }
    entityInteract(game, entity, action) {
        if (!entity.isPlayer)
            return;
        if (this.used.has(entity))
            return;
        if (action == "down" && entity.controlStates["down"] && !entity.oldControlStates["down"]) {
            game.playSound('kioskInteract');
            this.activeItem = this.activeItem < this.items.length - 1 ? this.activeItem + 1 : 0;
        }
        if (this.activeItem >= 0 && action == "up" && entity.controlStates["up"] && !entity.oldControlStates["up"]) {
            if (this.items.length == 0)
                return;
            this.items[this.activeItem].activate(entity);
            //            this.items.splice(this.activeItem,1);
            //            this.activeItem = this.activeItem>0? this.activeItem-1:0;
            this.used.add(entity);
            this.activeItem = -1;
            game.playSound('kioskDispense');
        }
        this.screen.activeItem = this.activeItem >= 0 ? this.items[this.activeItem] : null;
    }
}

export class GunPlatformJunction extends Tile {
    constructor(pos) {
        super(pos[0], pos[1], tileIds.Wall, false, false);
    }
    /**
     * 
     * @param {Game} game 
     */
    initItems(game) {
        if (game.tiles.below(this.pos).tile.passable) {
            // game.monsters.push(new GunPlatform(this));
        }
    }
}

export class TrapBlock extends Tile {
    constructor(pos, type = null) {
        super(pos[0], pos[1], tileIds.TrapBlock, false, false);
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
            this.trap = new TrapBlade(this);
            game.items.push(this.trap);
        }
    }
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

export class Tree extends Tile {
    constructor(pos, type, map, height = 3, level = 1) {
        //TODO: This manipulates the map unlike all other tile class constructors
        let sprite;
        let climbable;
        let t = map.above(pos);
        switch (type) {
            case 'apple':
                sprite = level == 1 ? tileIds.TrunkBox : (level == height || !t.passable ? tileIds.AppleTreeTop : tileIds.Trunk);
                climbable = level == height - 1;
                break;
            case 'maple':
                sprite = level == 1 ? tileIds.TrunkBox : (level == height || !t.passable ? tileIds.TreeTop : tileIds.Trunk);
                climbable = level == height - 1;
                break;
            case 'pine':
                sprite = level == 1 ? tileIds.PineBox : (level == height || !t.passable ? tileIds.PineTop : tileIds.PineMid);
                climbable = level < height;
                break;
        }
        super(pos[0], pos[1], sprite, true, climbable);
        this.climingLevel = 1;
        this.treeAbove = (level < height && t.passable) ? map.set(t, Tree, type, map, height, level + 1) : null;
    }
    destroy() {
        if (this.treeAbove != null) {
            this.treeAbove.destroy();
        }
    }
}

