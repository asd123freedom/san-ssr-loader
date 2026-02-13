import { compiler } from './helpers/compiler';

describe('Debug Styles', () => {
    test('Should include $style in output', async () => {
        const { stats, outputContent } = await compiler('styles.san');
        expect(stats?.hasErrors()).toBe(false);
        // 断言输出包含 $style 和 $tools
        expect(outputContent).toContain('$style');
        expect(outputContent).toContain('$tools');
    });
});
