document.getElementById("middle-column").insertAdjacentHTML("afterBegin", "<div id='autoClickers' class='card sortable border-secondary mb-3'> <div class='card-header p-0' data-toggle='collapse' href='#autoClickersSelectorBody' aria-expanded='true'><span>Auto Clickers</span></div><div id='autoClickersSelectorBody' class='card-body p-0 table-responsive collapse show' style=''> <div class='autoClickerRow'> <div class='autoClickerColumn'> <input type='checkbox' id='battleAutoClicker'/> <span>Battle</span> </div><div class='autoClickerColumn'> <select id='battleStrategySelect'></select> </div><div class='autoClickerColumn'> <input type='number' id='achievementKillCount'/> </div></div><div class='autoClickerRow'> <div class='autoClickerColumn'> <input type='checkbox' id='dungeonAutoClicker'/> <span>Dungeon</span> </div><div class='autoClickerColumn'> <select id='dungeonStrategySelect'></select> </div><div class='autoClickerColumn'> </div></div><div class='autoClickerRow'> <div class='autoClickerColumn'> <input type='checkbox' id='farmAutoClicker'/> <span>Farm</span> </div><div class='autoClickerColumn'> <select id='farmStrategySelect'></select> </div><div class='autoClickerColumn'> <select id='farmMulchSelect'></select></div></div><div class='autoClickerRow'> <div class='autoClickerColumn'> <input type='checkbox' id='hatcheryAutoClicker'/> <span>Hatchery</span> </div><div class='autoClickerColumn'> <select id='hatcheryStrategySelect'></select> </div><div class='autoClickerColumn'> <select id='hatcheryTypeSelect'></select> </div></div><div class='autoClickerRow'> <div class='autoClickerColumn'> <input type='checkbox' id='gymAutoClicker'/> <span>Gym</span> </div><div class='autoClickerColumn'> <select id='gymStrategySelect'></select> </div><div class='autoClickerColumn'> <input type='checkbox' id='gymAutoMove'/> <span>Auto Move*</span></div></div><div class='autoClickerRow'> <div class='autoClickerColumn'> <input type='checkbox' id='bombAutoClicker'/> <span>Bombs</span> </div><div class='autoClickerColumn'> <input type='checkbox' id='purchaseAutoClicker'/> <span>Buy Items</span></div><div class='autoClickerColumn'> <input type='checkbox' id='purchaseMulchAutoClicker'/> <span>Buy Mulch</span></div></div></div></div>");

function createClass(name,rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule) 
        (style.styleSheet || style.sheet).addRule(name, rules);
    else
        style.sheet.insertRule(name+"{"+rules+"}",0);
}

//createClass('.autoClickerToggle',"display: flex; align-items: center; margin-left: 12px; width: 100%;");
createClass('.autoClickerColumn input, .autoClickerColumn select',"margin-right: 8px; max-width:100%");
createClass('.autoClickerColumn select',"width: 100%;");
createClass(".autoClickerRow", "display: flex; align-items: center; text-align: left;");
createClass(".autoClickerColumn", "width: 33%;padding: 5px;");
createClass(".autoClickerRow:nth-child(2n)", "background-color: rgba(0,0,0,.05); ")
createClass(".autoClickerRow:not(:last-child)", "border-bottom-color: rgb(128, 128, 128);")

/*start battle*/
let battleAutoClickerIntervalId;
let battleAutoClickerDelay = 1;

function toggleBattleAutoClicker(){
    if(battleAutoClickerIntervalId){
        clearInterval(battleAutoClickerIntervalId);
    }
    battleAutoClickerIntervalId = null;
    if(document.getElementById("battleAutoClicker").checked){
        if(App.game.gameState === GameConstants.GameState.dungeon){
            boardMemory = {};
            dungeonInit();
        }
        battleAutoClickerIntervalId = setInterval(clickBattle, battleAutoClickerDelay);
    }
}

