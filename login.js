var models = require('./models');
var member = require('./singleton');

function loginFunction(id,pwd,res){
	var responseData;
	models.User.findOne({
		where: {user_id: id}
	})
		.then(function(user){
			if(user==null || user.dataValues.password!=pwd){
				responseData = {'result':'no','flag':member.mIsLogin};
				res.json(responseData);
				console.log('로그인 실패');
			} 
			else{
				//로그인 성공시 Singleton 객체에 id,pwd값 setting
				member.mIsLogin = true;	
				member.mId = id;
				member.mPwd = pwd;
				member.mName = user.dataValues.name;
				member.mNick = user.dataValues.nick;
				responseData = {'result' : 'ok', 'flag':member.mIsLogin};
				res.json(responseData);
				console.log('로그인 성공');
			}
		});
}

exports.loginFunction = loginFunction;
