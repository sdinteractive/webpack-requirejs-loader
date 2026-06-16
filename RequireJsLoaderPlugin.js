'use strict';

const { ConcatSource } = require('webpack-sources');

// Matches window.require("mixins!foo") or window.require('mixins!foo') in asset source
const MIXINS_PATTERN = /window\.require\(["'](mixins![^"']+)["']\)/g;

let RequireJsLoaderPlugin = function () {
};

/**
 * Scan compiled asset source for window.require("mixins!...") calls.
 * This is more reliable than module enumeration because webpack 5 scope-hoisting
 * (ConcatenatedModule) hides inner modules from chunkGraph iteration.
 */
function gatherImportsFromSource(source) {
    const imports = new Set();
    let match;
    MIXINS_PATTERN.lastIndex = 0;
    while ((match = MIXINS_PATTERN.exec(source)) !== null) {
        imports.add(match[1]);
    }
    return Array.from(imports);
}

function generateProlog(imports) {
    return `window.require(${JSON.stringify(imports)}, function () {`;
}

function generateEpilog() {
    return `});`;
}

RequireJsLoaderPlugin.prototype.apply = function (compiler) {
    compiler.hooks.compilation.tap('RequireJsLoader', (compilation) => {
        if (compilation.hooks.processAssets) {
            // webpack 5
            const webpack = compiler.webpack || require('webpack');
            compilation.hooks.processAssets.tap(
                {
                    name: 'RequireJsLoader',
                    stage: webpack.Compilation
                        ? webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY
                        : 1000,
                },
                (assets) => {
                    const processed = new Set();
                    for (const [filename, asset] of Object.entries(assets)) {
                        if (processed.has(filename)) continue;

                        const source = asset.source();
                        // Only wrap JS files that actually contain requirejs-loader calls
                        if (typeof source !== 'string' || !source.includes('window.require("mixins!')) {
                            continue;
                        }

                        const needsImport = gatherImportsFromSource(source);
                        if (needsImport.length === 0) continue;

                        compilation.updateAsset(
                            filename,
                            old => new ConcatSource(generateProlog(needsImport), '\n', old, '\n', generateEpilog())
                        );
                        processed.add(filename);
                    }
                }
            );
        } else {
            // webpack 4 fallback: module enumeration still works here
            compilation.hooks.chunkAsset.tap('RequireJsLoader', (chunk, filename) => {
                if (chunk.__requirejsLoaderDone) return;

                const modules = chunk.modulesIterable ? Array.from(chunk.modulesIterable) : [];
                const needsImport = [];
                for (const mod of modules) {
                    if (mod.request && mod.request.indexOf('requirejs-loader') !== -1) {
                        needsImport.push('mixins!' + mod.rawRequest);
                    }
                }
                if (needsImport.length === 0) return;

                compilation.assets[filename] = new ConcatSource(
                    generateProlog(needsImport), '\n',
                    compilation.assets[filename], '\n',
                    generateEpilog()
                );
                chunk.__requirejsLoaderDone = true;
            });
        }
    });
};

module.exports = RequireJsLoaderPlugin;