let autoMasterball = true;
function clickBattle(){
    const checked = document.getElementById("battleAutoClicker").checked;
    const checkedGym = document.getElementById("gymAutoClicker").checked;
    const checkedDungeon = document.getElementById("dungeonAutoClicker").checked;
    if(checked){
        if(autoMasterball){
            if(PokemonHelper.getPokemonById(Battle.enemyPokemon().id).catchRate < 10 && Battle.enemyPokemon().shiny ){
                App.game.pokeballs.notCaughtShinySelection = 3;
            }
            else{
                App.game.pokeballs.notCaughtShinySelection = 2;
            }
        }
        if(App.game.gameState === GameConstants.GameState.fighting){
            if(shouldMove()){
                nextRoute();
            }
            
            Battle.clickAttack();
        }
        if(!checkedGym && App.game.gameState === GameConstants.GameState.gym){
            GymBattle.clickAttack();
        }
        if(!checkedDungeon && App.game.gameState === GameConstants.GameState.dungeon){
            if(!DungeonRunner.fighting() && !DungeonBattle.catching()){
                moveInDungeonFast();
            }
            interactInDungeon();
        }
    } 
}

function shouldMove(){
    let strategy = document.getElementById("battleStrategySelect").value;
    if(strategy == 'None') {
        return false;
    }
    if(strategy == 'Achievement'){
        return App.game.statistics.routeKills[player.region][player.route()]() >= 10000
    }
    if(strategy == 'Shiny'){
        return RouteHelper.routeCompleted(player.route(), player.region, true);
    }
    return false;
}

function nextRoute(){
    const currRoute = player.route();
    const currRegion = player.region;
    const normRoute = MapHelper.normalizeRoute(currRoute, currRegion);
    const nextRoute = Routes.unnormalizeRoute(normRoute + 1);
    if(MapHelper.validRoute(nextRoute, currRegion)){
        MapHelper.moveToRoute(nextRoute, currRegion);
    }
    else MapHelper.moveToRoute(nextRoute, currRegion+1);
}

