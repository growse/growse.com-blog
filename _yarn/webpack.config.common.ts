import webpack = require("webpack");
import path from 'path'
import {CleanWebpackPlugin} from "clean-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

const ImageminWebpWebpackPlugin = require("imagemin-webp-webpack-plugin");


const config: webpack.Configuration = {
    entry: './ts/index.ts',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, '..', 'assets'),
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({filename: 'css/[name].[hash].css',}),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'img/',
                    to: 'img/'
                },
            ],
        }),
        new ImageminWebpWebpackPlugin({
            config: [{
                test: /\.(jpe?g|png)/,
                options: {
                    quality: 75
                }
            }],
            overrideExtension: false,
            detailedLogs: false,
            silent: false,
            strict: true
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /critical\.scss$/i,
                use: [
                    {loader: 'file-loader', options: {name: '[name].css',}},
                    'sass-loader'
                ],
            },
            {
                test: /main\.scss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: "/assets"
                        }
                    },
                    'css-loader',
                    'resolve-url-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                use: {loader: 'file-loader', options: {name: "[name].[hash].[ext]"}}
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        runtimeChunk: 'single',
    },
};

export default config;