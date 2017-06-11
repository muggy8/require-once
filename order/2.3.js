var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js")

console.log("      2.3.js has executed and is requireing 5.js")
requireOnce(
    [
        "/order/5.js"
    ],
    function(){
        console.log("      2.3.js requires 5.js has resolved")
    }
)
