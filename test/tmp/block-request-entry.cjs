// CommonJS 版本的块请求测试入口文件
// 直接导入 style 块
const style0 = require('./test-block-request.san?san=&type=style&index=0');
const style1 = require('./test-block-request.san?san=&type=style&index=1');

console.log('Style 0:', style0);
console.log('Style 1:', style1);

module.exports = {
    style0,
    style1
};
