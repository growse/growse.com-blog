import webpack = require("webpack");
import path from 'path'
import {CleanWebpackPlugin} from "clean-webpack-plugin";

const config: webpack.Configuration = {
    entry: './ts/index.ts',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, '..', 'assets', 'packed'),
    },
    plugins: [
        new CleanWebpackPlugin()
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
                    {loader: 'file-loader', options: {name: 'css/[name].[hash].css',}},
                    'sass-loader',
                ],
            },
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