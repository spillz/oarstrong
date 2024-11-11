//@ts-check
import { rightPad } from "./util.js";
/**@typedef {import('./game').Game} Game */


export function getScores(){
    if(localStorage["best_runs"]){
        return JSON.parse(localStorage["best_runs"]);
    }else{
        return [];
    }
}

export function addScore(game, score, won){
    let scores = getScores();
    let scoreObject = {score: score, level: game.level, won: won};
    scores.push(scoreObject);

    if(!game.sandboxMode) {
        localStorage["best_runs"] = JSON.stringify(scores);
    }
}

/**
 * 
 * @param {Game} game 
 */
export function drawScores(game){
    let scores = getScores();
    if(scores.length){
        game.drawText(
            rightPad(["LEVEL","SCORE","END"]),
            18,
            true,
            game.canvas.height/2,
            "white"
        );

        let newestScore = scores.pop();
        scores.sort(function(a,b){
            return b.score - a.score;
        });
        scores.unshift(newestScore);

        for(let i=0;i<Math.min(10,scores.length);i++){
            let scoreText = rightPad([scores[i].level, scores[i].score, scores[i].won? "ESCAPED":"DIED"]);
            game.drawText(
                scoreText,
                18,
                true,
                game.canvas.height/2 + 24+i*24,
                i == 0 ? "DarkOrange" : "DarkSeaGreen"
            );
        }
    }
}
