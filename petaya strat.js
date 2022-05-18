function plantWithCondition({shouldHarvest=false,shouldShovel=true, condition, newPlant}){
    const conditionPlot = App.game.farming.plotList[condition.plotId];
    const targetPlot = App.game.farming.plotList[newPlant.plotId];
    if(shouldShovel){
        if(targetPlot.berry != newPlant.berryId){
            App.game.farming.shovel(newPlant.plotId);
        }
    }
    const conditionMaxAge = conditionPlot.berryData.growthTime[condition.toDeath?4:3];
    const timeLeft = conditionMaxAge - conditionPlot.age;
    if(timeLeft > condition.timeLeft){
        return false;
    }
    if(shouldHarvest){
        App.game.farming.harvest(newPlant.plotId);
    }
    App.game.farming.plant(newPlant.plotId, newPlant.berryId)
    return true;
}

const plotStrategy = [
    {
        plotNum:0,
        berryName:'Kasib',
        berryNum:47,
        timeLeft:300
    },
    {
        plotNum:1,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:2,
        berryName:'Payapa',
        berryNum:44,
        timeLeft:35520
    },
    {
        plotNum:3,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:4,
        berryName:'Yache',
        berryNum:39,
        timeLeft:43200
    },
    {
        plotNum:5,
        berryName:'Shuca',
        berryNum:42,
        timeLeft:39120
    },
    {
        plotNum:6,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:7,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:8,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:9,
        berryName:'Wacan',
        berryNum:37,
        timeLeft:3180
    },
    {
        plotNum:10,
        berryName:'Chople',
        berryNum:40,
        timeLeft:35520
    },
    {
        plotNum:11,
        berryName:'Coba',
        berryNum:43,
        timeLeft:19320
    },
    {
        plotNum:12,
        berryName:'Kebia',
        berryNum:41,
        timeLeft:600
    },
    {
        plotNum:13,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:14,
        berryName:'Haban',
        berryNum:48,
        timeLeft:0
    },
    {
        plotNum:15,
        berryName:'Colbur',
        berryNum:49,
        timeLeft:26520
    },
    {
        plotNum:16,
        berryName:'Babiri',
        berryNum:50,
        timeLeft:72000
    },
    {
        plotNum:17,
        berryName:'Charti',
        berryNum:46,
        timeLeft:37320
    },
    {
        plotNum:18,
        berryName:null,
        berryNum:62,
        timeLeft:0
    },
    {
        plotNum:19,
        berryName:'Tanga',
        berryNum:45,
        timeLeft:5520
    },
    {
        plotNum:20,
        berryName:'Occa',
        berryNum:35,
        timeLeft:21480
    },
    {
        plotNum:21,
        berryName:'Rindo',
        berryNum:38,
        timeLeft:28320
    },
    {
        plotNum:22,
        berryName:'Passho',
        berryNum:36,
        timeLeft:21120
    },
    {
        plotNum:23,
        berryName:'Roseli',
        berryNum:52,
        timeLeft:24720
    },
    {
        plotNum:24,
        berryName:'Chilan',
        berryNum:51,
        timeLeft:5520
    },

];

let conditionMap = [];
plotStrategy.forEach(plot =>{
    conditionMap.push({
        condition: {
            plotId: 14,
            timeLeft: plot.timeLeft,
            toDeath: false
        },
        newPlant: {
            plotId: plot.plotNum,
            berryId: plot.berryNum
        }
    })
});

conditionMap.forEach(cond => plantWithCondition(cond));

function checkPetaya(){
    let plotList = App.game.farming.plotList;
    for(let i = 0; i < plotList.length; i++){
        if(plotList[i].berry == 62) return true;
    }
    return false;
}

let tryPetaya = true;
function doPlant(){
    
    if(tryPetaya){
        let petaya = checkPetaya()
        if(petaya != -1){
            App.game.farming.harvestAll();
            plantPasshos(petaya);
            tryPetaya = false;
        }
        conditionMap.forEach(cond => plantWithCondition(cond));
        setTimeout(doPlant, 1000);
    }
}
doPlant();

function plantPasshos(petaya){
    //plant to left, right, and all three below:
    App.game.farming.plant(petaya-1, 36);
    App.game.farming.plant(petaya+1, 36);
    App.game.farming.plant(petaya+4, 36);
    App.game.farming.plant(petaya+5, 36);
    App.game.farming.plant(petaya+6, 36);

    if(petaya != 1 && petaya != 3){
        App.game.farming.plant(petaya-4, 36);
        App.game.farming.plant(petaya-5, 36);
        App.game.farming.plant(petaya-6, 36);
    }
}
/*
exemplo
plantar uma chesto(id = 1) no centro se o plot superior esquerdo estiver com menos que 20s pra morrer, harvesando se tiver algo pra harvestar no plot

plantWithCondition({
  shouldHarvest: true,
  condition: {
    plotId: 0,
    timeLeft: 20,
    toDeath: true
  },
  newPlant: {
    plotId: 12,
    berryId: 1
  }
});

plantar maluquice sem harvest em todos os plots se o ultimo tiver a < 1 min de maturar

const newPlants = [];
for(let i = 0; i < 24; i++){
  newPlants.push({plotId: i, berryId: 23-i});
}
newPlants.map(plant => plantWithCondition({condition: {plotId: 24, timeLeft: 60}, newPlant: plant}));
*/