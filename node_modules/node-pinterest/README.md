node-pinterest

Simple request-promise based class for hooking into Pinterest.

```
var PDK = require('node-pinterest');
var pinterest = PDK.init(<YOUR ACCESS TOKEN>);
pinterest.api('me').then(console.log);
```

Passing a query string to the API:

```
var options = {
	qs: {
		fields: "id,first_name",
		limit: 10
	}
};
pinterest.api('me/pins', options).then(console.log);
```

Passing a direct URL to the API - useful for pagination:
```
pinterest.api('me/following/users'}).then(function(json) {
	console.log(json);
	if (json.page) {
		pinterest.api(json.page.next).then(console.log);
	}
});
```

Making a new pin:
```
pinterest.api('me/boards').then(function(json) {
	pinterest.api('pins', {
		method: 'POST',
		body: {
			board: json.data[0].id, // grab the first board from the previous response
			note: 'this is a test',
			link: 'http://gizmodo.com/amazon-prime-music-finally-gets-tunes-from-universal-mu-1733540468',
			image_url: 'http://i.kinja-img.com/gawker-media/image/upload/s--4Vp0Ks1S--/1451895062187798055.jpg'
		}
	}).then(function(json) {
		pinterest.api('me/pins').then(console.log);
	});
});

```
