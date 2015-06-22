var UI = require('ui');
var Vector2 = require('vector2');
var current_watch = require('WatchInfo.js');


var window = {
  window: new UI.Window({}),
  background: new UI.Rect({
    position: new Vector2(0,0), 
    size: new Vector2(144, 168),
  }),
  logo: new UI.Image({
    image: 'images/solaredgelogo.png',
    position: new Vector2(2,45), 
    size: new Vector2(140, 28)
  }),
  statusText: new UI.Text({
    text: 'Fetching data',
    position: new Vector2(0,100), 
    size: new Vector2(144, 10),
    font: 'gothic-24',
    color: (current_watch.platform == "basalt" ? 'red' : 'black'),
    textAlign: 'center'
  }),
};


window.window.add(window.background);
window.window.add(window.logo);
window.window.add(window.statusText);

window.today = createLine(25*7, 'Today:', '0', 'Wh');
window.month = createLine(49*7, 'Month:', '0', 'Wh');
window.year = createLine(73*7, 'Year:', '0', 'Wh');
window.total = createLine(97*7, 'Total:', '0', 'Wh');
window.power = createLine(121*7, 'Power:', '0', 'W');
window.lines = [window.today, window.month, window.year, window.total, window.power];

module.exports = window;

function createLine(top, legend, value, units) {
  var line = {
    legend: new UI.Text({
      text: legend,
      position: new Vector2(2, top+2), 
      size: new Vector2(46, 1),
      font: 'gothic-24',
      color: 'black',
      textAlign: 'left'
    }),
    value: new UI.Text({
      text: value,
      position: new Vector2(48, top), 
      size: new Vector2(60, 1),
      font: 'gothic-28-bold',
      color: 'black',
      textAlign: 'right'
    }),
    units: new UI.Text({
      text: units,
      position: new Vector2(112, top+2), 
      size: new Vector2(30, 1),
      font: 'gothic-24',
      color: 'black',
      textAlign: 'left'
    }),
    animateTo: function(top) {
      this.legend.animate({position: this.legend.position().set(2, top+2)});
      this.value.animate({position: this.value.position().set(48, top)});
      this.units.animate({position: this.units.position().set(112, top+2)});
    },
    text: function(text) {
      var value = text.split(' ', 2);
      this.value.text(value[0]);
      this.units.text(value[1]);
    }
  };
  
  window.window.add(line.legend);
  window.window.add(line.value);    
  window.window.add(line.units);
  return line;
}

