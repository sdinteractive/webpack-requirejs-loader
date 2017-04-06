# requirejs-loader

Allows the import of requirejs packages through the browser.

This is specifically useful for Magento 2, which extensively uses requirejs.

## Usage

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
