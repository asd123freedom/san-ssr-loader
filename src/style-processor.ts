import type { LoaderContext } from 'webpack';

/**
 * 样式处理结果类型
 */
export interface StyleProcessResult {
    name: string;
    cssCode: string;
    locals?: Record<string, string>;
}

export function loadStyleModule(
    context: LoaderContext<any>,
    moduleName: string,
    lang: string,
    index: number = 0,
): Promise<StyleProcessResult> {
    const queryParams = new URLSearchParams({
        san: '',
        type: 'style',
        index: index.toString(),
        lang: lang,
    });

    if (moduleName) {
        if (moduleName !== 'default') {
            queryParams.set('module', moduleName);
        } else {
            queryParams.set('module', '');
        }
    }

    const resource = `${context.resourcePath}?${queryParams.toString()}`;

    if (typeof context.importModule === 'function') {
        return new Promise((resolve, reject) => {
            context.importModule(resource).then((module: any) => {
                let cssCode = '';
                let locals: Record<string, string> = {};

                if (module.default) {
                    if (typeof module.default === 'object' && module.default.toString) {
                        try {
                            cssCode = module.default.toString();
                            if (cssCode.includes('Module') && !cssCode.includes('{')) {
                                cssCode = '';
                            }
                        } catch (e) {
                            console.error('Failed to call default.toString():', e);
                        }
                    } else if (typeof module.default === 'string' &&
                              module.default.includes('{') && module.default.includes('}')) {
                        cssCode = module.default;
                    }
                }

                Object.keys(module).forEach(key => {
                    if (key !== 'default') {
                        const value = module[key];
                        if (typeof value === 'string' && !value.includes('{') && !value.includes('}')) {
                            locals[key] = value;
                        }
                    }
                });

                resolve({
                    name: moduleName,
                    locals: locals,
                    cssCode: cssCode
                });
            }).catch((err: any) => {
                console.error('importModule failed:', err);
                reject(err);
            });
        });
    }

    return new Promise((resolve, reject) => {
        console.error('context.importModule is not available, this should not happen with webpack >= 5');
        resolve({
            name: moduleName,
            locals: {},
            cssCode: '',
        });
    });
}
