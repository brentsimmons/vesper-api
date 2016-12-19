exports.fetchCounts = fetchCounts;

function fetchCounts(request, callback) {

  request.service.mssql.query('select numberOfAccounts, numberOfNotes, numberOfTags, numberOfDeletedNotes, numberOfVerifiedAccounts, numberOfAttachments from (select count(*) as numberOfAccounts from vesper.accounts) numberOfAccounts CROSS JOIN (select count(*) as numberOfNotes from vesper.notes) numberOfNotes CROSS JOIN (select count(*) as numberOfTags from vesper.tags) numberOfTags CROSS JOIN (select count(*) as numberOfDeletedNotes from vesper.deletedNotes) numberOfDeletedNotes CROSS JOIN (select count(*) as numberOfVerifiedAccounts from vesper.accounts where verificationDate is not null) numberOfVerifiedAccounts CROSS JOIN (select count(*) as numberOfAttachments from vesper.notes where attachments is not null) numberOfAttachments;', [], {

    success: function(results) {

      callback(null, results[0]);
    },
    error: function(err) {
      callback(err);
    }
  });
}