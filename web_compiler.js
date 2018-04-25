const express = require('express');
const parse = require('parse-json');
const app = express();
const fs = require('fs');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');
const mysql = require('mysql');
const conn = mysql.createConnection( {
	host 		: 'localhost',
	user 		: 'root',
	password 	: 'jhl1305',
	database 	: 'test'
});

app.locals.pretty = true;
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}))

app.get('/form',function(req,res) {
	res.render('form');
});
app.get('/temp',function(req,res){
	res.render('temp',{time:Date(),title:"Pug"});
})
app.get('/form_receiver',function(req,res) {
	res.send('hello get');
});
app.post('/form_receiver',function(req,res) {
	var title = req.body.title;
	var description = req.body.description;
	var source = description.split(/\r\n|\r\n/).join("\n");
	var sql = 'INSERT INTO code(code) VALUES(?)';
	var file = 'test.c';
	fs.writeFile('test.c',source,'utf8',function(error) {
		console.log('write end');
	});

	var compile = spawn('gcc',['test.c']);
	compile.stdout.on('data',function(data) {
		console.log('stdout: '+data);
	});
	compile.stderr.on('data',function(data){
		console.log(String(data));
	});
	compile.on('close',function(data){
		if(data ==0) {
			var run = spawn('./a.out',[]);
			run.stdout.on('data',function(output){
				console.log('컴파일 결과: '+String(output));
				res.send('컴파일 결과 : '+output);
			});
			run.stderr.on('data', function (output) {
            console.log(String(output));
			});
			run.on('close', function (output) {
            console.log('stdout: ' + output);
			});
		}
	});

	conn.query(sql,[source],function(err,rows,fields){
		if(err) {
			console.log(err);
		} else {
		}
	});
});
app.get('/',function(req,res) {
	res.send('hello');
});

app.listen(3000,function() {
	console.log('server connected');
});
