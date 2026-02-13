import SanLoaderPlugin from 'san-loader/lib/plugin';
import SanSSRPlugin from 'san-ssr-plugin';
const path = require('path');

const mode = 'production';

export default {
    entry: {
        pageOne: './examples/index.san',
        app: './examples/testaaa.ts',
    },
    output: {
        filename: 'bundle.plugin.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2',
        publicPath: 'https://www.baidu.com/',
        clean: true
    },
    mode,
    target: 'node',
    plugins: [
        new SanSSRPlugin({
            output: {
                path: 'js',
            }
        }),
        new SanLoaderPlugin(),
    ],
    resolve: {
        extensions: ['.js', '.ts', '.san', '.json'],
    },
    module: {
        rules: [
            {
                test: /\.san$/,
                use: {
                    loader: 'san-loader',
                    options: {
                        compileTemplate: 'aPack'
                    }
                }
            },
            {
                test: /\.svg$/,
                type: 'asset/resource'
            },
            {
                test: /.(less|css)$/,

                oneOf: [
                    // 这里匹配 `<style lang="less">`
                    {
                        use: [
                            {
                                loader: 'style-loader',
                            },
                            {
                                loader: 'css-loader',
                                options: {
                                    sourceMap: true,
                                },
                            },
                            {
                                loader: 'less-loader',
                                options: {
                                    sourceMap: true,
                                },
                            },
                        ],
                    },
                    // 这里匹配 `<style lang="less" module>`
                    {
                        resourceQuery: /module/,
                        use: [
                            'style-loader',
                            {
                                loader: 'css-loader',
                                options: {
                                    esModule: false,
                                    modules: {
                                        exportLocalsConvention: 'camelCase',
                                        namedExport: false,
                                    },
                                    sourceMap: true,
                                },
                            },
                            {
                                loader: 'less-loader',
                                options: {
                                    sourceMap: true,
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
                            [
                                '@babel/plugin-proposal-class-properties',
                            ],
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
                        presets: [
                            '@babel/preset-env',
                        ],
                        plugins: [
                            [
                                '@babel/plugin-proposal-class-properties',
                            ],
                        ],
                    },
                },
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                options: {
                    esModule: false,
                    minimize: false,
                    sources: false,
                }
            },
        ],
    },
};
