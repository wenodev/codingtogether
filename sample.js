const express = require('express');
const parse = require('parse-json');
const app = express();
const fs = require('fs');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');

app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}))

app.get('/form',function(req,res) {
	res.render('form');
});
app.post('/form_receiver',function(req,res) {
	var title = req.body.title;
	var description = req.body.description;
	var source = description.split(/\r\n|\r\n/).join("\n");
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
				console.log('컴파일 완료');
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
});
app.get('/',function(req,res) {
	res.send('hello');
});

app.listen(3000,function() {
	console.log('server connected');
});
