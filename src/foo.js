"use strict";
exports.__esModule = true;
exports.foo = void 0;
var axios_1 = require("axios");
console.error("YO");
var foo = function () {
    axios_1["default"].get("/foo");
};
exports.foo = foo;
