if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

requireOnce([
	{server: "do-async", browser: "https://unpkg.com/do-async@latest"},
	{server: "method-overload", browser: "https://unpkg.com/method-overload@latest"},
	"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css",

], function(doAsync, overload, bootstrapCss){
	doAsync(function(){
		var chain = this;
		setTimeout(this.pass, 1000);
	}).then(function(){
		// console.log(overload);
		// console.log(bootstrapCss);
	})
})
