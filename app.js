var express = require('express');
var sequelize = require('sequelize');
var parse = require('parse-json');
var app = express();
var fs = require('fs');
var spawn = require('child_process').spawn;
var bodyParser = require('body-parser');
var request = require('request');
var client = require('cheerio-httpcli');
//templete engine and path
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//public directory path setting
app.use(express.static(__dirname));
//singleton
var member = require('./function/singleton');
//comfile function
var comp = require('./function/compiler');
//chatbot function
var chatbot = require('./function/chatBot');
//login function
var login = require('./function/login');
//enroll Validation function
var validation = require('./function/enrollValidation');
//modify info function
var modifyInfo = require('./function/modifyInfo');
// connect To DB
var models = require('./models');
models.sequelize.sync()
	.then(function() {
	console.log('✓ DB connection success.');
	  console.log('  Press CTRL-C to stop\n');
  })
  .catch(function(err) {
    console.error(err);
    console.log('✗ DB connection error. Please make sure DB is running.');
    process.exit();
  });

app.get('/about',function(req,res){
	res.render('about');
});
app.get('/practice',function(req,res){
	res.render("practice");
});
app.get('/mypage',function(req,res) {
	if(member.mIsLogin)
		res.render('mypage',{data:JSON.stringify(member)});
	else
		res.send("<script>alert('로그인이 필요합니다.')</script><meta http-equiv='refresh' content='0; url=http://localhost:3000/login'</meta>");
});
app.get('/login',function(req,res){
	res.render('login');
});
app.get('/enroll',function(req,res){
	res.render('enroll');
});
app.post('/enroll_receive',function(req,res){
	//name,email,nickname,password,confirm
	var info = req.body;
	validation.enrollValidation(info,res);
});
app.post('/modifyInfo_receive',function(req,res){
	var info = req.body;
	modifyInfo.modifyInfoFunction(info,res);
});
app.get('/logout',function(req,res){
	member.mId=null; member.mPwd = null; member.mName = null; member.mNick = null;
	member.mIsLogin = false;
	res.render('index');
});
app.post('/login_receive',function(req,res){
	var id = req.body.login_id;
	var pwd = req.body.login_password;
	var responseData;
	//로그인 메소드 호출
	login.loginFunction(id,pwd,res);
});
app.post('/practice_receive',function(req,res) {
	//var title = req.body.title;
	var language = req.body.language;
	var code = req.body.code;
	var source = code.split(/\r\n|\r\n/).join("\n");
	var source_path = './sources/';	
	//컴파일 메소드 호출
	comp.compileFunction(language,source_path,source,res);
});
app.post('/practice_chatting',function(req,res){
	var chat = req.body.chat;
	chatbot.chatBotFunction(chat,res);
});
app.get('/index',function(req,res){
	res.render('index');
});
app.get('/header',function(req,res){
	res.render('header',{login:member.mIsLogin});
});
app.get('/challenge',function(req,res){
	res.render('challenge');
})

app.listen(3000,function(){
	console.log('server connected');
});

