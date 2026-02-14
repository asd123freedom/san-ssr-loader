// 测试脚本来验证渲染效果
const { render } = require('./dist/bundle.js');

// 创建一个简单的渲染上下文
global.__COMPONENT_CONTEXT__ = {};

console.log('=== Testing Render Function ===');
try {
    const result = render({
        title: 'Test Title',
        content: 'Test Content'
    });

    console.log('Rendered HTML:');
    console.log(result);
    console.log('\n=== Rendering Complete ===');

    // 检查是否正确收集了 CSS
    console.log('\n=== Collected CSS ===');
    if (global.__COMPONENT_CONTEXT__) {
        const cssKeys = Object.keys(global.__COMPONENT_CONTEXT__);
        if (cssKeys.length > 0) {
            cssKeys.forEach(key => {
                console.log('CSS Style ID:', key);
                console.log(global.__COMPONENT_CONTEXT__[key]);
                console.log('');
            });
        } else {
            console.log('No CSS was collected!');
        }
    }
} catch (error) {
    console.error('Error during rendering:', error);
}
