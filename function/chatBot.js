var client = require('cheerio-httpcli');
function chatBotFunction(chat,res){
	var responseData;
	if(chat.match(/검색/)){
		var i = chat.indexOf("검색",0);
		var word = chat.substring(0,i);
		if(word.length<1){
			responseData = {'result':'no','answer':'형식에 맞지 않는 검색단어'};
			res.json(responseData);
			return;
		}
		var aList;
		client.fetch('http://www.google.com/search',{q:word},function(err,$,response,body){
			aList = $("div.rc").find(".r").find("a");
			responseData = {'result' : 'search', 'answer':aList[0].attribs.href};
			res.json(responseData);
		});
	}
	else if(chat.match(/if/))
		responseData = {'result':'yes','answer':'if문'};
	else if(chat.match(/for/))
		responseData = {'result':'yes','answer':'반복문'};
	else if(chat.match(/while/))
		responseData = {'result':'yes','answer':'반복문'};
	else
		responseData = {'result':'no','answer':'나도 잘 모르겠어'};
	if(chat.match(/검색/)==null)
		res.json(responseData);
}

exports.chatBotFunction = chatBotFunction;
