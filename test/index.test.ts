import { describe, test, expect } from "vitest";
import { compiler } from "./helpers/compiler";

describe("San SSR Loader", () => {
    describe("Basic Functionality", () => {
        test("Should compile simple component", async () => {
            const { stats, outputContent } = await compiler("basic.san");

            expect(stats?.hasErrors()).toBe(false);
            expect(outputContent).toContain("Hello World");
        });

        test("Should compile TypeScript component", async () => {
            const { stats, outputContent } = await compiler("ts-syntax.san");

            expect(stats?.hasErrors()).toBe(false);
            expect(outputContent).toContain("TypeScript Test");
        });

        test("Should handle styles and CSS Modules", async () => {
            const { stats, outputContent } = await compiler("styles.san");

            expect(stats?.hasErrors()).toBe(false);
            console.log(outputContent);
            expect(outputContent).toMatch(/\$style/);
            expect(outputContent).toMatch(/\$tools/);
        });

        test("Should handle template rendering", async () => {
            const { stats, outputContent } = await compiler("render.san");

            expect(stats?.hasErrors()).toBe(false);
            expect(outputContent).toContain("Item 1");
            expect(outputContent).toContain("Item 2");
            expect(outputContent).toContain("Item 3");
        });

        test("Should handle component imports", async () => {
            const { stats, outputContent } = await compiler(
                "import-component.san",
            );

            expect(stats?.hasErrors()).toBe(false);
            expect(outputContent).toContain("Import Test");
            expect(outputContent).toContain("我是子组件");
        });

        test("name module on style tag", async () => {
            const { stats, outputContent } = await compiler("index.san");

            expect(stats?.hasErrors()).toBe(false);

            expect(outputContent).toMatch(/data\['\$(style|tools1|tools2)'\]/g);
        });
    });

    describe("Edge Cases", () => {
        test("Should handle component without style", async () => {
            const { stats } = await compiler("no-style.san");

            expect(stats?.hasErrors()).toBe(false);
        });

        test("Should handle component without script", async () => {
            const { stats } = await compiler("no-script.san");

            expect(stats?.hasErrors()).toBe(false);
        });

        test("Should handle component without template", async () => {
            const { stats } = await compiler("no-template.san");

            expect(stats?.hasErrors()).toBe(false);
        });

        test.skip("Should reject non-TypeScript component", async () => {
            await expect(compiler("js-component.san")).rejects.toThrow(
                ".san file must be written in TypeScript",
            );
        });
    });

    describe("Options", () => {
        test("Should respect appendRenderFunction option", async () => {
            const randomStr = Math.random().toString(32).slice(2);
            const { stats, outputContent } = await compiler("basic.san", {
                appendRenderFunction() {
                    return `console.log('${randomStr}')`;
                },
            });

            expect(stats?.hasErrors()).toBe(false);
            expect(outputContent.includes(randomStr)).toBe(true);
        });

        test("Should handle non-existent tsconfig file", async () => {
            // 当 tsconfig 文件不存在时，loader 应该优雅地降级到默认配置而不是失败
            const { stats } = await compiler("basic.san", {
                tsConfigPath: "./non-existent-tsconfig.json",
            });

            expect(stats?.hasErrors()).toBe(false);
        });
    });

    describe("SSR Integration", () => {
        test("Should render component to HTML", async () => {
            const { stats, outputContent } = await compiler("basic.san");

            expect(stats?.hasErrors()).toBe(false);
            // 检查是否包含渲染相关的代码
            expect(outputContent).toContain("render");
        });
    });
});
