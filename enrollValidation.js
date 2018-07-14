var models = require('./models');
function enrollValidation(info,res){
	var responseData;
	//공백 체크
	var arr = JSON.stringify(info);
	for(var i=1; i<arr.length; i++){
		if(arr[i-1]=='"' && arr[i]=='"'){
			responseData = {'result':'no','flag':'1'};
			res.send(responseData);
			return;
		}
	}
	//비밀번호 불일치
	if(info.password !=info.confirm){
		responseData = {'result':'no','flag':'2'};
		res.send(responseData);
		return;
	}
	//이미 존재하는 아이디
	models.User.findAll({
		where: {user_id: info.email}
	})
	.then(function(user){
		if(user.length!=0){
			responseData = {'result':'no','flag':'3'};
			res.send(responseData);
			return;
		}
		else{
			responseData = {'result':'ok'};
			res.send(responseData);
			models.User.create({
				name: info.name,
				nick: info.nick,
				user_id: info.email,
				password: info.password
			}).catch(function(err){
				console.error(err);
			});
			return;
		}
	});
}
exports.enrollValidation = enrollValidation;
