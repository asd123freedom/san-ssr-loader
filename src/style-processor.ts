import type { LoaderContext } from 'webpack';

/**
 * 样式处理结果类型
 */
export interface StyleProcessResult {
    name: string;
    cssCode: string;
    locals?: Record<string, string>;
}

/**
 * 解析 style 标签内容并提取类名映射和 CSS 代码
 *
 * @param source css-loader 输出的 JavaScript 代码
 * @returns 包含类名映射和 CSS 代码的对象
 */
export function parseStyleModule(source: string): {
    locals: Record<string, string>;
    cssCode: string;
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
        cssCode,
    };
}

/**
 * 加载样式模块
 *
 * @param context webpack loader context
 * @param content 样式内容
 * @param moduleName 模块名称
 * @param lang 样式语言
 * @param index 样式块索引
 * @returns 样式处理结果
 */
export function loadStyleModule(
    context: LoaderContext<any>,
    moduleName: string,
    lang: string,
    index: number = 0,
): Promise<StyleProcessResult> {
    // 构建 style 资源的 query 参数，包含 san、lang、module 等信息
    const queryParams = new URLSearchParams({
        san: '',
        type: 'style',
        index: index.toString(),
        lang: lang,
    });

    // 只要有 module 属性，无论是否有名称，都需要添加 module 参数
    // 这样 webpack 配置就能正确匹配到启用 modules 选项的规则
    // 对于 default 模块，我们添加一个占位的 module 参数值，但不影响最终的变量名
    // 因为在 makeCustomRenderFunction 中会特殊处理 default 模块为 $style
    if (moduleName) {
        if (moduleName !== 'default') {
            queryParams.set('module', moduleName);
        } else {
            // 对于 default 模块，添加一个 module 参数，但值可以是空字符串
            queryParams.set('module', '');
        }
    }

    // 构建完整的资源路径，包含 query 参数
    const resource = `${context.resourcePath}?${queryParams.toString()}`;

    return new Promise((resolve, reject) => {
        context.loadModule(resource, (err, source) => {
            if (err) {
                reject(err);
                return;
            }

            // 解析 css-loader 输出的 JavaScript 代码
            const { locals, cssCode } = parseStyleModule(source as string);

            resolve({
                name: moduleName,
                locals,
                cssCode,
            });
        });
    });
}
