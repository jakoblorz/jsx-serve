"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var url = require("url");
var JSXServeServerTools;
(function (JSXServeServerTools) {
    /**
     * creates a filter function to filter all views that are registered at
     * the url
     * @param {string[]} urlPathArray list of url sections (split by /)
     */
    JSXServeServerTools.matchViewToPath = function (urlPathArray) {
        return function (handler) {
            var handlerHasMatchingPathLengths = urlPathArray.length === handler.path.length;
            // find matching path section -> possibly heavy as long
            // paths could be filtered, thus in an own function
            // which is only being invoked when handlerHasMatchingPathLengths
            // is evaluated as true
            var findMatchingPathSections = function () {
                return urlPathArray.filter(function (currentPathSection, index) {
                    return handler.path[index] === currentPathSection;
                });
            };
            return handlerHasMatchingPathLengths && findMatchingPathSections()
                .length === urlPathArray.length;
        };
    };
    /**
     * check if an object is a Promise
     * @param val object to check
     */
    JSXServeServerTools.isObjectPromise = function (val) {
        return typeof val === "object" && !!val.then && typeof val.then === "function";
    };
    /**
     * create a new http.Server instance routing requests to the correct handlers
     * @param _handlers list of the handler which should be reachable by requests later
     */
    JSXServeServerTools.createServer = function (_handlers) {
        return http.createServer(function (request, response) {
            // request.url can be undefined, thus replace with "/" if needed
            var requestUrl = request.url || "/";
            // split the requestUrl by "/", but makes sure not to include the initial "/"
            // and not to include the query
            var requestUrlPathSections = requestUrl.slice(1, (function (index) {
                if (index !== -1) {
                    return index;
                }
                return undefined;
            })(requestUrl.indexOf("?"))).split("/");
            // search for a request handler which is hooked to the url of the request
            // and is featuring the correct HTTP method
            var requestMatchingHandler = _handlers
                .filter(JSXServeServerTools.matchViewToPath(requestUrlPathSections))
                .filter(function (handler) {
                return handler.method === request.method;
            })[0];
            // we might not have found any handler, which is the case
            // when the requestMatchingHandler is undefined
            if (requestMatchingHandler === undefined) {
                return response.end(JSON.stringify({ error: "no handler found" }));
            }
            // build a handler argument array populated with the arguments from the query
            var requestMatchingHandlerArguments = ((function (queryStringArguments) {
                if (Object.keys(queryStringArguments).length === requestMatchingHandler.args.length) {
                    return requestMatchingHandler.args.map(function (argument) {
                        return queryStringArguments[argument];
                    });
                }
            })(url.parse(requestUrl, true).query) || []).filter(function (argument) {
                return argument !== undefined;
            });
            // if no arguments are required, the array can be undefined; but if arguments are required
            // and the argument array is still undefined, not enought argument were prominent in the
            // request
            if (requestMatchingHandler.args.length !== requestMatchingHandlerArguments.length) {
                return response.end(JSON.stringify({ error: "not enought arguments provided" }));
            }
            ;
            // catch the returned value of the handler; this can be any value, even a Promise
            var requestMatchingHandlerResult = requestMatchingHandler.handler.apply(null, requestMatchingHandlerArguments);
            /**
             * send any string or buffer back to the requesting client, sends an error
             * if the result is not a string or buffer;
             * should only be invoked once
             * @param result object (optimally a string or buffer) to be sent
             */
            var sendRequestMatchingHandlerResult = function (result) {
                if (typeof result === "string" || Buffer.isBuffer(result)) {
                    return response.end(result);
                }
                return response.end(JSON.stringify({ error: "handler response not supported" }));
            };
            // if the result of the handler is a promise, await the result
            // and then send the result
            if (JSXServeServerTools.isObjectPromise(requestMatchingHandlerResult)) {
                return requestMatchingHandlerResult
                    .then(sendRequestMatchingHandlerResult)
                    .catch(sendRequestMatchingHandlerResult);
            }
            // the result of the handler was not a promise, respond immediately
            sendRequestMatchingHandlerResult(requestMatchingHandlerResult);
        });
    };
})(JSXServeServerTools = exports.JSXServeServerTools || (exports.JSXServeServerTools = {}));

//# sourceMappingURL=JSXServeServerTools.js.map
