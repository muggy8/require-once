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

    var scopeProtector = function(){
		
        var registry = {};
		
        var attemptAjaxGet = function(url, callback, attempts){
            attempts = attempts || 1;

            var xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
                    if (xmlhttp.status >= 200 && xmlhttp.status < 300) {
                        callback(xmlhttp.responseText);
                    }
                    else if (attempts < 500) {
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
        }; 
		
		var seekOrGet = function(url, callback){
			
			if (registry[url] && registry[url].result){
				callback(null, registry[url].exported, registry[url].ajax.getResponseHeader("Content-Type"));
			}
			else if (registry[url] && !registry[url].result){
				registry[url].waiters.push(callback);
			}
			else {
				var queue = registry[url] = {
					waiters: [callback], 
					attempts: 1
				};
				
				function attemptConnection (){
					queue.ajax = new XMLHttpRequest(); 
						
					queue.ajax.onreadystatechange = function(){
						
						if (queue.ajax.readyState == XMLHttpRequest.DONE){
							
							if (queue.ajax.status >= 200 && queue.ajax.status < 300) {
								// success
								for (var i = 0; i < queue.waiters.length; i++){
									queue.result = queue.ajax.responseText;
									queue.waiters[i](queue.ajax.status, queue.ajax.responseText, queue.ajax.getResponseHeader("Content-Type"));
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
									queue.waiters[i](queue.ajax.status);
								}
								delete registry[url];
							}
						}
					}
					queue.ajax.open("GET", url, true)
					queue.ajax.send();
				}
				attemptConnection();
			}
		} 

    	context.requireOnce = context.require_once = function(dependencies, callback, failed){
    		var obtainedDependencies = [];
			for (var i = 0; i < dependencies.length; i++) {
				var index = i;
                seekOrGet(dependencies[i], function(statusCode, responce, contentType){
					if (responce){
						if (contentType.match(/json/) || contentType.match(/javascript/)) {
							obtainedDependencies[index] = registry[dependencies[index]].exported = saferEval(responce);
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
									!registry[dependencies[index]] || 
									!registry[dependencies[index]].result
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
    };
    scopeProtector();
})(this);
