# San-SSR Loader 实现方案

## 1. 架构设计

### 1.1 核心设计理念

**方案一：真正的 Loader 架构**

将 `.san` 文件的编译过程完全融入到 webpack 的模块系统中，让编译后的文件能够享受 webpack 的所有核心功能。

### 1.2 架构图

```
┌───────────────────────────────────────────────────────────┐
│                     webpack 模块系统                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │        san-ssr-loader（Normal 阶段）                 │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  1. 接收 .san 文件内容                               │  │
│  │  2. 解析 SFC 结构（template/script/style）           │  │
│  │  3. 编译 TypeScript 代码                            │  │
│  │  4. 调用 san-ssr 编译                               │  │
│  │  5. 返回可执行的 JavaScript 代码                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │        webpack 后续处理                             │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  - Tree Shaking                                      │  │
│  │  - 代码压缩                                          │  │
│  │  - 模块合并                                          │  │
│  │  - SourceMap 生成                                    │  │
│  │  - 等其他优化                                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  输出：符合 webpack 规范的 Bundle 文件                    │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

### 1.3 对比优势

| 特性 | 传统 Plugin 方案 | 新 Loader 方案 |
|------|----------------|---------------|
| **集成度** | 分离在 finishModules 钩子 | 完全融入模块系统 |
| **打包支持** | 无法打包 | 完全支持 Bundle 打包 |
| **Tree Shaking** | ❌ 不支持 | ✅ 支持 |
| **代码优化** | ❌ 不支持 | ✅ 支持压缩、优化 |
| **Module Resolution** | ❌ 独立解析 | ✅ 共享解析机制 |
| **SourceMap** | ❌ 无集成 | ✅ 完全集成 |
| **可导入性** | ❌ 直接导入有问题 | ✅ 正常 import/require |
| **二次编译** | ✅ 需要两次编译 | ❌ 单次编译 |
| **调试** | ❌ 困难 | ✅ 简单 |

## 2. 技术实现方案

### 2.1 核心接口设计

```typescript
interface SanSSRLoaderOptions {
  /**
   * tsconfig.json 文件路径
   */
  tsConfigPath?: string;

  /**
   * san-ssr 编译选项
   */
  sanSsrOptions?: {
    /**
     * 是否只编译 SSR 相关代码
     */
    ssrOnly?: boolean | ((filePath: string) => boolean);

    /**
     * 渲染函数名称
     */
    renderFunctionName?: string;

    /**
     * 其他 san-ssr 配置
     */
    [key: string]: any;
  };

  /**
   * 自定义渲染函数追加内容
   *
   * 用于覆盖默认的样式处理逻辑
   */
  appendRenderFunction?: (
    styleId: string,
    css?: string,
    locals?: Record<string, string>,
    namedModuleCss?: Array<{
      name: string;
      css?: string;
      locals?: Record<string, string>;
    }>
  ) => string;

  /**
   * 样式处理选项
   */
  styleOptions?: {
    /**
     * 是否启用 CSS Modules
     */
    modules?: boolean | string | {
      localIdentName?: string;
    };
  };

  /**
   * 模板处理选项
   */
  templateOptions?: {
    /**
     * 模板编译方式
     * - 'none'：不编译
     * - 'aNode'：编译为抽象节点
     * - 'aPack'：编译为打包格式
     */
    compileTemplate?: 'none' | 'aNode' | 'aPack';
  };
}
```

### 2.2 样式处理机制

#### 2.2.1 CSS 预处理和编译流程

新方案采用了与 webpack 模块系统深度集成的样式处理方式，确保了 CSS 预处理器的兼容性和处理流程的完整性。

```
┌─────────────────────────────────────────────────────────┐
│                      webpack 模块系统                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │        san-ssr-loader（Normal 阶段）               │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 1. 解析 .san 文件的 SFC 结构（template/script/style） │  │
│  │ 2. 处理 script 部分（编译 TypeScript）              │  │
│  │ 3. 为 style 部分生成 require 语句                   │  │
│  │ 4. 处理 template 部分（编译为 aNode 或 aPack）       │  │
│  │ 5. 调用 san-ssr 编译                               │  │
│  │ 6. 注入样式处理代码                               │  │
│  │ 7. 返回可执行的 JavaScript 代码                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  webpack 其他 loader 处理（less-loader、css-loader） │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │        webpack 后续处理                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 2.2.2 核心实现原理

