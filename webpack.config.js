const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')

module.exports = {
	entry: {
		app: './resources/assets/js/app.js'
	},
	output: {
		filename: '[name].[contenthash].js',
		path: path.resolve(__dirname, './public/assets/js'),
		clean: true
	},
	resolve: {
		extensions: ['.js', '.vue', '.json'],
		alias: {
			'vue$': 'vue/dist/vue.esm.js'
		}
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[name].[hash][ext]'
				}
			},
			{
				test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
				type: 'asset/resource',
				generator: {
					filename: 'images/[name].[hash][ext]'
				}
			}
		]
	},
	plugins: [
		new VueLoaderPlugin()
	],
	optimization: {
		moduleIds: 'deterministic',
		runtimeChunk: 'single',
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
	},
	performance: {
		hints: 'warning',
		maxAssetSize: 500000,
		maxEntrypointSize: 500000,
	}
}