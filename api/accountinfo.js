var vesperuser = require('../shared/vesperuser.js');

exports.post = function(request, response) {

  var authentication = vesperuser.usernameAndPasswordFromRequest(request);
  var username = authentication.username;
  var password = authentication.password;

  if (username !== 'qbranch' || password !== request.service.config.appSettings.SUPPORT_KEY) {
    response.send(401);
    return;
  }

  var emailAddress = request.body.emailAddress;
  if (!emailAddress) {
    response.send(400);
    return;
  }

  var accountsTable = request.service.tables.getTable('accounts');
  vesperuser.userForUsername(accountsTable, emailAddress, function(err, user) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    if (!user) {
      response.send(204);
      return;
    }

    vesperuser.statsForUserID(request, user.id, function(err, stats) {

      if (err) {
        console.error(err);
        response.send(500);
      }

      user.numberOfNotes = stats.numberOfNotes;
      user.numberOfTags = stats.numberOfTags;
      user.numberOfAttachments = stats.numberOfAttachments;
      user.numberOfDeletedNotes = stats.numberOfDeletedNotes;

      response.send(200, user);
    });
  });
};