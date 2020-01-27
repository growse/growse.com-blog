import webpack = require("webpack");
import path from 'path'
import {CleanWebpackPlugin} from "clean-webpack-plugin";
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const config: webpack.Configuration = {
    entry: './ts/index.ts',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, '..', 'assets','packed'),
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
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
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    // Creates `style` nodes from JS strings
                    // 'style-loader',
                    // // Translates CSS into CommonJS
                    'css-loader',
                    // // Compiles Sass to CSS
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