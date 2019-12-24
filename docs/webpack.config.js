/* @flow weak */

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const babelrc = require('component-docs/dist/utils/getBabelOptions')({
  modules: false,
  targets: {
    browsers: ['last 2 versions', 'safari >= 7'],
  },
});

const createWebpackConfig = require('component-docs/dist/utils/configureWebpack').default;

//const componentDocsConfig = require('./component-docs.config');
//const pathToCSS = componentDocsConfig.style

//fs.copyFileSync(path.resolve(__dirname, './assets/styles.css'), path.resolve(__dirname, 'dist', 'app.css'));

const config = {
  root: path.resolve(__dirname, '..'),
  entry: path.resolve(__dirname, './dist/app.src.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    bundle: 'app.bundle.js',
    style: 'app.css',
  },
  production: true
}


module.exports = {
  ...createWebpackConfig(config),
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
};