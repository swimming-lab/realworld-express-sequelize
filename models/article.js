const slug = require('slug');

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

	return Article;
}