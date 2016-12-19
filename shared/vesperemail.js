exports.sendEmail = sendEmail;

function sendEmail(request, message, callback) {

  var SendGrid = require('sendgrid').SendGrid;
  var username = request.service.config.appSettings.SENDGRID_USERNAME;
  var password = request.service.config.appSettings.SENDGRID_PASSWORD;
  var sendgrid = new SendGrid(username, password);

  if (!sendgrid) {
    callback(new Error('Error instantiating SendGrid.'));
    return;
  }

  sendgrid.send(message, function(success, message) {

    if (!success) {
      callback(message);
    }
    else {
      callback(null);
    }
  });
}

