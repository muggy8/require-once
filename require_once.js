(function(context, safeEval){
	var registry = {}

	var seekOrGet = function(url, callback){
		var requestUrl = url,
			registryEntry = registry[url],
			attemptConnection = function(queue){
				var connection = queue.request = new XMLHttpRequest(),
					recur = function(){
						attemptConnection(queue)
					}

				connection.onreadystatechange = function(){
					if (connection.readyState == XMLHttpRequest.DONE){
						if ((connection.status >= 200 && connection.status < 300) || connection.status == 304) {
							// success
							queue.result = 'success'
							for (var i = 0; i < queue.waiters.length; i++){
								if (i == 0){
									queue.waiters[i](queue)
								}
								else {
									seekOrGet(url, queue.waiters[i])
								}
							}
						}

						else if (connection.status >= 300 && connection.status < 400) {
							requestUrl = connection.getResponseHeader("Location") || url
							if (requestUrl != url){
								recur()
							}
							else {
								queue.attempts++
								setTimeout(recur, queue.attempts*100)
							}
						}

						else if (queue.attempts < 5){
							// retry this process with timeout
							queue.attempts++
							setTimeout(recur, queue.attempts*100)
						}

						else {
							queue.result = 'failed'
							// asset failed to load.
							for (var i = 0; i < queue.waiters.length; i++){
								queue.waiters[i](queue)
							}
						}
					}
				}
				connection.open("GET", requestUrl, true)
				connection.send()
			}

		// already loaded and is in cache
		if (registryEntry && typeof registryEntry.result !== 'undefined'){
			//console.log("insta callback", url)
			callback(registryEntry)
		}

		// is currently in the process of fetching
		else if (registryEntry && typeof registryEntry.result === 'undefined'){
			//console.log("added to waiters", url)
			registryEntry.waiters.push(callback)
		}

		// is a completely new URL not known yet
		else {
		//	console.log("new request", url)
			attemptConnection(
				registry[url] = {
					waiters: [callback],
					attempts: 1
				}
			)
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
		XMLHttpRequest.prototype.send = function(potentialData){
			var xhr = this
			var requestIndex = xhrs.push(xhr) - 1
			xhr.addEventListener("loadend", function(){
				// if something is waiting for xhr requests to finish call the first thing so it can start it's resolution cycle but only when the document is ready
                waitForDocReady(function(){
                    if (xhrReadyCallbacks.length){
                        xhrReadyCallbacks[xhrReadyCallbacks.length - 1]()
                    }
                })
			})
			if (typeof potentialData != "undefined"){
				xhr._send(potentialData)
			}
			else {
				xhr._send()
			}
		}
	}

	context.requireOnce = context.require_once = (context.requireOnce && context.require_once)? context.requireOnce : function(dependencies, callback, failed){
		if (!callback){
			throw new Error("Success callback not defined")
		}
		failed = failed || function(){}

		var obtainedDependencies = [],
			numberReturned = 0,
			finalResolution = function(){
				// resolve "returnVal" for all dependencies
				obtainedDependencies.forEach(function(opperator, index){
					if (opperator && opperator.evaluater){
						opperator.returnVal = opperator.returnVal || (opperator.evaluater.module.export != opperator.evaluater.module.exports)
							? opperator.evaluater.module.exports
							: (typeof opperator.evaluater.output == "undefined")? true : opperator.evaluater.output
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

				//remove the last item in callback (self)
				xhrReadyCallbacks.splice(xhrReadyCallbacks.length - 1, 1)

				// call the next item in the chain
				if (xhrReadyCallbacks.length){
					xhrReadyCallbacks[xhrReadyCallbacks.length - 1]()
				}
			},
			dependencyLoadStateCheck = function(){
                // this function will only be called when the doc is ready.
				if (numberReturned == dependencies.length){ // all dependencies have returned
                    var noXhrsLoading = xhrs.reduce(function(truthness, xhr){
                                           //xhr item is an XMLHttpRequest object  || xhr item is a script tag
                        return truthness && (xhr.readyState == XMLHttpRequest.DONE || xhr.readyState == "complete")
                    }, true)

    				noXhrsLoading && finalResolution()
				}
			},
            resolutionOrderSet = false,
            potentialScriptEvaluation = function(opperator){
                // push the current execution callback to the stack once first
                if (!resolutionOrderSet){
                    resolutionOrderSet = true
                    xhrReadyCallbacks.push(dependencyLoadStateCheck)
                }

                // evaluate the script maybe
                if (
                    opperator && // xhr did not fail
                    opperator.request.getResponseHeader("Content-Type").match(/javascript/i) && // is a javascript file
                    typeof opperator.evaluater == "undefined" // has not been evaluated already
                ){
                    //console.log("evaluating", opperator.request.responseURL)
                    opperator.evaluater = safeEval(opperator.request.responseText)
                }
                else if (
                    opperator && // xhr did not fail
                    typeof opperator.returnVal != "undefined" && // has not been evaluated already
                    !opperator.request.getResponseHeader("Content-Type").match(/javascript/i)  // file is not javascript
                ){
                    opperator.returnVal = opperator.request.responseText
                }

                // call the next step in the chain if no doc is ready
                // in the case that the doc isn't ready, the xhr onload callback will call it instead (above)
                if (document.readyState == "complete"){
                    dependencyLoadStateCheck()
                }

            }

		// actual loging for getting the dependencies and calling them
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
				dependency = mixedDependency.browser || mixedDependency; // mixedDependency can be object or a URL string

				seekOrGet(dependency, function(opperator){
                    console.log(opperator)
					if (opperator.result == "success"){
						obtainedDependencies[index] = opperator //{xhr: xhrObject, returnVal: cachedReturnVal}
					}
					else if (opperator.result = "failed"){
						obtainedDependencies[index] = false
					}
					numberReturned++
					//ifAllDependenciesLoaded()
                    potentialScriptEvaluation(opperator)
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
		var executionContext = Object.create(this),
			module = {},
			exporter = module.exports = module.export = function(output){
				module.exports = output
			},
			results = eval.call(executionContext, code)

		return {
			output: results,
			module: module
		}
	}.bind(this)
)
