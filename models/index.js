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
// const Article = require('./article')(sequelize, DataType)
// const Comment = require('./comment')(sequelize, DataType)
// const Tag = require('./tag')(sequelize, DataType)

// Associations.
User.belongsToMany(User, { through: UserFollowUser, as: 'follows', foreignKey: 'userId', otherKey: 'followId' });
UserFollowUser.belongsTo(User, { foreignKey: 'userId' })
User.hasMany(UserFollowUser, { foreignKey: 'followId' })

db.User = User;
db.UserFollowUser = UserFollowUser;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;