var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js")

console.log("  4.1.js has executed and is requireing 4.2.js and 5.js")
requireOnce(
    [
        "/order/4.2.js",
        "/order/5.js"
    ],
    function(_1, something){
        console.log("  4.1.js requires 4.2.js and 5.js has resolved")
        console.log("  5.js returned", something)
    }
)
