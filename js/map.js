//@ts-check
import { Treasure } from "./entity_items";
import { Jelly } from "./monster";
import { BeachLower, BeachUpper, Floor, KioskDispenser, KioskScreen, Palm, Wall, WaterDeep, WaterShallow } from "./tile";
import { TileMap } from "./tilemap";
import { choose, getRandomInt, randomRange, Rect, tryTo, Vec2 } from "./util";
/**@typedef {import('./game').Game} Game */
/**@typedef {import('./tile').Tile} Tile */

/**
 * 
 * @param {Game} game 
 */
export function generateLevel(game) {
    generateTiles(game);

    game.monsters = [];
    generateMonsters(game, game.tiles.startTile.pos);

    game.items = [];
    game.cells = 3 + Math.floor(game.level / 5);
    game.cellsCollected = 0;
    for (let i = 0; i < game.cells; i++) {
        game.items.push(new Treasure(randomPassableTile(game.tiles)));
    }

    for (let t of game.tiles.iterAll()) {
        t.initItems(game);
    }
}

function buildLab(tiles, quad) {
    let ctr = quad.w * quad.h / 40;
    for (let boxPos of tiles.iterRandom(quad, Floor, Wall, 1)) {
        if (!tiles.below(boxPos).passable && tiles.above(boxPos).passable) {
            let bioType = getRandomInt(4);
            switch (bioType) {
                // case 0:
                //     tiles.set(boxPos, Schematics);
                //     break;
                // case 1:
                //     tiles.set(boxPos, PotionDesk);
                //     break;
                // case 2:
                //     tiles.set(boxPos, BurnerDesk);
                //     break;
                // case 3:
                //     tiles.set(boxPos, CryoChamber, tiles, 1, getRandomInt(3,5));
                //     break;    
            }
            ctr--;
        }
        if (ctr <= 0) {
            break;
        }
    }
}

function buildWarzone(tiles, quad) {
    // let ctr=getRandomInt(quad.w*quad.h/40, quad.w*quad.h/5);
    // for(let boxPos of tiles.iterRandom(quad, Wall, null, 1)) {
    //     tiles.set(boxPos, choose([Wall,DisappearingWall]), choose([tileIds.ShotWall1, tileIds.ShotWall2, tileIds.BlastedWall1, tileIds.BlastedWall1]));
    //     ctr--;
    //     if(ctr<=0) break;
    // }
    // ctr=getRandomInt(quad.w*quad.h/40, quad.w*quad.h/10);
    // for(let boxPos of tiles.iterRandom(quad, Ladder, null, 1)) {
    //     tiles.set(boxPos, Ladder, choose([tileIds.BlastedLadder1, tileIds.BlastedLadder2]));
    //     ctr--;
    //     if(ctr<=0) break;
    // }
    // ctr=getRandomInt(quad.w*quad.h/80, quad.w*quad.h/10);
    // for(let boxPos of tiles.iterRandom(quad, Floor, null, 1)) {

    //     if(!tiles.below(boxPos).passable && tiles.above(boxPos).passable) {
    //         tiles.set(boxPos, Floor, choose([tileIds.Debris1, tileIds.BlastedPillar]));
    //         ctr--;
    //     }
    //     if(ctr<=0) break;
    // }
}

function buildMine(tiles, quad) {
    // let ctr=getRandomInt(3);
    // for(let boxPos of tiles.iterRandom(quad, Floor, Wall, 1)) {
    //     tiles.set(boxPos, DirtPile, tiles);
    //     dspot = getRandomInt(2)>0 ? tiles.rightOf(boxPos) : tiles.leftOf(boxPos);
    //     dspot.replace(DrillBlock);
    //     ctr--;
    //     if(ctr<=0) break;
    // }
}


