var express = require('express');
var app = express();
var parse = require('parse-json');
var bodyParser = require('body-parser');
var weather = require('weather-js');
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));



app.get('/weather',function(req,res){
	res.render('weather');
})
app.get('/',function(req,res){
	weather.find({search: 'Seoul', degreeType: 'C'}, function(err, result) {
		if(err) console.log(err);
		else {
			console.log(JSON.stringify(result, null, 2));
		}

	});

})
app.listen(3000,function() {
	console.log('connect');

})
