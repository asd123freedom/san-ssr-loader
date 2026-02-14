import * as vueCompiler from 'vue-template-compiler';
import type {SFCDescriptor} from '../types/index';

/**
 * Parse a single-file component (*.san) file into an SFC Descriptor Object.
 * 使用 vue-template-compiler 内置的 parseComponent 方法，提供更稳定和完整的解析功能
 */
export function parseComponent(
    content: string,
    options: {[key: string]: any} = {}
): SFCDescriptor {
    return vueCompiler.parseComponent(content, options);
}