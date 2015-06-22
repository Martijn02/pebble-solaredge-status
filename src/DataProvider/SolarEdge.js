var ajax = require('ajax');
var Settings = require('settings');

var provider = {
  checkSettings: function(settings, callback) {
    
  },
  loadData: function(window, callback) {
    ajax(
      {
        url:'https://monitoringapi.solaredge.com/site/' + Settings.option('siteId') + '/overview.json?api_key='+Settings.option('apiKey'),
        type:'json'
      },
      function(data) {
        window.today.text(numberFormat(data.overview.lastDayData.energy, 2, 'Wh'));
        window.month.text(numberFormat(data.overview.lastMonthData.energy, 2, 'Wh'));
        window.year.text(numberFormat(data.overview.lastYearData.energy, 2, 'Wh'));
        window.total.text(numberFormat(data.overview.lifeTimeData.energy, 2, 'Wh'));
        window.power.text(Math.round(data.overview.currentPower.power) + ' W');
        callback();
      },
      function(error) {
        console.log('Error loading data', error);
        callback(error);
      }
    );
  },
  loadDetailData: function(window, dateDiff, callback) {
    var date = new Date();
    if(dateDiff > 0) {
      date.setDate(date.getDate() - dateDiff);
    }

    var dateText = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    window.dateText.text(dateText);
    window.kwhText.text('');

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
        window.setMax(Math.round(max));

        for(var n = 0; n < data.power.values.length; n++) {
          window.animateBarTo(n, data.power.values[n].value);
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
            window.kwhText.text(kwh.toFixed(1) + "kWh");
            callback();
          },
          function(error) {
            console.log("Error: " + error);
            callback(error);
          }
        );

      },
      function(error) {
        console.log("Error: " + error);
        callback(error);
      }
    );
  }
};

module.exports = provider;

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
