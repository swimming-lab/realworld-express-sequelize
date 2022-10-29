const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secret = require('../config').secret;

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define("User", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		email: {
			type: DataTypes.STRING(100),
			validate: {
				isEmail: true,
			},
			unique: true,
			comment: "이메일",
		},
		password: {
			type: DataTypes.STRING,
			comment: "비밀번호",
		},
		username: {
			type: DataTypes.STRING(50),
			comment: "이름",
			unique: true,
			validate: {
				min: 2
			}
		},
		bio: {
			type: DataTypes.STRING,
			allowNull: true
		},
		image: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		charset: "utf8", // 한국어 설정
		collate: "utf8_general_ci", // 한국어 설정
		tableName: "users", // 테이블 이름
		timestamps: true, // createAt & updateAt 활성화
		paranoid: true, // timestamps 가 활성화 되어야 사용 가능 > deleteAt 옵션 on      
	});

	User.encodePassword = function(password) {
		return bcrypt.hashSync(password, 10);
	};

	User.prototype.validPassword = function(password) {      
  	return bcrypt.compareSync(password, this.password);
	};

	User.prototype.generateJWT = function() {
		const today = new Date();
		let exp = new Date(today);
		exp.setDate(today.getDate() + 60);
		return jwt.sign({
			id: this.id,
			username: this.username,
			exp: parseInt(exp.getTime() / 1000),
		}, secret);
	};

	User.prototype.toAuthJSON = function() {
		return {
			username: this.username,
			email: this.email,
			token: this.generateJWT(),
			bio: this.bio,
			image: this.image
		};
	};

	return User;
};