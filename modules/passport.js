var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const { User } = require("../models");

passport.use(new LocalStrategy({
    usernameField: 'user[email]',
    passwordField: 'user[password]'
}, async (email, password, done) => {
  console.log('@@@@@@@@@@@@@@@@@');
  await User.findOne({ where: {email: email} })
    .then((user) => {
      if (!user || !user.validPassword(password)) {
        return done(null, false, { errors: {'email or password': 'is invalid'} });
      }
      return done(null, user);
    })
    .catch(done);
}));