function buildGarden(tiles, quad) {
    // let ctr=quad.w*quad.h/40;
    // for(let boxPos of tiles.iterRandom(quad, Floor, Wall, 1)) {
    //     if(!tiles.below(boxPos).passable && tiles.above(boxPos).passable) {
    //         let bioType = getRandomInt(8);
    //         switch(bioType) {
    //             case 0:
    //             case 1:
    //                 tiles.set(boxPos, Vine, tiles, tileIds.VineBox, 10);
    //                 break;
    //             case 2:
    //                 tiles.set(boxPos, Tree, 'apple', tiles, 3, 1);
    //                 break;
    //             case 3:
    //                 tiles.set(boxPos, Tree, 'maple', tiles, 3, 1);
    //                 break;
    //             case 4:
    //                 tiles.set(boxPos, Tree, 'pine', tiles, 4, 1);
    //                 break;    
    //             case 5:
    //                 tiles.set(boxPos, Bush, null, tiles, 2);
    //                 break;    
    //             case 6:
    //                 tiles.set(boxPos, Floor, tileIds.FlowerBox);
    //                 break;    
    //             case 7:
    //                 tiles.set(boxPos, Floor, tileIds.PlantBox);
    //                 break;        
    //             }

    //         ctr--;
    //     }
    //     if(ctr<=0) {
    //         break;
    //     }
    // }
}

function buildRoom(tiles, quad, spiky = false) {
    // let ledgeRarity=Math.max(10-game.level,3);
    // let disRarity=Math.max(10-game.level,3);
    // let platRarity=Math.max(10-game.level,3);
    // let trapRarity=Math.max(10-game.level,3);
    // let gunRarity=Math.max(10-game.level,3);
    // let filled = 0
    // let maxFilled = getRandomInt(0.1*quad.w*quad.h,0.3*quad.w*quad.h);
    // for(pos of tiles.iterRandom(quad, Floor, Wall, 1)) {
    //     if(filled>maxFilled)
    //         break;
    //     let posn = new Vec2(pos);
    //     let n = tiles.numNeighbors(posn, Wall);
    //     let ttype = (getRandomInt(0,disRarity)?Wall:DisappearingWall)
    //     let maxLen = quad.right-posn.x
    //     let minLen = 1;
    //     if(maxLen>7) {
    //         ttype = getRandomInt(0,platRarity)? ttype:PlatformJunction;
    //         minLen = 7;
    //     }
    //     ttype = getRandomInt(0,trapRarity)? ttype:TrapBlock;
    //     if (tiles.below(pos) instanceof Floor) {
    //         ttype = getRandomInt(0,gunRarity)? ttype:GunPlatformJunction;
    //     }
    //     ttype = getRandomInt(0,ledgeRarity)? ttype:Ledge;
    //     let i = 0;
    //     let maxi = ((ttype==GunPlatformJunction || ttype==TrapBlock && !spiky)? 1: getRandomInt(minLen, maxLen));
    //     let firstTile = null;
    //     while(n<=1 && i<maxi) {
    //         if(i!=maxi/2){ 
    //             let t;
    //             if(ttype==PlatformJunction && i==0) {
    //                 t=firstTile = tiles.set(posn, ttype);
    //             } else if(ttype==PlatformJunction && i==maxi-1) {
    //                 t=tiles.set(posn, ttype, firstTile);
    //             } else {
    //                 t=tiles.set(posn, ttype);
    //             }
    //             if(ttype==PlatformJunction) {
    //                 game.tiles.above(t).replace(ttype);
    //             }
    //             if(ttype==Ledge) {
    //                 let t = tiles.above(posn);
    //                 tiles.set(t, Floor);
    //                 filled += 1;
    //             }
    //             filled+=1;
    //         }
    //         else {
    //             tiles.set(posn, Ladder);
    //             for(let tl = tiles.below(posn);tl instanceof Floor || tl instanceof Ledge;tl=tiles.below(tl.pos)) {
    //                 tiles.set(tl, Ladder);
    //             }
    //         }
    //         posn = new Vec2([posn.x+1, posn.y]);
    //         i+=1;
    //         n += tiles.numNeighbors(posn, Wall);
    //     }
    // }
}

