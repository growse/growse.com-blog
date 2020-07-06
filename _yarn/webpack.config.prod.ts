import webpack = require("webpack");
import {merge} from 'webpack-merge'
import common from './webpack.config.common'
import TerserPlugin from "terser-webpack-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";

const config: webpack.Configuration = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin(), new OptimizeCssAssetsPlugin()],
    }
});

export default config;