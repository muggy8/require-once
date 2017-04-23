if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

requireOnce([
	{server: "keygen", browser: "https://unpkg.com/keygen@latest"}
], function(keygen){
	console.log(keygen.url(64));
})