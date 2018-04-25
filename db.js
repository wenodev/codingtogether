var Sequelize = require('sequelize');
var connection = new Sequelize('test','root','jhl1305');

var Article = connection.define('article', {
	title: Sequelize.STRING,
	body: Sequelize.TEXT
});
connection.sync().then(function() {
	Article.create({
		title: 'demo title',
		body: 'show me the money power overwhelming operation cwal'
	});
});
