import App from './App.san';

// 导出渲染函数
export function render(data: { [key: string]: any } = {}) {
    if (App.sanSSRRenders && App.sanSSRRenders.default) {
        return App.sanSSRRenders.default(data);
    } else {
        console.error('Component does not have sanSSRRenders property');
        return '';
    }
}

// 如果直接运行该文件，则测试渲染
if (require.main === module) {
    console.log('Rendering component:');
    const result = render({
        title: 'Welcome to San SSR',
        content: 'This is a server-side rendered component using San SSR',
    });
    console.log('Render result:', result);
}
