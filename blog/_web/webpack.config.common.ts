import type { Configuration } from "webpack";
import * as path from "path";
import { fileURLToPath } from "url";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ImageminWebpWebpackPlugin from "imagemin-webp-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: Configuration = {
  entry: "./ts/index.ts",
  output: {
    filename: "[name].[fullhash].js",
    path: path.resolve(__dirname, "..", "assets"),
    assetModuleFilename: "[name].[hash][ext]",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({ filename: "css/[name].[fullhash].css" }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "img/",
          to: "img/",
          globOptions: {
            ignore: ["**/*.drawio"],
          },
        },
      ],
    }),
    new ImageminWebpWebpackPlugin({
      config: [
        {
          test: /\.(jpe?g|png)/,
          options: {
            quality: 75,
          },
        },
      ],
      overrideExtension: false,
      detailedLogs: false,
      silent: false,
      strict: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "esbuild-loader",
        options: { loader: "ts", target: "es2020" },
        exclude: /node_modules/,
      },
      {
        test: /critical\.scss$/i,
        use: [
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                loadPaths: ["node_modules"],
              },
            },
          },
        ],
        type: "asset/resource",
        generator: {
          filename: "[name].css",
        },
      },
      {
        test: /main\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "/assets/",
            },
          },
          "css-loader",
          "resolve-url-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sassOptions: {
                loadPaths: ["node_modules"],
              },
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  optimization: {
    runtimeChunk: "single",
  },
};

export default config;
