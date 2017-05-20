# require-once
RequireOnce is mostly a browser library that is inspired by requirejs and adds additional code from other sources to the current app context.

## What is it?
Require Once is a first and foremost a client (browser) javascipt that is inspired by requirejs but loads modules off the network automatically and so your index page is not filled with `<script src="path/to/dependency"></script>`. As the name implies, it will require whatever your dependency once and if you require it again, it will just use whatever it got the first time around. This means that you can require your own dependencies from within the JS files that need them rather than from elsewhere. You can also use it in node so your browser and server can share some of the same code base if you so desire.

## Install
Browser: `<script src="path/to/require_once.min.js"></script>`
node: `npm install require_once --save`

## usage
the library creates a requireOnce and require_once (alias) function in your global scope and you can call them to require your libraries from URLs. Please be advised that the URLs should be absolute paths (aka starting with "http(s)://" or "/"). All paths are relative to the HTML document that the app is ran and not the path of the file the includeOnce is called in. as a result, it's the best to just use absolute paths .

### requireOnce(array url, function callback[, function failedCallback])

General usage example:
```javascipt
requireOnce([
    'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js',
    'https://ajax.googleapis.com/ajax/libs/hammerjs/2.0.8/hammer.min.js',

], function(jquery, uiCSS, jqueryUI, hammerjs){
    $("head")
        .append(
            $("<style></style>").text(uiCSS)
        )

    new Hammer($("body")[0])
        .on("tap", function(ev){
            console.log("Eeeww I've been touched");
        });
});
```

For more information, please [visit this project's Github Page](https://github.com/muggy8/require-once)
