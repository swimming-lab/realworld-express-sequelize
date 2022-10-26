const express = require('express');
const router = express.Router();
const auth = require('../auth');
const passport = require('passport');
const { User } = require("../../models");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/users', function(req, res, next) {
  User.create({
    email: req.body.user.email,
    password: setPassword(req.body.user.password),
    username: req.body.user.username,
  })
  .then((result) => {
      console.log("저장 성공: ", result);
  })
  .catch((err) => {
      console.log("저장 Error: ", err);
  });
  res.send('users created');
});

module.exports = router;
