if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

console.log("    2.2.js has executed and is requireing 2.3.js and 5.js")
requireOnce(
    [
        "/order/5.js",
        "/order/2.3.js"
    ],
    function(){
        console.log("    2.2.js has requires 5.js and 2.3.js has resolved")
    }
)
