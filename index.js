'use strict';

module.exports = function () {
};

module.exports.pitch = function (remainingRequest) {
    this.cacheable && this.cacheable();

    const options = (this.getOptions ? this.getOptions() : this.query) || {};

    // This loader is normally applied via a `module.rules` entry rather than an
    // inline `mixins!` prefix, so `remainingRequest` here resolves to the absolute
    // filesystem path of the file, not the bare specifier (e.g. "jquery", or a
    // RequireJS-style module id) that was originally written in source. We need
    // that original, unresolved specifier to build a `window.require(...)` id
    // RequireJS will actually recognize. `this._module.rawRequest` is the only
    // way to recover it; it's a documented-but-discouraged loader context
    // property webpack has flagged for eventual removal, but there's currently
    // no public replacement that preserves the as-written request, so we keep
    // using it and only fall back to `remainingRequest` if it's unavailable.
    const rawRequest = (this._module && this._module.rawRequest) || remainingRequest;
    const requestName = String(rawRequest).replace(/^mixins!/, '').replace(/\.js$/, '');

    if (options.debug) {
        console.log('[requirejs-loader] pitch', {
            resourcePath: this.resourcePath,
            remainingRequest,
            rawRequest,
            requestName,
        });
    }

    let output;
    if (requestName === 'jquery') {
        const jqueryRequest = JSON.stringify('mixins!' + requestName);
        output = `module.exports = window.jQuery || window.$ || (typeof window.require === 'function' ? window.require(${jqueryRequest}) : undefined);`;
    } else {
        const jsonName = JSON.stringify('mixins!' + requestName);
        output = `module.exports = window.require(${jsonName});`;
    }

    if (typeof options.onTransform === 'function') {
        output = options.onTransform(output, this.resourcePath) || output;
    }

    return output;
};

module.exports.RequireJsLoaderPlugin = require('./RequireJsLoaderPlugin.js');