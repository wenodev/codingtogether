const express = require('express');
const sequelize = require('sequelize');
const parse = require('parse-json');
const app = express();
const fs = require('fs');
const PDK = require('node-pinterest');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');
var weather = require('weather-js');
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
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

app.get('/',function(req,res){
	res.send('connect');
});
app.get('/form',function(req,res){
	var location;
	var temperature;
	weather.find({search: 'Seoul',degreeType: 'C'}, function(err,result){
	if(err)
		console.log(err)
	else{
		location = result[0].location.name;
		temperature = result[0].current.temperature;
		res.render("form",{data: JSON.stringify(result)});
	}
	});
});
app.get('/login',function(req,res){
	res.render('login');
});
app.get('/mypage',function(req,res) {
	res.render('mypage');
})

app.post('/form_receive',function(req,res) {
	//var title = req.body.title;
	var language = req.body.language;
	var code = req.body.code;
	var source = code.split(/\r\n|\r\n/).join("\n");
	var file;
	var compile;
	var source_path = '../server_side_javascript/sources/';
	
	if(language == 'c'){
		file = source_path+'test.c';
		compile = spawn('gcc',[file]);
	}	
	else if(language=='c++'){
		file = source_path+'test.cpp';
		compile = spawn('g++',[file]);
	}
	else if(language=='java'){
		file = source_path+'Test.java';
		compile = spawn('javac',[file]);
	}

	fs.writeFile(file,source,'utf-8',function(error) {
		console.log('소스파일 작성 완료.');
	});
	
	compile.stdout.on('data',function(data) {
		console.log('stdout: '+data);
	});
	compile.stderr.on('data',function(data){
		console.log(String(data));
	});
	compile.on('close',function(data){
		if(data ==0) {
			var run;
			if(language == 'java'){
				run = spawn('java',['Test']);
			} else {
				run = spawn('./a.out',[]);
			}
			run.stdout.on('data',function(output){
				console.log('컴파일 완료');
				var responseData = {'result':'ok','output': output.toString('utf8'),'language':language};
				res.json(responseData);
			});
			run.stderr.on('data', function (output) {
				console.log(String(output));
			});
			run.on('close', function (output) {
				console.log('stdout: ' + output);
			});
			models.Code.create( {
				title: 'test',
				code: source 
			})
			.catch(err => {
				console.error(err);
			});
		}
	});
});

app.listen(3000,function() {
	console.log('server connected');
});
