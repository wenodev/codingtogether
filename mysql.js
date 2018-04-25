var mysql = require('mysql');
var connection = mysql.createConnection( {
	host		: 'localhost',
	user		: 'root',
	password	: 'jhl1305',
	port		: '3000',
	database	: 'scott'
});

connection.connect();

connection.query("SELECT * from member", function(err,row,fields){
	if(!err) 
		console.log('The solution is: ',rows);
	else
		console.log('Error while performing Query.',err);
});

connection.end();

