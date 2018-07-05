var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

function compileFunction(lan,path,source,res){
	var file, compile;
	if(lan=='c'){
		file= path+'test.c';
		compile = spawn('gcc',[file]);
	}
	else if(lan=='c++'){
		file = path+'test.cpp';
		compile = spawn('g++',[file]);
	}
	else if(lan=='java'){
		file = path+'Test.java';
		compile = spawn('javac',[file]);
	}
	else if(lan=='python'){
		file = path+'test.py';
		compile = spawn('python3',[file]);
	}
	fs.writeFile(file,source,'utf-8',function(error){
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
			if(lan == 'java'){
				run = exec("java Test",{cwd:'../server_side_javascript/sources'},function(err,stdout,stderr){});
			} 
			else if(lan == 'python') {
				run = exec("python3 test.py",{cwd:'../server_side_javascript/sources'},function(err,stdout,stderr){});
			}
			else {
				run = spawn('./a.out',[]);
			}
			run.stdout.on('data',function(output){
				console.log('컴파일 완료');
				var responseData = {'result':'ok','output': output.toString('utf8'),'language':lan};
				res.json(responseData);
			});
			run.stderr.on('data', function (output) {
				console.log(String(output));
			});
			run.on('close', function (output) {
				console.log('stdout: ' + output);
			});
		}
	});
}
exports.compileFunction = compileFunction;
