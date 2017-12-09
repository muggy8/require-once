(function(context, safeEval){
	if (context.requireOnce && context.rquire_once && context.requireOnce === context.rquire_once){
		return
	}
	var registry = {}

	var seekOrGet = function(url, callback){
		var requestUrl = url,
			registryEntry = registry[url],
			attemptConnection = function(queue){
				var connection = queue.requestObject = new XMLHttpRequest(),
					recur = function(){
						attemptConnection(queue)
					}

				connection.onreadystatechange = function(){
					if (connection.readyState == queue.requestObject.DONE){
						if ((connection.status >= 200 && connection.status < 300) || connection.status == 304) {
							// success
							queue.result = true
							for (var i = queue.waiters.length-1; i >= 0 ; i--){
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
							queue.result = false
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
			//console.log("new request", url)
			attemptConnection(
				registry[url] = {
					waiters: [callback],
					attempts: 1
				}
			)
		}
	}

	if (typeof document!= "undefined" && typeof XMLHttpRequest != "undefined"){ // dont do this if in node
		function waitForDocReady (callback) {
			if (document.readyState == "complete"){
				callback()
			}
			else {
				document.addEventListener("readystatechange", function(){
					if (document.readyState == "complete"){
						callback()
					}
				})
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

	context.requireOnce = context.require_once = function(dependencies, callback, failed){
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

				if (successFlag && dependencyLoadStateCheck.resolved !== true){
					//console.log("applying resolution for", dependencies)
					callback.apply(context, applyArray)
				}
				else if (!successFlag) {
					failed.apply(context, applyArray)
				}

				// mark this item as resolved
				dependencyLoadStateCheck.resolved = true
				//console.log("done resoling stack for", dependencies, xhrReadyCallbacks, dependencyLoadStateCheck.resolved)

				// check the stack in reverse order and find unresolved items and resolve them
				while (xhrReadyCallbacks.length){
					if (xhrReadyCallbacks.length !== 0){
						var nextLink = xhrReadyCallbacks[xhrReadyCallbacks.length - 1]
						xhrReadyCallbacks.splice(-1, 1)
						nextLink()
					}
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
					//console.warn("pushing dependency stack to callback stack", dependencies)
				}

				// evaluate the script maybe
				if (
					opperator && // xhr did not fail
					opperator.requestObject.getResponseHeader("Content-Type").match(/javascript/i) && // is a javascript file
					typeof opperator.evaluater == "undefined" // has not been evaluated already
				){
					//console.log("evaluating", opperator.requestObject.responseURL)
					opperator.evaluater = safeEval(opperator.requestObject.responseText)
				}
				else if (
					opperator && // xhr did not fail
					typeof opperator.returnVal != "undefined" && // has not been evaluated already
					!opperator.requestObject.getResponseHeader("Content-Type").match(/javascript/i)  // file is not javascript
				){
					opperator.returnVal = opperator.requestObject.responseText
				}

				// call the next step in the chain if doc is ready
				// in the case that the doc isn't ready, the xhr onload callback will call it instead (above)
				if (document.readyState == "complete"){
					dependencyLoadStateCheck()
				}

			}

		// actual logging for getting the dependencies and calling them
		dependencies.forEach(function(mixedDependency, index){
			if (!mixedDependency){
				obtainedDependencies[index] = true
				numberReturned++
				return
			}
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
					//console.log(opperator)
					if (opperator.result === true){
						obtainedDependencies[index] = opperator //{xhr: xhrObject, returnVal: cachedReturnVal}
					}
					else if (opperator.result === false){
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
		context.requireOnce.build = require("require_once_builder.js")
	}
})(
	this,
	function(code){
		var module = {}
		module.export = module.exports = function(o){
			module.exports = o
		}

		return {
			module: module,
			output: eval(code)
		}
	}
)