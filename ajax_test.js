const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.set('view engine','pug');
app.set('views','./views');
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(__dirname+'/public'));

app.get('/get_ajax', function(req, res, next) {
    res.render("ajax");
});

/* POST 호출 처리 */

app.post('/ajax', function(req, res, next) {

    console.log('POST 방식으로 서버 호출됨');
    //view에 있는 data 에서 던진 값을 받아서
    var msg = req.body.msg;
    msg = '[에코]' + msg;
    //json 형식으로 보내 준다.
    res.send({result:true, msg:msg});
});
app.listen(3100,function() {
	console.log('connect');
})