function buildCelledRooms(tiles, W, H, biome = 'base', wallType = Wall) {
    // //Draw border
    // for(let t of tiles.iterRectBorder(new Rect([0,0,W,H]))) {
    //     if(!(t instanceof wallType)) {
    //         tiles.set(t, wallType);
    //     }
    // }
    // let w = 0;
    // let rooms = [];
    // let rmin = 10;
    // let rmax = 20;
    // while(w<W) {
    //     roomW = W-w<2*rmin? W-w : getRandomInt(rmin, Math.min(rmax, W-w-rmin));
    //     w += roomW;
    //     //Draw vert wall
    //     for(let t of tiles.iterRectBorder(new Rect([w,0,1,H]))) {
    //         if(!(t instanceof wallType)) {
    //             tiles.set(t, wallType);
    //         }
    //     }
    //     let h = 0;
    //     while(h<H) {
    //         let holeStart, holeEnd;
    //         roomH = H-h<2*rmin? H-h : getRandomInt(rmin, Math.min(rmax, H-h-rmin));
    //         h += roomH;
    //         //Punch hole in left vert wall -- todo: do both sides except far ends
    //         if(w>roomW) {
    //             holeEnd = getRandomInt(1 , 4);
    //             holeStart  = getRandomInt(h-roomH+1, h-holeLen);
    //             for(let t of tiles.iterRectBorder(new Rect([w-roomW,holeStart,1,holeLen]))) {
    //                 if(!(t instanceof Floor)) {
    //                     tiles.set(t, Floor);
    //                 }
    //             }
    //         }
    //         //Punch hole in vert wall -- todo: do both sides except far ends
    //         if(w<W) {
    //             holeLen = getRandomInt(1 , 4);
    //             holeStart  = getRandomInt(h-roomH+1, h-holeLen);
    //             for(let t of tiles.iterRectBorder(new Rect([w,holeStart,1,holeLen]))) {
    //                 if(!(t instanceof Floor)) {
    //                     tiles.set(t, Floor);
    //                 }
    //             }
    //         }

    //         //Draw horiz wall
    //         for(let t of tiles.iterRectBorder(new Rect([w-roomW,h,roomW,1]))) {
    //             if(!(t instanceof wallType)) {
    //                 tiles.set(t, wallType);
    //             }
    //         }
    //         //Punch hole in top horiz wall -- todo: do both sides except far ends
    //         if(h>roomH) {
    //             holeLen = getRandomInt(1 , 4);
    //             holeStart  = getRandomInt(w-roomW+1, w-holeLen);
    //             for(let t of tiles.iterRectBorder(new Rect([holeStart,h-roomH,holeLen,1]))) {
    //                 if(!(t instanceof Floor)) {
    //                     tiles.set(t, Floor);
    //                 }
    //             }
    //         }
    //         //Punch hole in horiz wall -- todo: do both sides except far ends
    //         if(h<H) {
    //             holeLen = getRandomInt(1 , 4);
    //             holeStart  = getRandomInt(w-roomW+1, w-holeLen);
    //             for(let t of tiles.iterRectBorder(new Rect([holeStart,h,holeLen,1]))) {
    //                 if(!(t instanceof Floor)) {
    //                     tiles.set(t, Floor);
    //                 }
    //             }
    //         }

    //         rooms.push(new Rect([w-roomW, h-roomH, roomW, roomH]));
    //     }
    // }
    // for(let room of rooms) {
    //     buildRoom(tiles, room);
    // }
    // let rbiome = biome;
    // for(let room of rooms) {
    //     if(biome=='mixed') rbiome = choose(['platforms', 'spiky', 'mine', 'garden', 'warzone', 'lab']); 
    //     switch(rbiome) {
    //         case 'garden':
    //             buildGarden(tiles, room);
    //             break;
    //         case 'lab':
    //             buildLab(tiles, room);
    //             break;
    //         case 'warzone':
    //             buildWarzone(tiles, room);
    //             break;
    //         case 'mine':
    //             buildMine(tiles, room);
    //             break;
    //         }
    // }
    // return [rooms[0], rooms[rooms.length-1], choose(rooms)];
}

