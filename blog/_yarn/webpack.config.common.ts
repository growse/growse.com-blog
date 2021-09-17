import webpack = require("webpack");
import * as path from 'path'
import {CleanWebpackPlugin} from "clean-webpack-plugin";

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const ImageminWebpWebpackPlugin = require("imagemin-webp-webpack-plugin");


const config: webpack.Configuration = {
    entry: './ts/index.ts',
    output: {
        filename: '[name].[fullhash].js',
        path: path.resolve(__dirname, '..', 'assets'),
        assetModuleFilename: "[name].[hash][ext]"
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({filename: 'css/[name].[fullhash].css',}),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'img/',
                    to: 'img/',
                    globOptions: {
                        ignore: ["**/*.drawio"]
                    }
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
                    'sass-loader'
                ],
                type: "asset/resource",
                generator: {
                    filename: '[name].css',
                },
            },
            {
                test: /main\.scss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: "/assets/"
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
                type: 'asset/resource'
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
