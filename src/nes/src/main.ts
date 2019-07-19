import { NesConsole } from "./nesconsole";
import RomManager from "./ui/rommanager";
import { ConsoleState } from "./nes";

var canvasId = "main";
var gameConsole: NesConsole;
var timeoutHandle = undefined;

document.getElementById("btn-play").addEventListener("click", () => {
  if(timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  var selectElement = document.getElementById(
    "select-game"
  ) as HTMLSelectElement;
  var selectedGame = Number(
    selectElement.options[selectElement.selectedIndex].value
  );

  var game = RomManager.valueToGame(selectedGame);
  gameConsole = new NesConsole(game, canvasId);
  gameConsole.setupDOM();

  timeoutHandle = setTimeout(function() {
    document.getElementById("select-game").classList.add("hidden");
    document.getElementById("btn-play").classList.add("hidden");

    setImmediate(() => gameConsole.run(performance.now()));
  }, 1000);
});

document.getElementById("btn-save").addEventListener("click", () => {
  var data = gameConsole.save();


  document.getElementById("saved-status").innerHTML = "<strong>State Saved!</strong>";
  saveJSON(data, "save-state.json");
});

document.getElementById("btn-load").addEventListener("click", () => {
  var data: ConsoleState = JSON.parse(document.getElementById("console-dump").textContent);

  gameConsole.load(data);
});

document.getElementById("overlay").className = "hidden";

/* function to save JSON to file from browser
  * adapted from http://bgrins.github.io/devtools-snippets/#console-save
  * @param {Object} data -- json object to save
  * @param {String} file -- file name to save to 
*/
function saveJSON(data, filename){

  if(!data) {
      console.error('No data')
      return;
  }

  if(!filename) filename = 'console.json'

  if(typeof data === "object"){
      data = JSON.stringify(data, undefined, 4)
  }

  var blob = new Blob([data], {type: 'text/json'}),
      e    = document.createEvent('MouseEvents'),
      a    = document.createElement('a')

  a.download = filename
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
  e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  a.dispatchEvent(e)
}