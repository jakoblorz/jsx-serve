#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");
const yaml = require("js-yaml");

const importYamlConfigurationFromFile = function (file) {
    return yaml.safeLoad(fs.readFileSync(file));
};
module.exports.importYamlConfigurationFromFile = importYamlConfigurationFromFile;

const parseConfigurationFromObject = function (config) {
    
    if (!config.defaults) {
        config.defaults = {};
    }

    config.defaults = {
        port: config.defaults.port || 8080,
        host: config.defaults.host || "127.0.0.1",
        mode: config.defaults.mode || "strict" // there are 2 mode: non-strict and strict
    };

    config.handlers = (config.handlers || []).map(function (hconf) {
        if (!hconf.file) {
            throw new Error("Configuration Parsing Error: file is required");
        }

        if (!hconf.alias && config.defaults.mode === "strict") {
            throw new Error("Configuration Parsing Error: alias is required in strict mode");
        }

        const supportedMethods = ["POST", "PUT", "GET", "DELETE"];
        if (hconf.method !== undefined && supportedMethods.indexOf(hconf.method) === -1) {
            throw new Error("Configuration Parsing Error: method is not supported");
        }

        return {
            file: hconf.file,
            alias: hconf.alias,
            method: hconf.method || "GET"
        };
    });

    return config;
};
module.exports.parseConfigurationFromObject = parseConfigurationFromObject;

/**
 * check if a filename ends with an allowed extname
 * @param {string[]} allowedExtnames list of extnames that are allowed
 */
const filterFilePathByExtname = function (allowedExtnames) {
    return function (file) {
        return allowedExtnames.indexOf(path.extname(file)) !== -1;
    };
};

/**
 * check if a path points to a file or a directory
 * @param {string} file path to a file or a directory
 */
const fileIsDirectory = function (file) {
    return fs.statSync(file).isDirectory();
};

/**
 * scan a directory for files recursively, returning a list of all files 
 * @param {string} basePath directory path to start scanning for files
 * @param {string} relPath not required when calling manually - stores the offset from the
 * initial dir path
 */
const readDirRecursive = function (basePath, relPath = "/") {
    const currentLevelDirPath = path.join(basePath, relPath);

    /**
     * recusively call readDirRecursive if the file argument
     * is a directory
     * @param {string} file filename
     */
    const conditionalRecursionMap = function (file) {
        const currentLevelRelativeFilePath = path.join(relPath, file);

        if (fileIsDirectory(path.join(currentLevelDirPath, file))) {
            return readDirRecursive(basePath, currentLevelRelativeFilePath);
        }

        return currentLevelRelativeFilePath
    };

    /**
     * append an array or plain value to another array
     * @param {any[]} array list of already processed elements
     * @param {any | any[]} insertionVal value to append to the list of already processed elements
     */
    const reduceMultiDimensionalArray = function (array, insertionVal) {
        if (insertionVal instanceof Array) {
            return array.concat(insertionVal);
        }

        return array.concat([insertionVal]);
    };

    return fs.readdirSync(currentLevelDirPath)
        .map(conditionalRecursionMap)
        .reduce(reduceMultiDimensionalArray, []);
};

/**
 * get a list of the arguments of a function
 * @param {Function} fn function to extract the required arguments from
 */
const extractFunctionArguments = function (fn) {
    const unprocessedArgs = (fn.toString()
        .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, "")
        .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m))[1]
        .split(/,/);

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
const arrayConcatOperation = function (fn, argPosition = 0) {
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
const matchViewToPath = function (urlPathArray) {
    return function (view) {
        const viewPathHasMatchingLengths = urlPathArray.length === view.path.length;

        const findMatchingPathSections = function () {
            return urlPathArray.filter((currentPathSection, index) =>
                view.path[index] === currentPathSection);
        };

        return viewPathHasMatchingLengths && findMatchingPathSections().length ===
            urlPathArray.length;
    };
};

const isPromise = function (val) {
    return typeof val === "object" && !!val.then && typeof val.then === 'function';
}

const importViewDir = function (_folder, _config = { default: { mode: "non-strict"}, handlers: [] }) {
    return readDirRecursive(_folder)
        .filter(filterFilePathByExtname([".js", ".jsx"]))
        .reduce((handlers, file) => {
            
            const handlerConfiguration = _config.handlers.filter(f => f.file === file)[0] || {};

            // filter out the handler as no configuration is found when strict-mode is enabled
            if (_config.defaults.mode === "strict-mode" && Object.keys(handlerConfiguration).length === 0) {
                return handlers;
            }

            const targetFileImport = require(path.join(_folder, file));

            if (typeof targetFileImport !== "function") {
                return handlers;
            }

            const targetFileArguments = extractFunctionArguments(targetFileImport);
            const targetFileUrlPath = (((f) => f[0] === "/" ? f.slice(1) : f)(handlerConfiguration.alias || file))
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
module.exports.importViewDir = importViewDir;

const createServer = function (_views) {
    _views.forEach(v => console.log(v));
    return http.createServer((req, res) => {
        
        // prevent req.url === undefined errors
        req.url = req.url || "/";
    
        // create a splitted path-section array
        const urlFullQualifiedPathSections = req.url.slice(1, ((index) =>
            index === -1 ? undefined : index)(req.url.indexOf("?"))).split("/");
    
        // try to find a view that matches the url path-sections adn the method
        const view = _views.filter(matchViewToPath(urlFullQualifiedPathSections))
            .filter(v => v.method === req.method)[0];
    
        // return an error if no view was found
        if (view === undefined) {
            return res.end(JSON.stringify({ error: "no handler found" }));
        }
    
        // extract the arguments from the request's query, undefined if args are not
        // sufficient
        const args = ((queryArgs) => Object.keys(queryArgs).length === view.args.length ?
            view.args.map((arg) => queryArgs[arg]) : undefined)(url.parse(req.url, true).query);
    
        // if arguments are required but not sufficient, return an error
        if (args === undefined && view.args.length > 0) {
            return res.end(JSON.stringify({ error: "not enough arguments provided" }));
        }
    
        // invoke the handler method using the extracted arguments
        const possiblePromiseResponse = view.handler.apply(null, args);
    
        // if the result of the handler is a string or buffer the response is already here
        if (typeof possiblePromiseResponse === "string" || Buffer.isBuffer(possiblePromiseResponse)) {
            return res.end(possiblePromiseResponse);
        }
    
        if (isPromise(possiblePromiseResponse)) {
            return possiblePromiseResponse
                .then((result) => res.end(result))
                .catch((err) => res.end(JSON.stringify(err)));
        }
    
        res.end(JSON.stringify({ error: "handler response not supported" }));
    
    });
};
module.exports.createServer = createServer;

const createInstance = function (_port, _host) {
    let views = [];

    return {
        loadViewsFromDir: function (_viewDir) {
            views = views.concat(importViewDir(_viewDir));
        },
        listen: function (port, host) {
            createServer(views).listen(port || _port || 8080, host || _host || "localhost");
        }
    }
};
module.exports.createInstance = createInstance;
