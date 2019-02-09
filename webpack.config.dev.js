/* eslint-disable global-require */

const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlPlugin = require('html-webpack-plugin');
const ForkTSCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  mode: 'development',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.[hash].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /config\/env\.js$/,
        use: [
          {
            loader: 'val-loader',
            options: {
              CONFIG_NAME: process.env.CONFIG,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        use: [
          'cache-loader',
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.tsx?$/,
        use: ['cache-loader', 'ts-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.(css)$/,
        use: [
          {
            loader: require.resolve('style-loader'),
            options: {
              hmr: false,
            },
          },
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              ident: 'postcss',
              plugins: () => [
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
        ],
      },
      {
        test: /\.(less)$/,
        use: [
          {
            loader: require.resolve('style-loader'),
            options: {
              hmr: false,
            },
          },
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              ident: 'postcss',
              plugins: () => [
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
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
    ],
  },
  plugins: [
    new ForkTSCheckerWebpackPlugin(),
    new webpack.EnvironmentPlugin({
      CONFIG: 'localnet',
    }),
    new HtmlPlugin({
      template: 'src/index.html',
    }),
  ],
  devServer: {
    publicPath: '/',
    port: 1234,
    historyApiFallback: true,
  },
};
