
//Global control states affected by all controllers
controlStates = {
    'left': false,
    'right': false,
    'up':false,
    'down':false,
    'cycle':false,
    'use':false,
    'jump':false,
    'camera':false,
    'menu':false,
};
controlStates0 = {... controlStates};
oldControlStates = {... controlStates};
newControlStates = {... controlStates};

lastController = null;

defaultKeyMap = {
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'a': 'left',
    'd': 'right',
    'w': 'up',
    's': 'down',
    'j': 'jump',
    'k': 'use',
    'l': 'cycle',
    'i': 'run',
    'u': 'door',
    ' ': 'jump',
    'z': 'use',
    'x': 'cycle',
    'c': 'run',
    'v': 'door',
    '0': 'camera',
    'Escape': 'menu',
}

// page up	33
// Space	32
// page down	34
// end	35
// home	36
// arrow left	37
// arrow up	38
// arrow right	39
// arrow down	40

// numpad 0	96
// numpad 1	97
// numpad 2	98
// numpad 3	99
// numpad 4	100
// numpad 5	101
// numpad 6	102
// numpad 7	103
// numpad 8	104
// numpad 9	105
// multiply	106
// add	107
// subtract	109
// decimal point	110
// divide	111

defaultKeyMap2 = {
    'a': 'left', //keypad left
    'd': 'right', //keypad right
    'w': 'up', //keypad up
    's': 'down', //keypad down
    ',': 'cycle', //keypad -
    'm': 'use', //keypad +
    ' ': 'jump', //keypad enter
    '0': 'camera',
    'Escape': 'menu',
}


class Controller {
    constructor() {
        this.controlStates = {... controlStates0}
        this.attach_to_player();
        window.addEventListener('blur', e=>{
            this.clearPressedAll();
        });
    }
    attach_to_player(player=null) {
        this.player = player;
        lastController = this;
        if(player!=null) {
            this.player.controller = this;
        }
    }
    set(action, state=true) {
        controlStates[action] = state;
        lastController = this; 
        let player = this.player;
        if(player!=null) {
            player.controlStates[action] = state;
        }
    }
    clearPressedAll() {
        for(const c in this.controlStates) {
            this.controlStates[c] = false;
        }
    }
    vibrate(intensity1, intensity2, duration) {

    } 
}

class KeyboardController extends Controller {
    constructor(keyMap=null) {
        super();
        if(keyMap==null)
            keyMap = defaultKeyMap;
        this.keyMap = keyMap;
        let that = this;
        document.onkeydown = function(e) {that.keyDownHandler(e)};
        document.onkeyup = function(e) {that.keyUpHandler(e)};
    }
    keyDownHandler(e){
        if(e.key=="p") { //Keyboard only shortcuts
            game.fillScreen = !game.fillScreen;
            game.updateWindowSize();
        }
        if(e.key=="f") {
            game.showFPS = !game.showFPS;
            game.updateWindowSize();
        }
        if(e.key=="G") { //capital G to avoid accidental keypress
            game.cullOffCamera = !game.cullOffCamera;
        }
        if(e.key in this.keyMap)
            this.set(this.keyMap[e.key], true);
    }
    keyUpHandler(e){
        if(e.key in this.keyMap)
            this.set(this.keyMap[e.key], false);
    }
}

class GamepadController extends Controller {
    constructor(gamepad) {
        super();
        this.gamepad = gamepad;
        this.thresh = 0.2;
        this.internalStates = {... this.controlStates};
    }
    set(action, state=true) {
        if(this.internalStates[action]==state)
            return;
        this.internalStates[action] = state;
        super.set(action, state);
    }   
//    e.gamepad.index, e.gamepad.id,
//    e.gamepad.buttons.length, e.gamepad.axes.length);
    vibrate(intensity1, intensity2, duration) {
        if(game.activePlayers.length==1) {
            //default vibration does not support intensity -- could simulate by staggering pulses over the duration
            window.navigator.vibrate(duration); 
        }
        if(this.gamepad.vibrationActuator!=null) {
            this.gamepad.vibrationActuator.playEffect('dual-rumble', 
                {
                    startDelay: 0,
                    duration: duration,
                    weakMagnitude: intensity1,
                    strongMagnitude: intensity2 });
        }
        //Firefox version
        //Need to check there are two vibrators
        //gamepad.hapticActuators[0].pulse(intensity1, duration);
        //gamepad.hapticActuators[1].pulse(intensity2, duration);

        //Also apply global vibration in a single player game (TODO: Turn off by default so we don't duplicate calls unnecessarily?)
    }
}

