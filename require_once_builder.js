const fs = require("fs")
const jsdom = require("jsdom")
module.exports = function(config, target){
	// set the defaults
	if (typeof config == "string"){
		config = {
			source: config
		}
	}
}