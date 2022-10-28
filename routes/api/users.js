const express = require('express');
const router = express.Router();
const auth = require('../auth');
const passport = require('passport');
const { User } = require("../../models");

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

router.post('/users', (req, res, next) => {
  User.create({
    email: req.body.user.email,
    password: User.encodePassword(req.body.user.password),
    username: req.body.user.username,
  })
    .then((user) => {
      console.log("저장 성공: ", user);
      res.json({ user: user.toAuthJSON() });
    })
    .catch((err) => {
      console.log("저장 Error: ", err);
      res.status(500).json({ errors: {message: err.errors[0].message || "Some error occurred while creating user."} });
    });
});

router.post('/users/login', (req, res, next) => {
  if (!req.body.user.email) {
    res.status(422).json({ errors: {email: " can't be blank"} });
  }

  if (!req.body.user.password) {
    res.status(422).json({ errors: {password: "password can't be blank"} });
  }

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) { next(err); }

    if (user) {
      user.token = user.generateJWT();
      res.json({ user: user.toAuthJSON() });
    } else {
      res.status(422).json(info);
    }
  })(req, res, next);
});

module.exports = router;
