import webpack = require("webpack");
import {merge} from 'webpack-merge'
import common from './webpack.config.common'
import TerserPlugin from "terser-webpack-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";

const config: webpack.Configuration = merge(common, {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({extractComments: false}), new OptimizeCssAssetsPlugin()],
    }
});

export default config;
