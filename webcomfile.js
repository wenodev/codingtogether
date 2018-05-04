const express = require('express');
const sequelize = require('sequelize');
const parse = require('parse-json');
const app = express();
const fs = require('fs');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}))
//bootstrap
app.use(express.static(__dirname + '/public'));
// connect To DB
const models = require('./models');
models.sequelize.sync()
  .then(() => {
    console.log('✓ DB connection success.');
    console.log('  Press CTRL-C to stop\n');
  })
  .catch(err => {
    console.error(err);
    console.log('✗ DB connection error. Please make sure DB is running.');
    process.exit();
  });


app.get('/form',function(req,res) {
	res.render('form');
});
app.post('/form_receiver',function(req,res) {
	var title = req.body.title;
	var description = req.body.description;
	var language = req.body.language;
	var source = description.split(/\r\n|\r\n/).join("\n");
	var file;
	if(language =='C')
		file = 'test.c';
	else if(language == 'C++')
		file = 'test.cpp';
	else
		file = 'Test.java';
	
	fs.writeFile(file,source,'utf8',function(error) {
		console.log('write end');
	});
	var compile = spawn('g++',[file]);
	if(language == 'Java')
		compile = spawn('javac',[file]);
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
				console.log('컴파일 완료');
				res.send('컴파일 결과 : '+output);
			});
			run.stderr.on('data', function (output) {
            console.log(String(output));
			});
			run.on('close', function (output) {
            console.log('stdout: ' + output);
			});
			models.Code.create( {
				title: title,
				code: source 
			})
			.catch(err => {
				console.error(err);
			});
		}
	});
});
app.get('/',function(req,res) {
	res.send('hello');
});

app.listen(3000,function() {
	console.log('server connected');
});
