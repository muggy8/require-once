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
        var alreadyLoaded = [];
    	context.requireOnce = context.require_once = function(dependencies, callback){
    		for (var i = 0; i < dependencies.length; i++) {

    		}
    	}
    };
    scopeProtector();
})(this);
