'use strict';

const ConcatSource = require('webpack-sources').ConcatSource;

let RequireJsLoaderPlugin = function () {
};

function gatherRequireJsImports(modules) {
    let needsImport = [];
    for (let module of modules) {
        // If the requirejs-loader was used, then we need to wrap and import this module.
        // TODO: Clean up this check.
        if (module.request && String(module.request).indexOf('jquery.js') !== -1) {
            needsImport.push('mixins!' + module.rawRequest);
        } else if (module.request && module.request.indexOf('requirejs-loader') !== -1) {
            needsImport.push(module.rawRequest);
        }
    }

    return needsImport;
}

function generateProlog(imports) {
    const jsonImports = JSON.stringify(imports);
    return `window.require(${jsonImports}, function () {`;
}

function generateEpilog(imports) {
    return `});`;
}

function registerHook(object, oldName, newName, cb) {
    if (object.hooks) {
        object.hooks[newName].tap('RequireJsLoader', cb);
    } else {
        object.plugin(oldName, cb);
    }
}

RequireJsLoaderPlugin.prototype.apply = function (compiler) {
    registerHook(compiler, 'compilation', 'compilation', (compilation, data) => {
        registerHook(compilation, 'chunk-asset', 'chunkAsset', (chunk, filename) => {
            // Avoid applying imports twice.
            if ('--requirejs-export:done' in chunk) {
                return;
            }

            const modules = chunk.modulesIterable ? Array.from(chunk.modulesIterable) : modules;
            const needsImport = gatherRequireJsImports(modules);
            if (needsImport.length != 0) {
                let prolog = generateProlog(needsImport);
                let epilog = generateEpilog(needsImport);

                compilation.assets[filename] = new ConcatSource(prolog, "\n", compilation.assets[filename], "\n", epilog);
            }
        });
    });
};

module.exports = RequireJsLoaderPlugin;
