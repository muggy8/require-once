if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

console.log("  2.1.js has executed and is requireing 2.2.js and angular")
requireOnce(
    [
        "/order/2.2.js",
        "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"
    ],
    function(){
        console.log("  2.1.js has requires 2.2.js and angular and resolved")
    }
)
