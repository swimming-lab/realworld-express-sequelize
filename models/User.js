const jwt = require('jsonwebtoken');
var crypto = require('crypto');
const secret = require('../config').secret;

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define("users", {
		email: {
			type: DataTypes.STRING(100),
			validate: {
				isEmail: true,
			},
			unique: true,
			comment: "이메일",
		},
		hash: {
			type: DataTypes.STRING,
			comment: "비밀번호",
		},
		salt: {
			type: DataTypes.STRING,
		},
		username: {
			type: DataTypes.STRING(50),
			comment: "이름",
			validate: {
				min: 2
			}
		}
	}, {
		charset: "utf8", // 한국어 설정
		collate: "utf8_general_ci", // 한국어 설정
		tableName: "users", // 테이블 이름
		timestamps: true, // createAt & updateAt 활성화
		paranoid: true, // timestamps 가 활성화 되어야 사용 가능 > deleteAt 옵션 on      
	});

	User.prototype.setPassword = function(password) {
		this.salt = crypto.randomBytes(16).toString('hex');
		this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	};

	User.prototype.validPassword = function(password) {      
		const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  	return this.hash === hash;
	};

	User.prototype.generateJWT = function() {
		var today = new Date();
		var exp = new Date(today);
		exp.setDate(today.getDate() + 60);
		return jwt.sign({
			id: this._id,
			username: this.name,
			exp: parseInt(exp.getTime() / 1000),
		}, secret);
	};

	User.prototype.toAuthJSON = function() {
		return {
			username: this.name,
			email: this.email,
			token: this.generateJWT(),
		};
	};

	return User;
};