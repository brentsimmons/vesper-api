var vesperverifyemail = require('../shared/vesperverifyemail.js');

exports.get = function(request, response) {

  try {
    var emailAddress = request.query.emailAddress;
    vesperverifyemail.sendVerificationEmailToUsername(request, emailAddress);
    response.send(204);
  }
  catch (err) {
    console.error(err);
    response.send(500);
  }
};