var path = require('path');
var webpack = require('webpack');

var folder = 'public';

var isDev = true;

module.exports = {
    entry: `./src/index.js`,

    output: {
        path: path.resolve(__dirname, './dist/'),
        publicPath: '/dist/',
        filename: 'vue-g-select.js',
        library: 'VueGSelect',
        libraryTarget: 'umd'
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    esModule: true,
                    //postcss: [require('postcss-cssnext')()]
                    preserveWhitespace: false,

                    postcss: [require('autoprefixer')({
                        browsers: ['> 1%']
                    })],

                    preLoaders: {
                        html: 'htmlclean-loader'
                    },

                    loaders: {
                        js: 'babel-loader?' + JSON.stringify({
                            presets: [['es2015', { modules: false }]]
                        }),
                        scss:['style-loader', 'css-loader', 'sass-loader']
                    }
                }
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.html$/,
                loader: 'vue-html-loader'
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: '[name].[ext]?[hash]'
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { sourceMap: true } }
                ]
            },
            {
                test: /\.(scss|sass)$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            { test: /\.(woff|woff2)$/,  loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
            { test: /\.ttf$/,    loader: 'file-loader' },
            { test: /\.eot$/,    loader: 'file-loader' },
            { test: /\.svg$/,    loader: 'file-loader' }
        ]
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    },
    devtool: isDev ? '#eval' : '#source-map',
    cache: true,
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.js'
        }
    },
    externals: {
        lodash: 'lodash'
    }
};

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map';
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    ])
}
