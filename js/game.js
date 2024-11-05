class Game {
    constructor() {
        this.timer_tick = null;
        this.FPSframes = 0;
        this.FPStime = 0;
        this.FPS = 0;
        this.updateTimes = new MathArray([]);
        this.drawTimes = new MathArray([]);
        this.updateMean = 0;
        this.updateMax = 0;
        this.drawMean = 0;
        this.drawMax = 0;  

        this.camera = new Camera();
        this.fillScreen = false;
        this.dimW = this.prefDimW = 44;
        this.dimH = this.prefDimH = 26;
        this.uiWidth = 0; //width in tiles of non-game portion of screen
        this.uiHeight = 2; //height in tiles for non-game portion of screen
        this.tileSize = this.getTileScale()*16;

        this.sprites = {
            players: new SpriteSheet("sprites/players.png"),
            monsters: new SpriteSheet("sprites/monsters.png"),
            tiles: new SpriteSheet("sprites/tiles.png"),
            entitiesItems: new SpriteSheet("sprites/entities_and_items.png"),
            base: new SpriteSheet("sprites/WaveStrong.png", 32),
        }
    
        this.gameOffsetX = 0;
        this.gameOffsetY = 0;
    
        this.startLevelTime = 60000;
        this.level = 1;
        this.maxHp = 3;
    
        this.activePlayers = [];
        this.keyboard = new KeyboardController();
        this.touch = new TouchController();
        this.gamepadMgr = new GamepadManager();
    
        this.tiles = null; //tilemap for the level
        this.monsters = null; //monsters in the level
        this.items = null; //items in the level
    
        this.multiplayerEnabled = true;
        this.competitiveMode = false;
        this.sandboxMode = false;
        this.gameState = "loading";  
        this.showFPS = false;
        this.cullOffCamera = true;

        this.cells = 0;
        this.cellsCollected = 0;

        this.startingHp = 3; 
        this.numLevels = 30;      
    
        this.shakeAmount = 0;       
        this.shakeX = 0;                 
        this.shakeY = 0;      
    
        this.initSounds();
    
        this.numReady = 0;

    }    

    start() {
        window.onresize = (() => that.updateWindowSize());
        this.setupCanvas();

        let that = this;
        this.sprites.players.sheet.onload = (() => that.ready());
        this.sprites.monsters.sheet.onload = (() => that.ready());
        this.sprites.tiles.sheet.onload = (() => that.ready());
        this.sprites.entitiesItems.sheet.onload = (() => that.ready());
    
        this.mainMenu = new MainMenu();
        this.optionsMenu = new OptionsMenu();
        this.inGameMenu = new InGameMenu();

    }

    ready() {
        this.numReady++;
        if(this.numReady>=4) {
            this.gameState = 'title';
            this.update();
//            let that=this;
//            setInterval(()=>that.update(), 15);
        }
    }

    update() {
        let updateStart = performance.now();
        this.gamepadMgr.update_gamepad_states();
        for(let s of Object.keys(controlStates))
            newControlStates[s] = oldControlStates[s]!=controlStates[s];
        for(let p of this.activePlayers) {
            for(let s of Object.keys(p.controlStates))
                p.newControlStates[s] = p.oldControlStates[s]!=p.controlStates[s];
        }
        if(this.gameState=="dead" && !oldControlStates["jump"] && controlStates["jump"]) {
            this.gameState = "scores"
        }
        else if(this.gameState == "running" || this.gameState == "dead"){  
            if(this.gameState=="running" && controlStates['menu'] && !oldControlStates['menu']) {
                this.gameState = "paused";
            }
            if(this.gameState=="running" && controlStates['jump'] && !oldControlStates['jump']) {
                if(lastController.player==null)
                this.addPlayer();
            }
            let millis = 15;
            let n_timer_tick = Date.now();
            if(this.timer_tick!=null){
                millis = Math.min(n_timer_tick - this.timer_tick, 30); //maximum of 30 ms refresh
            }
    
            this.timer_tick = n_timer_tick;
            for(let player of this.activePlayers)
                player.update(millis);
            this.levelTime -= millis; //n_timer_tick - timer_tick; //use real elapsed time for the timer
    
            if(this.levelTime<0 && this.levelTime+millis>=0) {
                let i=0;
                for(let t of this.tiles.iterRect(new Rect([1,this.tiles.dimH-1,this.tiles.dimW-2,1]))) {
                    this.items.push(new Boom(t, 1000+i*20));
                    i+=1;
                }
            }
    
            for(let i of this.items)
                i.update(millis);
            remove_dead(this.items)
    
            for(let m of this.monsters)
                m.update(millis);
            remove_dead(this.monsters);
    
            remove_dropped(this.activePlayers);
            let all_dead = true;
            for (let player of this.activePlayers) {
                if(!player.dead) {
                    all_dead = false;
                    break;
                }
            }

            if(!this.competitiveMode && all_dead && this.gameState!="dead"){    
                this.keyboard.player = null;
                this.touch.player = null;
                this.gamepadMgr.release_all_players();
                addScore(this.score, false);
                this.gameState = "dead";
                this.items.push(new DelayedSound('gameOver', 1000));
            }

            let level_clear = true;
            for (let player of this.activePlayers) {
                if(!player.dead && !player.escaped) {
                    level_clear = false;
                    break;
                }
            }
            if(level_clear && this.gameState!="dead") {
//                this.playSound("newLevel"); 
                if(this.level == this.numLevels){
                    if(!this.competitiveMode)
                        addScore(this.score, true); 
                    this.gameState = "dead";
                    this.prefDimW = 22;
                    this.prefDimH = 13;
                    this.updateWindowSize();
                    this.showTitle();
                }else{
                    this.level++;
                    this.startLevel();
                }
            }        
            this.spawnCounter-=millis;
            if(this.spawnCounter <= 0){  
                this.spawnCounter = this.spawnRate;
                if (this.monsters.length<50) {
                    spawnMonster(null, true); //player.pos to stop spawning near the player
                }
            }    
            this.updateTimes.push(performance.now() - updateStart);
            this.draw(millis);
        } else if(this.gameState == "title" || this.gameState == "options") {
            this.showTitle();
        } else if(this.gameState == "scores") {
            this.showTitle();
            if(!oldControlStates["jump"] && controlStates["jump"]) {
                this.gameState = "title"
            }
        } else if(this.gameState == "paused") {
            this.showTitle();
            if(this.gameState=="paused" && !oldControlStates["menu"] && controlStates["menu"]) {
                this.gameState = "running";
            }
        }

        oldControlStates = {... controlStates};
        for(let p of this.activePlayers) {
            p.oldControlStates = {... p.controlStates};
        }
        let that = this;
        window.requestAnimationFrame(() => that.update());
    }
    
    draw(millis){
        let drawStart = performance.now();
        if(this.gameState == "running" || this.gameState == "dead"){  
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    
            screenshake();
            this.camera.update(millis);

            let cx = 0; 
            let cy = 0;
            let cr = this.tiles.dimW;
            let cb = this.tiles.dimH;    
            if(this.cullOffCamera) {
                cx = Math.floor(this.camera.x);
                cy = Math.floor(this.camera.y);
                cr = Math.ceil(this.camera.right);
                cb = Math.ceil(this.camera.bottom);    
            }
            for(let i=cx;i<cr;i++){
                for(let j=cy;j<cb;j++){
                    this.tiles.at([i,j]).draw();
                }
            }

            if(this.cullOffCamera) {
                let cam = this.camera;
                for(let m of this.monsters) {
                    if(cam.collide(new Rect([m.pos.x,m.pos.y,1,1]))) m.draw();
                }
                for(let p of this.activePlayers) {
                    if(cam.collide(new Rect([p.pos.x,p.pos.y,1,1]))) p.draw();
                }
                for(let i of this.items) {
                    if(cam.collide(new Rect([i.pos.x,i.pos.y,1,1]))) i.draw();
                }
            } else {
                for(let i=0;i<this.monsters.length;i++){
                    this.monsters[i].draw();
                }
        
                for (let player of this.activePlayers) {
                    player.draw();
                }
    
                for(let i=0;i<this.items.length;i++){
                    this.items[i].draw();
                }    
            }

            // for(let i=0;i<this.items.length;i++){
            //     this.items[i].draw_bounds();
            // }


            this.shakeX = 0;
            this.shakeY = 0;
            W = this.camera.scrollable?this.camera.viewPortW:this.dimW;
            H = this.camera.scrollable?this.camera.viewPortH:this.dimH;
            //Draw time left
            let timerColor = (!this.competitiveMode || this.levelTime>this.startLevelTime-10000) ? "DarkSeaGreen" : "DarkOrange";
            drawText("Lvl "+this.level+" Time "+Math.ceil(this.levelTime/1000)+" Scr "+this.score, this.tileSize*3/8, true, this.tileSize*3/4, timerColor);
    
            let hud_pos = [new Vec2([0,0]),new Vec2([W-6,0]),new Vec2([0,H-1]),new Vec2([W-6,H-1])];
            let p = 0;
            for(let player of this.activePlayers) {
                let hp = hud_pos[p];
                player.drawHUD(hp);
                let i = 0;
                for(let item of player.inventory) {
                    item.draw(hp.add([3+i+this.competitiveMode,0]), player);
                    i++;
                }
                for(let item of player.passiveInventory) {
                    item.draw(hp.add([3+i+this.competitiveMode,0]), player);
                    i++;
                }
                p++;
            }
            this.drawTimes.push(performance.now() - drawStart);
            if(this.showFPS) {
                this.FPSframes += 1;
                this.FPStime += millis;
                if(this.FPStime>1000) {
                    this.FPS = Math.round(10*1000*this.FPSframes/this.FPStime)/10
                    this.FPStime = 0;
                    this.FPSframes = 0;
                    this.updateMean = Math.round(this.updateTimes.mean()*100)/100;
                    this.updateMax = Math.round(this.updateTimes.max()*100)/100;
                    this.updateTimes = new MathArray([]);
                    this.drawMean = Math.round(this.drawTimes.mean()*100)/100;
                    this.drawMax = Math.round(this.drawTimes.max()*100)/100;
                    this.drawTimes = new MathArray([]);
                }
                let cull = this.cullOffCamera? "CULL":"";
                drawText("FPS: "+this.FPS+"  Update: "+this.updateMean+"ms (peak "+this.updateMax+")  Draw: "+this.drawMean+"ms (peak "+this.drawMax+") "+cull, this.tileSize*3/8, true, this.tileSize*(H-0.25)+this.gameOffsetY, "DarkSeaGreen");
            }
        }
    }
        
    setupCanvas(){
        this.canvas = document.querySelector("canvas");
    
        this.canvas.width = window.innerWidth; //this.tileSize*(this.dimW);
        this.canvas.height = window.innerHeight; //this.tileSize*(this.dimH);
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
    
        if(this.camera.scrollable) {
            this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize*this.camera.viewPortW)/2);
            this.gameOffsetY =  Math.floor((window.innerHeight - this.tileSize*this.camera.viewPortH)/2);

        } else {
            this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize*this.dimW)/2);
            this.gameOffsetY =  Math.floor((window.innerHeight - this.tileSize*this.dimH)/2);
        }
    
    }

    getTileScale() {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        let scale;
        if(this.camera.scrollable) {
            scale = sh/(this.camera.viewPortH+this.uiHeight)/16;
        } else {
            scale = Math.min(sh/(this.prefDimH+this.uiHeight)/16,sw/(this.prefDimW+this.uiWidth)/16);
        }
        if(!this.fillScreen) { //pixel perfect scaling
            scale = Math.floor(scale);
        }    
        return scale;
    }
    
    fitMaptoTileSize(scale) {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        if(this.camera.scrollable) {
            this.camera.viewPortH = sh/scale; // (sh/scale - this.uiHeight);
            this.camera.viewPortW = sw/scale; //(sw/scale - this.uiWidth);    
//            this.dimW = this.prefDimW;
//            this.dimH = this.prefDimH;
        } else {
            this.dimH = Math.floor(sh/scale);
            this.dimW = Math.floor(sw/scale);    
//            this.dimH = Math.floor(sh/scale - this.uiHeight);
//            this.dimW = Math.floor(sw/scale - this.uiWidth);    
            this.camera.viewPortH = this.dimH;
            this.camera.viewPortW = this.dimW;
        }
    }
    
    updateWindowSize() {
        if(this.competitiveMode) {
            this.camera.scrollable = false;
        } else {
            this.camera.scrollable = true;
            this.camera.viewPortW = 14;
            this.camera.viewPortH = 8;    
        }

        this.tileSize = this.getTileScale()*16;
        this.fitMaptoTileSize(this.tileSize);
        this.setupCanvas();
        this.mainMenu.updateWindowSize();
        this.optionsMenu.updateWindowSize();
    }
        

    initSounds(){          
        this.sounds = {
            hit1: new Audio('sounds/hit1.wav'),
            hit2: new Audio('sounds/hit2.wav'),
            pickup1: new Audio('sounds/sfx_sounds_powerup5.wav'),
            pickup2: new Audio('sounds/sfx_sounds_powerup15.wav'),
            changeInv: new Audio('sounds/Slide_Sharp_01.wav'),
            boom: new Audio('sounds/explodemini.wav'),
            boomBig: new Audio('sounds/explode.wav'),
            dead1: new Audio('sounds/aargh0.ogg'),
            dead2: new Audio('sounds/aargh1.ogg'),
            dead3: new Audio('sounds/aargh2.ogg'),
            dead4: new Audio('sounds/aargh3.ogg'),
            dead5: new Audio('sounds/aargh4.ogg'),
            dead6: new Audio('sounds/aargh5.ogg'),
            dead7: new Audio('sounds/aargh6.ogg'),
            dead8: new Audio('sounds/aargh7.ogg'),
            exitLevel: new Audio('sounds/rock_metal_slide_1.wav'),
            gameOver: new Audio('sounds/evil cyber laugh.wav'),            
//            newLevel: new Audio('sounds/newLevel.wav'),
//            spell: new Audio('sounds/spell.wav'),
            kioskInteract: new Audio('sounds/Click_Standard_02.wav'),
            kioskDispense: new Audio('sounds/flaunch.wav'),
            gunFire1: new Audio('sounds/sfx_wpn_laser7.wav'),
            gunFire2: new Audio('sounds/sfx_wpn_laser6.wav'),
            gunFire3: new Audio('sounds/sfx_wpn_laser5.wav'),
            gunReload: new Audio('sounds/sfx_wpn_reload.wav'),
            rifleFire: new Audio('sounds/Rifleprimary2.ogg'),
            rifleReload: new Audio('sounds/sfx_wpn_reload.wav'),
            shotgunFire: new Audio('sounds/minigun3.ogg'),
            shotgunReload: new Audio('sounds/Rack.mp3'),
            rocketFire: new Audio('sounds/sfx_wpn_missilelaunch.wav'),
            rocketReload: new Audio('sounds/Slide_Sharp_01.wav'),
            grappleFire: new Audio('sounds/jumppad.ogg'),
            grappleReload: new Audio('sounds/Slide_Sharp_01.wav'),
            grappleRetract: new Audio('sounds/rattle1.wav'),
            wrenchFire: new Audio('sounds/rattle1.wav'),
            wrenchReload: new Audio('sounds/Slide_Sharp_01.wav'),
            saberCharge: new Audio('sounds/SpaceShip_Engine_Large_Loop_00.wav'),
        };
    }
    
    playSound(soundName, ctime=0, loop=false, play=true){
       this.sounds[soundName].currentTime = ctime;
       this.sounds[soundName].loop = loop;
       if(play) {
           this.sounds[soundName].play();
       }
       return this.sounds[soundName];
    }

    showTitle(){                                          
        this.ctx.fillStyle = 'rgba(0,0,0,.75)';
        this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height); 
    
        drawText("Oarstrong", 2*this.tileSize, true, this.canvas.height/2 - 3.5*this.tileSize, "DarkSeaGreen");
        drawText("by Evan Moore", this.tileSize, true, this.canvas.height/2 - 2*this.tileSize, "DarkOrange"); 
    
        if(this.gameState == "title") {
            this.mainMenu.update(0);
            this.mainMenu.draw();
        } else
        if(this.gameState == "options") {
            this.optionsMenu.update(0);
            this.optionsMenu.draw();    
        } else
        if(this.gameState == "paused") {
            this.inGameMenu.update(0);
            this.inGameMenu.draw();    
        } else
        if(this.gameState == "scores")
            drawScores(); 
    }
    
    addPlayer() {
        let player = new Player();
        player.hp = this.startingHp;
        player.maxHp = this.startingHp;
        let startingItems;
        if(this.sandboxMode) {
            startingItems = [new Wrench(), new Fist(), new PowerSaber(), new Grenade(), new Gun(), new Shotgun(), new Rifle(), new RocketLauncher(), new JetPack(), new Drone(), new GrappleGun()];
            startingItems[0].count = 4;
            startingItems[3].count = 5;
            for(let i of [new Shield(), new Glider()]) {
                player.passiveInventory.add(i);
            }
        } else {
            startingItems = [new Fist()];
            if(this.competitiveMode)
                startingItems[0].hitDamage = 1;
        }
        for(let i of startingItems)
            player.inventory.add(i);
        player.inventory.select(player.inventory[0]);
        player.pos = this.tiles.startTile.pos;
        player.controller = lastController;
        lastController.attach_to_player(player);
        this.activePlayers.push(player);
    }
    
    startGame(){                                           
        this.timer_tick = null;
        this.level = 1;
        this.score = 0;
        this.cellsCollected = 2;
        this.activePlayers = []; 
        let player = new Player();
        this.activePlayers.push(player);
        // single player attach all controllers to this player
        if(this.multiplayerEnabled) {
            lastController.attach_to_player(player);
        } else {
            this.keyboard.attach_to_player(player);
            this.touch.attach_to_player(player);
            this.gamepadMgr.attach_all_to_player(player);
        }
        player.hp = this.startingHp;
        player.maxHp = this.startingHp;
        let startingItems;
        if(this.sandboxMode) {
            startingItems = [new Wrench(), new Fist(), new PowerSaber(), new Grenade(), new Gun(), new Shotgun(), new Rifle(), new RocketLauncher(), new JetPack(), new Drone(), new GrappleGun()];
            startingItems[0].count = 4;
            startingItems[3].count = 5;
            for(let i of [new Shield(), new Glider()]) {
                player.passiveInventory.add(i);
            }
        }
        else {
            startingItems = [new Fist()];
            if(this.competitiveMode)
                startingItems[0].hitDamage = 1;
        }
        for(let i of startingItems) {
            player.inventory.add(i);
        }
        player.inventory.select(player.inventory[0]);
        this.startLevel();
    
        this.gameState = "running";
    }
    
    startLevel(){  
        this.spawnRate = 10000;              
        this.spawnCounter = this.spawnRate;  
        this.levelTime = this.startLevelTime;
        this.camera.pos = null;

        let cc = this.competitiveMode? 1 : this.cellsCollected;

        generateLevel();
    
        for(let player of this.activePlayers) {
            player.pos = this.tiles.startTile.pos;
            player.escaped = false;
            if (player.dead) {
                player.revive();
            }
    
            let addon = 1+Math.floor(this.level/10);
            if(this.sandboxMode && this.level>1 && !player.dead) {
                let inventory = player.inventory;
                inventory[0].ammo += 2*addon;
                inventory[1].charges += addon;
                inventory[2].count += addon;
                inventory[3].fuel += 1000*addon;
                inventory[0].ammo = Math.min(inventory[0].ammo,inventory[0].maxAmmo);
                inventory[1].charges = Math.min(inventory[1].charges,inventory[1].maxCharges);
                inventory[2].count = Math.min(inventory[2].count,inventory[2].maxCount);
                inventory[3].fuel = Math.min(inventory[3].fuel,inventory[3].maxFuel);
            }
        }
        let items = shuffle([FistPickup, PowerSaberPickup, GrenadePickup, GunPickup, RiflePickup, ShotgunPickup, RocketLauncherPickup, JetPackPickup, WrenchPickup, GrappleGunPickup, DronePickup, ShieldPickup, GliderPickup]).slice(0,cc)
        items.push(HealthPickup);
        this.tiles.kioskTile.setItems(items);
        this.levelupItems = [UpgradePickup, BootsPickup];
    }    
}

