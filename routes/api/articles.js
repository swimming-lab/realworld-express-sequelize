const router = require('express').Router();
const auth = require('../../modules/auth');
const { User, Article, Comment, Tag, UserFollowUser } = require("../../models");

router.param('article', async (req, res, next, slug) => {
  await Article.findOne({ where: {slug: slug} })
    .then((article) => {
      if (!article) { return res.sendStatus(404); }

      req.article = article;
      console.log("조회 성공: ", article);

      next();
    })
    .catch(next);
});

router.param('comment', async (req, res, next, id) => {
  await Comment.findOne({ where: {id: id, articleId: req.article.id} })
    .then((comment) => {
      if (!comment) { return res.sendStatus(404); }

      req.comment = comment;
      console.log("조회 성공: ", comment);

      next();
    })
    .catch(next);
})

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

router.get('/', auth.optional, async (req, res, next) => {
	try {
		let limit = 20;
    let offset = 0;

		const criteria = {};
    if (typeof req.query.limit !== 'undefined') { limit = Number(req.query.limit) }
    if (typeof req.query.offset !== 'undefined') { offset = Number(req.query.offset) }
		if (typeof req.query.author !== 'undefined') { criteria.auth = req.query.author }
		if (typeof req.query.favorited !== 'undefined') { criteria.favorited = req.query.favorited }
		if (typeof req.query.tag !== 'undefined') { criteria.tag = req.query.tag }

		const [{count, rows}, user] = await Promise.all([
			Article.findAllAndCountByMultiplecriteria(offset, limit, criteria),
			req.auth ? await User.findByPk(req.auth.id) : null
		])

    res.json({
			articles: await Promise.all(rows.map((article) => {
				return article.toJSONFor(user)
			})),
			articlesCount: count
		});
  } catch(err) {
    next(err);
  }
});

router.get('/feed', auth.required, async (req, res, next) => {
	try {
		let limit = 20;
    let offset = 0;

		if (typeof req.query.limit !== 'undefined') { limit = Number(req.query.limit) }
    if (typeof req.query.offset !== 'undefined') { offset = Number(req.query.offset) }

		const user = await User.findByPk(req.auth.id);
		if (!user) { return res.sendStatus(401); }

		const {count, rows} = await Article.findAllAndCountByUserFollowed(offset, limit, user);

		res.json({
			articles: await Promise.all(rows.map((article) => {
				return article.toJSONFor(user)
			})),
			articlesCount: count
		});
  } catch(err) {
    next(err);
  }
});

router.get('/:article', auth.optional, async (req, res, next) => {
	try {
		const [user, author] = await Promise.all([
			req.auth ? User.findByPk(req.auth.id) : null,
			req.article.getAuthor()
		]);

    res.json({ article: await req.article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.post('/', auth.required, async (req, res, next) => {
	try {
    const user = await User.findByPk(req.auth.id);
    if (!user) { return res.sendStatus(401); }

		let article = new Article(req.body.article);
		article.authorId = user.id;

		const tagList = req.body.article.tagList;
		await Promise.all([
			typeof tagList === 'undefined' ? null : setArticleTags(req, article, tagList),
			article.save()
		]);

    res.json({ article: await article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.put('/:article', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { return res.sendStatus(401); }
		if (user.id != req.article.authorId) { return res.sendStatus(403); }

		const article = req.article;
		const tagList = req.body.article.tagList;

		if (typeof req.body.article.title !== 'undefined') {
			article.title = req.body.article.title;
		}
		if (typeof req.body.article.description !== 'undefined') {
			article.description = req.body.article.description;
		}
		if (typeof req.body.article.body !== 'undefined') {
			article.body = req.body.article.body;
		}

		await Promise.all([
			typeof tagList === 'undefined' ? null : setArticleTags(req, article, tagList),
			article.save()
		]);

    res.json({ article: await article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.delete('/:article', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { return res.sendStatus(401); }
		if (user.id != req.article.authorId) { return res.sendStatus(403); }

		await req.article.destroy();

    res.sendStatus(204);
  } catch(err) {
    next(err);
  }
});

router.post('/:article/favorite', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { return res.sendStatus(401); }

		await user.addFavorite(req.article.id);
    res.json({ article: await req.article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.delete('/:article/favorite', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { return res.sendStatus(401); }

		await user.removeFavorite(req.article.id);
    res.json({ article: await req.article.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.get('/:article/comments', auth.optional, async (req, res, next) => {
	try {
		let user = null;
		if (req.auth) {
			user = await User.findByPk(req.auth.id);
		}

		const comments = await Comment.findAll({
			where: {
				articleId: req.article.id
			},
			include: [
				{ model: User, as: 'author' }
			],
			order: [
				['createdAt', 'DESC']
			]
		});

		res.json({
      comments: await Promise.all(comments.map((comment) => {
        return comment.toJSONFor(user)
      }))
    })
  } catch(err) {
    next(err);
  }
});

router.post('/:article/comments', auth.required, async (req, res, next) => {
	try {
    const user = await User.findByPk(req.auth.id);
    if (!user) { return res.sendStatus(401); }

		let comment = new Comment(req.body.comment);
		comment.articleId = req.article.id;
		comment.authorId = user.id;

		await comment.save();
		comment.author = user;

    res.json({ comment: await comment.toJSONFor(user) });
  } catch(err) {
    next(err);
  }
});

router.delete('/:article/comments/:comment', auth.required, async (req, res, next) => {
	try {
		const user = await User.findByPk(req.auth.id);
		if (!user) { return res.sendStatus(401); }
		if (user.id != req.comment.authorId) { return res.sendStatus(403); }

		await req.comment.destroy();

    res.sendStatus(204);
  } catch(err) {
    next(err);
  }
});

module.exports = router;