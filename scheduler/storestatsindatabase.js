function storestatsindatabase() {

  var httprequest = require('request');
  var url = 'https://vesper.azure-mobile.net/api/storestats';
  var config = require('mobileservice-config');

  var options = {
    uri: url,
    method: 'POST',
    headers: {
      'x-zumo-application': config.appSettings.VESPER_APPLICATION_KEY
    }
  };

  httprequest(options, function(err, response, body) {

    if (err) {
      console.error(err);
    }
  });
}