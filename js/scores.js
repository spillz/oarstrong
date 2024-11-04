function getScores(){
    if(localStorage["best_runs"]){
        return JSON.parse(localStorage["best_runs"]);
    }else{
        return [];
    }
}

function addScore(score, won){
    let scores = getScores();
    let scoreObject = {score: score, level: game.level, won: won};
    scores.push(scoreObject);

    if(!game.sandboxMode)
        localStorage["best_runs"] = JSON.stringify(scores);
}

function drawScores(){
    if(!game.competitiveMode) {
        let scores = getScores();
        if(scores.length){
            drawText(
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
                drawText(
                    scoreText,
                    18,
                    true,
                    game.canvas.height/2 + 24+i*24,
                    i == 0 ? "DarkOrange" : "DarkSeaGreen"
                );
            }
        }
    } else
    {
        drawText(
            rightPad(["PLAYER","SCORE","DEATHS"]),
            18,
            true,
            game.canvas.height/2,
            "white"
        );
        for(let i=0;i<game.activePlayers.length;i++){
            let scoreText = rightPad([i, game.activePlayers[i].score, game.activePlayers[i].deaths]);
            drawText(
                scoreText,
                18,
                true,
                game.canvas.height/2 + 24+i*24,
                i == 0 ? "DarkOrange" : "DarkSeaGreen"
            );
        }
    }
}
