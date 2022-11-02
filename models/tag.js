module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			unique: {
				args: true,
				message: 'Tag name must be unique.'
			},
		}
	}, {
		charset: "utf8", // 한국어 설정
		collate: "utf8_general_ci", // 한국어 설정
		tableName: "tags", // 테이블 이름
		timestamps: true // createAt & updateAt 활성화
	});

  return Tag
}