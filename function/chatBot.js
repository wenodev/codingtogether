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
	if(chat.match(/warning/)||chat.match(/error/)) {
		if(chat.match(/format/))
			responseData = {'result':'yes','answer' : '형식이 잘못된 것 같아 정수표현은 %d, 문자열은 %s와 같이 표현해. '}
		else if(chat.match(/expected ';'/))
			responseData = {'result':'yes','answer' : '명령어 끝에는 세미콜론이 필요한데 없는 부분이 있는지 찾아봐~'}
		else 
			responseData = {'result':'yes','answer' : '에러가 발생했어!'}
	}
	else if(chat.match(/if/))
		responseData = {'result':'yes','answer':'if문'};
	else if(chat.match(/for/))
		responseData = {'result':'yes','answer':'반복문'};
	else if(chat.match(/while/))
		responseData = {'result':'yes','answer':'반복문'};
	else if(chat.match(/missing/))
		responseData = {'result':'yes','answer' : '따옴표 혹은 괄호와 같은 쌍이 잘 닫혔는지 확인해봐!'}
	else
		responseData = {'result':'no','answer':'나도 잘 모르겠어'};
	if(chat.match(/검색/)==null)
		res.json(responseData);
}

exports.chatBotFunction = chatBotFunction;
