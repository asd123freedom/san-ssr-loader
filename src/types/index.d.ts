import {WebpackError} from 'webpack';

/**
 * San SSR Loader 配置选项
 */
export interface SanSSRLoaderOptions {
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

/**
 * 样式处理结果类型
 */
export interface StyleProcessResult {
  name: string;
  cssCode: string;
  locals?: Record<string, string>;
}

export interface SFCBlock {
    type: string;
    content: string;
    attrs: Record<string, string>;
    start?: number;
    end?: number;
    lang?: string;
    src?: string;
    scoped?: boolean;
    module?: string | boolean;
}

export interface SFCDescriptor {
    template: SFCBlock | undefined;
    script: SFCBlock | undefined;
    styles: SFCBlock[];
    customBlocks: SFCBlock[];
    errors: string[];
}

export interface ASTAttr {
    name: string;
    value: any;
    dynamic?: boolean;
    start?: number;
    end?: number;
};

export interface ExtractedCssResult {
    name?: string;
    cssCode: string;
    locals?: Record<string, string> | undefined;
}

export interface CompileTsOptions {
    tsFilePath: string;
    context: string;
    template?: string;
    reportError?: (err: WebpackError) => void;
}
