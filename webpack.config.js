/* eslint-disable */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
		entry: {
				panel: './src/panel.js'
		},
		output: {
				filename: '[name].js',
				path: path.resolve(__dirname, 'extension')
		},
		devtool: 'cheap-source-map',
		optimization: {
				minimize: false
		},
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
						},
						{
								test: /\.(png|svg|jpg|jpeg|gif)$/i,
								type: 'asset/resource',
								generator: {
										filename: 'images/[name][ext]'
								}
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
								{ from: 'panel.html', to: '.' },
								{ from: 'src/images', to: 'images' },
								{ from: 'src/server', to: 'server' },
								{
									from: 'node_modules/pretty-print-json/dist/css/pretty-print-json.prefers.css',
									to: 'pretty-print-json.css'
								}
						]
				})
		],
		resolve: {
				extensions: ['.js', '.jsx', '.scss']
		}
};
