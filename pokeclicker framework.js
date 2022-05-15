const activeActions = [];
const mainInterval = 1000;
const storage = {};

/*
layout config
*/
const maxColumns = 3; // maximum amount of inputs per row

const position = ["beforeEnd", "middle-column"]; // recommended options: (beforeEnd, afterStart), (left-column, middle-column, right-column)



/* 
macro declarations
each declaration must be a function that returns an object with 
an array named "inputs" defining the GUI 
an optional
an array named "initActions" for actions that should be loaded on init
return {inputs, init, initActons}

inputs: [
  {
    type:     string type of input(checkbox, select, etc) - type:'gap' creates empty element,
    id:       [optional] DOM element id,
    onClick:  [optional] function to be executed on DOM element click,
    label:    [optional] string to be placed after the input. no effect on type='select'
    options:  [optional] array of objects for initial options for type='select' inputs. [{label, value}, {label, value}, {label, value}]. label can be omitted to use value as label
  }
]

actions
each action in array activeActions is executed on every main call

const someAction = createAction({
  execute:              main function of the action,
  endCondition:         [optional] boolean or function returning a boolean. removes action from activeActions when true,
  onConditionFulfilled: [optional] function to be executed when endCondition is true
  onConditionFailed:    [optional] function to be executed when endCondition is false. runs before execute
  nextActions:          [optional] actions array to be added to activeActions when endCondition is true
})
*/
const declarations = {
  route: () => {
    
    let battleAutoClickerIntervalId = null;
    let battleAutoClickerDelay = 1;
    
    function shouldMove(){
      let strategy = document.getElementById("routeStrategies").value;
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
    
    function clickBattle(){
      const autoMasterball = document.getElementById("routeMasterballToggle").checked;
      if(autoMasterball){
        if(Battle.enemyPokemon() && PokemonHelper.getPokemonById(Battle.enemyPokemon().id).catchRate < 10 && Battle.enemyPokemon().shiny ){

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
    }
    
    function startBattleAutoClicker(){
      if(!battleAutoClickerIntervalId){
        battleAutoClickerIntervalId = setInterval(clickBattle, battleAutoClickerDelay);
      }
    }
    
    function stopBattleAutoClicker(){
      if(battleAutoClickerIntervalId){
        clearInterval(battleAutoClickerIntervalId);
      }
      battleAutoClickerIntervalId = null;
    }
    
    const battleAction = createAction({
      execute: startBattleAutoClicker,
      endCondition: ()=>!document.getElementById("routeToggle").checked,
      onConditionFulfilled: stopBattleAutoClicker
    });
    
    const onClick = () => {
      if(document.getElementById("routeToggle").checked){
        activeActions.push(battleAction);
      }
    };
    
    const inputs = [
      {type: "checkbox", id: "routeToggle", label: "Battle", onClick},
      {
        type: "select", id: "routeStrategies",
        options: [
          {value: "None"},
          {value: "Achievement"},
          {value: "Shiny"}
        ]
      },
      {type: "checkbox", id: "routeMasterballToggle", label: "Masterball"}
    ];
    
    return {inputs};
  },
  
  gym: () => {
    
    let battleAutoClickerIntervalId = null;
    let battleAutoClickerDelay = 1;
    
    function clickBattle(){
      let strategy = document.getElementById("gymStrategies").value;
      if(App.game.gameState == GameConstants.GameState.town){
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
      if(App.game.gameState == GameConstants.GameState.gym){
        GymBattle.clickAttack();
      }
    }
    
    function startBattleAutoClicker(){
      if(!battleAutoClickerIntervalId){
        battleAutoClickerIntervalId = setInterval(clickBattle, battleAutoClickerDelay);
      }
    }
    
    function stopBattleAutoClicker(){
      if(battleAutoClickerIntervalId){
        clearInterval(battleAutoClickerIntervalId);
      }
      battleAutoClickerIntervalId = null;
    }
    
    const gymAction = createAction({
      execute: startBattleAutoClicker,
      endCondition: ()=>!document.getElementById("gymToggle").checked,
      onConditionFulfilled: stopBattleAutoClicker
    });
    
    const onClick = () => {
      if(document.getElementById("gymToggle").checked){
        activeActions.push(gymAction);
      }
    };
    
    const inputs = [
      {type: "checkbox", id: "gymToggle", label: "Gym", onClick},
      {
        type: "select", id: "gymStrategies",
        options: [
          {value: "1"},
          {value: "2"},
          {value: "3"},
          {value: "4"},
          {value: "Champion"}
        ]
      },
      {type: "gap"}
    ];
    
    return {inputs};
  }, 
  
  dungeons: () => {
    
    let dungeonClickerIntervalId = null;
    let dungeonClickerDelay = 1;

    let bestPath = {goalType: null, path: []};

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
      bestPath = getBestPath(state);
    }
    
    function getBestPath(state){
      const strategy =  document.getElementById("dungeonStrategies").value;
      const goals = dungeonStrategies[strategy];
      let goalType = goals.reduce((prev, current) => (state.count[prev] > 0 ? prev : current));
      for(let i = 0; i < state.board.length; i++){
        const startingNode = state.board.reduce((prev, current) => (((current.distance < prev.distance) && current.status == 0) ? current : prev), {distance: 1000000});
        startingNode.status = 1;
        const neighbors = state.board.filter(node => (node.status == 0 && Math.abs(node.x - startingNode.x) + Math.abs(node.y - startingNode.y) == 1));
        for(j = 0; j < neighbors.length; j++){
          const node = neighbors[j];
          if(node.type == goalType){
            let direction = node.x - startingNode.x == -1 ? "Left" : node.x - startingNode.x == 1 ? "Right" : node.y - startingNode.y == -1 ? "Up" : "Down";
            node.directions = [...startingNode.directions];
            node.directions.push(direction);
            node.directions.push("goal");
            return {goalType, path: node.directions};
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

    function interact(){
      const currentTileType = DungeonRunner.map.currentTile().type();
      if(DungeonRunner.fighting() && !DungeonBattle.catching()){
        const autoMasterball = document.getElementById("dungeonMasterballToggle").checked;
        if(autoMasterball){
          if(PokemonHelper.getPokemonById(Battle.enemyPokemon().id).catchRate < 10 && Battle.enemyPokemon().shiny ){
            App.game.pokeballs.notCaughtShinySelection = 3;
          }
          else{
            App.game.pokeballs.notCaughtShinySelection = 2;
          }
        }
        DungeonBattle.clickAttack();
      }
      else if (currentTileType == bestPath.goalType && bestPath.goalType == 3){
        DungeonRunner.openChest();
      }
      else if(currentTileType == bestPath.goalType && !DungeonRunner.fightingBoss() && bestPath.goalType == 4){
        DungeonRunner.startBossFight();
      }
      else if(!DungeonRunner.fighting() && !DungeonBattle.catching() && bestPath.path.length > 0){
        move();
      }
    }

    function move(){
      let direction = bestPath.path[0];
      bestPath.path.splice(0,1);
      if(direction != "goal"){
        DungeonRunner.map["move"+direction]();
      }
    }

    function dungeonClicker(){
      if((App.game.gameState == GameConstants.GameState.town) && player.town().dungeon){
          DungeonRunner.initializeDungeon(player.town().dungeon);
      }
      if(!(App.game.gameState === GameConstants.GameState.dungeon)){
        return;
      }
      if(bestPath.path.length == 0){
        dijkstra();
      }
      let i = 0;
      while(bestPath.path.length > 0 && i < 1200){
        interact();
        i++;
      }
    }
    
    function startDungeonClicker(){
      if(!dungeonClickerIntervalId){
        dungeonClickerIntervalId = setInterval(dungeonClicker, dungeonClickerDelay);
      }
    }
    
    function stopDungeonClicker(){
      if(dungeonClickerIntervalId){
        clearInterval(dungeonClickerIntervalId);
      }
      dungeonClickerIntervalId = null;
    }
    
    const dungeonAction = createAction({
      execute: startDungeonClicker,
      endCondition: ()=>!document.getElementById("dungeonToggle").checked,
      onConditionFulfilled: stopDungeonClicker
    });
    
    const onClick = () => {
      if(document.getElementById("dungeonToggle").checked){
        activeActions.push(dungeonAction);
      }
    };
    
    const inputs = [
      {type: "checkbox", id: "dungeonToggle", label: "Dungeons", onClick},
      {
        type: "select", id: "dungeonStrategies",
        options: [
          {value: "Fast Clear"},
          {value: "Fast no Chests"},
          {value: "Full Clear"},
          {value: "Full no Chests"}
        ]
      },
      {type: "checkbox", id: "dungeonMasterballToggle", label: "Masterball"},
    ];
    
    return {inputs};
  },
  
  hatchery: () => {
    
    const populateStrategies = () => {
      let select = document.getElementById("hatcheryStrategies");
      let oldOption = Math.max(select.selectedIndex, 0);
      for(i = select.options.length; i >= 0; i--){
        select.remove(i);
      }
      let eggTypes = [
        {Name:'Electric_egg', Label:'Electric Egg'},
        {Name:'Fire_egg', Label:'Fire Egg'},
        {Name:'Water_egg', Label:'Water Egg'},
        {Name:'Fighting_egg', Label:'Fighting Egg'},
        {Name:'Dragon_egg', Label:'Dragon Egg'},
        {Name:'Grass_egg', Label:'Grass Egg'},
        {Name:'Mystery_egg', Label:'Mystery Egg'}
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
    
    const execute = () => {
      for(let i = 3; i >= 0; i--){
        App.game.breeding.hatchPokemonEgg(i);
      }
      for(let i = 7; i >= 0; i--){
        const queue = document.getElementById("hatcheryQueueToggle").checked;
        if((!queue && App.game.breeding.hasFreeEggSlot()) || (queue && App.game.breeding.queueList().length < 4)){
          let strat = document.getElementById("hatcheryStrategies").value;
          if(strat.includes('egg')){
            ItemList[strat].use();
            populateStrategies();
          }
          else{
            let pokeList = PartyController.getHatcherySortedList().filter( poke => {
              return poke.level == 100 && poke.breeding == false && (strat.includes('no Shinies') ? !poke.shiny : true)
            });
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
    }
    
    const hatcheryAction = createAction({
      execute,
      endCondition: ()=>!document.getElementById("hatcheryToggle").checked
    });
    
    const onClick = () => {
      if(document.getElementById("hatcheryToggle").checked){
        activeActions.push(hatcheryAction);
      }
    }
    
    const inputs = [
      {type: "checkbox", id: "hatcheryToggle", label: "Hatchery", onClick},
      {type: "select", id: "hatcheryStrategies"},

      {type: "checkbox", id: "hatcheryQueueToggle", label: "Use queue"}
    ];
    
    return {inputs, init: populateStrategies};
  },
  
  farm: () => {
    
    function execute(){
        let plots = App.game.farming.plotList;
        let strategy = document.getElementById("farmStrategies").value;
        let mulchStrategy = document.getElementById("mulchStrategies").value;
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
        let strat = document.getElementById("farmStrategies").value;
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
                if(plot.age < plot.berryData.growthTime[3] - 800){//boost until 10min left (not counting Sprayduck)
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


    const farmAction = createAction({
      execute,
      endCondition: ()=>!document.getElementById("farmToggle").checked
    });
    
    const onClick = () => {
      if(document.getElementById("farmToggle").checked){
        activeActions.push(farmAction);
      }
    };
    
    const inputs = [
      {type: "checkbox", id: "farmToggle", label: "Farm", onClick},
      {
        type: "select", id: "farmStrategies", 
        options: [
          {value: "Replant Early"},
          {value: "Replant Late"},
          {value: "Plant Selected"}
        ]
      },
      {
        type: "select", id: "mulchStrategies", 
        options: [
            {value:'None'},
            {value:'Boost All'}, 
            {value:'Rich Only'}, 
            {value:'Boost + Rich'},
            {value:'Surprise Open'},
            {value:'Surprise Planted'}, 
            {value:'Surprise All'}
        ]
      },

    ];
    
    return {inputs};
  },
  
  bomber: () => {
    
    const shouldBomb = () => (App.game.underground.energy >= (App.game.underground.getMaxEnergy() - 10));
    const shouldBuy = (item) => {
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
    const executeBomb = () => {

      if(shouldBomb()){
        Mine.bomb();
      }
    }
    const executeBuy = () => {
        autobuyItems.filter(item => !item.name.includes('Mulch'))
        .forEach(item =>{
            if(shouldBuy(item)){
                ItemList[item.name].buy(50);
            }
        });
      }
    const executeBuyMulch = () => {
        autobuyItems.filter(item => !item.name.includes('Mulch'))
        .forEach(item =>{
            if(shouldBuy(item)){
                ItemList[item.name].buy(50);
            }
        });
    }
    

    
    const bombAction = createAction({
      execute:executeBomb,
      endCondition: ()=>!document.getElementById("bomberToggle").checked
    });
    const buyAction = createAction({
        execute:executeBuy,
        endCondition: ()=>!document.getElementById("buyToggle").checked
    });
    const buyMulchAction = createAction({
        execute:executeBuyMulch,
        endCondition: ()=>!document.getElementById("buyMulchToggle").checked
    });
    
    const onClickBomb = () => {
        

      if(document.getElementById("bomberToggle").checked){
        activeActions.push(bombAction);
      }
    }
    const onClickBuy = () => {
        if(document.getElementById("buyToggle").checked){
          activeActions.push(buyAction);
        }
    }
    const onClickBuyMulch = () => {
        if(document.getElementById("buyMulchToggle").checked){
            activeActions.push(buyMulchAction);
        }
    }
    
    
    const autobuyItems = [
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

    const inputs = [
      {type: "checkbox", id: "bomberToggle", label: "Bombs", onClick:onClickBomb},
      {type: "checkbox", id: "buyToggle", label: "Buy Item ", onClick:onClickBuy},
      {type: "checkbox", id: "buyMulchToggle", label: "Buy Mulch", onClick:onClickBuyMulch}

    ];
    
    return {inputs};
  }
};

function noop(){}

function createAction({execute = noop, endCondition = true, onConditionFulfilled = noop, onConditionFailed = noop, nextActions = []}){
  return {execute, endCondition, onConditionFulfilled, onConditionFailed, nextActions};
}

function createInputCard(){
  document.getElementById(position[1]).insertAdjacentHTML(position[0], `
  <div id='autoClickers' class='card sortable border-secondary mb-3'>
  <div class='card-header p-0' data-toggle='collapse' href='#autoClickersSelectorBody' aria-expanded='true'>
  <span>Auto Clickers</span>
  </div>
  <div id='autoClickersSelectorBody' class='card-body p-0 table-responsive collapse show'>
  </div>
  </div>
  `);
}

function createInputs(inputs){
  const lastRowItemCount = inputs.length % maxColumns;
  
  let finalInput = `<div class='autoClickerRow'>`
  
  inputs.map(({id, type, label, options = []}, index) => {
    const isLastRow = (inputs.length - (index + 1)) < lastRowItemCount;
    
    finalInput += `<div class='autoClickerInput' style='width: calc(100% / ${isLastRow?lastRowItemCount:maxColumns})'>`
    
    if(type == "select"){
      finalInput += `<select${id?` id='${id}'`:''}>`
      options.map(({value, label}) => {
        if(!label){
          label = value;
        }
        finalInput += `<option value='${value}'>${label}</option>`;
      });
      finalInput += `</select>`;
    }
    
    else if(type != "gap"){
      finalInput += `<input${id?` id='${id}'`:''} type='${type}'>`;
      if(label){
        finalInput += `<span>${label}</span>`
      }
    }
    
    finalInput += `</div>`
  });
  
  finalInput += `</div>`
  
  document.getElementById("autoClickersSelectorBody").insertAdjacentHTML("beforeEnd", finalInput);
  
  inputs.map(({type, id}) => {
    if(type == "select"){
      document.getElementById(id).selectedIndex = 0;
    }
  })
  
  inputs.map(input => {
    if(input.onClick){
      document.getElementById(input.id).addEventListener("click", input.onClick);
    }
  });
}

function createClass(name,rules){
  var style = document.createElement('style');
  style.type = 'text/css';
  document.getElementsByTagName('head')[0].appendChild(style);
  if(!(style.sheet||{}).insertRule) 
  (style.styleSheet || style.sheet).addRule(name, rules);
  else
  style.sheet.insertRule(name+"{"+rules+"}",0);
}

function initFramework(){
  createInputCard();
  Object.values(declarations).map((declaration) => {
    const {inputs = [], init = noop, initActions = []} = declaration();
    createInputs(inputs);
    init();
    initActions.map((action) => {
      activeActions.push(action);
    })
  });
  
  createClass('.autoClickerInput',"display: flex; align-items: center; padding-left: 12px;");
  createClass('.autoClickerInput input, .autoClickerInput select',"margin-right: 8px;");
  createClass('.autoClickerInput select',"width: 100%;");
  createClass(".autoClickerRow", "display: flex; align-items: center; flex-wrap: wrap;");
  createClass(".autoClickerRow:nth-child(2n)", "background-color: rgba(0,0,0,.05); ")
  createClass(".autoClickerRow:not(:last-child)", "border-bottom-color: rgb(128, 128, 128);")
}

function main(){
  for(let i = activeActions.length - 1; i >= 0; i--){
    const action = activeActions[i];
    if((!(action.endCondition instanceof Function) && action.endCondition) || ((action.endCondition instanceof Function) && action.endCondition())){
      action.onConditionFulfilled();
      activeActions.splice(i, 1);
      action.nextActions.map(nextAction => activeActions.push(nextAction));
    }
    else{
      action.onConditionFailed();
      action.execute();
    }
  }
};

initFramework();
setInterval(main, mainInterval);