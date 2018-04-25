var express = require('express');
var app = express();

// connect To DB
const models = require('./models');
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

app.get('/',function(req,res) {
	models.User.findAll().then(function(result) {
		res.json(result);
	}).catch(function(err) {
		console.log(err);
	});
});
app.get('/insert',function(req,res) {
	models.User.create({user_id: 'asdf', password: 'pwd'},{ fields:['user_id','password']})
  .then(result => {
     res.json(result);
  })
  .catch(err => {
     console.error(err);
  });
});
app.get('/delete',function(req,res) {
	models.User.destroy({where: {userID:''}})
		.then(result => {
			res.json({});
		}).catch(err=> {
			console.error(err);
		})
});
app.get('/update',function(req,res) {
	models.User.update({userid: 'user'},{where: {userId:' '}})
		.then(result =>{
			res.json(result);
		}).catch(err => {
			console.error(err);
		});
})

app.listen(3000,function() {
	console.log('server connected!');
});
