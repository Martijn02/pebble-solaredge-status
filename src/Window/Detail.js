var Settings = require('settings');
var UI = require('ui');
var Vector2 = require('vector2');
var current_watch = require('WatchInfo.js');

var timeLegends = [[6, 0], [9, 23], [12, 47], [15, 74], [18, 101], [21, 128]];
var graphHeight = 120;
var graphTop = 16;
var max = Settings.option('maxPower');

var window = {
  dateDiff: 0,
  window: new UI.Window({}),
  background: new UI.Rect({
    position: new Vector2(0,0), 
    size: new Vector2(144, 168),
    backgroundColor: 'black'
  }),
  kwhText: new UI.Text({
    text: '22.7kWh',
    position: new Vector2(0,0), 
    size: new Vector2(50, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'left',
  }),
  dateText: new UI.Text({
    text: '2015-45-79',
    position: new Vector2(0,0), 
    size: new Vector2(144, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'center',
  }),
  maxText: new UI.Text({
    text: max + 'W',
    position: new Vector2(144-40,0), 
    size: new Vector2(40, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'right',
  }),
  bars : [],
  setMax: function(value) {
    max = value;
    this.maxText.text(max + 'W');
  },
  animateBarsToZero: function() {
    for(var n = 0; n < 64; n++) {
      var pos = this.bars[n].position().set(n*2 + Math.floor(n / 4), graphTop + (graphHeight-1));
      var size = this.bars[n].size().set(2, 1);
      // Schedule the animation with an animateDef
      this.bars[n].animate({ position: pos, size: size });
    }
  },
  animateBarTo: function(bar, value) {
    var barHeight = Math.floor(value / max * graphHeight);
    var pos = this.bars[bar].position().set(bar*2 + Math.floor(bar / 4), graphTop + (graphHeight-barHeight));
    var size = this.bars[bar].size().set(2, barHeight);
    // Schedule the animation with an animateDef
    this.bars[bar].animate({ position: pos, size: size });
  }
};

window.window.add(window.background);
window.window.add(window.kwhText);
window.window.add(window.dateText);
window.window.add(window.maxText);

// Add bars
for (var n = 0; n < 64; n++) {
  var height = 1;
  var bar = new UI.Rect({ 
    position: new Vector2(n*2 + Math.floor(n / 4), graphTop + (graphHeight-height)), 
    size: new Vector2(2, height),
    borderColor: 'white', 
    backgroundColor: 'black' 
  });       
  window.window.add(bar);
  window.bars.push(bar);
}

// Add time legend texts
for (var i = 0; i < timeLegends.length; i++) {
  window.window.add(new UI.Text({
    text: timeLegends[i][0],
    position: new Vector2(timeLegends[i][1], graphTop + graphHeight), 
    size: new Vector2(20, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'left',
  }));
}

module.exports = window;