/**
 * 
 * @param {Game} game 
 */
function generateTiles(game) {
    // Main mapgen routine. This is a work in progress.
    // Set a biome and map shape
    // sub-divide space into rooms
    // populate individual rooms
    // set entrance, locker, kiosk and exit tiles
    // todo: should check pathing to make sure all can be accessed

    let biome = 'island';
    // let biome = choose(['platforms', 'spiky', 'garden', 'warzone', 'lab', 'mixed']); //'mine', 
    let mapShape;
    if (game.camera.scrollable && game.prefDimW == null && game.prefDimH == null) {
        mapShape = 0;
        switch (mapShape) {
            case 0:
                game.dimW = 30;
                game.dimH = 30;
                break;
        }
    }

    //Clear the level
    const W = game.dimW;
    const H = game.dimH;
    game.tiles = new TileMap(W, H);
    let tiles = game.tiles;
    tiles.fillRect(new Rect([0, 0, W, H]), WaterDeep);
    tiles.fillCircle([15, 15], 10.5, WaterShallow);
    tiles.fillCircle([15, 15], 8.5, BeachLower);
    tiles.fillCircle([16, 16], 3.5, BeachUpper);

    tiles.startTile = tiles.at([15, 15]);
    tiles.endTile = tiles.at([10, 10]);
    let kioskPos = [20, 20]
    let ks = tiles.above(new Vec2(kioskPos)).replace(KioskScreen).tile;
    let kt = tiles.get(kioskPos).replace(KioskDispenser).tile;
    tiles.kioskTile = kt;

    for(let i=0; i<5; i++) {
        let tile = randomPassableTile(tiles,new Vec2(tiles.startTile), false, false);
        if (tile!==undefined) {
            tiles.set(tile.pos, Palm);
        }
    }



}

/**
 * 
 * @param {TileMap} tiles 
 * @param {Vec2} playerPos 
 * @param {boolean} standable 
 * @param {boolean} standable_not_passable 
 * @returns 
 */
export function randomPassableTile(tiles, playerPos = null, standable = false, standable_not_passable = true) {
    /**@type {Tile|undefined} */
    let tile;
    tryTo('get random passable tile', function () {
        let x = randomRange(0, tiles.dimW - 1);
        let y = randomRange(0, tiles.dimH - 1);
        tile = tiles.at([x, y]);
        if (playerPos != null)
            return tile.passable && tile.pos.dist(playerPos) > 3;
        // return tile.passable && tile.pos.dist(playerPos)>3 && (!standable || game.tiles.below(tile).standable && !(standable_not_passable && game.tiles.below(tile).passable));
        else
            return true;
        // return tile.passable  && (!standable || game.tiles.below(tile).standable);
    });
    return tile;
}

/**
 * 
 * @param {Game} game 
 * @param {Vec2} playerPos 
 */
export function generateMonsters(game, playerPos) {
    let numMonsters = Math.min(2 * game.level, 15) + 5;
    for (let i = 0; i < numMonsters; i++) {
        spawnMonster(game, playerPos, false);
    }
}

/**
 * 
 * @param {Game} game
 * @param {Vec2} playerPos 
 * @param {boolean} standable 
 */
export function spawnMonster(game, playerPos = null, standable = false) {
    let m = [];
    m = [Jelly];
    // if(game.level<=5)
    //     m = [OneEye, OneEye, OneEye, OneEye, OneEye, OneEye, TwoEye, TwoEye, Tank];
    // else if(game.level<=10)
    //     m = [OneEye, OneEye, TwoEye, TwoEye, Tank];
    // else if(game.level<=15)
    //     m = [OneEye, OneEye, TwoEye, Tank];
    // else if(game.level<=20)
    //    m = [OneEye, OneEye, TwoEye, TwoEye, Tank, Eater];
    // else 
    //    m = [OneEye, TwoEye, Tank, Eater, Jester];
    let monsterType = choose(m);
    let monster = new monsterType(randomPassableTile(game.tiles, playerPos, standable));
    game.monsters.push(monster);
}