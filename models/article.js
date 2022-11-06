const slug = require('slug');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

module.exports = (sequelize, DataTypes) => {
	const Article = sequelize.define("Article", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		slug: {
			type: DataTypes.STRING,
			unique: {
				args: true,
				message: 'Slug must be unique.'
			},
			set(v) {
				this.setDataValue('slug', v.toLowerCase())
			}
		},
		title: {
			type: DataTypes.STRING,
			comment: "제목",
		},
		description: {
			type: DataTypes.STRING,
			comment: "설명",
		},
		body: {
			type: DataTypes.STRING,
			comment: "본문",
		},
	}, {
		hooks: {
			beforeValidate: (article, options) => {
				if (!article.slug) {
					article.slug = slug(article.title) + '-' + ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
				}
			}
		},
		charset: "utf8", // 한국어 설정
		collate: "utf8_general_ci", // 한국어 설정
		tableName: "articles", // 테이블 이름
		timestamps: true, // createAt & updateAt 활성화
		paranoid: true, // timestamps 가 활성화 되어야 사용 가능 > deleteAt 옵션 on      
	});

	Article.prototype.toJSONFor = async function(user) {
    let authorPromise;

    if (this.authorPromise === undefined) {
      authorPromise = this.getAuthor();
    } else {
      authorPromise = new Promise(resolve => {resolve(this.author)});
    }
    const [tags, favorited, favoritesCount, author] = await Promise.all([
      this.getTags(),
      user ? user.hasFavorite(this.id) : false,
      this.countFavoritedBy(),
      authorPromise.then(author => author.toProfileJSONFor(user)),
    ]);

    return {
      slug: this.slug,
      title: this.title,
      description: this.description,
      body: this.body,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tagList: tags.map(tag => tag.name),
      favorited,
      favoritesCount,
      author,
    };
  }

	/**
	SELECT 
		`Article`.`*`, 
		`author`.`*`
	FROM `articles` AS `Article` 
	INNER JOIN `users` AS `author` 
		ON `Article`.`authorId` = `author`.`id` 
		AND (`author`.`deletedAt` IS NULL) 
	INNER JOIN `user_follow_user` AS `author->UserFollowUsers` 
		ON `author->UserFollowUsers`.`followId` = `author`.`id` 
		AND `author->UserFollowUsers`.`userId` = 1 
	WHERE (`Article`.`deletedAt` IS NULL) 
	ORDER BY `Article`.`createdAt` DESC 
	LIMIT 0, 20;
	 */
	Article.findAllAndCountByUserFollowed = async function(offset, limit, user) {
		return await Article.findAndCountAll({
			offset: offset,
			limit: limit,
			subQuery: false,
			order: [[
				'createdAt', 'DESC'
			]],
			include: [
        {
          model: sequelize.models.User,
          as: 'author',
          required: true,
          include: [
            {
              model: sequelize.models.UserFollowUser,
              on: {
                followId: { [Op.col]: 'author.id' },
              },
              attributes: [],
              where: { userId: user.id },
            }
          ],
        },
      ],
		});
	};
	
	/**
	SELECT 
		`Article`.`*`, 
		`author`.`*`, 
		`favoritedBy`.`*`, 
		`favoritedBy->user_favorite_article`.`*`, 
		`tags`.`*`, 
		`tags->article_tag`.`*` 
	FROM `articles` AS `Article` 
	LEFT OUTER JOIN `users` AS `author` 
		ON `Article`.`authorId` = `author`.`id`
		AND (`author`.`deletedAt` IS NULL)
	INNER JOIN (
		`user_favorite_article` AS `favoritedBy->user_favorite_article` 
		INNER JOIN `users` AS `favoritedBy` 
			ON `favoritedBy`.`id` = `favoritedBy->user_favorite_article`.`userId`
	)
		ON `Article`.`id` = `favoritedBy->user_favorite_article`.`articleId` 
		AND (
			`favoritedBy`.`deletedAt` IS NULL 
			AND `favoritedBy`.`username` = 'sooyoung2'
		)
	INNER JOIN (
		`article_tag` AS `tags->article_tag` 
		INNER JOIN `tags` AS `tags` 
			ON `tags`.`id` = `tags->article_tag`.`tagId`
	)
		ON `Article`.`id` = `tags->article_tag`.`articleId` 
		AND `tags`.`name` = 't1'
	WHERE (`Article`.`deletedAt` IS NULL)
	ORDER BY `Article`.`createdAt` DESC 
	LIMIT 0, 5;
	 */
	Article.findAllAndCountByMultiplecriteria = async function(offset, limit, criteria) {
		const include = [];

		const authorInclude = {
      model: sequelize.models.User,
      as: 'author'
    }

		if (criteria.author) {
      authorInclude.where = { username: criteria.author }
    }
		include.push(authorInclude);

		if (criteria.favorited) {
			include.push({
        model: sequelize.models.User,
        as: 'favoritedBy',
        where: { username: criteria.favorited }
      });
		}

		if (criteria.tag) {
      include.push({
        model: sequelize.models.Tag,
        as: 'tags',
        where: { name: criteria.tag }
      })
    }

		return Article.findAndCountAll({
			offset: Number(offset),
			limit: Number(limit),
			subQuery: false,
			order: [[
				'createdAt', 'DESC'
			]],
			include: include,
		});
	}

	return Article;
}