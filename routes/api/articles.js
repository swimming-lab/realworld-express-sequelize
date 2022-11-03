const router = require('express').Router();
const auth = require('../../modules/auth');
const { User, Article, Tag } = require("../../models");

router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

router.param('article', async (req, res, next, slug) => {
  await Article.findOne({ where: {slug: slug} })
    .then((article) => {
      if (!article) { res.sendStatus(404); }

      req.article = article;
      console.log("조회 성공: ", article);

      next();
    })
    .catch(next);
});

async function setArticleTags(req, article, tagList) {
	await Tag.bulkCreate(
		tagList.map((tag) => { return { name: tag } }), 
		{ ignoreDuplicates: true }
	);

	// IDs may be missing from the above, so we have to do a find.
	// https://github.com/sequelize/sequelize/issues/11223#issuecomment-864185973
	const tags = await Tag.findAll({ where: {name: tagList} });
	await article.setTags(tags);
}

router.post('/', auth.required, async (req, res, next) => {
	try {
    const user = await User.findByPk(req.auth.id);
    if (!user) { res.sendStatus(401); }

		let article = new Article(req.body.article);
		article.authorId = user.id;

		const tagList = req.body.article.tagList;
		await Promise.all([
			typeof tagList === 'undefined' ? null : setArticleTags(req, article, tagList),
			article.save()
		]);

    return res.json({ article: await article.toJSONFor(user) })
  } catch(err) {
    next(err);
  }
});

router.post('/:article/favorite', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { res.sendStatus(401); }

		await user.addFavorite(req.article.id);
    res.json({ article: await req.article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.delete('/:article/favorite', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { res.sendStatus(401); }

		await user.removeFavorite(req.article.id);
    res.json({ article: await req.article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

module.exports = router;