import webpack = require("webpack");
import TerserPlugin = require("terser-webpack-plugin");
import CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
import {merge} from 'webpack-merge'
import common from './webpack.config.common'

const config: webpack.Configuration = merge(common, {
    mode: 'production',
    optimization: {
        minimize: true,
        // minimizer: [`...`, new TerserPlugin({extractComments: false})],
    }
});

export default config;
