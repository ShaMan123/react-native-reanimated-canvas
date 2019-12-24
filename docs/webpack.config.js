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

fs.copyFileSync(path.resolve(__dirname, './assets/styles.css'), path.resolve(__dirname, 'dist', 'app.css'));

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

function mergeConfig() {
  const { production, entry, root, output } = config;
  const componentDocsWebpackConfig = createWebpackConfig(config);
  const patch = {
    context: root,
    mode: production ? 'production' : 'development',
    devtool: 'source-map',
    entry: production
      ? entry
      : [require.resolve('webpack-hot-middleware/client'), entry],
    output: {
      path: output.path,
      filename: output.bundle,
      publicPath: '/',
    },
    optimization: {
      minimize: production,
      namedModules: true,
      concatenateModules: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(production ? 'production' : 'development'),
        },
      }),
      new MiniCssExtractPlugin({
        filename: output.style,
      }),
    ].concat(
      production
        ? [new webpack.LoaderOptionsPlugin({ minimize: true, debug: false })]
        : [
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NoEmitOnErrorsPlugin(),
        ]
    ),
    module: {
      rules: [
        {
          test: /\.(js|tsx?)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: babelrc,
            },
            {
              loader: require.resolve('linaria/loader'),
              options: { sourceMap: !production, babelOptions: babelrc },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            'css-loader',
            { loader: require.resolve('css-hot-loader') },
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                sourceMap: !production,
                publicPath: (resourcePath, context) => {
                  // publicPath is the relative path of the resource to the context
                  // e.g. for ./css/admin/main.css the publicPath will be ../../
                  // while for ./css/main.css the publicPath will be ../
                  return resourcePath
                  //return path.relative(path.dirname(resourcePath), context) + '/';
                },
              },
            },
            {
              loader: require.resolve('css-loader'),
              options: { sourceMap: !production },
            },
          ],
        },
        {
          test: /\.(bmp|gif|jpg|jpeg|png|svg|webp|eot|woff|woff2|ttf)$/,
          use: {
            loader: require.resolve('file-loader'),
            options: {
              outputPath: 'assets/',
              publicPath: 'assets/',
            },
          },
        },
      ],
    },
  }

  return patch;
}





module.exports = {
  ...createWebpackConfig(config),

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
};