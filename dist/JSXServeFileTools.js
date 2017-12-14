"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var JSXServeFileTools;
(function (JSXServeFileTools) {
    JSXServeFileTools.parseJSXServeConfiguration = function (_configuration) {
        var parseJSXServeHandlerConfiguration = function (_hconfiguration) {
            if (!_hconfiguration.file) {
                throw new Error("Configuration Parsing Error: file is required");
            }
            if (!_hconfiguration.alias && _configuration.defaults.mode === "strict") {
                throw new Error("Configuration Parsing Error: alias is required in strict mode");
            }
            var supportedMethods = ["POST", "PUT", "GET", "DELETE"];
            if (_hconfiguration.method !== undefined && supportedMethods.indexOf(_hconfiguration.method) === -1) {
                throw new Error("Configuration Parsing Error: method is not supported");
            }
            return {
                file: _hconfiguration.file,
                alias: _hconfiguration.alias,
                method: _hconfiguration.method || "GET"
            };
        };
        return {
            defaults: {
                host: _configuration.defaults.host || "127.0.0.1",
                mode: _configuration.defaults.mode || "strict",
                port: _configuration.defaults.port || 8080,
            },
            handlers: (_configuration.handlers || []).map(parseJSXServeHandlerConfiguration)
        };
    };
    /**
     * get a list of the arguments of a function
     * @param {Function} fn function to extract the required arguments from
     */
    JSXServeFileTools.extractFunctionArguments = function (fn) {
        var argumentMatchArray = (fn.toString()
            .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, "")
            .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m));
        if (argumentMatchArray === null) {
            return [];
        }
        var unprocessedArgs = argumentMatchArray[1].split(/,/);
        // regex edge case: when no args are specified, the regex will
        // return an array with one element which is a empty string
        if (unprocessedArgs.length === 1 && unprocessedArgs[0] === "") {
            return [];
        }
        return unprocessedArgs;
    };
    /**
     * check if a filename ends with an allowed extname
     * @param {string[]} allowedExtnames list of extnames that are allowed
     */
    JSXServeFileTools.filterFilePathByExtname = function (allowedExtnames) {
        return function (file) {
            return allowedExtnames.indexOf(path.extname(file)) !== -1;
        };
    };
    /**
     * check if a path points to a file or a directory
     * @param {string} file path to a file or a directory
     */
    JSXServeFileTools.fileIsDirectory = function (file) {
        return fs.statSync(file).isDirectory();
    };
    /**
     * scan a directory for files recursively, returning a list of all files
     * @param {string} basePath directory path to start scanning for files
     * @param {string} relPath not required when calling manually - stores the offset from the
     * initial dir path
     */
    JSXServeFileTools.readDirRecursive = function (basePath, relPath) {
        if (relPath === void 0) { relPath = "/"; }
        var currentLevelDirPath = path.join(basePath, relPath);
        /**
         * recusively call readDirRecursive if the file argument
         * is a directory
         * @param {string} file filename
         */
        var conditionalRecursionMap = function (file) {
            var currentLevelRelativeFilePath = path.join(relPath, file);
            if (JSXServeFileTools.fileIsDirectory(path.join(currentLevelDirPath, file))) {
                return JSXServeFileTools.readDirRecursive(basePath, currentLevelRelativeFilePath);
            }
            return currentLevelRelativeFilePath;
        };
        /**
         * append an array or plain value to another array
         * @param {any[]} array list of already processed elements
         * @param {any | any[]} insertionVal value to append to the list of already processed elements
         */
        var reduceMultiDimensionalArray = function (array, insertionVal) {
            if (insertionVal instanceof Array) {
                return array.concat(insertionVal);
            }
            return array.concat([insertionVal]);
        };
        return fs.readdirSync(currentLevelDirPath)
            .map(conditionalRecursionMap)
            .reduce(reduceMultiDimensionalArray, []);
    };
    JSXServeFileTools.importViewDir = function (_folder, _config) {
        return JSXServeFileTools.readDirRecursive(_folder)
            .filter(JSXServeFileTools.filterFilePathByExtname([".js", ".jsx"]))
            .reduce(function (handlers, file) {
            var handlerConfiguration = _config.handlers.filter(function (f) { return f.file === file; })[0] || {};
            // filter out the handler as no configuration is found when strict-mode is enabled
            if (_config.defaults.mode === "strict" && Object.keys(handlerConfiguration).length === 0) {
                return handlers;
            }
            var targetFileImport = require(path.join(_folder, file));
            if (typeof targetFileImport !== "function") {
                return handlers;
            }
            var targetFileArguments = JSXServeFileTools.extractFunctionArguments(targetFileImport);
            var targetFileUrlPath = ((function (f) { return f[0] === "/" ? f.slice(1) : f; })(handlerConfiguration.alias || file))
                .split("/");
            return handlers.concat([{
                    file: file,
                    handler: targetFileImport,
                    args: targetFileArguments,
                    path: targetFileUrlPath,
                    method: handlerConfiguration.method || "GET"
                }]);
        }, []);
    };
})(JSXServeFileTools = exports.JSXServeFileTools || (exports.JSXServeFileTools = {}));

//# sourceMappingURL=JSXServeFileTools.js.map
