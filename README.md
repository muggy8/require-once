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

All you have to do to use the library is to replace your (probably) `(function(){...})()` with `requireOnce([dependency1, dependency2 ...], function(){...})` once all the URLs are loaded, it will call the success function.

### success callback
If all the dependencies are loaded successfully, the success callback is called, the dependencies are passed into it in the same order that they are listed if the requested file has a content type of text/javascipt then it will evaluate the javascript in a relatively safe and contained scope. After the script has been evaluated, if the script has something in modules.exports then that is passed to the success callback, if not, if the script execution returns something then that value is passed to the caller and if no modules.exports is produced and nothing is returned by the execution, then true is pass in it's stead.

If however the file loaded is not a javascript file. the file's contents is passed directly in it's place. This way you can request any file (CSS, JSON, etc) and do with it what you want.

### failedCallback
Because it loads stuff off a network, the calls might fail so you might want to prepare for situations for when the network fails your app. The library has an automatic fail retry system so if the file failes to fetch, it will wait a bit for another try and then again up to 5 times before declaring the operation a failure. If a failure to load is detected, the 3rd callback is used to keep track of this and act as kind of a fallback. The arguments are again passed to the function in listed order except dependencies that failed to load will have the value of false. With our example above, we can complete it like this:

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
}, function(jquery, uiCSS, jqueryUI, hammerjs){
    if (!jquery){
        var script = document.createElement("script");
        script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js';
        document.querySelector("body").append(script)
    }

    if (!uiCSS){
        var link = document.createElement("link");
        link.setAttribute("href", 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css');
        link.setAttribute("rel", "stylesheet");
        document.querySelector("body").append(link)
    }

    if (!jqueryUI){
        var script = document.createElement("script");
        script.src = 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js';
        document.querySelector("body").append(script)
    }

    if (!hammerjs){
        var script = document.createElement("script");
        script.src = 'https://ajax.googleapis.com/ajax/libs/hammerjs/2.0.8/hammer.min.js';
        document.querySelector("body").append(script)
    }
});
```

In the above example. if we failed to load the required dependencies, we attempt to load it via a regular Script or Link tag.

## RequireOnce inside of RequireOnce?

Yes you can call requireOnce inside of files that got required by requireOnce and they would share the same cache. This way if you have a large number of nested dependencies that depends on other things, you can feel free to just have one init.js in your main html response which then loads in other modules on the fly and the modules themselves will load in their own dependencies.

UPDATE: As of version 0.2.0, all files that load in other files via XMLHttpRequest (which is what requireOnce uses to load stuff off the network) will be kept track of while requiring files. This will mean that if you require a file that requires another file asynchronously, the callback to the first require wont be fired until the callback to the second require is fully resolve. This is a recursive process.

for example, Imagine the file structure below for your app.

```
- index.html
+ js
  + ui
    - topnav.js
    - bottomNav.js
  + auth
    - login.js
    - logout.js
  + crypt
    - genRSAKey.js
    - rsa.js
    - ase.js
  + ajax
    - httpGet.js
    - httpPost.js
  + app
    - main.js
    - helpers.js
+ css
...
```
trying to maintain that as your project grows will become difficult as you forget that each time you add a file, you'll need to add it to all the index pages and so on. but what if you just added a new dependency at the top of the file you're working on. for example you can have a rsa.js depend on genRSAKey.js and when you include rsa.js you automatically include the generator as well and when you init your app, your app will just get all the required stuff by itself.

## <script> tags in the index?
and now that you are loading your dependencies and modules off the network in your javascipt, you can remove them from your html responses. however if you still have them there, there's really no harm since most browsers are pretty good about caching and reusing them. Ideally, the library will detect already loaded assets in the page but there's no real good way of implementing this since Script tags dont really tell you what has loaded successfully and what hasn't. If you have a creative solution, please feel to submit pull requests to this project and let me know

## Sharing code with Node
If you are like me and you like to write code that is shared between Node and Browser for whatever reason, you can do so in the following way

```javascipt
var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js")

requireOnce([
    {browser: "/path/to/dependency1.js", server:"dependency"}
    {browser: "/path/to/underscore.js", server:"underscore"},
	"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
], function(dependency1, _, css){
    dependency1.action(_.method());

	if (css){
		console.log("I am in a browser")
		// my logic
	}
});
```

In the first line, we detect if require_once has been loaded and if not, require it. What happens is if you are in a browser environment requireOnce is probably already loaded via a <script> tag (or is inlined somewhere) and so you can just use it but if you are in a node environment the library has not yet been loaded and as a result you load it in via require.

When requesting libraries, you can use the requireOnce and pass an array where each element is either a string for a URL or an object with a browser and server property. The browser property is of course the url to load the asset in the browser where as the server is the string to be passed into node's "require()" function.

The library will take care of the rest with XMLHttpRequests while in the browser or via require() in node. if you do not pass a server property, or if you just use a string, the server wont bother trying to get the asset and will just return a false in that place. If this is the case you should have catches so when running your code on the server, you don't expect your asset to come in when a false is going to drop in it's place.

## Licence?
MIT = free for all yay?

## Changelog:

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
var requireOnce = (typeof require_once == "function")? require_once : require("./require_once.js");
```

this line declares a locally scoped version of requireOnce based on the globally scoped require_once or uses node's require function to get the function. This way it simplifies the need for require once being declared in the code execution scope just to have things work. If you are exclusively running require_once from within the browser then there should be no problem for you with this update.
