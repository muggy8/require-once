# require-once
RequireOnce is mostly a browser library that is inspired by requirejs and adds additional code from other sources to the current app context.

## What is it?
Require Once is a first and foremost a client (browser) javascipt library that is inspired by requirejs but loads modules off the network automatically and so your index page is not filled with `<script src="path/to/dependency"></script>`. As the name implies, it will require whatever your dependency once and if you require it again, it will just use whatever it got the first time around. This means that you can require your own dependencies from within the JS files that need them rather than from elsewhere. You can also use it in node so your browser and server can share some of the same code base if you so desire.

## Install
Browser: `<script src="path/to/require_once.min.js"></script>`

node: `npm install require_once --save`

## usage
the library creates a requireOnce and require_once (alias) function in your global scope and you can call them to require your libraries from URLs. Please be advised that the URLs should be absolute paths (aka starting with "http(s)://", "//", or "/"). All paths are relative to the HTML document that the app is ran and not the path of the file the includeOnce is called in. as a result, it's the best to just use absolute paths .

### requireOnce(array url, function callback[, function failedCallback])

General usage example:
```javascipt
requireOnce([
    'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css',
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js',
    'https://ajax.googleapis.com/ajax/libs/hammerjs/2.0.8/hammer.min.js'
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

## Licence?
MIT = free for all yay?

## Changelog:

#### 0.4.5
Removed Debugging "console.log" from min file

#### 0.4.4
Fixed a bug that made callbacks resolve twice sometimes.

#### 0.4.3
Actually Fixed a bug that was supposed to be fixed in 0.4.2

#### 0.4.2
Fixed a bug that made the require_once choke on null requires

#### 0.4.1
Fixed a bug that caused the resolution order to be forwards instead of backwards

#### 0.4.0
This update is yet another update that would cause potentially breaking changes to the code However it is for the best as it is a before the validation script for checking if we are able to use require once is
```javascript
if (typeof requireOnce != "undefined") var requireOnce = require("require_once");
```

however because of hoisting this line actually become

```javascript
var requireOnce;
if (typeof requireOnce != "undefined") requireOnce = require("require_once");
```

which means that in the case that you are loading require_once off the main script that's no big deal but if a script is being required the declaration above would override the global requireOnce function and as a result the workaround would be to declare a requireOnce AND require_once within the scope of the required script's execution scope. This is not the most ideal and would likely lead to more hacks down the line in order to make things work (eg: potential issues in Electrons dev environment if i ever get around to supporting that). In order to avoid this problem the code that checks for if requireOnce is useable or not should be modified to

```javascript
var requireOnce = (typeof require_once == "function")? require_once : require("require_once");
```

this line declares a locally scoped version of requireOnce based on the globally scoped require_once or uses node's require function to get the function. This way it simplifies the need for require once being declared in the code execution scope just to have things work. If you are exclusively running require_once from within the browser then there should be no problem for you with this update.

## More Info:
For more information please [visit this project's github page](https://github.com/muggy8/require-once)
