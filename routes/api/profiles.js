const express = require('express');
const router = express.Router();
const auth = require('../../modules/auth');
const { User } = require("../../models");

// Preload user profile on routes with ':username'
router.param('username', async (req, res, next, username) => {
  await User.findOne({ where: {username: username} })
    .then((user) => {
      if (!user) { res.sendStatus(404); }

      req.profile = user;
      console.log("조회 성공: ", user);

      next();
    })
    .catch(next);
});

router.get('/:username', auth.optional, async (req, res, next) => {
  try {
    let toProfileJSONForUser;

    if (req.auth) {
      const user = await User.findByPk(req.auth.id);
      console.log("조회 성공: ", user);
      if (user) {
        toProfileJSONForUser = user;
      } else {
        toProfileJSONForUser = false;
      }
    } else {
      toProfileJSONForUser = false;
    }
    res.json({ profile: await req.profile.toProfileJSONFor(toProfileJSONForUser) });
  } catch(err) {
    next(err);
  }
});

router.post('/:username/follow', auth.required, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.auth.id);
    if (!user) { res.sendStatus(401); }

    await user.addFollow(req.profile.id);
    res.json({ profile: await req.profile.toProfileJSONFor(toProfileJSONForUser) });
  } catch(err) {
    next(err);
  }
});

router.delete('/:username/follow', auth.required, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.auth.id);
    if (!user) { res.sendStatus(401); }

    await user.removeFollow(req.profile.id);
    res.json({ profile: await req.profile.toProfileJSONFor(toProfileJSONForUser) });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
