const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    panel: './src/panel.js',
    styles: './src/styles/index.scss',
    themeObserver: './src/theme-observer.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'extension')
  },
  devtool: 'cheap-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'devtools.html', to: '.' },
        { from: 'devtools.js', to: '.' },
        { from: 'panel.html', to: '.' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.scss']
  }
};
