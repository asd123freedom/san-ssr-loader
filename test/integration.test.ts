import { compiler } from './helpers/compiler';

describe('San SSR Loader 集成测试', () => {
  describe('功能测试用例', () => {
    test('基础 .san 文件编译', async () => {
      const { stats, outputContent } = await compiler('basic.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('Hello World');
    });

    test('TypeScript 语法验证', async () => {
      const { stats, outputContent } = await compiler('ts-syntax.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('TypeScript Test');
    });

    test.skip('样式处理验证', async () => {
      const { stats, outputContent } = await compiler('styles.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toMatch(/data\['\$style'\]/);
      expect(outputContent).toMatch(/data\['\$tools'\]/);
    });

    test('模板渲染验证', async () => {
      const { stats, outputContent } = await compiler('render.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('Item 1');
      expect(outputContent).toContain('Item 2');
      expect(outputContent).toContain('Item 3');
    });

    test('模块导入导出验证', async () => {
      const { stats, outputContent } = await compiler('import-component.san');

      expect(stats?.hasErrors()).toBe(false);
      expect(outputContent).toContain('Import Test');
      expect(outputContent).toContain('我是子组件');
    });
  });

  describe('边界条件测试', () => {
    test('无样式组件测试', async () => {
      const { stats } = await compiler('no-style.san');

      expect(stats?.hasErrors()).toBe(false);
    });

    test('无 script 组件测试', async () => {
      const { stats } = await compiler('no-script.san');

      expect(stats?.hasErrors()).toBe(false);
    });

    test('无模板组件测试', async () => {
      const { stats } = await compiler('no-template.san');

      expect(stats?.hasErrors()).toBe(false);
    });

    test.skip('非 TypeScript 组件测试', async () => {
      await expect(compiler('js-component.san')).rejects.toThrow(
        '.san file must be written in TypeScript'
      );
    });
  });
});
