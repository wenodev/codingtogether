module.exports = function (sequelize, DataTypes) {
  const code = sequelize.define('Code', {
	  title: {
		  field: 'title', type: DataTypes.STRING(10), unique: false, allowNull: false },
	  code: {
		  field: 'code', type: DataTypes.STRING(100), allowNull: false },
  }, {
    // don't use camelcase for automatically added attributes but underscore style
    // so updatedAt will be updated_at
    underscored: true,

    // disable the modification of tablenames; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true,

    // define the table's name
    tableName: 'code'
  });

  return code;
};
