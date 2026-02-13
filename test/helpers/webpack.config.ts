import webpack from "webpack";
import path from "path";
import { fileURLToPath } from "url";
import type { SanSSRLoaderOptions } from "../../src/types";

// 使用 import.meta.url 来获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import tsNode from "ts-node";

// 配置 ts-node
// @ts-ignore
tsNode.register({
    compilerOptions: {
        module: "CommonJS",
        sourceMap: true,
        typeRoots: [
            path.resolve(__dirname, "../../node_modules/@types"),
            path.resolve(__dirname, "../../src/types"),
        ],
    },
    files: true,
    transpileOnly: false,
    project: path.resolve(__dirname, "../../tsconfig.json"),
    ignore: [/html-parser\.js/],
});

export function getConfig(
    fixture: string,
    options: Partial<SanSSRLoaderOptions> = {},
): webpack.Configuration {
    let entry: string;
    if (fixture.startsWith("tmp/")) {
        // 如果是 tmp/ 开头的路径，直接从当前目录解析
        entry = path.resolve(__dirname, "../", fixture);
    } else {
        // 否则从 samples/ 目录解析
        entry = path.resolve(__dirname, "../samples/", fixture);
    }

    return {
        mode: "production" as const,
        entry,
        output: {
            path: path.resolve(__dirname, "output"),
            filename: "bundle.js",
            libraryTarget: "commonjs2",
            clean: true,
        },
        target: "node",
        devtool: "source-map",
        resolveLoader: {
            extensions: [".ts", ".js"], // 允许 loader 自动补全 .ts 后缀
        },
        module: {
            rules: [
                {
                    test: /html-parser\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                            ],
                            plugins: [
                                "@babel/plugin-proposal-class-properties",
                            ],
                            sourceMaps: true,
                        },
                    },
                },
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-typescript",
                            ],
                            plugins: [
                                "@babel/plugin-proposal-class-properties",
                            ],
                            sourceMaps: true,
                        },
                    },
                },
                // 专门处理带有 type=style 参数的 .san 文件请求
                {
                    test: /\.san$/,
                    resourceQuery: /type=style/,
                    oneOf: [
                        // 匹配带有 module 属性的 style（无论 lang 是什么）
                        {
                            resourceQuery: /module.*lang=less|lang=less.*module/,
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        modules: {
                                            exportLocalsConvention: "camelCase",
                                            namedExport: false,
                                        },
                                        sourceMap: true,
                                    },
                                },
                                {
                                    loader: "less-loader",
                                    options: {
                                        sourceMap: true,
                                        lessOptions: {
                                            paths: [
                                                path.resolve(__dirname, "node_modules"),
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                        // 匹配不带有 module 属性但带有 lang=less 的 style
                        {
                            resourceQuery: /lang=less/,
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        sourceMap: true,
                                    },
                                },
                                {
                                    loader: "less-loader",
                                    options: {
                                        sourceMap: true,
                                        lessOptions: {
                                            paths: [
                                                path.resolve(__dirname, "node_modules"),
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                        // 匹配带有 module 属性的 style
                        {
                            resourceQuery: /module/,
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        modules: {
                                            exportLocalsConvention: "camelCase",
                                            namedExport: false,
                                        },
                                        sourceMap: true,
                                    },
                                },
                            ],
                        },
                        // 默认处理 CSS 样式（始终启用 modules）
                        {
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        sourceMap: true,
                                    },
                                }
                            ],
                        },
                    ],
                },
                // 处理 .san 文件，使用我们的 san-ssr-loader
                {
                    test: /\.san$/,
                    use: {
                        loader: path.resolve(__dirname, "../../src/index.ts"),
                        options,
                    },
                },
                // 处理其他样式文件
                {
                    test: /\.(less|css)$/,
                    oneOf: [
                        // 匹配带有 module 参数的样式文件（包括我们临时创建的）
                        {
                            resourceQuery: /module/,
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        modules: {
                                            exportLocalsConvention: "camelCase",
                                            namedExport: false,
                                        },
                                        sourceMap: true,
                                    },
                                },
                                {
                                    loader: "less-loader",
                                    options: {
                                        sourceMap: true,
                                        lessOptions: {
                                            paths: [
                                                path.resolve(
                                                    __dirname,
                                                    "node_modules",
                                                ),
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                        // 匹配普通样式文件
                        {
                            use: [
                                {
                                    loader: "css-loader",
                                    options: {
                                        esModule: false,
                                        sourceMap: true,
                                    },
                                },
                                {
                                    loader: "less-loader",
                                    options: {
                                        sourceMap: true,
                                        lessOptions: {
                                            paths: [
                                                path.resolve(
                                                    __dirname,
                                                    "node_modules",
                                                ),
                                            ],
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    test: /\.ts$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-typescript",
                            ],
                            plugins: [
                                ["@babel/plugin-proposal-class-properties"],
                            ],
                        },
                    },
                },
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                            plugins: [
                                ["@babel/plugin-proposal-class-properties"],
                            ],
                        },
                    },
                },
                {
                    test: /\.html$/,
                    loader: "html-loader",
                    options: {
                        esModule: false,
                        minimize: false,
                        sources: false,
                    },
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    type: "asset/inline",
                },
            ],
        },
        resolve: {
            extensions: [".js", ".ts", ".san", ".json"],
            modules: ["node_modules", path.resolve(__dirname, "../../src")],
            alias: {
                "@": path.resolve(__dirname, "../../src"),
            },
        },
        // 禁用一些 webpack 优化以便于测试
        optimization: {
            minimize: false,
            moduleIds: "named",
        },
        stats: {
            errorDetails: true,
        },
        externals: {
            // 外部化 san 依赖，避免打包到 bundle 中
            san: "san",
        },
    };
}
