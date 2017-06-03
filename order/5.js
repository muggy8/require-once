if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

console.log("    5.js has executed and is requireing jquery")

requireOnce(
    [
        "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"
    ],
    function(){
        console.log("    5.js requires jquery has resolved")
    }
)
