// 直接导入块请求的测试入口
// 注意：这需要特殊的 webpack 配置来支持

// 直接导入 style 块
import style0 from './test-block-request.san?san=&type=style&index=0';
import style1 from './test-block-request.san?san=&type=style&index=1';

console.log('Style 0:', style0);
console.log('Style 1:', style1);

export { style0, style1 };
