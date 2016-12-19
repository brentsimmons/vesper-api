var vesperverifyemail = require('../shared/vesperverifyemail.js');

exports.get = function(request, response) {

  request.service.mssql.query('select username from accounts where verificationDate is null;', [], {

    success: function(results) {

      var emailAddresses = results.map(function(oneItem) {
        return oneItem.username;
      });
      
      emailAddresses.forEach(function(oneEmailAddress) {
        vesperverifyemail.sendVerificationEmailToUsername(request, oneEmailAddress);
      });
      
      response.send(200, emailAddresses);
      
     },
    error: function(err) {
      console.error(err);
      response.send(500);
    }
  });
};