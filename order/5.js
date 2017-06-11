var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js")

console.log("    5.js has executed and is requireing jquery")

requireOnce(
    [
        "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"
    ],
    function(){
        module.exports = {
			foo: "bar"
		}
        console.log("    5.js requires jquery has resolved")
        $("body").on("click", function(){
            console.log("working?")
        })
    }
)
