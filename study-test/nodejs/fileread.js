var fs = require('fs');
fs.readFile('sample.txt', 'utf-8', function(err, data){
  console.log(data);
});
