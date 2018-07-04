var express = require('express');
var sequelize = require('sequelize');
var parse = require('parse-json');
var app = express();
var fs = require('fs');
var PDK = require('node-pinterest');
var pinterestAPI = require('pinterest-api');
var multer = require('multer');
var _storage = multer.diskStorage({
    destination: function(req,file,cb) {
        cb(null,'uploads/');
    },
    filename: function(req,file,cb) {
        cb(null,file.originalname);
    }
});
var upload = multer({storage: _storage});
var spawn = require('child_process').spawn;
var bodyParser = require('body-parser');
var weather = require('weather-js');
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//bootstrap
app.use(express.static(__dirname + '/public'));
app.use('/user',express.static('uploads'));
//singleton
var member = require('./singleton');
member.mIsLogin = false;
// connect To DB
var models = require('./models');
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

app.get('/upload',function(req,res){
	res.render('upload');
});
app.post('/upload',upload.single('userfile'),function(req,res){
	var pinterest = PDK.init('AReOr2zot2VzjaCcok1amxZxLZDAFTHTFGxcXIBE9FpR1MA0sQAAAAA');
	pinterest.api('me').then(console.log);
	var filename = 'localhost:3000/user/'+req.file.originalname;
	pinterest.api('me/boards').then(function(json) {
    pinterest.api('pins', {
        method: 'POST',
        body: {
            board: json.data[0].id, // grab the first board from the previous response
            note: 'this is a test',
            link: 'http://bubobubo003.tistory.com',
			image_url: 'http://farm2.staticflickr.com/1763/42317153534_aaf71c5a3c_z.jpg'
        }
	}).then(function(json) {
		console.log(json);
        pinterest.api('me/pins').then(console.log);
		});
	});
	res.send('uploaded');
});
app.get('/image',function(req,res){
	var pinterest = pinterestAPI('godparty');
	pinterest.getPinsFromBoard('project', true, function (pins) {
		var url = pins.data[0].images['237x'].url;
		res.render("image",{data: JSON.stringify(pins)});
	});
});
app.get('/vue',function(req,res){
	res.render('vue');
});
app.get('/form',function(req,res){
	weather.find({search: 'Seoul',degreeType: 'C'}, function(err,result){
	if(err)
		console.log(err);
	else
		res.render("form",{data: JSON.stringify(result) ,login: member.mIsLogin});
	});
});
app.get('/mypage',function(req,res) {
	if(member.mIsLogin) 
		res.render('mypage');
	else{
		res.send("<script>alert('로그인이 필요합니다.')</script><meta http-equiv='refresh' content='0; url=http://localhost:3000/form'</meta>")
	}
});
app.get('/login',function(req,res){
	res.render('login');
});
app.get('/logout',function(req,res){
	member = {};
	member.mIsLogin = false;
	res.redirect('back');
});
app.post('/login_receive',function(req,res){
	var id = req.body.login_id;
	var pwd = req.body.login_password;
	//DB에서 회원정보 검색
	models.User.findOne({
		where: { user_id: id}
	})
	.then((user)=> {
		if(user==null || user.dataValues['password']!=pwd) {
			var responseData = {'result' : 'no', 'flag' : member.mIsLogin};
			res.json(responseData);
			console.log('로그인 실패')
		}
		else{
			//로그인 성공시 Singleton 객체에 id,pwd값 setting
			member.mIsLogin = true;	
			member.mId = id;
			member.mPwd = pwd;
			var responseData = {'result' : 'ok', 'flag':member.mIsLogin};
			res.json(responseData);
			console.log('로그인 성공');
		}
	});
});
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

