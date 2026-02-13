/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./test/tmp/test-block-request.san?san=&type=style&index=0"
/*!*****************************************************************!*\
  !*** ./test/tmp/test-block-request.san?san=&type=style&index=0 ***!
  \*****************************************************************/
() {

throw new Error("Module parse failed: Unexpected token (2:0)\nFile was processed with these loaders:\n * ./src/index.ts\nYou may need an additional loader to handle the result of these loaders.\n| \n> .test {\n|   color: red;\n|   background: yellow;");

/***/ },

/***/ "./test/tmp/test-block-request.san?san=&type=style&index=1"
/*!*****************************************************************!*\
  !*** ./test/tmp/test-block-request.san?san=&type=style&index=1 ***!
  \*****************************************************************/
() {

throw new Error("Module parse failed: Unexpected token (2:0)\nFile was processed with these loaders:\n * ./src/index.ts\nYou may need an additional loader to handle the result of these loaders.\n| \n> .button {\n|   background: blue;\n|   color: white;");

/***/ },

/***/ "./test/tmp/block-request-entry.cjs"
/*!******************************************!*\
  !*** ./test/tmp/block-request-entry.cjs ***!
  \******************************************/
(module, __unused_webpack_exports, __webpack_require__) {

// CommonJS 版本的块请求测试入口文件
// 直接导入 style 块
const style0 = __webpack_require__(/*! ./test-block-request.san?san=&type=style&index=0 */ "./test/tmp/test-block-request.san?san=&type=style&index=0");
const style1 = __webpack_require__(/*! ./test-block-request.san?san=&type=style&index=1 */ "./test/tmp/test-block-request.san?san=&type=style&index=1");

console.log('Style 0:', style0);
console.log('Style 1:', style1);

module.exports = {
    style0,
    style1
};


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./test/tmp/block-request-entry.cjs");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map