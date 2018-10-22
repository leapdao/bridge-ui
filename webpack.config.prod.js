/* eslint-disable global-require */

const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

const threadLoader = {
  loader: 'thread-loader',
  options: {
    workers: require('os').cpus.length - 1,
  },
};

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.[hash].js',
  },
  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      'web3-core-requestmanager': require.resolve('web3-core-requestmanager'),
      'web3-providers-ws': require.resolve('web3-providers-ws'),
      'web3-utils': require.resolve('web3-utils'),
      'web3-core': require.resolve('web3-core'),
      'web3-core-helpers': require.resolve('web3-core-helpers'),
      'web3-core-method': require.resolve('web3-core-method'),
      'web3-eth-ens': require.resolve('./dummies/web3-eth-ens.js'),
      'web3-providers-ipc': require.resolve('./dummies/web3-providers.js'),
      'bn.js': require.resolve('bn.js'),

      elliptic: require.resolve('elliptic'),
      '@ant-design/icons/lib/dist$': path.resolve(__dirname, './src/icons.js'),
      // react: 'preact-compat',
      // 'react-dom': 'preact-compat',
      // // Not necessary unless you consume a module using `createClass`
      // 'create-react-class': 'preact-compat/lib/create-react-class',
      // // Not necessary unless you consume a module requiring `react-dom-factories`
      // 'react-dom-factories': 'preact-compat/lib/react-dom-factories',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['cache-loader', threadLoader, 'babel-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.tsx?$/,
        use: [
          'cache-loader',
          threadLoader,
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true,
            },
          },
        ],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.(css|less)$/,
        loader: ExtractTextPlugin.extract(
          Object.assign(
            {
              fallback: {
                loader: require.resolve('style-loader'),
                options: {
                  hmr: false,
                },
              },
              use: [
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    minimize: true,
                    sourceMap: false,
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    ident: 'postcss',
                    plugins: () => [
                      require('cssnano')({
                        preset: 'default',
                      }),
                      require('postcss-flexbugs-fixes'), // eslint-disable-line
                      autoprefixer({
                        browsers: [
                          '>1%',
                          'last 4 versions',
                          'Firefox ESR',
                          'not ie < 9', // React doesn't support IE8 anyway
                        ],
                        flexbox: 'no-2009',
                      }),
                    ],
                  },
                },
                {
                  loader: require.resolve('less-loader'),
                  options: {
                    javascriptEnabled: true,
                  },
                },
              ],
            },
            {}
          )
        ),
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
    ],
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        parse: {
          ecma: 8,
        },
        compress: {
          ecma: 5,
          warnings: false,
          comparisons: false,
        },
        mangle: {
          safari10: true,
        },
        output: {
          ecma: 5,
          comments: false,
          ascii_only: true,
        },
      },
      parallel: true,
      cache: true,
      sourceMap: false,
    }),
    new ExtractTextPlugin({
      filename: 'main.[hash].css',
    }),
    new webpack.EnvironmentPlugin(['NETWORK_ID', 'BRIDGE_ADDR', 'PARSEC_NODE']),
    new HtmlPlugin({
      template: 'src/index.html',
    }),
  ],
};
