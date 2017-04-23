(function(context){
    function saferEval(code){
        if (this != context){
            return saferEval.call(context, code);
        }

        var module = {},
            exporter = module.exports = module.export = function(output){
                module.exports = output;
            },
            results = eval(code);

        // is node package and get the module.exports and return it to the caller
        if (module.exports != exporter){
            return module.exports;
        }
        // maybe the code returned something? return that to caller
		else if (results) {
			return results;
		}
        // code has no outputs, let the caller know that the code evaluated successfully.
        return true;
    }

    (function(){
        var registry = {};

		var seekOrGet = function(url, callback){
			var registryEntry = registry[url];
			// already loaded and is in cache
			if (registryEntry && registryEntry.result){
				callback(registryEntry.ajax.status, registryEntry.exported, registryEntry.ajax.getResponseHeader("Content-Type"));
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
                                    var contentType = connection.getResponseHeader("Content-Type")
                                    if (contentType.match(/javascript/)){
                                        queue.exported = saferEval(queue.result);
                                    }
									queue.waiters[i](connection.status, queue.exported || queue.result, contentType);
								}
							}

							else if (queue.attempts < 5){
								// retry this process
								queue.attempts++;
								setTimeout(attemptConnection, queue.attempts*100);
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
			if (!callback){
				throw "Success callback not defined";
			}
			failed = failed || function(){};
    		var obtainedDependencies = [],
                numberReturned = 0;
			
			var attemptCallback = function(){
				if (numberReturned == dependencies.length){ // all dependencies have returned
					var callFail = false;

					obtainedDependencies.forEach(function(gotten){
						if (!gotten && gotten === false){
							callFail = true;
						}
					});

					if (callFail){
						failed.apply(context, obtainedDependencies);
					}
					else {
						callback.apply(context, obtainedDependencies);
					}
				}
			}

			//for (var i = 0; i < dependencies.length; i++) {
            dependencies.forEach(function(mixedDependency, index){
				
				var dependency;
				if (typeof require != 'undefined' && typeof XMLHttpRequest == 'undefined'){ // inside node
					dependency = mixedDependency.server
					if (dependency){
						obtainedDependencies[index] = require(dependency);
					}
					else {
						obtainedDependencies[index] = false;
					}
					numberReturned++;
					attemptCallback();
				}
				else if (XMLHttpRequest){ // inside browser
					dependency = mixedDependency.browser || mixedDependency; // mixedDependency can be object or a URL string
					seekOrGet(dependency, function(statusCode, responce, contentType){

						numberReturned++;

						if (responce){
							obtainedDependencies[index] = responce;
						}
						else {
							obtainedDependencies[index] = false;
						}
						
						attemptCallback();
					});
					
				}
				
            })

    	};
    })();
	
	if (typeof module != 'undefined'){
		module.exports = context.requireOnce;
	};
})(this);
