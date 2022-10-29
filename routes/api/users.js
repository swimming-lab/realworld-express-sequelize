const express = require('express');
const router = express.Router();
const auth = require('../../modules/auth');
const passport = require('passport');
const { User } = require("../../models");

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

router.get('/user', auth.required, async (req, res, next) => {
  await User.findOne({ id: req.auth.id })
    .then((user) => {
      if (!user) { res.sendStatus(401); }

      console.log("조회 성공: ", user);
      res.json({ user: user.toAuthJSON() });
    })
    .catch((err) => {
      console.log("조회 Error: ", err);
      res.status(500).json({ errors: {message: err.errors[0].message || "Some error occurred."} });
    });
});

router.post('/users', async (req, res, next) => {
  await User.create({
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
      res.status(500).json({ errors: {message: err.errors[0].message || "Some error occurred."} });
    });
});

router.put('/user', auth.required, async (req, res, next) => {
  await User.findOne({ id: req.auth.id })
    .then(async (user) => {
      if (!user) { return res.sendStatus(401); }

      // only update fields that were actually passed...
      if (typeof req.body.user.username !== 'undefined') {
        user.username = req.body.user.username;
      }
      if (typeof req.body.user.email !== 'undefined') {
        user.email = req.body.user.email;
      }
      if (typeof req.body.user.bio !== 'undefined') {
        user.bio = req.body.user.bio;
      }
      if (typeof req.body.user.image !== 'undefined') {
        user.image = req.body.user.image;
      }
      if (typeof req.body.user.password !== 'undefined') {
        user.password = User.encodePassword(req.body.user.password);
      }

      await user.save()
        .then(() => {
          res.json({ user: user.toAuthJSON() });
        });
    })
    .catch(next);
});

router.post('/users/login', async (req, res, next) => {
  if (!req.body.user.email) {
    res.status(422).json({ errors: {email: " can't be blank"} });
  }

  if (!req.body.user.password) {
    res.status(422).json({ errors: {password: "password can't be blank"} });
  }

  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) { next(err); }

    if (user) {
      user.token = await user.generateJWT();
      res.json({ user: user.toAuthJSON() });
    } else {
      res.status(422).json(info);
    }
  })(req, res, next);
});

module.exports = router;
