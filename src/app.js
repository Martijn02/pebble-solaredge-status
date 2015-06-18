var Settings = require('settings');
var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');

var detailWindow = false;
var dateDiff = 0;
var timeLegends = [[6, 0], [9, 23], [12, 47], [15, 74], [18, 101], [21, 128]];
var graphHeight = 120;
var graphTop = 16;

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
    loadData();
  }
);


// Create a Card with title and subtitle
var card = new UI.Card({
  title:' SolarEdge',
  subtitle:'Loading data...',
  style: 'large',
  icon: 'images/sun.png'
});

// Display the Card
card.show();

if (!Settings.option('maxPower')) {
  Settings.option('maxPower', 0);
}

if (Settings.option('siteId') && Settings.option('apiKey')) {
  loadData();
} else {
  card.subtitle("");
  card.body("Please configure the app on your phone.");
}

function loadData() {
  ajax(
    {
      url:'https://monitoringapi.solaredge.com/site/' + Settings.option('siteId') + '/overview.json?api_key='+Settings.option('apiKey'),
      type:'json'
    },
    function(data) {
      card.subtitle(numberFormat(data.overview.lastDayData.energy, 2, 'Wh'));
      card.body('Today: ' + numberFormat(data.overview.lastDayData.energy, 2, 'Wh') + '\n' +
                'Month: ' + numberFormat(data.overview.lastMonthData.energy, 2, 'Wh') + '\n' +
                'Total: ' + numberFormat(data.overview.lifeTimeData.energy, 2, 'Wh') + '\n' + 
                'Power ' + numberFormat(data.overview.currentPower.power, 2, 'W') + '\n');
     
      card.on('click', 'select', function() {
        console.log('Select clicked!');
        card.hide('');
        createDetailWindow();
        detailWindow.show();
      });
      
    },
    function(error) {
      console.log(error);
      card.body("Error: " + error);
    }
  );
}

function createDetailWindow() {
  console.log('createDetailWindow');
  if (detailWindow)
    return detailWindow;
  
  // Create the Window
  detailWindow = new UI.Window();
  
  // Add KWh text
  detailWindow.kwhText = new UI.Text({
    text: '22.7kWh',
    position: new Vector2(0,0), 
    size: new Vector2(50, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'left',
  });
  detailWindow.add(detailWindow.kwhText);
  
  // Add date text
  detailWindow.dateText = new UI.Text({
    text: '2015-45-79',
    position: new Vector2(0,0), 
    size: new Vector2(144, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'center',
  });
  detailWindow.add(detailWindow.dateText);
  
  // Add max power text
  detailWindow.maxText = new UI.Text({
    text: Settings.option('maxPower') + 'W',
    position: new Vector2(144-40,0), 
    size: new Vector2(40, 10),
    font: 'gothic-14',
    color: 'white',
    textAlign: 'right',
  });
  detailWindow.add(detailWindow.maxText);
  
  // Add graph bars
  detailWindow.bars = [];
  for (var n = 0; n < 64; n++) {
    var height = 1;
    var bar = new UI.Rect({ 
      position: new Vector2(n*2 + Math.floor(n / 4), graphTop + (graphHeight-height)), 
      size: new Vector2(2, height),
      borderColor: 'white', 
      backgroundColor: 'black' 
    });       
    detailWindow.add(bar);
    detailWindow.bars.push(bar);
  }

  // Add time legend texts
  for (var i = 0; i < timeLegends.length; i++) {
    console.log(i, timeLegends[i][0]);
    detailWindow.add(new UI.Text({
      text: timeLegends[i][0],
      position: new Vector2(timeLegends[i][1], graphTop + graphHeight), 
      size: new Vector2(20, 10),
      font: 'gothic-14',
      color: 'white',
      textAlign: 'left',
    }));
  }

  // Load detail data
  loadDetailData(dateDiff);
  
  // Click event handlers
  detailWindow.on('click', 'up', function() {
    console.log('detailWindow up');
    animateBarsToZero();
    loadDetailData(++dateDiff);
  });
  
  detailWindow.on('click', 'down', function() {
    console.log('detailWindow down');
    if(dateDiff > 0) {
      animateBarsToZero();
      loadDetailData(--dateDiff);
    }
  });
  
  detailWindow.on('click', 'select', function() {
    console.log('detailWindow select');
    detailWindow.hide();
    card.show();
  });
  return detailWindow;
}

function animateBarsToZero() {
  for(var n = 0; n < 64; n++) {
    var pos = detailWindow.bars[n].position().set(n*2 + Math.floor(n / 4), graphTop + (graphHeight-1));
    var size = detailWindow.bars[n].size().set(2, 1);
    // Schedule the animation with an animateDef
    detailWindow.bars[n].animate({ position: pos, size: size });
  }
}

function loadDetailData(dateDiff) {
  var date = new Date();
  if(dateDiff > 0) {
    date.setDate(date.getDate() - dateDiff);
  }
  
  var dateText = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
  detailWindow.dateText.text(dateText);
  detailWindow.kwhText.text('');
    
  var url = 'https://monitoringapi.solaredge.com/site/' + Settings.option('siteId') + '/power.json?api_key=' + Settings.option('apiKey') + '&startTime=' + dateText + '%206:00:00&endTime=' + dateText + '%2022:00:00';
  console.log('Opening URL: ' + url);
  ajax(
    {
      url:url,
      type:'json'
    },
    function(data) {
      var max = Settings.option('maxPower');
      for(var i = 0; i < data.power.values.length; i++) {
        if(data.power.values[i].value > max)
          max = data.power.values[i].value;
      }
      for(var n = 0; n < data.power.values.length; n++) {
        var barHeight = Math.floor(data.power.values[n].value / max * graphHeight);
        var pos = detailWindow.bars[n].position().set(n*2 + Math.floor(n / 4), graphTop + (graphHeight-barHeight));
        var size = detailWindow.bars[n].size().set(2, barHeight);
        // Schedule the animation with an animateDef
        detailWindow.bars[n].animate({ position: pos, size: size });
      }
      detailWindow.maxText.text(Math.round(max) + "W");
      var url = 'https://monitoringapi.solaredge.com/site/' + Settings.option('siteId') + '/energy.json?api_key=' + Settings.option('apiKey') + '&startDate=' + dateText + '&endDate=' + dateText;
      console.log('Opening URL: ' + url);
      ajax(
        {
          url:url,
          type:'json'
        },
        function(data) {
          var kwh = data.energy.values[0].value / 1000;
          detailWindow.kwhText.text(kwh.toFixed(1) + "kWh");
        },
        function(error) {
          console.log("Error: " + error);
        }
      );
          
    },
    function(error) {
      console.log("Error: " + error);
    }
  );
}


 
function numberFormat(value, precision, suffix) {
  var unit = '';
  if(value > 1000) {
    value = value / 1000;
    unit = 'k';
  }
  if(value > 1000) {
    value = value / 1000;
    unit = 'M';
  }
  return value.toFixed(precision) + ' ' + unit + suffix;
  
}