function populateBattleStrategies(){
    let select = document.getElementById("battleStrategySelect");

    let options = ['None', 'Achievement', 'Shiny'];

    for(var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
}
populateBattleStrategies();


document.getElementById("battleAutoClicker").addEventListener("click", toggleBattleAutoClicker);
/*end battle*/

/*start gym*/
let gymAutoClickerIntervalId;
let gymAutoClickerDelay = 1;


function toggleGymAutoClicker(){
    if(gymAutoClickerIntervalId){
        clearInterval(gymAutoClickerIntervalId);
    }
    gymAutoClickerIntervalId = null;
    if(document.getElementById("gymAutoClicker").checked){
        gymAutoClickerIntervalId = setInterval(clickGym, gymAutoClickerDelay);
    }
}

function clickGym(){
    const checked = document.getElementById("gymAutoClicker").checked;
    let strategy = document.getElementById("gymStrategySelect").value;
    if(checked && App.game.gameState == GameConstants.GameState.town){
        if(strategy == 'Champion'){
            for(let i = 0; i < player.town().content.length; i++){
                if(player.town().content[i] instanceof Champion){
                    document.querySelector(".list-group").children[i+1].querySelector("button")?.click();
                    return;
                }
            }   
        }
        else{
            let i = parseInt(strategy)-1;
            if(player.town().content[i] instanceof Gym){
                document.querySelector(".list-group").children[i+1].querySelector("button")?.click();
                return;
            }
        }
    }
    if(checked && App.game.gameState == GameConstants.GameState.gym){
        GymBattle.clickAttack();
    }
}
function populateGymStrategies(){
    let select = document.getElementById("gymStrategySelect");

    let options = ['1', '2', '3', '4', 'Champion'];

    for(var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
}
populateGymStrategies();
document.getElementById("gymAutoClicker").addEventListener("click", toggleGymAutoClicker);
/*end gym*/

/*start farm*/
let farmAutoClickerIntervalId;
let farmAutoClickerDelay = 1;

function toggleFarmAutoClicker(){
    if(farmAutoClickerIntervalId){
        clearInterval(farmAutoClickerIntervalId);
    }
    farmAutoClickerIntervalId = null;
    if(document.getElementById("farmAutoClicker").checked){
        farmAutoClickerIntervalId = setInterval(clickFarm, farmAutoClickerDelay);
    }
}

function clickFarm(){
    let plots = App.game.farming.plotList;
    let strategy = document.getElementById("farmStrategySelect").value;
    let mulchStrategy = document.getElementById("farmMulchSelect").value;
    if(strategy == 'Plant Selected'){
        App.game.farming.harvestAll();
        App.game.farming.plantAll(FarmController.selectedBerry());
        return;
    }

    for(let i = 0; i < plots.length; i++){
        plot = plots[i];
        const berry = plot.berry;
        const mulchIndex = shouldMulch(plot, mulchStrategy);
        if(mulchIndex != -1){
            App.game.farming.addMulch(i, mulchIndex, 1);
        }
        if(shouldHarvest(plot)){
            App.game.farming.harvest(i);
            App.game.farming.plant(i, berry);
        }        
    }
}

function shouldHarvest(plot){
    if(plot.stage() != 4) return false;
    let strat = document.getElementById("farmStrategySelect").value;
    if(strat == 'Replant Early') return true;
    if(strat == 'Replant Late') return plot.age > plot.berryData.growthTime[4] - 15;
}

function shouldMulch(plot, strat){
    if(plot.mulch != -1) return -1;
    if (plot.berry == BerryType.None){
        return strat == 'Surprise Open' ? 2 : -1;
    }
    switch(strat){
        case 'None': 
            return -1;
        case 'Boost All':
            if(plot.stage() == 4){ 
                return -1
            }
            return 0;
        case 'Rich Only':
            if(shouldHarvest(plot)){
                return 1;
            }
            return -1;
        case 'Boost + Rich':
            if(shouldHarvest(plot)){
                return 1;
            }
            if(plot.age < plot.berryData.growthTime[3] - 600){//boost until 10min left (not counting Sprayduck)
                return 0;
            }
            return -1;
        case 'Surprise Planted':
            if(plot.berry != BerryType.None){
                return 2;
            }
            return -1;
        case 'Surprise All':
            return 2;
        default:
            return -1;
    }
}

function populateFarmStrategies(){
    let select = document.getElementById("farmStrategySelect");

    let options = ['Replant Early', 'Replant Late', 'Plant Selected'];

    for(var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
}
populateFarmStrategies();

function populateMulchStrategies(){
    let select = document.getElementById("farmMulchSelect");

    let options = ['None', 'Boost All', 'Rich Only', 'Boost + Rich', 'Surprise Open', 'Surprise Planted', 'Surprise All'];

    for(var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
}
populateMulchStrategies();


document.getElementById("farmAutoClicker").addEventListener("click", toggleFarmAutoClicker);
/*end farm*/

/*start hatchery*/
let hatcheryAutoClickerIntervalId;
let hatcheryAutoClickerDelay = 1000;

function toggleHatcheryAutoClicker(){
    if(hatcheryAutoClickerIntervalId){
        clearInterval(hatcheryAutoClickerIntervalId);
    }
    hatcheryAutoClickerIntervalId = null;
    if(document.getElementById("hatcheryAutoClicker").checked){
        hatcheryAutoClickerIntervalId = setInterval(clickHatchery, hatcheryAutoClickerDelay);
    }
}

function clickHatchery(){
    for(let i = 3; i >= 0; i--){
        App.game.breeding.hatchPokemonEgg(i);
    }
    if(App.game.breeding.hasFreeEggSlot()){
        let strat = document.getElementById("hatcheryStrategySelect").value;
        if(strat.includes('egg')){
            ItemList[strat].use();
            populateHatcheryStrategies();
        }
        else{
            let pokeList = PartyController.getHatcherySortedList()
                .filter( poke => poke.level == 100 && 
                        poke.breeding == false &&
                        (strat.includes('no Shinies') ? !poke.shiny : true)
                        );
            if(strat.includes('Highest')){
                for(let i = 0; i < pokeList.length; i++){
                    let poke = pokeList[i];
                    if(PokemonHelper.calcNativeRegion(poke.id) == player.highestRegion()){
                        App.game.breeding.addPokemonToHatchery(poke);
                        return;
                    }
                }
            }
            App.game.breeding.addPokemonToHatchery(pokeList[0]);
        }
    }
}

function populateHatcheryStrategies(){
    let select = document.getElementById("hatcheryStrategySelect");
    let oldOption = Math.max(select.selectedIndex, 0);
    for(i = select.options.length; i >= 0; i--){
        select.remove(i);
    }
    let eggTypes = [
        {
            Name:'Electric_egg',
            Label:'Electric Egg'
        },
        {
            Name:'Fire_egg',
            Label:'Fire Egg'
        },
        {
            Name:'Water_egg',
            Label:'Water Egg'
        },
        {
            Name:'Fighting_egg',
            Label:'Fighting Egg'
        },
        {
            Name:'Dragon_egg',
            Label:'Dragon Egg'
        },
        {
            Name:'Grass_egg',
            Label:'Grass Egg'
        },
        {
            Name:'Mystery_egg',
            Label:'Mystery Egg'
        }
    ];

    eggTypes = eggTypes.map(egg =>  { 
        egg.Amount = player.itemList[egg.Name]();
        if(egg.Name == 'Mystery_egg'){
            egg.isCaught = App.game.breeding.getAllCaughtStatus();
        }
        else{
            let etype = EggType[egg.Name.split('_')[0]];
            egg.isCaught = App.game.breeding.getTypeCaughtStatus(etype);
        }
        return egg;
    });

    var otherStrats = ['Highest Region', 'Sorted Hatchery', 'Highest no Shinies', 'Sorted no Shinies'];


    for(var i = 0; i < otherStrats.length; i++) {
        var opt = otherStrats[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }

    for(var i = 0; i < eggTypes.length; i++) {
        var egg = eggTypes[i];
        var el = document.createElement("option");
        el.textContent = `${egg.Label} - ${egg.Amount} ${egg.isCaught == 0 ? '(U)' : '(☆)'}`;
        el.value = egg.Name;
        select.appendChild(el);
    }
    select.selectedIndex = Math.min(oldOption, select.options.length);
}
populateHatcheryStrategies();

document.getElementById("hatcheryAutoClicker").addEventListener("click", toggleHatcheryAutoClicker);
/*end hatchery*/

/*start bombs*/
let bombAutoClickerIntervalId;
let bombAutoClickerDelay = 1000;

function toggleBombAutoClicker(){
    if(bombAutoClickerIntervalId){
        clearInterval(bombAutoClickerIntervalId);
    }
    bombAutoClickerIntervalId = null;
    if(document.getElementById("bombAutoClicker").checked){
        bombAutoClickerIntervalId = setInterval(clickBomb, bombAutoClickerDelay);
    }
}

function clickBomb(){
    if(App.game.underground.energy >= App.game.underground.getMaxEnergy() - 10 ){
        Mine.bomb();
    }
}

document.getElementById("bombAutoClicker").addEventListener("click", toggleBombAutoClicker);
/*end bombs*/

/*start dungeon*/
let dungeonAutoClickerIntervalId;
let dungeonAutoClickerDelay = 1;
let boardMemory;

function toggleDungeonAutoClicker(){
    if(dungeonAutoClickerIntervalId){
        clearInterval(dungeonAutoClickerIntervalId);
    }
    dungeonAutoClickerIntervalId = null;
    if(document.getElementById("dungeonAutoClicker").checked){
        if(App.game.gameState === GameConstants.GameState.dungeon){
            boardMemory = {};
            dungeonInit();
        }
        dungeonAutoClickerIntervalId = setInterval(clickDungeon, dungeonAutoClickerDelay);
    }
}


let path = [];
function clickDungeon(){
    if(App.game.gameState == GameConstants.GameState.town){
        boardMemory = {};
        if(player.town().dungeon){
            DungeonRunner.initializeDungeon(player.town().dungeon);
        }   
        else{
            for(let i = 0; i < player.town().content.length; i++){
                if(player.town().content[i] instanceof MoveToDungeon){
                    document.querySelector(".list-group").children[i+1].querySelector("button")?.click();
                    return;
                }
            }
        }
    }
    if(App.game.gameState === GameConstants.GameState.dungeon){
        if(Object.keys(boardMemory) == 0){
            dungeonInit();
        }
        if(!DungeonRunner.fighting() && !DungeonBattle.catching()){
            
            let strat = document.getElementById("dungeonStrategySelect").value;
            if(strat.includes('Fast')){
                moveInDungeonFast();
            }
            else{
                moveInDungeonFull();
            }
            /*if(!path || path.length == 0) path = dijkstra();
            let direction = path.shift();
            DungeonRunner.map["move"+direction]();*/
        }
        interactInDungeon();
    }
}

function moveInDungeonFull(){
    let board = DungeonRunner.map.board();
    let max = board.length-1;
    let playerPosition = DungeonRunner.map.playerPosition();
    let {x,y} = playerPosition;
    if(x > 0 && !board[y][x-1].isVisited) DungeonRunner.map.moveLeft();
    else if(y > 0 && !board[y-1][x].isVisited) DungeonRunner.map.moveUp();
    else if(y < max && !board[y+1][x].isVisited) DungeonRunner.map.moveDown();
    else if(x < max && !board[y][x+1].isVisited) DungeonRunner.map.moveRight();
    else{
        DungeonRunner.map.moveToCoordinates(boardMemory.boss.x, boardMemory.boss.y);
        DungeonRunner.startBossFight();
    }
}

function moveInDungeonFast(){
    
    let board = DungeonRunner.map.board();
    let playerPosition = DungeonRunner.map.playerPosition();
    let {x,y} = playerPosition;
    let targetVector = getNextTargetVector();
    
    if(targetVector.y == 0){
        if(targetVector.x < 0) DungeonRunner.map.moveLeft();
        else if(targetVector.x > 0) DungeonRunner.map.moveRight();
    }
    else if(targetVector.x == 0){
        if(targetVector.y < 0) DungeonRunner.map.moveUp();
        else if(targetVector.y > 0) DungeonRunner.map.moveDown();
    }
    else{
        if(targetVector.x > 0 && targetVector.y > 0){
            if(board[y+1][x].type() != 2) DungeonRunner.map.moveDown();
            else DungeonRunner.map.moveRight();
        }
        if(targetVector.x < 0 && targetVector.y > 0){
            if(board[y+1][x].type() != 2) DungeonRunner.map.moveDown();
            else DungeonRunner.map.moveLeft();
        }
        if(targetVector.x > 0 && targetVector.y < 0){
            if(board[y-1][x].type() != 2) DungeonRunner.map.moveUp();
            else DungeonRunner.map.moveRight();
        }
        if(targetVector.x < 0 && targetVector.y < 0){
            if(board[y-1][x].type() != 2) DungeonRunner.map.moveUp();
            else DungeonRunner.map.moveLeft();
        }
    }
}

function interactInDungeon(){
    let strat = document.getElementById("dungeonStrategySelect").value;
    if (DungeonRunner.map.currentTile().type() === GameConstants.DungeonTile.chest && !strat.includes('no Chests')) {
        DungeonRunner.openChest();
    }
    else if (DungeonRunner.map.currentTile().type() === GameConstants.DungeonTile.boss && !DungeonRunner.fightingBoss()) {
        if(strat.includes('Fast') && (!chestsLeft() || strat.includes('no Chest'))){
        //if(!path || path == []){
            DungeonRunner.startBossFight();
        }
        
    }
    else if (DungeonRunner.fighting() && !DungeonBattle.catching()) {
            DungeonBattle.clickAttack();
    }
}

function dungeonInit(){
    boardMemory.chests = [];
    DungeonRunner.map.board().map((row, y) => {
        row.map((tile, x) => {
            let type = tile.type();
            if(tile.type() == 3){
                boardMemory.chests.push({x,y,distance: getDistanceToTarget(x,y)});
            }
            else if(tile.type() == 4){
                boardMemory.boss = {x,y}
            }
        })
    });
}

function chestsLeft(){
    return boardMemory.chests.length;
}

function getNextTargetVector(){
    let strat = document.getElementById("dungeonStrategySelect").value;
    
    updateChests();
    let target;
    if(chestsLeft() > 0 && !strat.includes('no Chests')){
        target = boardMemory.chests.reduce((prev, current)=>((prev.distance<=current.distance)?prev:current));
    }
    else{
        target = boardMemory.boss;
    }
    return {x: target.x - DungeonRunner.map.playerPosition().x, y: target.y - DungeonRunner.map.playerPosition().y};
}

function getDistanceToTarget(x,y){
    return Math.abs(x - DungeonRunner.map.playerPosition().x) + Math.abs(y - DungeonRunner.map.playerPosition().y);
}


function updateChests(){
    boardMemory.chests = boardMemory.chests.filter(({x,y})=>{
        return x!=DungeonRunner.map.playerPosition().x||y!=DungeonRunner.map.playerPosition().y;
    });
    for(let i = 0; i < boardMemory.chests.length; i++){
        boardMemory.chests[i].distance = getDistanceToTarget(boardMemory.chests[i].x,boardMemory.chests[i].y);
    }
}

let dungeonStrategies = {
    "Fast Clear": [3, 4],
    "Fast no Chests": [4],
    "Full Clear": [2, 3, 4],
    "Full no Chests": [2, 4]
}


function dijkstra(){
    const state = {board: [], count: {"0": 0, "1": 0, "2": 0, "3": 0, "4": 0}};
    DungeonRunner.map.board().map((row, y) => {
        row.map((tile, x) => {
            let node = {
                x, 
                y, 
                distance: x == DungeonRunner.map.playerPosition().x && y == DungeonRunner.map.playerPosition().y ? 0 : 1000000,
                type: tile.type(),
                status: 0,
                directions: []
            };
            state.board.push(node);
            state.count[tile.type()]++;
        });
    });
    return getBestPath(state);
}

function getBestPath(state){
	const strategy =  document.getElementById("dungeonStrategySelect").value;
    const goals = dungeonStrategies[strategy];
    const goalType = goals.reduce((prev, current) => (state.count[prev] > 0 ? prev : current));
    for(let i = 0; i < state.board.length; i++){
        const startingNode = state.board.reduce((prev, current) => (((current.distance < prev.distance) && current.status == 0) ? current : prev));
        startingNode.status = 1;
        const neighbors = state.board.filter(node => (node.status == 0 && Math.abs(node.x - startingNode.x) + Math.abs(node.y - startingNode.y) == 1));
        for(j = 0; j < neighbors.length; j++){
            const node = neighbors[j];
            if(node.type == goalType){
                let direction = node.x - startingNode.x == -1 ? "Left" : node.x - startingNode.x == 1 ? "Right" : node.y - startingNode.y == -1 ? "Up" : "Down";
                node.directions = [...startingNode.directions];
                node.directions.push(direction);
                debugger;
                return node.directions;
            }
            const stepDistance = node.type == 2 ? 100 : 1;
            if(stepDistance < node.distance){
                node.distance = startingNode.distance + stepDistance;
                let direction = node.x - startingNode.x == -1 ? "Left" : node.x - startingNode.x == 1 ? "Right" : node.y - startingNode.y == -1 ? "Up" : "Down";
                node.directions = [...startingNode.directions];
                node.directions.push(direction);
            }
        }
    }
}

function populateDungeonStrategies(){
    let select = document.getElementById("dungeonStrategySelect");
    let options = ['Full Clear', 'Full no Chests', 'Fast Clear', 'Fast no Chests'];

    for(var i = 0; i < options.length; i++) {
        var opt = options[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
}

populateDungeonStrategies();

document.getElementById("dungeonAutoClicker").addEventListener("click", toggleDungeonAutoClicker);
/*end dungeon*/

/*start autobuy*/
let autobuyIntervalId;
let autobuyMulchIntervalId;
let autobuyClickerDelay = 1000;

function toggleAutobuy(){
    if(autobuyIntervalId){
        clearInterval(autobuyIntervalId);
    }
    autobuyIntervalId = null;
    if(document.getElementById("purchaseAutoClicker").checked){
        autobuyIntervalId = setInterval(autobuy, autobuyClickerDelay);
    }
}

function toggleAutobuyMulch(){
    if(autobuyMulchIntervalId){
        clearInterval(autobuyMulchIntervalId);
    }
    autobuyMulchIntervalId = null;
    if(document.getElementById("purchaseMulchAutoClicker").checked){
        autobuyMulchIntervalId = setInterval(autobuyMulch, autobuyClickerDelay);
    }
}

let autobuyItems = [
    {name:'Ultraball', value:2000, amount:3000},
    {name:'xAttack', value:600, amount:3000},
    {name:'xClick', value:400, amount:3000},
    {name:'Lucky_egg', value:800, amount:3000},
    {name:'Token_collector', value:1000, amount:3000},
    {name:'Item_magnet', value:1500, amount:3000},
    {name:'Lucky_incense', value:2000, amount:3000},
    {name:'Boost_Mulch', value:50, amount:250000},
    {name:'Rich_Mulch', value:100, amount:200, index:1},
    {name:'Surprise_Mulch', value:150, amount:300, index:2},
];

function autobuy(){
    autobuyItems.filter(item => !item.name.includes('Mulch'))
    .forEach(item =>{
        if(shouldBuy(item)) {
            ItemList[item.name].buy(50);
        }
    })
}
function autobuyMulch(){
    autobuyItems.filter(item => item.name.includes('Mulch'))
    .forEach(item =>{
        if(shouldBuy(item)) {
            ItemList[item.name].buy(50);
        }
    })
}


function shouldBuy(item){
    if(ItemList[item.name].price() > item.value) return false;
    if(item.name == 'Ultraball'){
        return App.game.pokeballs.pokeballs[2].quantity() < item.amount;
    }
    if(item.name == 'Boost_Mulch'){
        return App.game.wallet.currencies[4]() > item.amount;
    }
    if(item.name.includes('Mulch') ){
        return App.game.farming.mulchList[item.index]() < item.amount;
    }
    return player.itemList[item.name]() < item.amount;
}

document.getElementById("purchaseAutoClicker").addEventListener("click", toggleAutobuy);
document.getElementById("purchaseMulchAutoClicker").addEventListener("click", toggleAutobuyMulch);


/*end autobuy */
