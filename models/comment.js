module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		body: {
			type: DataTypes.STRING,
			comment: "댓글 본문",
		}
	}, {
		charset: "utf8", // 한국어 설정
		collate: "utf8_general_ci", // 한국어 설정
		tableName: "comments", // 테이블 이름
		timestamps: true, // createAt & updateAt 활성화
		paranoid: true, // timestamps 가 활성화 되어야 사용 가능 > deleteAt 옵션 on    
	});

  return Comment
}