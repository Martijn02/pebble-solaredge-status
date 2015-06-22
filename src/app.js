var Settings = require('settings');
var ajax = require('ajax');

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

if (!Settings.option('maxPower')) {
  Settings.option('maxPower', 0);
}

var errorWindow = require('Window/Error.js');
var overviewWindow = require('Window/Overview.js');
var detailWindow = require('Window/Detail.js');


if (Settings.option('siteId') && Settings.option('apiKey')) {
  overviewWindow.window.show();
  loadData(function() {
    overviewWindow.window.remove(overviewWindow.statusText);
    // Animate logo up
    overviewWindow.logo.animate({ position: overviewWindow.logo.position().set(2, 2) }, 400);
    // Animate lines into view
    for (var n = 0; n < overviewWindow.lines.length; n++) {
      overviewWindow.lines[n].animateTo(25 + (n*24));
    }  
  });
} else {
  errorWindow.window.show();
}


function loadData(cb) {
  ajax(
    {
      url:'https://monitoringapi.solaredge.com/site/' + Settings.option('siteId') + '/overview.json?api_key='+Settings.option('apiKey'),
      type:'json'
    },
    function(data) {
      
      overviewWindow.today.text(numberFormat(data.overview.lastDayData.energy, 2, 'Wh'));
      overviewWindow.month.text(numberFormat(data.overview.lastMonthData.energy, 2, 'Wh'));
      overviewWindow.year.text(numberFormat(data.overview.lastYearData.energy, 2, 'Wh'));
      overviewWindow.total.text(numberFormat(data.overview.lifeTimeData.energy, 2, 'Wh'));
      overviewWindow.power.text(Math.round(data.overview.currentPower.power) + ' W');
     
      overviewWindow.window.on('click', 'select', function() {
        console.log('Select clicked!');
        overviewWindow.window.hide();
        detailWindow.window.show();
        // Load detail data
        loadDetailData(detailWindow.dateDiff);
      });
      
      cb();
      
    },
    function(error) {
      console.log(error);
      overviewWindow.statusText.text("Error: " + error);
    }
  );
}




// Click event handlers
detailWindow.window.on('click', 'up', function() {
  console.log('detailWindow up');
  detailWindow.animateBarsToZero();
  loadDetailData(++detailWindow.dateDiff);
});

detailWindow.window.on('click', 'down', function() {
  console.log('detailWindow down');
  if(detailWindow.dateDiff > 0) {
    detailWindow.animateBarsToZero();
    loadDetailData(--detailWindow.dateDiff);
  }
});

detailWindow.window.on('click', 'select', function() {
  console.log('detailWindow select');
  detailWindow.window.hide();
  overviewWindow.window.show();
});

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
      detailWindow.setMax(Math.round(max));
            
      for(var n = 0; n < data.power.values.length; n++) {
        detailWindow.animateBarTo(n, data.power.values[n].value);
      }
      
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