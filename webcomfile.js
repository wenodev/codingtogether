const express = require('express');
const sequelize = require('sequelize');
const parse = require('parse-json');
const app = express();
const fs = require('fs');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//bootstrap
app.use(express.static(__dirname + '/public'));
// connect To DB
const models = require('./models');

var c;
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


app.get('/form',function(req,res){
	res.render("form");
});

app.post('/form_receive',function(req,res) {
	//var title = req.body.title;
	//var language = req.body.language;
	var code = req.body.code;
	console.log('넘어온 코드 : '+code);
	var source = code.split(/\r\n|\r\n/).join("\n");
	var file='test.c';
	
	fs.writeFile(file,source,'utf8',function(error) {
		console.log('write end');
	});
	var compile = spawn('gcc',[file]);
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
				var responseData = {'result':'ok','output': output.toString('utf8')};
				res.json(responseData);
			});
			run.stderr.on('data', function (output) {
				console.log(String(output));
			});
			run.on('close', function (output) {
				console.log('stdout: ' + output);
			});
			models.Code.create( {
				title: 'test1',
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
