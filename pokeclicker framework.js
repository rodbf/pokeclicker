const activeActions = [];
const mainInterval = 1000;

/*
layout config
*/
const maxColumns = 3; // maximum amount of inputs per row
const position = ["beforeEnd", "middle-column"]; // recommended options: (beforeEnd, afterStart), (left-column, middle-column, right-column)


/* 
  macro declarations
  each declaration must be a function that returns an object with an array named "inputs" defining the GUI and an array named "initActions" for actions that should be loaded on init
    return {inputs, initActons}

  inputs: [
    {
      type:     string type of input(checkbox, select, etc) - type:'gap' creates empty element,
      id:       [optional] DOM element id,
      onClick:  [optional] function to be executed on DOM element click,
      label:    [optional] string to be placed after the input. no effect on type='select'
      options:  [optional] array of objects for initial options for type='select' inputs. [{label, value}, {label, value}, {label, value}]
    }
  ]

  actions
  each action in array activeActions is executed on every main call

  const someAction = createAction({
    execute:              main function of the action,
    endCondition:         [optional] boolean or function returning a boolean. removes action from activeActions when true,
    onConditionFulfilled: [optional] function to be executed when endCondition is true
    onConditionFailed:    [optional] function to be executed when endCondition is false
    nextAction:           [optional] action to be added to activeActions when endCondition is true
  })
*/
const declarations = {
  autoBomber: () => {

    const shouldBomb = () => {
      return (App.game.underground.energy >= (App.game.underground.getMaxEnergy() - 10));
    }

    const clickBomb = () => {
      if(shouldBomb()){
        Mine.bomb();
      }
    }

    const bombAction = createAction({
      execute: clickBomb,
      endCondition: ()=>!document.getElementById("bombAutoClicker").checked
    })

    const onClick = () => {
      if(document.getElementById("bombAutoClicker").checked){
        activeActions.push(bombAction);
      }
    }

    const inputs = [
      {
        type: "checkbox",
        id: "bombAutoClicker",
        onClick,
        label: "Bombs"
      },
      /* examples to be removed */
      {
        type: "gap"
      },
      {
        type: "select",
        id: "bombAutoClicker2",
        options: [
          {label: "bomb1", value: 1},
          {label: "bomb2", value: 2},
          {label: "bomb3", value: 3}
        ]
      },
      {
        type: "checkbox",
        id: "bombAutoClicker3",
        label: "Bombs"
      },
      {
        type: "checkbox",
        id: "bombAutoClicker5",
        label: "Bombs"
      }
      /* end examples */
    ];

    const initActions = [];
    return {inputs, initActions};
  }
};

function noop(){}

function createAction({execute = noop, endCondition = true, onConditionFulfilled = noop, onConditionFailed = noop, nextAction = null}){
  return {execute, endCondition, onConditionFulfilled, onConditionFailed, nextAction};
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
      finalInput += `<select${id?` id=${id}`:''}>`
      options.map(({value, label}) => {
        finalInput += `<option value=${value}>${label}</option>`;
      });
      finalInput += `</select>`;
    }

    else if(type != "gap"){
      finalInput += `<input${id?` id=${id}`:''} type=${type}>`;
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

function init (){
  createInputCard();
  Object.values(declarations).map((declaration) => {
    const obj = declaration();
    obj.initActions.map((action) => {
      activeActions.push(action);
    })
    createInputs(obj.inputs);
  });
  
  createClass('.autoClickerInput',"display: flex; align-items: center; padding-left: 12px;");
  createClass('.autoClickerInput input, .autoClickerInput select',"margin-right: 8px;");
  createClass('.autoClickerInput select',"width: 100%;");
  createClass(".autoClickerRow", "display: flex; align-items: center; flex-wrap: wrap;");
  createClass(".autoClickerRow:nth-child(2n)", "background-color: rgba(0,0,0,.05); ")
  createClass(".autoClickerRow:not(:last-child)", "border-bottom-color: rgb(128, 128, 128);")
}

function main (){
  for(let i = activeActions.length - 1; i >= 0; i--){
    const action = activeActions[i];
    action.execute();
    if((!(action.endCondition instanceof Function) && action.endCondition) || ((action.endCondition instanceof Function) && action.endCondition())){
      action.onConditionFulfilled();
      activeActions.splice(i, 1);
      if (action.nextAction instanceof Function){
        activeActions.push(action.nextAction);
      }
    }
    else{
      action.onConditionFailed();
    }
  }
};

init();
setInterval(main, mainInterval);