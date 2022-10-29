var { expressjwt: jwt } = require("express-jwt");
var secret = require('../config').secret;

function getTokenFromHeader(req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token' ||
      req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}

var auth = {
  required: jwt({
    secret: secret,
    requestProperty: 'auth',
    algorithms: ["HS256"],
    credentialsRequired: true,
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret: secret,
    requestProperty: 'auth',
    algorithms: ["HS256"],
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
};

module.exports = auth;