```typescript
// 样式模块加载和解析
const stylePromises = styleResources.map(async (styleResource) => {
  return new Promise((resolve, reject) => {
    this.loadModule(styleResource.resource, (err, source, sourceMap, module) => {
      if (err) {
        reject(err);
        return;
      }

      // 解析 css-loader 输出的 JavaScript 代码
      const { locals, cssCode } = parseStyleModule(source);

      resolve({
        name: styleResource.name,
        locals,
        cssCode
      });
    });
  });
});

// 样式模块解析器
function parseStyleModule(source: string): {
  locals: Record<string, string>,
  cssCode: string
} {
  // 解析 css-loader 输出的代码，提取 ___CSS_LOADER_EXPORT___.locals 和 CSS 代码
  const localsMatch = source.match(
    /___CSS_LOADER_EXPORT___\.locals\s*=\s*({[\s\S]*?});/,
  );
  const cssMatch = source.match(
    /___CSS_LOADER_EXPORT___\.push\s*\[\s*module\.id\s*,\s*[`'"]([\s\S]*?)[`'"]\s*,/,
  );

  // css-loader 输出的代码中，___CSS_LOADER_EXPORT___.locals 对象的属性值可能使用反引号(`)
  // 而 JSON.parse 只能解析双引号(")包裹的字符串，因此需要将所有反引号替换为双引号
  const locals = localsMatch
    ? JSON.parse(localsMatch[1].replace(/`/g, '"'))
    : {};
  const cssCode = cssMatch ? cssMatch[1] : '';

  return {
    locals,
    cssCode
  };
}
```

#### 2.2.3 Loader 执行两次的机制

**为什么样式处理时 loader 会被执行两次？**

在样式处理过程中，`san-ssr-loader` 会被执行两次，这是设计上的有意为之：

```typescript
// src/index.ts - 两次执行的判断逻辑
const query = new URLSearchParams(this.resourceQuery.slice(1));

// 第二次执行：处理特定类型的块请求（如 style）
if (query.get('san') === '' && query.get('type')) {
    const descriptor = parseComponent(content) as unknown as SFCDescriptor;
    const type = query.get('type');
    const index = parseInt(query.get('index') || '0');

    if (type === 'style' && descriptor.styles[index]) {
        // 直接返回样式内容，不经过 webpack 解析链，避免循环依赖
        const styleContent = descriptor.styles[index].content;
        callback(null, styleContent);
        return;
    }
    // 对于其他类型的块，目前不支持直接返回
    callback(null, '');
    return;
}

// 第一次执行：正常解析 SFC 结构
const descriptor = parseComponent(content) as unknown as SFCDescriptor;
// ... 处理 script、template 等部分
```

**执行流程说明：**

1. **第一次执行**：
   - webpack 正常处理 `.san` 文件
   - 解析完整的 SFC 结构（template/script/style）
   - 处理 script 部分（编译 TypeScript）
   - 调用 `loadStyleModule` 函数加载样式模块

2. **第二次执行**：
   - 在 `loadStyleModule` 中，通过 `context.loadModule()` 方法再次加载相同资源
   - 但添加了 query 参数：`?san&type=style&index=0&lang=css&module=`
   - loader 再次被调用，但进入到专门处理 style 块的逻辑
   - 直接返回原始的样式内容，让 webpack 继续通过配置的 loader 链处理（如 less-loader、css-loader 等）

**这样设计的优势：**

- 确保样式能够通过完整的 webpack loader 链进行处理
- 避免了循环依赖问题
- 分离了 SFC 解析和样式处理的关注点
- 让样式处理与 webpack 的模块系统深度集成

#### 2.2.3 webpack 配置

```javascript
// 处理 .san 文件中的 style 标签
{
  resourceQuery: /type=style/,
  oneOf: [
    // 处理 CSS Modules
    {
      resourceQuery: /module/,
      use: [
        {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[name]_[local]_[hash:base64:5]'
            },
            esModule: false
          }
        },
        {
          loader: 'less-loader'
        }
      ]
    },
    // 处理普通样式
    {
      use: [
        {
          loader: 'css-loader',
          options: {
            esModule: false
          }
        },
        {
          loader: 'less-loader'
        }
      ]
    }
  ]
}
```

### 2.3 webpack 配置示例

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: {
    app: './src/ssr-entry.ts', // 主入口
    vendors: ['san'] // 第三方库
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2' // 导出为 CommonJS 模块
  },
  mode: 'production',
  target: 'node', // 目标是 Node.js 环境
  module: {
    rules: [
      {
        test: /\.san$/,
        use: [
          {
            loader: 'san-ssr-loader',
            options: {
              tsConfigPath: './tsconfig.ssr.json',
              sanSsrOptions: {
                ssrOnly: true
              },
              styleOptions: {
                modules: true
              },
              templateOptions: {
                compileTemplate: 'aPack'
              }
            }
          }
        ]
      },
      {
        test: /\.ts$/,
        use: 'babel-loader'
      },
      // 处理 .san 文件中的 style 标签
      {
        resourceQuery: /type=style/,
        oneOf: [
          // 处理 CSS Modules
          {
            resourceQuery: /module/,
            use: [
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: '[name]_[local]_[hash:base64:5]'
                  },
                  esModule: false
                }
              },
              {
                loader: 'less-loader'
              }
            ]
          },
          // 处理普通样式
          {
            use: [
              {
                loader: 'css-loader',
                options: {
                  esModule: false
                }
              },
              {
                loader: 'less-loader'
              }
            ]
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.san', '.json'],
    alias: {
      'san$': require.resolve('san')
    }
  },
  optimization: {
    minimize: true,
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

### 2.3 入口文件示例

```typescript
// src/ssr-entry.ts
import { createApp } from 'san-ssr';
import MyComponent from './components/MyComponent.san';

// 导出渲染函数
export function render(data: any) {
  const app = createApp();
  return app.renderToString(MyComponent, data);
}

// 导出组件供其他模块使用
export { MyComponent };

// 支持多个组件
import OtherComponent from './components/OtherComponent.san';
export { OtherComponent };
```

## 3. 测试用例设计

### 3.1 功能测试用例

#### 3.1.1 基础编译测试

**测试名称**：基础 .san 文件编译

**测试目标**：验证简单的 .san 文件能够正常编译

**测试样本**：
```html
<!-- samples/basic.san -->
<template>
    <div>{{ message }}</div>
</template>

<script lang="ts">
import { Component } from 'san';

export default class BasicComponent extends Component {
    initData() {
        return {
            message: 'Hello World'
        };
    }
}
</script>
```

**测试步骤**：
1. 使用 webpack 编译该文件
2. 检查输出的 bundle 中是否包含该组件
3. 在 Node.js 环境中 require 该组件并验证渲染

**期望结果**：
- 编译成功
- 组件导出正确
- 能够正常渲染

#### 3.1.2 TypeScript 支持测试

**测试名称**：TypeScript 语法验证

**测试目标**：验证 TypeScript 语法支持

**测试样本**：
```html
<!-- samples/ts-syntax.san -->
<template>
    <div>{{ info.title }}</div>
</template>

<script lang="ts">
import { Component } from 'san';

interface Info {
    title: string;
    description: string;
}

export default class TypeScriptComponent extends Component {
    initData() {
        const info: Info = {
            title: 'TypeScript Test',
            description: 'Test TypeScript support'
        };

        return { info };
    }
}
</script>
```

**测试步骤**：
1. 编译该文件
2. 验证编译过程无错误
3. 检查类型信息是否正确传递

**期望结果**：
- 编译成功，无语法错误
- 类型信息正确处理
- 组件能够正常渲染

#### 3.1.3 样式处理测试

**测试名称**：样式处理验证

**测试目标**：验证样式和 CSS Modules 支持

**测试样本**：
```html
<!-- samples/styles.san -->
<template>
    <div class="{{ $style.container }}">
        <span class="{{ $style.title }}">{{ title }}</span>
    </div>
</template>

<script lang="ts">
import { Component } from 'san';

export default class StyleComponent extends Component {
    initData() {
        return {
            title: 'Styled Component'
        };
    }
}
</script>

<style module>
.container {
    padding: 10px;
    background: #f5f5f5;
}

.title {
    color: #333;
    font-size: 18px;
}
</style>

<style module="tools">
.button {
    background: blue;
    color: white;
}
</style>
```

**测试步骤**：
1. 编译该文件
2. 检查输出中是否包含样式信息
3. 验证 $style 和 $tools 属性是否存在

**期望结果**：
- 样式代码正确注入
- $style 和 $tools 属性正确生成
- 支持多个 CSS Modules

#### 3.1.4 模板渲染测试

**测试名称**：模板渲染验证

**测试目标**：验证模板编译和渲染

**测试样本**：
```html
<!-- samples/render.san -->
<template>
    <div>
        <h1>{{ title }}</h1>
        <ul>
            <li s-for="item in list">{{ item }}</li>
        </ul>
        <p s-if="showMessage">显示消息</p>
        <p s-else>隐藏消息</p>
    </div>
</template>

<script lang="ts">
import { Component } from 'san';

export default class RenderComponent extends Component {
    initData() {
        return {
            title: 'Render Test',
            list: ['Item 1', 'Item 2', 'Item 3'],
            showMessage: true
        };
    }
}
</script>
```

**测试步骤**：
1. 编译该组件
2. 在 Node.js 中渲染该组件
3. 验证渲染结果

**期望结果**：
- 模板正确编译
- 渲染结果包含所有内容
- 条件渲染和循环渲染正确

#### 3.1.5 导入导出测试

**测试名称**：模块导入导出验证

**测试目标**：验证组件间的依赖关系

**测试样本**：
```html
<!-- samples/import-component.san -->
<template>
    <div>
        <h1>{{ title }}</h1>
        <comp />
    </div>
</template>

<script lang="ts">
import { Component } from 'san';
import Comp from './comp.san';

export default class ImportComponent extends Component {
    static components = {
        comp: Comp
    };

    initData() {
        return {
            title: 'Import Test'
        };
    }
}
</script>
```

```html
<!-- samples/comp.san -->
<template>
    <div>我是子组件</div>
</template>

<script lang="ts">
import { Component } from 'san';

export default class CompComponent extends Component {}
</script>
```

**测试步骤**：
1. 编译包含这两个组件的 bundle
2. 验证模块依赖关系
3. 渲染组件并验证结果

**期望结果**：
- 依赖解析正确
- 子组件能够正常导入
- 渲染结果包含子组件内容

### 3.2 边界条件测试

#### 3.2.1 无样式组件

**测试名称**：无样式组件测试

**测试目标**：验证无 style 标签的组件

**测试样本**：
```html
<!-- samples/no-style.san -->
<template>
    <div>No style component</div>
</template>

<script lang="ts">
import { Component } from 'san';

export default class NoStyleComponent extends Component {}
</script>
```

**期望结果**：
- 编译成功
- 输出中不包含样式相关代码

#### 3.2.2 无 script 组件

**测试名称**：无 script 组件测试

**测试目标**：验证无 script 标签的组件

**测试样本**：
```html
<!-- samples/no-script.san -->
<template>
    <div>No script component</div>
</template>
```

**期望结果**：
- 编译成功
- 生成默认的组件类

#### 3.2.3 无模板组件

**测试名称**：无模板组件测试

**测试目标**：验证无 template 标签的组件

**测试样本**：
```html
<!-- samples/no-template.san -->
<script lang="ts">
import { Component } from 'san';

export default class NoTemplateComponent extends Component {}
</script>
```

**期望结果**：
- 编译成功
- 生成空的渲染函数

#### 3.2.4 JavaScript 组件（禁止）

**测试名称**：非 TypeScript 组件测试

**测试目标**：验证对 JavaScript 组件的禁止

**测试样本**：
```html
<!-- samples/js-component.san -->
<template>
    <div>JavaScript Component</div>
</template>

<script>
import { Component } from 'san';

export default class JSComponent extends Component {}
</script>
```

**期望结果**：
- 编译失败
- 错误信息表明必须使用 TypeScript

### 3.3 性能测试

#### 3.3.1 编译速度测试

**测试名称**：大量组件编译速度

**测试目标**：验证编译时间是否在可接受范围内

**测试方法**：
1. 创建包含大量简单组件的项目
2. 使用 webpack 编译
3. 测量编译时间

**期望结果**：
- 编译时间与组件数量成线性关系
- 单个组件编译时间 < 100ms

#### 3.3.2 代码大小优化

**测试名称**：代码大小优化测试

**测试目标**：验证 webpack 的优化功能

**测试方法**：
1. 编译包含多个组件的项目
2. 检查代码是否有重复
3. 验证 Tree Shaking 是否生效

**期望结果**：
- 输出代码大小合理
- 无重复代码
- 未使用的代码已被消除

### 3.4 集成测试

#### 3.4.1 服务端渲染集成

**测试名称**：服务端渲染集成测试

**测试目标**：验证与服务端环境的集成

**测试样本**：
```javascript
// test/ssr-integration.test.ts
import { renderToString } from 'san-ssr';
import App from '../samples/app.san';

describe('SSR Integration', () => {
  test('Should render app correctly', async () => {
    const html = await renderToString(App, {
      title: 'SSR Test',
      content: 'This is server side rendered'
    });

    expect(html).toContain('SSR Test');
    expect(html).toContain('This is server side rendered');
  });

  test('Should handle data binding', async () => {
    const html = await renderToString(App, {
      title: 'Dynamic Content',
      content: 'This is dynamic'
    });

    expect(html).toContain('Dynamic Content');
    expect(html).toContain('This is dynamic');
  });
});
```

#### 3.4.2 错误处理测试

**测试名称**：错误处理验证

**测试目标**：验证错误处理机制

**测试方法**：
1. 创建包含语法错误的组件
2. 编译并捕获错误信息
3. 验证错误信息的准确性

**期望结果**：
- 错误信息准确
- 编译过程优雅失败
- 错误位置信息准确

## 4. 完成的测试用例

### 4.1 完整测试文件结构

```
test/
├── samples/
│   ├── basic.san                 # 基础组件
│   ├── ts-syntax.san             # TypeScript 语法
│   ├── styles.san                # 样式处理
│   ├── render.san                # 模板渲染
│   ├── import-component.san      # 导入导出
│   ├── comp.san                  # 子组件
│   ├── no-style.san              # 无样式组件
│   ├── no-script.san             # 无脚本组件
│   ├── no-template.san           # 无模板组件
│   ├── js-component.san          # JavaScript 组件（禁止）
│   └── app.san                   # 完整应用
├── integration/
│   ├── ssr.test.ts              # SSR 集成测试
│   └── webpack.test.ts          # webpack 集成测试
├── helpers/
│   ├── compiler.ts              # 编译器辅助函数
│   └── webpack.config.ts        # 测试配置
└── index.test.ts                # 主测试文件
```

### 4.2 测试实现

#### 4.2.1 编译器辅助函数

```typescript
// test/helpers/compiler.ts
import webpack from 'webpack';
import { Compiler, Configuration } from 'webpack';
import path from 'path';
import fs from 'fs';
import memfs from 'memfs';

export async function compiler(fixture: string, options: any = {}): Promise<{
  stats: webpack.Stats;
  outputContent: string;
}> {
  const entry = path.resolve(__dirname, '../samples/', fixture);

  const config: Configuration = {
    mode: 'development',
    entry,
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
      libraryTarget: 'commonjs2'
    },
    target: 'node',
    module: {
      rules: [
        {
          test: /\.san$/,
          use: [
            {
              loader: path.resolve(__dirname, '../../src/index.ts'),
              options
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.ts', '.san', '.json']
    }
  };

  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err);
      if (stats?.hasErrors()) reject(stats.compilation.errors);

      const outputPath = path.resolve(__dirname, 'bundle.js');
      const outputContent = fs.readFileSync(outputPath, 'utf-8');

      resolve({ stats, outputContent });
    });
  });
}
```

#### 4.2.2 主测试文件

```typescript
// test/index.test.ts
import { compiler } from './helpers/compiler';

describe('San SSR Loader', () => {
  describe('Basic Functionality', () => {
    test('Should compile simple component', async () => {
      const { stats, outputContent } = await compiler('basic.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('Hello World');
    });

    test('Should compile TypeScript component', async () => {
      const { stats, outputContent } = await compiler('ts-syntax.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('TypeScript Test');
    });

    test('Should handle styles and CSS Modules', async () => {
      const { stats, outputContent } = await compiler('styles.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toMatch(/data\['\$style'\]/);
      expect(outputContent).toMatch(/data\['\$tools'\]/);
    });

    test('Should handle template rendering', async () => {
      const { stats, outputContent } = await compiler('render.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('Item 1');
      expect(outputContent).toContain('Item 2');
      expect(outputContent).toContain('Item 3');
    });

    test('Should handle component imports', async () => {
      const { stats, outputContent } = await compiler('import-component.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('Import Test');
      expect(outputContent).toContain('我是子组件');
    });
  });

  describe('Edge Cases', () => {
    test('Should handle component without style', async () => {
      const { stats } = await compiler('no-style.san');

      expect(stats?.hasErrors()).toBe(false);
    });

    test('Should handle component without script', async () => {
      const { stats } = await compiler('no-script.san');

      expect(stats?.hasErrors()).toBe(false);
    });

    test('Should handle component without template', async () => {
      const { stats } = await compiler('no-template.san');

      expect(stats?.hasErrors()).toBe(false);
    });

    test('Should reject non-TypeScript component', async () => {
      await expect(compiler('js-component.san')).rejects.toThrow(
        '.san file must be written in TypeScript'
      );
    });
  });

  describe('Options', () => {
    test('Should respect appendRenderFunction option', async () => {
      const randomStr = Math.random().toString(32).slice(2);
      const { stats, outputContent } = await compiler('basic.san', {
        appendRenderFunction() {
          return `console.log('${randomStr}')`;
        }
      });

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent.includes(randomStr)).toBe(true);
    });

    test('Should use custom tsconfig path', async () => {
      const { stats } = await compiler('basic.san', {
        tsConfigPath: './tsconfig.custom.json'
      });

      expect(stats?.hasErrors()).toBe(false);
    });
  });
});
```

### 4.3 运行测试

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npx jest test/index.test.ts

# 运行特定测试组
npx jest test/index.test.ts -t "Basic Functionality"
```

## 5. 使用示例

### 5.1 简单示例

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.san$/,
        use: 'san-ssr-loader'
      }
    ]
  }
};
```

```typescript
// src/main.ts
import App from './app.san';
import { renderToString } from 'san-ssr';

const html = renderToString(App, {
  title: 'Hello San',
  message: 'Welcome to San SSR'
});

console.log('Rendered HTML:', html);
```

### 5.2 服务器部署

```javascript
// server.js
const http = require('http');
const { renderToString } = require('san-ssr');
const App = require('./dist/bundle').default;

http.createServer((req, res) => {
  const html = renderToString(App, {
    title: 'Server Rendered',
    url: req.url
  });

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server Rendered</title>
      </head>
      <body>${html}</body>
    </html>
  `);
}).listen(3000);

console.log('Server running at http://localhost:3000');
```

## 6. 总结

这个方案完全改变了之前的架构思路，将 `.san` 文件的编译过程完全融入到 webpack 的模块系统中，让编译后的文件能够享受 webpack 的所有核心功能。

**主要改进**：
- 支持 bundle 打包
- 支持 Tree Shaking
- 支持代码优化和压缩
- 支持 SourceMap 集成
- 简化了配置和调试
- 提高了编译性能

这个方案将使 San 组件的服务端渲染更加符合现代前端工程化的最佳实践。
