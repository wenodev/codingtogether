var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var models = require('./models');
var async = require('async');
function compileFunction(lan,path,source,res){
	var file, compile,run,responseData;
	var tasks = [
		function(callback){
			if(lan=='c')
				file = path+'test.c';
			else if(lan=='java')
				file = path+'Test.java';
			else if(lan=='python')
				file = path+'test.py';
			fs.writeFile(file,source,'utf-8',function(error){console.log('소스파일 작성 완료.');});
			callback(null,file);
		},
		function(file,callback){
			if(lan=='c')
				compile = spawn('gcc',[file]);
			else if(lan=='java')
				compile = spawn('javac',[file]);	
			else if(lan=='python')
				compile = spawn('python3',[file]);
			console.log('컴파일 완료 여기서 실행파일이 생성됨');
			setTimeout(callback,1000,null,compile);
		},
		function(compile,callback){
			if(lan=='c'){
				run = spawn('./a.out',[]);
				run.stdout.on('data',function(stdout){
					callback(null,stdout.toString('utf8'));
				});
			}
			else if(lan=='java')
				run = exec("java Test",{cwd:'../server_side_javascript/sources'},function(err,stdout,stderr){
					callback(null,stdout);
				});
			else if(lan=='python')
				run = exec('python3 test.py',{cwd:'../server_side_javascript/sources'},function(err,stdout,stderr){
					callback(null,stdout);
				});
			console.log('여기서 파일을 실행합니다.');
		},
		function(stdout,callback){
			responseData = {'result':'ok','output':stdout};
			res.json(responseData);
			callback(null);
		}
	];

	async.waterfall(tasks,function(err){
		if(err)
			console.log('err');
		else
			console.log('done');
	});
	//DB저장
	models.Code.create( {
		title: 'test',
		code: source 
	}).catch(function(err) {
		console.error(err);
	});
	
	//	compile.on('close',function(data){
	//		if(data ==0) {
	//			run.stdout.on('data',function(output){
	//				console.log('실행 완료');
	//				responseData = {'result':'ok','output': output.toString('utf8'),'language':lan};
	//				res.json(responseData);
	//			});
	//			run.stderr.on('data', function (output) {
	//				console.log(String(output));
	//			});
	//			run.on('close', function (output) {
	//				console.log('stdout: ' + output);
	//			});
	//			run.stdin.on('readable',function(){
	//				responseData = {'result':'ok','output':'입력:'};
	//				res.json(responseData);
	//			});
	//		}
	//	});
}
exports.compileFunction = compileFunction;
