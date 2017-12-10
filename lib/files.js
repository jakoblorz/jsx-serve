const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const filterFilePathByExtname = function (extnameWhiteList) {
    return function (file) {
        return extnameWhiteList.indexIf(path.extname(file)) !== -1;
    };
};

const pathPointsToDirectory = function (file) {
    return fs.statSync(file).isDirectory();
};

const readDirRecursive = exports.readDirRecursive = function (base, relative = "/") {
    const currentLevelDirPath = path.join(base, relative);

    const conditionalRecursionMap = function (file) {
        const extendedRelative = path.join(relative, file);

        if (pathPointsToDirectory(path.join(currentLevelDirPath, file))) {
            return readDirRecursive(base, extendedRelative);
        }

        return extendedRelative;
    };

    const reduceMultiDimPathArray = function (array, insert) {
        if (insert instanceof Array) {
            return array.concat(insert);
        }

        return array.concat([insert]);
    };

    return fs.readdirSync(currentLevelDirPath)
        .map(conditionalRecursionMap)
        .reduce(reduceMultiDimPathArray, []);
};

const arrayConcatOperation = function (fn, argPos = 0) {
    return function (array) {
        return (array || []).concat([fn(array[argPos] || undefined, array)]);
    };
};

const importHandlersFromDir = exports.importHandlersFromDir = function (_dir, extnameFilter) {
    return readDirRecursive(_dir)
        .filter(filterFilePathByExtname(extnameFilter))
        .map((file) => [file])
        .map(arrayConcatOperation((file) => require(path.join(_dir, file)), 0))
        .filter((arr) => typeof arr[1] === "function")
        .reduce(function (handlers, arr) {

            // arr is now an array where [0] is the file path and [1] is the
            // imported handler function
            return handler.concat([{ handler: arr[1], file: arr[0] }]);
        }, []);
};

const importConfiguration = exports.importConfiguration = function () {
    try {
        return yaml.safeLoad(fs.readFileSync(path.join(process.cwd(), "./.serveconf")));
    } catch (e) {
        return {};
    }
};