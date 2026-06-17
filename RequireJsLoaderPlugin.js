'use strict';

const { ConcatSource } = require('webpack-sources');

let RequireJsLoaderPlugin = function () {
};

function isNormalModule(module) {
    return Boolean(module && typeof module.request === 'string' && module.rawRequest != null);
}

function normalizeRequest(rawRequest) {
    return String(rawRequest).replace(/^mixins!/, '').replace(/\.js$/, '');
}

function gatherRequireJsImports(modules) {
    let needsImport = [];
    for (let module of modules) {
        if (isNormalModule(module) && String(module.request).indexOf('requirejs-loader') !== -1) {
            needsImport.push('mixins!' + normalizeRequest(module.rawRequest));
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

RequireJsLoaderPlugin.prototype.apply = function (compiler) {
    const isWebpack5 = Boolean(compiler.webpack);

    if (isWebpack5) {
        compiler.hooks.compilation.tap('RequireJsLoaderPlugin', (compilation) => {
            const Compilation = compiler.webpack.Compilation;

            compilation.hooks.processAssets.tap(
                {
                    name: 'RequireJsLoaderPlugin',
                    stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                },
                () => {
                    const processedFiles = new Set();

                    for (const chunk of compilation.chunks) {
                        const chunkModules = Array.from(
                            compilation.chunkGraph.getChunkModulesIterable(chunk)
                        );

                        const needsImport = gatherRequireJsImports(chunkModules);

                        if (needsImport.length === 0) continue;

                        const prolog = generateProlog(needsImport);
                        const epilog = generateEpilog(needsImport);

                        for (const filename of chunk.files) {
                            if (!filename.endsWith('.js')) continue;
                            if (processedFiles.has(filename)) continue;

                            processedFiles.add(filename);
                            compilation.updateAsset(
                                filename,
                                (old) => new ConcatSource(prolog, '\n', old, '\n', epilog)
                            );
                        }
                    }
                }
            );
        });
    } else {
        compiler.hooks.compilation.tap('RequireJsLoaderPlugin', (compilation) => {
            compilation.hooks.chunkAsset.tap('RequireJsLoaderPlugin', (chunk, filename) => {
                if (!filename.endsWith('.js')) return;

                // Avoid applying imports twice.
                if ('--requirejs-export:done' in chunk) {
                    return;
                }

                const modules = chunk.modulesIterable ? Array.from(chunk.modulesIterable) : [];
                const needsImport = gatherRequireJsImports(modules);

                if (needsImport.length !== 0) {
                    let prolog = generateProlog(needsImport);
                    let epilog = generateEpilog(needsImport);

                    compilation.assets[filename] = new ConcatSource(prolog, "\n", compilation.assets[filename], "\n", epilog);
                }

                chunk['--requirejs-export:done'] = true;
            });
        });
    }
};

module.exports = RequireJsLoaderPlugin;
