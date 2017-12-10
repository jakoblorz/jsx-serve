const extractFunctionArguments = exports.extractFunctionArguments = function (fn) {
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

const createHandlerMatchingFilter = exports.createHandlerMatchingFilter = function (handlers) {
    return function (pathSectionArray) {
        return function (handler) {
            const hasMatchingPathLength = pathSectionArray.length === handler.path.length;

            const findMatchingPathSections = function () {
                return pathSectionArray.filter(function (currentPathSection, index) {
                    return handler.path[index] === currentPathSection
                });
            };

            return hasMatchingPathLength && findMatchingPathSections().length ===
                pathSectionArray.length;
        };
    };
};