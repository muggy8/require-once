(function(context, safeEval){
    var registry = {}

	var seekOrGet = function(url, callback){
        var requestUrl = url
		var registryEntry = registry[url]

		// already loaded and is in cache
		if (registryEntry && typeof registryEntry.result !== 'undefined'){
            callback(registryEntry.request, registryEntry.returnVal)
		}

		// is currently in the process of fetching
		else if (registryEntry && registryEntry.result === 'undefined'){
			registryEntry.waiters.push(callback)
		}

		// is a completely new URL not known yet
		else {
			var queue = registry[url] = {
				waiters: [callback],
				attempts: 1
			}

			function attemptConnection (){
				var connection = queue.request = new XMLHttpRequest()

				connection.onreadystatechange = function(){

					if (connection.readyState == XMLHttpRequest.DONE){

						if (connection.status >= 200 && connection.status < 300) {
							// success
							queue.result = 'success'
							for (var i = 0; i < queue.waiters.length; i++){
								queue.waiters[i](connection)
							}
						}

                        else if (connection.status >= 300 && connection.status < 400) {

                            requestUrl = connection.getResponseHeader("Location") || url
                            if (requestUrl != url){
                                attemptConnection()
                            }
                            else {
                                queue.attempts++
								setTimeout(attemptConnection, queue.attempts*100)
                            }
                        }

						else if (queue.attempts < 5){
							// retry this process with timeout
							queue.attempts++
							setTimeout(attemptConnection, queue.attempts*100)
						}

						else {
							// asset failed to load.
							for (var i = 0; i < queue.waiters.length; i++){
								queue.waiters[i](connection)
							}
                            queue.result = 'failed'
						}
					}
				}
				connection.open("GET", requestUrl, true)
				connection.send()
			}
			attemptConnection()
		}
	}

    if (typeof document!= "undefined" && typeof XMLHttpRequest != "undefined"){ // dont do this if in node
        var waitingForDoc = []
        document.addEventListener("readystatechange", function(){
            if (document.readyState == "complete"){
                for(var i = 0; i < waitingForDoc.length; i++){
                    waitingForDoc[i]()
                }
            }
        })
        function waitForDocReady (callback) {
            if (document.readyState == "complete"){
                callback()
            }
            else {
                waitingForDoc.push(callback)
            }
        }

        var xhrs = []
        var xhrReadyCallbacks = []
        XMLHttpRequest.prototype._send = XMLHttpRequest.prototype.send
        XMLHttpRequest.prototype.send = function(){
            var xhr = this
            var requestIndex = xhrs.push(xhr) - 1
            xhr.addEventListener("loadend", function(){
                // if something is waiting for xhr requests to finish call the first thing so it can start it's resolution cycle
                if (xhrReadyCallbacks.length){
                    xhrReadyCallbacks[xhrReadyCallbacks.length - 1]()
                }
            })
            xhr._send()
        }
    }

	context.requireOnce = context.require_once = function(dependencies, callback, failed){
		console.warn (registry)
		if (!callback){
			throw "Success callback not defined"
		}
		failed = failed || function(){}

		var obtainedDependencies = [],
            numberReturned = 0,
            afterEvaluatedXhrsAreDone = function(){
                //remove the last item in callback (self)
                xhrReadyCallbacks.splice(xhrReadyCallbacks.length - 1, 1)

                // check to make sure everything's loaded include new script tags
                var noXhrsLoading = xhrs.reduce(function(truthness, xhr){
                                       //xhr item is an XMLHttpRequest object  || xhr item is a script tag
                    return truthness && (xhr.readyState == XMLHttpRequest.DONE || xhr.readyState == "complete")
                }, true)

                if (noXhrsLoading){
                    // resolve "returnVal" for all dependencies
                    obtainedDependencies.forEach(function(wrapper, index){
                        var dependencyName = dependencies[index].browser || dependencies[index];

                        registry[dependencyName].returnVal = wrapper.returnVal
                        if (wrapper && wrapper.evaluater){
                            registry[dependencyName].returnVal = wrapper.returnVal = (wrapper.evaluater.module.export != wrapper.evaluater.module.exports)
                                ? wrapper.evaluater.module.exports
                                : wrapper.evaluater.output
                        }
                    })

                    // call success or fail appropriately
                    var successFlag = true;
                    var applyArray = obtainedDependencies.map(function(dependency){
                        if (!dependency){
                            return successFlag = false
                        }
                        else {
                            return dependency.returnVal
                        }
                    })

                    if (successFlag){
                        callback.apply(context, applyArray)
                    }
                    else {
                        failed.apply(context, applyArray)
                    }

                    // call the next item in the chain
                    if (xhrReadyCallbacks.length){
                        xhrReadyCallbacks[xhrReadyCallbacks.length - 1]()
                    }

                }
                else {
                    xhrReadyCallbacks.push(afterEvaluatedXhrsAreDone)
                }
            },
            ifAllDependenciesLoaded = function(){
                if (numberReturned == dependencies.length){ // all dependencies have returned

                    // eval all unevaluated javascripts
                    obtainedDependencies.forEach(function(wrapper){
                        if (
                            wrapper && // xhr did not fail
                            typeof wrapper.returnVal == "undefined" && // has not been evaluated already
                            wrapper.xhr.getResponseHeader("Content-Type").match(/javascript/i) // is a javascript file
                        ){
                            wrapper.evaluater = safeEval(wrapper.xhr.responseText)
                        }
                        else if (
                            wrapper && // xhr did not fail
                            typeof wrapper.returnVal == "undefined" && // has not been evaluated already
                            wrapper.xhr // file is not javascript
                        ){
                            wrapper.returnVal = wrapper.xhr.responseText
                        }
                    })

                    // add a callback to wait on any xhr requests that resulted from all the evals
                    xhrReadyCallbacks.push(afterEvaluatedXhrsAreDone)

                    var noXhrsLoading = xhrs.reduce(function(truthness, xhr){
                        return truthness && (xhr.readyState == XMLHttpRequest.DONE || xhr.readyState == "complete")
                                           //xhr item is an XMLHttpRequest object  || xhr item is a script tag
                    }, true)

                    if (noXhrsLoading){
                       xhrReadyCallbacks[xhrReadyCallbacks.length - 1]()
                    }
                }
            }

        dependencies.forEach(function(mixedDependency, index){
			var dependency
			if (typeof require != 'undefined' && typeof XMLHttpRequest == 'undefined'){ // inside node
				dependency = mixedDependency.server
				if (dependency){
					obtainedDependencies[index] = require(dependency)
				}
				else {
					obtainedDependencies[index] = false
				}

				numberReturned++
                if (numberReturned == dependencies.length){ // all dependencies have returned
    				callback.apply(context, obtainedDependencies)
    			}
			}
			else if (XMLHttpRequest){ // inside browser
				waitForDocReady(function(){
					dependency = mixedDependency.browser || mixedDependency; // mixedDependency can be object or a URL string

	                seekOrGet(dependency, function(xhrObject, cachedReturnVal){
						if (xhrObject.status >= 200 && xhrObject.status < 300){
							obtainedDependencies[index] = {xhr: xhrObject, returnVal: cachedReturnVal}
						}
						else {
							obtainedDependencies[index] = false
						}
						numberReturned++
	                    ifAllDependenciesLoaded()
					})
				})
			}
        })
	}

	if (typeof module != 'undefined'){
		module.exports = context.requireOnce
	}
})(
    this,
    function(code){
        var module = {},
            requireOnce = this.requireOnce,
            require_once = this.require_once,
            exporter = module.exports = module.export = function(output){
                module.exports = output
            },
            results = eval(code)

        return {
            output: results,
            module: module
        }
    }
)
