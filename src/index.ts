import { parseComponent } from "./lib/parseComponent";
import { compileSanToTs } from "./lib/compileSanToTs";
import { callSanSsr } from "./lib/callSanSsr";
import { loadStyleModule } from "./style-processor";
import type { LoaderContext } from "webpack";
import type { SanSSRLoaderOptions, SFCDescriptor } from "./types/index";

export default function (
    this: LoaderContext<SanSSRLoaderOptions>,
    content: string,
) {
    const callback = this.async();
    const options = this.getOptions();

    try {
        // 解析查询参数
        const query = new URLSearchParams(this.resourceQuery.slice(1));

        // 如果是处理特定类型的块请求（如 style），直接返回相应的内容
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

        // 解析 SFC 结构
        const descriptor = parseComponent(content) as unknown as SFCDescriptor;

        // 处理 script 部分（编译 TypeScript）
        const tsRes = compileSanToTs(
            descriptor,
            this.resourcePath,
            this.rootContext,
            descriptor.template?.content,
            (err) => this.emitError(err),
        );

        const stylePromises = descriptor.styles.map(async (style, index) => {
            const moduleName =
                typeof style.module === "string" ? style.module : undefined;

            try {
                const styleResult = await loadStyleModule(
                    this,
                    moduleName || 'default',
                    style.lang || 'css',
                    index
                );

                return styleResult;
            } catch (error) {
                console.error('Failed to load style module:', error);
                // 如果加载失败，返回空样式
                return {
                    name: moduleName,
                    cssCode: '',
                    locals: {},
                };
            }
        });

        // 等待样式加载完成
        Promise.all(stylePromises)
            .then((styles) => {
                console.log('=== All Styles Processed ===');
                console.log(`  Total styles processed: ${styles.length}`);
                styles.forEach((result, index) => {
                    console.log(`  Style ${index} result: ${result.name}`);
                    console.log(`    CSS code length: ${result.cssCode.length}`);
                    console.log(`    Locals:`, result.locals);
                });

                // 调用 san-ssr 编译
                console.log('=== Calling San SSR ===');
                console.log('Styles array structure:', JSON.stringify(styles, null, 2));
                const jsRes = callSanSsr(
                    {
                        path: this.resourcePath,
                        content: tsRes,
                    },
                    styles,
                    this.rootContext,
                    options.sanSsrOptions || {},
                    (err) => this.emitError(err),
                    {
                        tsConfigPath: options.tsConfigPath,
                        appendRenderFunction: options.appendRenderFunction,
                    },
                );
                callback(null, jsRes);
            })
            .catch((err) => {
                callback(err);
            });
    } catch (err) {
        callback(err as Error);
    }
}
