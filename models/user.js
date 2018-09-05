var models = require('../models')
module.exports = function (sequelize, DataTypes) {
  const user = sequelize.define('User', {
	  name: {
		  field: 'name', 
		  type: DataTypes.STRING(20), 
		  allowNull:false
	  },
	  nick: {
		  field: 'nick', 
		  type: DataTypes.STRING(20), 
		  allowNull:false
	  },
	  user_id: {
		  field: 'user_id', 
		  type: DataTypes.STRING(50), 
		  allowNull: false,
		  unique: true
	  },
	  password: {
		  field: 'password', 
		  type: DataTypes.STRING(30), 
		  allowNull:false
	  },
  	}, {
    // don't use camelcase for automatically added attributes but underscore style
    // so updatedAt will be updated_at
	charset: 'utf8',
	collate: 'utf8_unicode_ci',
    underscored: true,

    // disable the modification of tablenames; By default, sequelize will automatically
    // transform all passed model names first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true,

    // define the table's name
    tableName: 'user'
	});
  return user;
};
