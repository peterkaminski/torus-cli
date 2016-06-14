'use strict';

var Promise = require('es6-promise').Promise;
var Command = require('../cli/command');

var flags = require('../flags');
var viewCred = require('../credentials/view');
var auth = require('../middleware/auth');

var view = new Command(
  'view',
  'view credentials for the current service and environment',
  function (ctx) {
    return new Promise(function (resolve, reject) {
      viewCred.execute(ctx).then(function (creds) {
        viewCred.output.success(creds);
        resolve(true);
      }).catch(function (err) {
        err.type = err.type || 'unknown';
        viewCred.output.failure(err);
        reject(err);
      });
    });
  }
);

view.hook('pre', auth());

flags.add(view, 'org', {
  description: 'the org the credentials belongs too'
});
flags.add(view, 'service', {
  description: 'the service the credentials belong too'
});
flags.add(view, 'environment', {
  description: 'the environment the credentiasl belong too'
});
flags.add(view, 'instance', {
  description: 'the instance of the service belonging to the current user'
});

module.exports = view;