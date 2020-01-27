import webpack = require("webpack");
import merge from 'webpack-merge'
import common from './webpack.config.common'

const config: webpack.Configuration = merge(common, {
    mode: 'production',
    devtool: 'source-map',
});

export default config;