'use strict';

const path = require('path');
const ConcatSource = require('webpack-sources').ConcatSource;

module.exports = function() {
};

module.exports.pitch = function(remainingRequest) {
	this.cacheable && this.cacheable();

    // Route through window.require.
    // TODO: We use rawRequest to grab the original request (including text! or etc.)
    const jsonName = JSON.stringify(this._module.rawRequest);
    return `module.exports = window.require(${jsonName});`;
};

module.exports.RequireJsLoaderPlugin = require('./RequireJsLoaderPlugin.js');
