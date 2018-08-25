var models = require('../models');
function modifyInfoFunction(info,res){
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
	models.User.update(
		{name: info.name, nick: info.nickname, password: info.password},
		{where: {user_id: info.email} }
	);
	responseData = {'result':'ok'};
	res.send(responseData);
}
exports.modifyInfoFunction = modifyInfoFunction;
