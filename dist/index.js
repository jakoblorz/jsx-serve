#! /usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createServer = exports.importViewDir = exports.isPromise = exports.matchViewToPath = exports.arrayConcatOperation = exports.extractFunctionArguments = exports.readDirRecursive = exports.fileIsDirectory = exports.filterFilePathByExtname = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _http = require("http");

var http = _interopRequireWildcard(_http);

var _url = require("url");

var url = _interopRequireWildcard(_url);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * check if a filename ends with an allowed extname
 * @param {string[]} allowedExtnames list of extnames that are allowed
 */
var filterFilePathByExtname = exports.filterFilePathByExtname = function filterFilePathByExtname(allowedExtnames) {
    return function (file) {
        return allowedExtnames.indexOf(path.extname(file)) !== -1;
    };
};

/**
 * check if a path points to a file or a directory
 * @param {string} file path to a file or a directory
 */
var fileIsDirectory = exports.fileIsDirectory = function fileIsDirectory(file) {
    return fs.statSync(file).isDirectory();
};

/**
 * scan a directory for files recursively, returning a list of all files 
 * @param {string} basePath directory path to start scanning for files
 * @param {string} relPath not required when calling manually - stores the offset from the
 * initial dir path
 */
var readDirRecursive = exports.readDirRecursive = function readDirRecursive(basePath) {
    var relPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/";

    var currentLevelDirPath = path.join(basePath, relPath);

    /**
     * recusively call readDirRecursive if the file argument
     * is a directory
     * @param {string} file filename
     */
    var conditionalRecursionMap = function conditionalRecursionMap(file) {
        var currentLevelRelativeFilePath = path.join(relPath, file);

        if (fileIsDirectory(path.join(currentLevelDirPath, file))) {
            return readDirRecursive(basePath, currentLevelRelativeFilePath);
        }

        return currentLevelRelativeFilePath;
    };

    /**
     * append an array or plain value to another array
     * @param {any[]} array list of already processed elements
     * @param {any | any[]} insertionVal value to append to the list of already processed elements
     */
    var reduceMultiDimensionalArray = function reduceMultiDimensionalArray(array, insertionVal) {
        if (insertionVal instanceof Array) {
            return array.concat(insertionVal);
        }

        return array.concat([insertionVal]);
    };

    return fs.readdirSync(currentLevelDirPath).map(conditionalRecursionMap).reduce(reduceMultiDimensionalArray, []);
};

/**
 * get a list of the arguments of a function
 * @param {Function} fn function to extract the required arguments from
 */
var extractFunctionArguments = exports.extractFunctionArguments = function extractFunctionArguments(fn) {
    var unprocessedArgs = fn.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, "").match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].split(/,/);

    // regex edge case: when no args are specified, the regex will
    // return an array with one element which is a empty string
    if (unprocessedArgs.length === 1 && unprocessedArgs[0] === "") {
        return [];
    }

    return unprocessedArgs;
};

/**
 * create an operation on an array which requires the first array value. The result will be
 * appended to the array
 * @param {Function} fn callback that is invoked using the invoked array element at position
 * 1 as first argument and full array as second argument
 * @param {number} argPosition specify the first arguments position on the input array
 */
var arrayConcatOperation = exports.arrayConcatOperation = function arrayConcatOperation(fn) {
    var argPosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    return function (array) {

        if (array.length > 0) {
            return array.concat([fn(array[argPosition], array)]);
        }

        return [];
    };
};

/**
 * creates a filter function to filter all views that are registered at
 * the url
 * @param {string[]} urlPathArray list of url sections (split be /)
 */
var matchViewToPath = exports.matchViewToPath = function matchViewToPath(urlPathArray) {
    return function (view) {
        var viewPathHasMatchingLengths = urlPathArray.length === view.path.length;

        var findMatchingPathSections = function findMatchingPathSections() {
            return urlPathArray.filter(function (currentPathSection, index) {
                return view.path[index] === currentPathSection;
            });
        };

        return viewPathHasMatchingLengths && findMatchingPathSections().length === urlPathArray.length;
    };
};

var isPromise = exports.isPromise = function isPromise(val) {
    return (typeof val === "undefined" ? "undefined" : _typeof(val)) === "object" && !!val.then && typeof val.then === 'function';
};

var importViewDir = exports.importViewDir = function importViewDir(_folder) {
    return readDirRecursive(_folder).filter(filterFilePathByExtname([".js", ".jsx"])).map(function (file) {
        return [file];
    }).map(arrayConcatOperation(function (file) {
        return require(path.join(_folder, file));
    }, 0)).filter(function (arr) {
        return typeof arr[1] === "function";
    }).map(arrayConcatOperation(function (fn) {
        return extractFunctionArguments(fn);
    }, 1)).map(arrayConcatOperation(function (file) {
        return (file[0] === "/" ? file.slice(1) : file).split("/");
    }, 0)).map(function (array) {
        return { file: array[0], handler: array[1], args: array[2], path: array[3] };
    });
};

var createServer = exports.createServer = function createServer(_views) {
    return http.createServer(function (req, res) {

        // prevent req.url === undefined errors
        req.url = req.url || "/";

        // create a splitted path-section array
        var urlFullQualifiedPathSections = req.url.slice(1, function (index) {
            return index === -1 ? undefined : index;
        }(req.url.indexOf("?"))).split("/");

        // try to find a view that matches the url path-sections
        var view = _views.filter(matchViewToPath(urlFullQualifiedPathSections))[0];

        // return an error if no view was found
        if (view === undefined) {
            return res.end(JSON.stringify({ error: "no handler found" }));
        }

        // extract the arguments from the request's query, undefined if args are not
        // sufficient
        var args = function (queryArgs) {
            return Object.keys(queryArgs).length === view.args.length ? view.args.map(function (arg) {
                return queryArgs[arg];
            }) : undefined;
        }(url.parse(req.url, true).query);

        // if arguments are required but not sufficient, return an error
        if (args === undefined && view.args.length > 0) {
            return res.end(JSON.stringify({ error: "not enough arguments provided" }));
        }

        // invoke the handler method using the extracted arguments
        var possiblePromiseResponse = view.handler.apply(null, args);

        // if the result of the handler is a string or buffer the response is already here
        if (typeof possiblePromiseResponse === "string" || Buffer.isBuffer(possiblePromiseResponse)) {
            return res.end(possiblePromiseResponse);
        }

        if (isPromise(possiblePromiseResponse)) {
            return possiblePromiseResponse.then(function (result) {
                return res.end(result);
            }).catch(function (err) {
                return res.end(JSON.stringify(err));
            });
        }

        res.end(JSON.stringify({ error: "handler response not supported" }));
    });
};