# requirejs-loader

Allows the import of requirejs packages through the browser.

This is specifically useful for Magento 2, which extensively uses requirejs.

Currently, a prefix of `mixins!` is added, so this is only usable with Magento 2.

## Usage

In webpack.config.js:

    const RequireJsLoaderPlugin = require('@sdinteractive/requirejs-loader').RequireJsLoaderPlugin;

    module.exports = {
      module: {
        rules: [
          {
            test: /require.*\.js$/,
            use: [
              { loader: '@sdinteractive/requirejs-loader' },
            ],
          }
        ]
      },

      plugins: [
        new RequireJsLoaderPlugin(),
      ],
    };

In Magento 2, you'll normally want to include the pub/static/Vendor/theme/locale folder in the module resolve paths.
Adjust the test/exclude rules so that the loader only applies when loading requirejs files, so you can still import
things from node_modules and similar via webpack.
