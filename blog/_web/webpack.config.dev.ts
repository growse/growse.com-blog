import type { Configuration } from "webpack";
import { merge } from "webpack-merge";
import common from "./webpack.config.common.ts";

const config: Configuration = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
});

export default config;
