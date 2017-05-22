if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

requireOnce([
	{server: "do-async", browser: "https://unpkg.com/do-async@latest"},
	{server: "method-overload", browser: "https://unpkg.com/method-overload@latest"},
	"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
], function(doAsync, overload, bootstrapCss){
    console.log("doAsync", "overload", "loaded");
	var myTestFn = doAsync(function(something){
        console.log(something);
		var chain = this;
		setTimeout(this.pass, 1000);
	}).then(function(){
		console.log(overload);
		//console.log(bootstrapCss);
	})

    "undefined"!=typeof module&&module.exports&&(module.exports=myTestFn)
}, function(){
	console.log("idk why but it failed")
})
