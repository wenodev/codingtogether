var fs = require('fs');
var spawn = require('child_process').spawn;
var cp = require('child_process');
var n = cp.fork(`${__dirname}/sub.js`);
var exec = require('child_process').exec;
var models = require('../models');
var async = require('async');
var member = require('./singleton');
function compileFunction(lan,path,source,res){
	var file, compile,run,responseData;
	var final = false;
	var cnt=1;
	var tasks = [
		function(callback){
			if(lan=='c')
				file = path+'test.c';
			else if(lan=='java')
				file = path+'Test.java';
			else if(lan=='python')
				file = path+'test.py';
			fs.writeFile(file,source,'utf-8',function(err){if(err) throw err;});
			callback(null,file);
		},
		function(file,callback){
			if(lan=='c'){
				compile = exec('gcc test.c',{cwd:'sources'},function(err,stdout,stderr){
					if(stderr.length==0){
						var run = spawn('./sources/./a.out',[]);
						run.stdout.on('data',function(stdout){
							callback(null,stdout.toString('utf8'));
						})
					}		
					else
						callback(true,stderr)
				})
			}
			else if(lan=='java'){
				compile = exec('javac Test.java',{cwd:'sources'},function(err,stdout,stderr){
					if(stderr.length==0) {
						var run = exec("java Test",{cwd:'sources'},function(err,stdout,stderr){
							callback(null,stdout);
						});
					}
					else
						callback(true,stderr)
				})
			}
			else if(lan=='python'){
				compile = exec('python3 test.py',{cwd:'sources'},function(err,stdout,stderr){
					if(stderr.length==0) {
						callback(null,stdout)
					}
					else 
						callback(true,stderr)
				})
			}
		},
		function(stdout,callback){
			callback(null,stdout)
		}
	]
	async.waterfall(tasks,function(err,msg){
		if(err){
			responseData = {'result':'err','output':msg};
			res.json(responseData);
		}
		else{
			responseData = {'result':'ok','output':msg};
			res.json(responseData);
			console.log('done');
		}
	});

	//DB저장
	models.Code.create({
		title: 'test',
		code: source
	}).catch(function(err) {
		console.error(err);
	});
}
exports.compileFunction = compileFunction;
