$("#mineModal").find('.btn-primary')[$("#mineModal").find('.btn-primary').length-1].insertAdjacentHTML("beforeBegin", "<button type='button' class='btn btn-primary' onclick='mineBot(getRewardLocations())'>Solve</button>");

function getEnergyFraction(){
    return App.game.underground.energy / App.game.underground.getMaxEnergy();
}

function gainEnergy(){
    if(getEnergyFraction() < 0.5){
        ItemList['SmallRestore'].use();
    }
}

function getRewardLocations(){
    let rewards = [];
    Mine.rewardGrid.map((row, y) => {
        row.map((tile, x) => {
            if(tile && !tile.revealed){
                rewards.push({x,y});
            }
        });
    });
    return rewards;
}

function mineBot(rewards){
    rewards.map(tile => {
        gainEnergy();
        Mine.chisel(tile.y, tile.x);
    });
    let next = getRewardLocations();
    if(next.length > 0){
        mineBot(next);
    }
}

let mineBotEnabled = true;

function mineBotRepeater(){
    if(mineBotEnabled){
        setTimeout(()=>mineBotRepeater(), 2000);
        mineBot(getRewardLocations());
    }
}