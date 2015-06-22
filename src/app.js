var Settings = require('settings');

var errorWindow = require('Window/Error.js');
var overviewWindow = require('Window/Overview.js');
var detailWindow = require('Window/Detail.js');

var provider = require('DataProvider/SolarEdge.js');

console.log('Starting app', JSON.stringify(Settings.option()));

// Catch configuration events
Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('http://martijn.vanzal.com/sestatus/?' + encodeURIComponent(JSON.stringify(Settings.option())));
});

Pebble.addEventListener('webviewclosed',
  function(e) {
    var configuration = JSON.parse(decodeURIComponent(e.response));
    console.log('Configuration window returned: ', JSON.stringify(configuration));
    Settings.option('apiKey', configuration.apiKey);
    Settings.option('siteId', parseInt(configuration.siteId));
    Settings.option('maxPower', parseInt(configuration.maxPower));
    provider.loadData(overviewWindow, overviewDataLoaded);
  }
);

// Set default maxPower
if (!Settings.option('maxPower')) {
  Settings.option('maxPower', 0);
}

if (Settings.option('siteId') && Settings.option('apiKey')) {
  overviewWindow.window.show();
  provider.loadData(overviewWindow, overviewDataLoaded);
} else {
  errorWindow.window.show();
}

function overviewDataLoaded(err) {
  if(err) {
    overviewWindow.window.hide();
    errorWindow.statusText.text('Error loading');
    errorWindow.image.image('images/exclamation.png');
    errorWindow.window.show();
    return;
  }

  overviewWindow.animateIn();
  overviewWindow.window.on('click', 'select', function() {
    overviewWindow.window.hide();
    detailWindow.window.show();
    // Load detail data
    provider.loadDetailData(detailWindow, detailWindow.dateDiff, detailDataLoaded);
  });
}

// Click event handlers
detailWindow.window.on('click', 'up', function() {
  detailWindow.animateBarsToZero();
  provider.loadDetailData(detailWindow, ++detailWindow.dateDiff, detailDataLoaded);
});

detailWindow.window.on('click', 'down', function() {
  if(detailWindow.dateDiff > 0) {
    detailWindow.animateBarsToZero();
    provider.loadDetailData(detailWindow, --detailWindow.dateDiff, detailDataLoaded);
  }
});

detailWindow.window.on('click', 'select', function() {
  detailWindow.window.hide();
  overviewWindow.window.show();
});

function detailDataLoaded(err) {
  if(err) {
    detailWindow.window.hide();
    errorWindow.statusText.text('Error loading');
    errorWindow.image.image('images/exclamation.png');
    errorWindow.window.show();
    return;
  }
}