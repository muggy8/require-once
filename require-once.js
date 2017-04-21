(function(context){
    function saferEval(code){
        if (this !== context){
            return safeEval.apply(context, code);
        }

        var module = {}
        var exporter = module.exports = module.export = function(output){
            module.exports = output;
        }
        var results = eval(code);
        if (module.exports != exporter){
            return module.exports;
        }
		else if (results) {
			return results;
		}
    }

    (function(){
		
        var registry = {};
		
		var seekOrGet = function(url, callback){
			var registryEntry = registry[url];
			// already loaded and is in cache
			if (registryEntry && registryEntry.result){
				callback(null, registryEntry.exported, registryEntry.ajax.getResponseHeader("Content-Type"));
			}
			// is currently in the process of fetching 
			else if (registryEntry && !registryEntry.result){
				registryEntry.waiters.push(callback);
			}
			
			// is a completely new URL not known yet
			else {
				var queue = registry[url] = {
					waiters: [callback], 
					attempts: 1
				};
				
				function attemptConnection (){
					var connection = queue.ajax = new XMLHttpRequest(); 
						
					connection.onreadystatechange = function(){
						
						if (connection.readyState == XMLHttpRequest.DONE){
							
							if (connection.status >= 200 && connection.status < 300) {
								// success
								for (var i = 0; i < queue.waiters.length; i++){
									queue.result = connection.responseText;
									queue.waiters[i](connection.status, connection.responseText, connection.getResponseHeader("Content-Type"));
								}
							}
							
							else if (queue.attempts < 5){
								// retry this process
								queue.attempts++;
								setTime(attemptConnection, queue.attempts*100);
							}
							
							else {
								// asset failed to load.
								for (var i = 0; i < queue.waiters.length; i++){
									queue.waiters[i](connection.status);
								}
								delete registry[url];
							}
						}
					}
					connection.open("GET", url, true)
					connection.send();
				}
				attemptConnection();
			}
		} 

    	context.requireOnce = context.require_once = function(dependencies, callback, failed){
			failed = failed || function(){};
    		var obtainedDependencies = [];
			for (var i = 0; i < dependencies.length; i++) {
				var index = i, 
					dependency = dependencies[i];
                seekOrGet(dependency, function(statusCode, responce, contentType){
					if (responce){
						if (contentType.match(/json/) || contentType.match(/javascript/)) {
							obtainedDependencies[index] = registry[dependency].exported = saferEval(responce);
						}
						else {
							obtainedDependencies[index] = responce;
						}
					}
					else {
						obtainedDependencies[index] = false;
					}
					
					if (obtainedDependencies.length === dependencies.length){
						
						var loadErrorFlag = false,
							loadNotDoneFlag = false;
						
						for (var j = 0; j < obtainedDependencies.length; j++){
							if (obtainedDependencies[j]){
								if (
									obtainedDependencies[j] === false || 
									!registry[dependency] || 
									!registry[dependency].result
								){
									loadFailFlag = true;
								}
							}
							else {
								loadNotDoneFlag = true;
							}
						}
						
						if (!loadErrorFlag && !loadNotDoneFlag) {
							callback.apply(context, obtainedDependencies);
						}
						else if (loadErrorFlag && !loadNotDoneFlag) {
							failed.apply(context. obtainedDependencies);
						}
					}
				});
    		}
    	};
    })();
})(this);
