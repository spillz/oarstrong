//@ts-check

import { Rect } from "./util";
import * as controllers from "./controllers";
/**@typedef {import('./game').Game} Game */

export class Menu {
    constructor(options, dim, callback) {
        this.options = options;
        this.dim = new Rect(dim);
        this.activeOption=0;
        this.callback = callback;
        this.color = "DarkSeaGreen"
    }
    /**
     * 
     * @param {Game} game 
     */
    draw(game) {
        let row_size = Math.ceil(this.dim.h/this.options.length)
        let text_size = Math.ceil(this.dim.h/this.options.length/2)
        let y = this.dim.y;
        let center_x = this.dim.x + this.dim.w/2
        let i = 0;
        for(let o of this.options) {
            let opt = i==this.activeOption? ">"+o+"<":o;
            this.drawMenuText(game, opt, text_size, true, center_x, y, this.color);
            i+=1;
            y+=row_size;
        }
    }
    /**
     * 
     * @param {Game} game 
     * @param {string} text 
     * @param {number} size 
     * @param {boolean} centered 
     * @param {number} textX 
     * @param {number} textY 
     * @param {string} color 
     */
    drawMenuText(game, text, size, centered, textX, textY, color) {
        game.ctx.fillStyle = color;
        game.ctx.font = size + "px monospace";
        if(centered){
            textX = textX - game.ctx.measureText(text).width/2;
        }
        game.ctx.fillText(text, textX, textY);        
    }
    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    update(game, millis) {
        if(controllers.controlStates['up'] && !controllers.oldControlStates['up']) {
            this.activeOption = this.activeOption>0? this.activeOption-1 : this.options.length-1;
            this.callback(this,'change');
        }
        if(controllers.controlStates['down'] && !controllers.oldControlStates['down']) {
            this.activeOption = this.activeOption<this.options.length-1? this.activeOption+1 : 0;
            this.callback(this,'change');
        }
        if(controllers.controlStates['use'] && !controllers.oldControlStates['use'] || 
            controllers.controlStates['jump'] && !controllers.oldControlStates['jump'])
            this.callback(this,'select');
    }
}

export class MainMenu extends Menu {
    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        let dim = new Rect([0, game.canvas.height/2, game.canvas.width, 4*game.tileSize])
        super(['Play Game', 'High Scores', 'Options'], dim, (menu, action) => this.handler(game, menu, action));
    }
    /**
     * 
     * @param {Game} game 
     */
    updateWindowSize(game) {
        this.dim = new Rect([0, game.canvas.height/2, game.canvas.width, 4*game.tileSize]);
    }
    /**
     * 
     * @param {Game} game 
     * @param {Menu} menu 
     * @param {string} action 
     */
    handler(game, menu, action) {
        if(action === 'select') {
            switch(menu.activeOption) {
                case 0:
                    if(controllers.controlStates["left"]) {
                        game.prefDimW = 80;
                        game.prefDimH = 40; 
                        game.startLevelTime = 360000;
                    } else if(controllers.controlStates["right"]) {
                        game.prefDimW = 22;
                        game.prefDimH = 13; 
                        game.startLevelTime = 120000;
                    } else {
                        game.prefDimW = null;
                        game.prefDimH = null;
                        game.startLevelTime = 240000;
                    }
                    game.competitiveMode = false;
                    game.updateWindowSize();
                    game.startGame();
                    break;
                case 1:
                    game.gameState = 'scores'
                    break;
                case 2:
                    game.gameState = 'options'
                    break;
            }
        }
    }    
}


export class OptionsMenu extends Menu {
    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        let dim = new Rect([0, game.canvas.height/2, game.canvas.width, 0])
        super([], dim, (menu, action) => this.handler(game, menu, action));
    }
    /**
     * 
     * @param {Game} game 
     */
    updateWindowSize(game) {
        this.dim = new Rect([0, game.canvas.height/2, game.canvas.width, this.options.length*game.tileSize]);
    }
    /**
     * 
     * @param {Game} game 
     * @param {number} millis 
     */
    update(game, millis) {
        this.options = [
                'Pixel perfect scaling: '+(game.fillScreen?'OFF':'ON'),
                'Show framerate: '+(game.showFPS?'ON':'OFF'),
                'Sandbox mode: '+(game.sandboxMode?'ON':'OFF'),
//                'Key bindings',
//                'Touch controls',
//                'Gamepad 1',
                'Back'
            ];
        this.dim = new Rect([0, game.canvas.height/2, game.canvas.width, this.options.length*game.tileSize])
        super.update(game, millis);
    }
    /**
     * 
     * @param {Game} game 
     * @param {Menu} menu 
     * @param {string} action 
     */
    handler(game, menu, action) {
        if(action == 'select') {
            switch(menu.activeOption) {
                case 0:
                    game.fillScreen = !game.fillScreen;
                    game.updateWindowSize();
                    break;
                case 1:
                    game.showFPS = !game.showFPS;
                    break;
                case 2:
                    game.sandboxMode = !game.sandboxMode;
                    break;
                case 3:
                    game.gameState = 'title';
                    break;
                case 4:
                    break;
                case 5:
                    game.gameState = 'title';
                    break;
                }
        }
    }    
}

export class InGameMenu extends Menu {
    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        let dim = new Rect([0, game.canvas.height/2, game.canvas.width, 3*game.tileSize])
        super(['Continue', 'Drop Player', 'Exit to Main Menu'], dim, (menu, action) => this.handler(game, menu, action));
    }
    /**
     * 
     * @param {Game} game 
     */
    updateWindowSize(game) {
        this.dim = new Rect([0, game.canvas.height/2, game.canvas.width, this.options.length*game.tileSize]);
    }
    /**
     * 
     * @param {Game} game 
     * @param {Menu} menu 
     * @param {string} action 
     */
    handler(game, menu, action) {
        if(action == 'select') {
            switch(menu.activeOption) {
                case 0:
                    game.gameState = 'running';
                    break;
                case 1:
                    for(let p of game.activePlayers) {
                        if(p.controlStates['jump'] && !p.oldControlStates['jump']) {
                            p.dead = true;
                            p.dropFromGame = true;
                            game.gameState = 'running';
                        }
                    }
                    break;
                case 2:
                    game.gameState = 'title';
                    break;
                }
        }
    }    

}