class GamepadManager {
    gamepads = {};
    constructor() {
        let that = this;
        window.addEventListener("gamepadconnected", function(e){that.connected(e)});
        window.addEventListener("gamepaddisconnected", function(e){that.disconnected(e)});
    }
    connected(e) {
        this.gamepads[e.gamepad.index] = new GamepadController(e.gamepad);
    }
    disconnected(e) {
        let g = this.gamepads[e.gamepad.index];
        if(g.player!=null) {
            g.player.dead = true;
            g.player.dropFromGame = true;
        }
        delete this.gamepads[e.gamepad.index];
    }
    update_gamepad_states() {
        let gps = navigator.getGamepads(); 
        if(gps==null)
            return;
        for(let g of gps) {
            if(g==null)
                continue;
            let c = this.gamepads[g.index];
            c.gamepad = g; //put the latest state in the gamepad object
            c.set("jump",this.buttonPressed(g.buttons[0]));
            c.set("cycle",this.buttonPressed(g.buttons[1]) || this.buttonPressed(g.buttons[6]));
            c.set("use",this.buttonPressed(g.buttons[2]) || this.buttonPressed(g.buttons[7]));
            c.set("door",this.buttonPressed(g.buttons[3]) || this.buttonPressed(g.buttons[4]));
            c.set("run",this.buttonPressed(g.buttons[5]));
            c.set("camera", this.buttonPressed(g.buttons[12]));
            c.set("menu", this.buttonPressed(g.buttons[9]));
            c.set("left",g.axes[0]<-c.thresh && (g.axes[0]<-0.5*Math.abs(g.axes[1])));
            c.set("right",g.axes[0]>c.thresh && (g.axes[0]>0.5*Math.abs(g.axes[1])));
            c.set("up",g.axes[1]<-c.thresh && (g.axes[1]<-0.5*Math.abs(g.axes[0])));
            c.set("down",g.axes[1]>c.thresh    && (g.axes[1]>-0.5*Math.abs(g.axes[0])));
        }
    }
    buttonPressed(b) {
        if (typeof(b) == "object")
            return b.pressed;
        return b == 1.0;
    }
    attach_all_to_player(player) {
        for(let g of Object.keys(this.gamepads))
            this.gamepads[g].attach_to_player(player);
    }
    release_all_players() {
        for(let g of Object.keys(this.gamepads))
            this.gamepads[g].attach_to_player();
    }
}

class TouchController extends Controller {
    constructor() {
        super();
        this.canvas = document.getElementById("canvas");
        let canvas = this.canvas
        // Register touch event handlers
        let that = this;
        canvas.addEventListener('touchstart', function(ev){that.process_touchstart(ev);}, false);
        canvas.addEventListener('touchmove', function(ev){that.process_touchmove(ev);}, false);
        canvas.addEventListener('touchcancel', function(ev){that.process_touchend(ev);}, false);
        canvas.addEventListener('touchend', function(ev){that.process_touchend(ev);}, false);
        document.addEventListener('backbutton', function(ev){that.process_back(ev);}, true);
        navigator.app
        this.dPad = [-1,0,0];
        this.butJump = [-1,0,0];
        this.butInv = [-1,0,0];
        this.butUse = [-1,0,0];
        this.butCamera = [-1,0,0];
    }
    process_back(ev) {
        console.log('Back pressed', ev)
        let state = true;
        this.set("menu", state); //TODO: true or false depend on ev state
    }
    // touchstart handler
    process_touchstart(ev) {
        // Use the event's data to call out to the appropriate gesture handlers
        let canvas = this.canvas;
        let t = ev.touches[0];
        for(let t of ev.changedTouches) { 
            if(t.clientX<0.5*canvas.width) {
                if(t.clientY>0.33*canvas.height) this.dPad = [t.identifier, t.clientX, t.clientY];
                else {
                    this.set("camera");
                    this.butCamera = [t.identifier, t.clientX, t.clientY];
                }
            } else {
                if(t.clientY>0.66*canvas.height) {
                    this.set("jump");
                    this.butJump = [t.identifier, t.clientX, t.clientY];
                }
                else if(t.clientY<0.33*canvas.height) {
                    this.set("cycle");
                    this.butInv = [t.identifier, t.clientX, t.clientY];
                }
                else {
                    this.set("use");
                    this.butUse = [t.identifier, t.clientX, t.clientY];
                }
            }
        }   
        ev.preventDefault();
    }
    // touchmove handler
    process_touchmove(ev) {
        // Set call preventDefault()
        for(let t of ev.changedTouches) { 
            if(t.identifier == this.dPad[0]) {
                let x=this.dPad[1];
                let y=this.dPad[2];
                for(let k of ["left","right","up","down","run","camera"])
                    this.set(k, false);
                this.set("left", t.clientX<x-0.1*game.tileSize  && (t.clientX-x<-0.5*Math.abs(t.clientY-y)))
                this.set("right", t.clientX>x+0.1*game.tileSize && (t.clientX-x>0.5*Math.abs(t.clientY-y)));
                this.set("up", t.clientY<y-0.1*game.tileSize    && (t.clientY-y<-0.5*Math.abs(t.clientX-x)));
                this.set("down", t.clientY>y+0.1*game.tileSize  && (t.clientY-y>0.5*Math.abs(t.clientX-x)));
                this.set("run", t.clientX<x-game.tileSize || t.clientX>x+game.tileSize
                                || t.clientY>y+game.tileSize || t.clientY<y-game.tileSize);
            }
        }
        ev.preventDefault();
    }
    // touchend handler
    process_touchend(ev) {
        for(let t of ev.changedTouches) {
            if(t.identifier==this.dPad[0]) {
                for(let k of ["left","right","up","down"])
                    this.set(k,false);
                this.dPad=[-1,0,0];
            }
            if(t.identifier==this.butInv[0])
                this.set("cycle", false);
            if(t.identifier==this.butUse[0])
                this.set("use", false);
            if(t.identifier==this.butJump[0])
                this.set("jump", false);
            if(t.identifier==this.butCamera[0])
                this.set("camera", false);
        }
        ev.preventDefault();
    }
    vibrate(intensity1, intensity2, duration) {
        window.navigator.vibrate(duration); //default vibration does not support intensity -- could simulate by staggering pulses over the duration
    }
}