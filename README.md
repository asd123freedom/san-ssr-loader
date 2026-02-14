# san-ssr-loader

webpack loader for san single-file components (SFC)

## Background

本仓库借鉴了 [san-ssr-plugin](https://github.com/searchfe/san-ssr-plugin) 的代码结构和功能实现，专门为 San 组件提供服务器端渲染支持。

## Installation

```bash
npm install san-ssr-loader --save-dev
```

## Usage

### webpack Configuration

```javascript
module.exports = {
    module: {
        rules: [
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
                                    esModule: true,
                                    modules: {
                                        exportLocalsConvention: "camelCaseOnly",
                                        namedExport: true,
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
                                    esModule: true,
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
                                    esModule: true,
                                    modules: {
                                        exportLocalsConvention: "camelCaseOnly",
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
                            {
                                loader: "css-loader",
                                options: {
                                    esModule: true,
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
                    loader: 'san-ssr-loader',
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
                                    esModule: true,
                                    modules: {
                                        exportLocalsConvention: "camelCaseOnly",
                                        namedExport: true,
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
                                    esModule: true,
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
                exclude: /(node_modules)/,
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
                exclude: /(node_modules)/,
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
                    esModule: true,
                    minimize: false,
                    sources: false,
                },
            },
        ],
    },
};
```

### San Single-File Component

```html
<template>
    <div class="{{ $style.container }}">
        <span class="{{ $style.text }}">This is a styled component</span>
    </div>
</template>

<script lang="ts">
    import { Component } from "san";

    export default class App extends Component {
        initData() {
            return {
                title: "Welcome to San SSR",
            };
        }
    }
</script>

<style module>
    .container {
        background-color: #f0f0f0;
        padding: 20px;
        border-radius: 8px;
    }

    .text {
        color: #333;
        font-size: 16px;
    }
</style>
```

### Rendering Component

```typescript
import App from "./App.san";

export function render(data: { [key: string]: any } = {}) {
    if (App.sanSSRRenders && App.sanSSRRenders.default) {
        return App.sanSSRRenders.default(data);
    } else {
        console.error("Component does not have sanSSRRenders property");
        return "";
    }
}
```

## 样式处理配置

### css-loader 配置说明

我们推荐使用以下 css-loader 配置以获得最佳体验：

```javascript
{
    loader: "css-loader",
    options: {
        esModule: true,
        modules: {
            exportLocalsConvention: "camelCaseOnly",
            namedExport: true,
        },
        sourceMap: true,
    },
}
```

**为什么选择 `esModule: true` 和 `namedExport: true`？**

1. **现代化模块系统支持**：输出符合 ES 模块规范的代码
2. **直接模块导入**：通过 `context.importModule` 可以直接获取模块导出对象
4. **更好的类型支持**：与 TypeScript 配合更友好

## Options

### tsConfigPath

Path to TypeScript configuration file (default: automatically finds tsconfig.json in parent directories)

### sanSsrOptions

Options for san-ssr compiler (see [san-ssr documentation](https://github.com/baidu/san-ssr))

### styleOptions

Options for style processing:

- `modules: boolean`: Enable CSS Modules by default (default: false)

### templateOptions

Options for template processing:

- `compileTemplate: string`: Template compiler type (aPack or babel, default: aPack)

### appendRenderFunction

Custom render function append content. Use this to override default style handling logic.

```typescript
type AppendRenderFunction = (
    styleId: string,
    css?: string,
    locals?: Record<string, string>,
    namedModuleCss?: Array<{
        name: string;
        css?: string;
        locals?: Record<string, string>;
    }>,
) => string;
```

## Features

- **TypeScript 支持**：完整支持 TypeScript 语法和类型检查
- **CSS Modules 支持**：内置对 CSS Modules 的支持，使用 `esModule: true` 和 `namedExport: true` 配置
- **样式预处理器支持**：支持 Less、SCSS 等预处理器
- **Webpack 深度集成**：完全融入 webpack 模块系统，支持 Tree Shaking 和代码优化
- **服务器端渲染**：生成可在服务器端渲染的组件
- **样式处理机制**：使用 webpack 5 的 `context.importModule` 直接导入模块
- **模板编译**：支持 aPack 和 babel 两种模板编译方式
- **调试友好**：支持 SourceMap 和调试工具集成

## Example

本项目包含一个完整的示例，展示如何使用 san-ssr-loader 进行开发和测试。

### 运行示例

1. 安装依赖：

    ```bash
    cd example
    npm install
    ```

2. 构建项目：

    ```bash
    npm run build
    ```

3. 运行示例：
    ```bash
    npm run dev
    ```

示例代码位于 `example/src/` 目录中，包含一个简单的 San 组件和测试文件。运行 `npm run dev` 会构建并运行该示例，输出渲染后的 HTML。
