import { IJSXServeHandlerConfiguration } from "./IJSXServeHandlerConfiguration";
import { IJSXServeConfiguration } from "./IJSXServeConfiguration";
import { IJSXServeHandlerObject } from "./IJSXServeHandlerObject";

import * as fs from "fs";
import * as path from "path";

export module JSXServeFileTools {
    
    export const parseJSXServeConfiguration = function (_configuration: any) {
    
        const parseJSXServeHandlerConfiguration = function (_hconfiguration: any) {
            if (!_hconfiguration.file) {
                throw new Error("Configuration Parsing Error: file is required");
            }
    
            if (!_hconfiguration.alias && _configuration.defaults.mode === "strict") {
                throw new Error("Configuration Parsing Error: alias is required in strict mode");
            }
    
            const supportedMethods = ["POST", "PUT", "GET", "DELETE"];
            if (_hconfiguration.method !== undefined && supportedMethods.indexOf(_hconfiguration.method) === -1) {
                throw new Error("Configuration Parsing Error: method is not supported");
            }
    
            return {
                file: _hconfiguration.file,
                alias: _hconfiguration.alias,
                method: _hconfiguration.method || "GET"
            } as IJSXServeHandlerConfiguration;
        };
    
        return {
            defaults: {
                host: _configuration.defaults.host || "127.0.0.1",
                mode: _configuration.defaults.mode || "strict",
                port: _configuration.defaults.port || 8080,
            },
            handlers: (_configuration.handlers || []).map(parseJSXServeHandlerConfiguration)
        } as IJSXServeConfiguration;
    };
    
    /**
     * get a list of the arguments of a function
     * @param {Function} fn function to extract the required arguments from
     */
    export const extractFunctionArguments = function (fn: () => void) {
    
        const argumentMatchArray: string[] | null = (fn.toString()
            .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, "")
            .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m));
    
        if (argumentMatchArray === null) {
            return [];
        }
    
        const unprocessedArgs = argumentMatchArray[1].split(/,/);
    
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
    export const filterFilePathByExtname = function (allowedExtnames: string[]) {
        return function (file: string) {
            return allowedExtnames.indexOf(path.extname(file)) !== -1;
        };
    };

    /**
     * check if a path points to a file or a directory
     * @param {string} file path to a file or a directory
     */
    export const fileIsDirectory = function (file: string) {
        return fs.statSync(file).isDirectory();
    };

    /**
     * scan a directory for files recursively, returning a list of all files 
     * @param {string} basePath directory path to start scanning for files
     * @param {string} relPath not required when calling manually - stores the offset from the
     * initial dir path
     */
    export const readDirRecursive = function (basePath: string, relPath: string = "/"): string[] {
        const currentLevelDirPath = path.join(basePath, relPath);

        /**
         * recusively call readDirRecursive if the file argument
         * is a directory
         * @param {string} file filename
         */
        const conditionalRecursionMap = function (file: string): string | string[] {
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
        const reduceMultiDimensionalArray = function (array: string[], insertionVal: string | string[]): string[] {
            if (insertionVal instanceof Array) {
                return array.concat(insertionVal);
            }

            return array.concat([insertionVal]);
        };

        return fs.readdirSync(currentLevelDirPath)
            .map<string | string[]>(conditionalRecursionMap)
            .reduce<string[]>(reduceMultiDimensionalArray, [] as string[]);
    };

    export const importViewDir = function (_folder: string, _config: IJSXServeConfiguration) {
        return readDirRecursive(_folder)
            .filter(filterFilePathByExtname([".js", ".jsx"]))
            .reduce((handlers, file) => {
                
                const handlerConfiguration = _config.handlers.filter(f => f.file === file)[0] || {};
    
                // filter out the handler as no configuration is found when strict-mode is enabled
                if (_config.defaults.mode === "strict" && Object.keys(handlerConfiguration).length === 0) {
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
                    method: (handlerConfiguration as IJSXServeHandlerConfiguration).method || "GET"
                }]);
            }, [] as IJSXServeHandlerObject[]);
    };
}
