const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const mode = 'production';

module.exports = {
    entry: {
        app: './src/index.ts',
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2',
        clean: true,
    },
    devtool: 'source-map',
    mode,
    target: 'node',
    resolveLoader: {
        extensions: ['.ts', '.js'], // 允许 loader 自动补全 .ts 后缀
    },
    module: {
        rules: [
            {
                test: /html-parser\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                        ],
                        sourceMaps: true,
                    },
                },
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
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
                            // 不要使用 MiniCssExtractPlugin.loader，因为 SSR 需要 CSS 内容嵌入在 JS 中
                            {
                                loader: 'css-loader',
                                options: {
                                    esModule: true,
                                    modules: {
                                        localIdentName: '[local]-[hash:base64:8]',
                                        exportLocalsConvention: 'camelCaseOnly', // 为了兼容 namedExport: true
                                        namedExport: true,
                                    },
                                    sourceMap: true,
                                    exportType: 'string',
                                },
                            },
                            {
                                loader: 'less-loader',
                                options: {
                                    sourceMap: true,
                                    lessOptions: {
                                        paths: [
                                            path.resolve(__dirname, 'node_modules'),
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
                            // 不要使用 MiniCssExtractPlugin.loader，因为 SSR 需要 CSS 内容嵌入在 JS 中
                            {
                                loader: 'css-loader',
                                options: {
                                    esModule: true,
                                    sourceMap: true,
                                    exportType: 'string',
                                },
                            },
                            {
                                loader: 'less-loader',
                                options: {
                                    sourceMap: true,
                                    lessOptions: {
                                        paths: [
                                            path.resolve(__dirname, 'node_modules'),
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
                            // 不要使用 MiniCssExtractPlugin.loader，因为 SSR 需要 CSS 内容嵌入在 JS 中
                            {
                                loader: 'css-loader',
                                options: {
                                    esModule: true,
                                    modules: {
                                        exportLocalsConvention: 'camelCaseOnly',
                                        namedExport: true,
                                    },
                                    sourceMap: true,
                                },
                            },
                        ],
                    },
                    // 默认处理 CSS 样式
                    {
                        use: [
                            // 不要使用 MiniCssExtractPlugin.loader，因为 SSR 需要 CSS 内容嵌入在 JS 中
                            {
                                loader: 'css-loader',
                                options: {
                                    esModule: true,
                                    sourceMap: true,
                                    exportType: 'string',
                                },
                            },
                        ],
                    },
                ],
            },
            // 处理 .san 文件，使用我们的 san-ssr-loader
            {
                test: /\.san$/,
                use: {
                    loader: path.resolve(__dirname, '../dist/index.js'),
                    options: {
                        tsConfigPath: './tsconfig.json',
                        sanSsrOptions: {
                            ssrOnly: true,
                        },
                        styleOptions: {
                            modules: true,
                        },
                        templateOptions: {
                            compileTemplate: 'aPack',
                        },
                    },
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
                                loader: 'css-loader',
                                options: {
                                    esModule: true,
                                    modules: {
                                        exportLocalsConvention: 'camelCaseOnly',
                                        namedExport: true,
                                    },
                                    sourceMap: true,
                                },
                            },
                            {
                                loader: 'less-loader',
                                options: {
                                    sourceMap: true,
                                    lessOptions: {
                                        paths: [
                                            path.resolve(__dirname, 'node_modules'),
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                    // 匹配普通样式文件
                    {
                        use: [
                            MiniCssExtractPlugin.loader,
                            {
                                loader: 'css-loader',
                                options: {
                                    esModule: true,
                                    sourceMap: true,
                                    exportType: 'string',
                                },
                            },
                            {
                                loader: 'less-loader',
                                options: {
                                    sourceMap: true,
                                    lessOptions: {
                                        paths: [
                                            path.resolve(__dirname, 'node_modules'),
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
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            ['@babel/plugin-proposal-class-properties'],
                        ],
                    },
                },
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            ['@babel/plugin-proposal-class-properties'],
                        ],
                    },
                },
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                options: {
                    esModule: true,
                    minimize: false,
                    sources: false,
                },
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/inline',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.ts', '.san', '.json'],
        modules: ['node_modules', path.resolve(__dirname, '../src')],
        alias: {
            '@': path.resolve(__dirname, '../src'),
        },
    },
    // 禁用一些 webpack 优化以便于测试
    optimization: {
        minimize: false,
        moduleIds: 'named',
    },
    stats: {
        errorDetails: true,
    },
    externals: {
        // 外部化 san 依赖，避免打包到 bundle 中
        san: 'san',
    }
};
