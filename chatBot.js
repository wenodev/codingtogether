function chatBotFunction(chat,res){
	var responseData;
	if(chat.match(/if/))	
		responseData = {'result':'yes','answer':'if문'};
	else if(chat.match(/for/))
		responseData = {'result':'yes','answer':'반복문'};
	else if(chat.match(/while/))
		responseData = {'result':'yes','answer':'반복문'};
	else
		responseData = {'result':'no','answer':'나도 잘 모르겠어'};
	res.json(responseData);
}

exports.chatBotFunction = chatBotFunction;
