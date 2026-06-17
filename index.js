'use strict';

module.exports = function () {
};

module.exports.pitch = function (remainingRequest) {
	this.cacheable && this.cacheable();

    // Route through window.require.
    // It's safe to use mixins! in all cases, and necessary for anything where require('mixins').hasMixins(module) is true.
    // TODO: We use rawRequest to grab the original request (including text! or etc.)
    const requestName = this._module.rawRequest.replace(/^mixins!/, '').replace(/\.js$/, '');

    if (requestName === 'jquery') {
        const jqueryRequest = JSON.stringify('mixins!' + requestName);
        return `module.exports = window.jQuery || window.$ || (typeof window.require === 'function' ? window.require(${jqueryRequest}) : undefined);`;
    }

    const jsonName = JSON.stringify('mixins!' + requestName);
    return `module.exports = window.require(${jsonName});`;
};

module.exports.RequireJsLoaderPlugin = require('./RequireJsLoaderPlugin.js');
