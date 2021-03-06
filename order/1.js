var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js")

console.log("1.js has executed and is requireing 2.1.js, 3.1.js, 4.1.js and 5.js")
requireOnce(
    [
        "/order/2.1.js",
        "/order/3.1.js",
        "/order/4.1.js",
        "/order/5.js",
        "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js",
		"/extra-require.js"
    ],
    function(){
        console.warn("1.js has fired and resolved")
    }
)
