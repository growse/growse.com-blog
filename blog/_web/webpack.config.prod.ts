import type { Configuration } from "webpack";
import { merge } from "webpack-merge";
import common from "./webpack.config.common.ts";

const config: Configuration = merge(common, {
  mode: "production",
  optimization: {
    minimize: true,
  },
});

export default config;
