const Sequelize = require('sequelize');

const sequelize = new Sequelize(
	'scott',
	'root',
	'jhl1305',
	{
		'host' : 'localhost',
		'dialect' : 'mysql'
	}
);
