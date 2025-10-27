const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDevelopment ? 'seo-sdk.js' : 'seo-sdk.min.js',
      library: 'SEODataSDK',
      libraryTarget: 'umd',
      libraryExport: 'default',
      globalObject: 'this',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['> 1%', 'last 2 versions', 'not dead'],
                    },
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    optimization: {
      minimize: !isDevelopment,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: !isDevelopment,
              pure_funcs: isDevelopment ? [] : ['console.log'],
            },
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
    },
    devtool: isDevelopment ? 'source-map' : false,
    performance: {
      maxEntrypointSize: 51200, // 50KB
      maxAssetSize: 51200,
      hints: isDevelopment ? false : 'warning',
    },
  };
};
