# require-once
RequireOnce is mostly a browser library that is inspired by requirejs and adds additional code from other sources to the current app view.

## What is it?
Require Once is a client (browser) javascipt that is inspired by requirejs but loads modules off the network and so your index page is not filled with `<script src="path/to/dependency"></script>`. As the name implies, it will require whatever your dependency once and if you require it again, it will just use whatever it got the first time around. This means that you can require your own dependencies from within the JS files that need them rather than from elsewhere.

## Install
You can either in-line the file in your JS at the top or you can add `<script src="path/to/require-once.min.js"></script>` to your project somewhere before you start using it.

## usage
the library creates a requireOnce and require_once (alius) function in your global scope and you can call them to require your libraries from URLs. Please be advised that the URLs should be absolute paths (aka starting with "http(s)" or "/"). All paths are relative to the HTML document that the app is ran and not the path of the file the includeOnce is called in. as a result, it's the best to just make paths absolute.

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

All you have to do to use the library is to replace your (probably) `(function(){...})()` with `requireOnce([dependency1, dependency2 ...], function(){...})` once all the URLs are loaded, it will call the success function.

### success callback
If all the dependencies are loaded successfully, the success callback is called, the dependencies are passed into it in the same order that they are listed if the requested file has a content type of text/javascipt then it will evaluate the javascript in a relatively safe and contained scope. After the script has been evaluated, if the script has something in modules.exports then that is returned, if not, if the script execution returns something then that is returned to the caller and if no modules.exports is produced and nothing is returned by the execution, then true is pass in it's stead.

If however the file loaded is not a javascrit file. the file's contents is passed directly in it's place. This way you can request any file (CSS, JSON, etc) and do with it what you want.

### failedCallback
Because it loads stuff off a network, it might fail so you might want to prepare for situations for when the network fails your app. The 3rd callback is used to keep track of this and act as kind of a fallback. The arguments are again passed to the function in listed order except dependencies that failed to load will have the value of false. With our example above, we can complete it like this:

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

Yes you can call requireOnce inside of files that got required by requireOnce and they would share the same cache. This way if you have a large number of nested dependencies that depends on other things, you can feel free to just have one init.js in your main html response which then loads in other modules on the fly.

Immagine the file structure below for your app.

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
trying to maintain that as your project grows will become dificult as you forget that each tme you add a file, you'll need to add it to all the index pages and so on. but what if you just added a new dependency at the top of the file you're working on. for example you can have a rsa.js depend on genRSAKey.js and when you include rsa.js you automatically include the generator as well and when you init your app, your app will just get all the required stuff by itself.

## <script> tags in the index?
and now that you are loading your dependencies and modules off the network in your javascipt, you can remove them from your html responses. however if you still have them there, there's really no harm since most browsers are pretty good about caching and reusing them. Ideally, the library will detect already loaded assets in the page but that would be too complicated so meh~

## Licence?
MIT = free for all yay?