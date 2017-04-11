'use strict';

const ConcatSource = require('webpack-sources').ConcatSource;

let RequireJsLoaderPlugin = function() {
};

function gatherRequireJsImports(modules) {
    let needsImport = [];
    for (var module of modules) {
        // If the requirejs-loader was used, then we need to wrap and import this module.
        // TODO: Clean up this check.
        if (module.request && module.request.indexOf('requirejs-loader') !== -1) {
            needsImport.push(module.rawRequest);
        }
    }

    return needsImport;
}

function generateProlog(imports) {
    const jsonImports = JSON.stringify(imports);
    return `window.require(${jsonImports}, function() {`;
}

function generateEpilog(imports) {
    return `});`;
}

RequireJsLoaderPlugin.prototype.apply = function(compiler) {
    compiler.plugin('compilation', (compilation, data) => {
        compilation.plugin('chunk-asset', (chunk, filename) => {
            // Avoid applying imports twice.
            if ('--requirejs-export:done' in chunk) {
                return;
            }

            const needsImport = gatherRequireJsImports(chunk.modules);
            if (needsImport.length != 0) {
                let prolog = generateProlog(needsImport);
                let epilog = generateEpilog(needsImport);

                compilation.assets[filename] = new ConcatSource(prolog, "\n", compilation.assets[filename], "\n", epilog);
            }
        });
    });
};

module.exports = RequireJsLoaderPlugin;
