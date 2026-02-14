import { compiler } from './helpers/compiler';

describe('Debug Styles', () => {
    test('Should include $style in output', async () => {
        const { stats, outputContent } = await compiler('styles.san');
        expect(stats?.hasErrors()).toBe(false);
        // 断言输出包含 $style 和 $tools
        expect(outputContent).toContain('$style');
        expect(outputContent).toContain('$tools');
    });

    test('Should collect and include complete CSS code in makeRender', async () => {
        const { stats, outputContent } = await compiler('styles.san');
        expect(stats?.hasErrors()).toBe(false);

        // 断言输出包含 makeRender 函数
        expect(outputContent).toContain('function makeRender(originRender)');

        // 检查是否有 CSS 样式内容（应该包含样式定义字符）
        // 由于 CSS 模块会哈希化类名，我们不能直接查找原始类名
        expect(outputContent).toContain('background');
        expect(outputContent).toContain('color');
        expect(outputContent).toContain('padding');

        // 检查是否包含实际的 CSS 规则格式
        // 匹配 CSS 规则格式：.class-name { property: value; }
        const cssRulePattern = /\.[a-zA-Z0-9_-]+\s*\{[\s\S]*?\}/;
        expect(outputContent).toMatch(cssRulePattern);

        console.log('✅ CSS code collection test passed!');
    });
});
