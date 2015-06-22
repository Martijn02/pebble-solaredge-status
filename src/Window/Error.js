var UI = require('ui');
var Vector2 = require('vector2');
var current_watch = require('WatchInfo.js');

var ErrorWindow = {
  window: new UI.Window({}),
    background: new UI.Rect({
    position: new Vector2(0,0), 
    size: new Vector2(144, 168),
    backgroundColor: (current_watch.platform == "basalt" ? 'darkCandyAppleRed' : 'white')
  }),
  image: new UI.Image({
    image: 'images/mobile_ffffff_70.png',
    position: new Vector2(37,37), 
    size: new Vector2(70, 70),
    compositing: (current_watch.platform == "basalt" ? 'set' : 'clear')
  }),
  statusText: new UI.Text({
    text: 'Please configure',
    position: new Vector2(0,115), 
    size: new Vector2(144, 25),
    font: 'gothic-24-bold',
    color: (current_watch.platform == "basalt" ? 'white' : 'black'),
    textAlign: 'center'
  })
};

ErrorWindow.window.add(ErrorWindow.image);
ErrorWindow.window.add(ErrorWindow.background);
ErrorWindow.window.add(ErrorWindow.statusText);

module.exports = ErrorWindow;