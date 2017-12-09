"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createInstance = exports.importViewDir = undefined;

var _index = require("./dist/index");

var createInstance = exports.createInstance = function createInstance(_port, _host) {

    let views = [];

    return {
        loadViewsFromDir: function (_viewDir) {
            views = views.concat(_index.importViewDir(_viewDir));
        },
        listen: function (port, host) {
            _index.createServer(views).listen(port || _port || 8080, host || _host || "localhost");
        }
    }
};

var importViewDir = exports.importViewDir = _index.importViewDir;
