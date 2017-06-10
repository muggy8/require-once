console.log(typeof requireOnce, typeof require_once)
console.log(requireOnce, require_once)
if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

console.log("  3.1.js has executed and is requireing 3.2.js")
requireOnce(
    [
        "/order/3.2.js"
    ],
    function(){
        console.log("  3.1.js requires 3.2.js has resolved")
    }
)
