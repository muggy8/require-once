(function(context){
    function saferEval(code){
        if (this !== context){
            return safeEval.apply(context, code);
        }

        var module = {}
        var exporter = module.exports = module.export = function(output){
            module.exports = output;
        }
        eval(code);
        if (module.exports != exporter){
            return module.exports;
        }
    }

    var scopeProtector = function(){
        var attemptAjaxGet = function(url, callback, attempts){
            attempts = attempts || 1;

            var xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
                    if (xmlhttp.status >= 200 && xmlhttp.status < 300) {
                        callback(xmlhttp.responseText);
                    }
                    else if (attempts < 5) {
                        setTimeOut(function(){
                            attemptAjaxGet(url, callback, attempts+1);
                        }, attempts*100);
                    }
                    else {
                        callback(null);
                    }
                }
            };

            xmlhttp.open("GET", dependencies[i], true);
            xmlhttp.send();
        }

        var alreadyLoaded = {};
    	context.requireOnce = context.require_once = function(dependencies, callback){
    		for (var i = 0; i < dependencies.length; i++) {
                var resource = dependencies[i];
                if (alreadyLoaded[resource]) {
                    callback(alreadyLoaded[resource].exported)
                }
                else {
                    attemptAjaxGet(resource, function(data){
                        if (data){
                            alreadyLoaded[resource] = {
                                lable: resource,
                                exported: saferEval(data)
                            };
                        }
                    });
                }
    		}
    	};
    };
    scopeProtector();
})(this);
