'use strict';

module.exports = function () {
};

module.exports.pitch = function (remainingRequest) {
    this.cacheable && this.cacheable();

    // Route through window.require.
    // It's safe to use mixins! in all cases, and necessary for anything where require('mixins').hasMixins(module) is true.
    // webpack 5: rawRequest is still on NormalModule but accessed via this._module
    const rawRequest = this._module && this._module.rawRequest;
    const jsonName = JSON.stringify('mixins!' + rawRequest);

    // For jquery, fall back to window.jQuery if the RequireJS proxy hasn't resolved .fn yet
    if (rawRequest === 'jquery') {
        return `var _r=window.require(${jsonName});module.exports=(_r&&_r.fn)?_r:(window.jQuery||_r);`;
    }

    return `module.exports = window.require(${jsonName});`;
};

module.exports.RequireJsLoaderPlugin = require('./RequireJsLoaderPlugin.js');
