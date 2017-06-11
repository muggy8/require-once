var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js")

requireOnce([
    'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js',
    'https://ajax.googleapis.com/ajax/libs/hammerjs/2.0.8/hammer.min.js',
    {browser: 'test.js', server: './test.js'},
    "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
], function(jquery, uiCSS, jqueryUI, hammerjs, myTest){

    //myTest(123)
	console.log(myTest)
	$("head")
        .append(
            $("<style></style>").text(uiCSS)
        )

    new Hammer($("body")[0])
        .on("tap", function(ev){
            console.log("Eeeww I've been touched");
        });

    //console.log(doAsync)
});
