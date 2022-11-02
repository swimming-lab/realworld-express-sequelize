const { Sequelize, DataTypes } = require('sequelize');
const env = process.env.NODE_ENV || 'dev';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const User = require('./user')(sequelize, DataTypes);
const UserFollowUser = sequelize.define('UserFollowUser', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  followId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
}, {
  tableName: 'user_follow_user'
});
const Article = require('./article')(sequelize, DataTypes);
// const Comment = require('./comment')(sequelize, DataTypes);
const Tag = require('./tag')(sequelize, DataTypes);

// Associations.

// User follow user (super many to many)
User.belongsToMany(User, { through: UserFollowUser, as: 'follows', foreignKey: 'userId', otherKey: 'followId' });
UserFollowUser.belongsTo(User, { foreignKey: 'userId' })
User.hasMany(UserFollowUser, { foreignKey: 'followId' })

// Article author User
Article.belongsTo(User, { as: 'author', foreignKey: {name: 'authorId', allowNull: false} });
User.hasMany(Article, { as: 'authoredArticles', foreignKey: 'authorId' });

// Tag Article
Article.belongsToMany(Tag, { through: 'article_tag', as: 'tags', foreignKey: 'articleId', otherKey: 'tagId' });
Tag.belongsToMany(Article, { through: 'article_tag', as: 'taggedArticles', foreignKey: 'tagId', otherKey: 'articleId' });

db.User = User;
db.UserFollowUser = UserFollowUser;
db.Article = Article;
db.Tag = Tag;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;