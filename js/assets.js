//NOTE: This is unchecked JavaScript because TypeScript checked is unaware of Vite's asset imports 

import imgPlayers from '../sprites/players.png';
import imgMonsters from '../sprites/monsters.png';
import imgTiles from "../sprites/tiles.png";
import imgEntitiesItems from "../sprites/entities_and_items.png";
import imgWaveStrong from "../sprites/WaveStrong.png";

import audioHit1 from '../sounds/hit1.wav';
import audioHit2 from '../sounds/hit2.wav';
import audioPickup1 from '../sounds/sfx_sounds_powerup5.wav';
import audioPickup2 from '../sounds/sfx_sounds_powerup15.wav';
import audioChangeInv from '../sounds/Slide_Sharp_01.wav';
import audioBoom from '../sounds/explodemini.wav';
import audioBoomBig from '../sounds/explode.wav';
import audioDead1 from '../sounds/aargh0.ogg';
import audioDead2 from '../sounds/aargh1.ogg';
import audioDead3 from '../sounds/aargh2.ogg';
import audioDead4 from '../sounds/aargh3.ogg';
import audioDead5 from '../sounds/aargh4.ogg';
import audioDead6 from '../sounds/aargh5.ogg';
import audioDead7 from '../sounds/aargh6.ogg';
import audioDead8 from '../sounds/aargh7.ogg';
import audioExitLevel from '../sounds/rock_metal_slide_1.wav';
import audioGameOver from '../sounds/evil cyber laugh.wav';
import audioKioskInteract from '../sounds/Click_Standard_02.wav';
import audioKioskDispense from '../sounds/flaunch.wav';
import audioGunFire1 from '../sounds/sfx_wpn_laser7.wav';
import audioGunFire2 from '../sounds/sfx_wpn_laser6.wav';
import audioGunFire3 from '../sounds/sfx_wpn_laser5.wav';
import audioGunReload from '../sounds/sfx_wpn_reload.wav';
import audioRifleFire from '../sounds/Rifleprimary2.ogg';
import audioRifleReload from '../sounds/sfx_wpn_reload.wav';
import audioShotgunFire from '../sounds/minigun3.ogg';
import audioShotgunReload from '../sounds/Rack.mp3';
import audioRocketFire from '../sounds/sfx_wpn_missilelaunch.wav';
import audioRocketReload from '../sounds/Slide_Sharp_01.wav';
import audioGrappleFire from '../sounds/jumppad.ogg';
import audioGrappleReload from '../sounds/Slide_Sharp_01.wav';
import audioGrappleRetract from '../sounds/rattle1.wav';
import audioWrenchFire from '../sounds/rattle1.wav';
import audioWrenchReload from '../sounds/Slide_Sharp_01.wav';
import audioSaberCharge from '../sounds/SpaceShip_Engine_Large_Loop_00.wav';

/**
 * 
 * @returns {{Players:string, Monsters:string, Tiles:string, EntitiesItems:string, WaveStrong:string}}
 */
export function initSpriteFiles() {
    return {
        Players: imgPlayers,
        Monsters: imgMonsters,
        Tiles: imgTiles,
        EntitiesItems: imgEntitiesItems,
        WaveStrong: imgWaveStrong,        
    }
}

export function initSounds() {
    return {
        hit1: new Audio(audioHit1),
        hit2: new Audio(audioHit2),
        pickup1: new Audio(audioPickup1),
        pickup2: new Audio(audioPickup2),
        changeInv: new Audio(audioChangeInv),
        boom: new Audio(audioBoom),
        boomBig: new Audio(audioBoomBig),
        dead1: new Audio(audioDead1),
        dead2: new Audio(audioDead2),
        dead3: new Audio(audioDead3),
        dead4: new Audio(audioDead4),
        dead5: new Audio(audioDead5),
        dead6: new Audio(audioDead6),
        dead7: new Audio(audioDead7),
        dead8: new Audio(audioDead8),
        exitLevel: new Audio(audioExitLevel),
        gameOver: new Audio(audioGameOver),
        kioskInteract: new Audio(audioKioskInteract),
        kioskDispense: new Audio(audioKioskDispense),
        gunFire1: new Audio(audioGunFire1),
        gunFire2: new Audio(audioGunFire2),
        gunFire3: new Audio(audioGunFire3),
        gunReload: new Audio(audioGunReload),
        rifleFire: new Audio(audioRifleFire),
        rifleReload: new Audio(audioRifleReload),
        shotgunFire: new Audio(audioShotgunFire),
        shotgunReload: new Audio(audioShotgunReload),
        rocketFire: new Audio(audioRocketFire),
        rocketReload: new Audio(audioRocketReload),
        grappleFire: new Audio(audioGrappleFire),
        grappleReload: new Audio(audioGrappleReload),
        grappleRetract: new Audio(audioGrappleRetract),
        wrenchFire: new Audio(audioWrenchFire),
        wrenchReload: new Audio(audioWrenchReload),
        saberCharge: new Audio(audioSaberCharge),
    };
}