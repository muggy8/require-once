console.log(typeof requireOnce, typeof require_once)
console.log(requireOnce, require_once)
if (typeof requireOnce == 'undefined') var requireOnce = require("./require_once.js");

console.log("    5.js has executed and is requireing jquery")
console.log(this)

requireOnce(
    [
        "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"
    ],
    function(){
        module.exports = {}
        console.log("    5.js requires jquery has resolved")
        $("body").on("click", function(){
            console.log("working?")
        })
    }
)
