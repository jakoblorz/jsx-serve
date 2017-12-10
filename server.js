const http = require("http");
const url = require("url");
const { createHandlerMatchingFilter} = require("./lib/handlers");

const createServer = exports.createServer = function (_handlers) {
    const handlerMatchingFiler = createHandlerMatchingFilter(_handlers);

    return http.createServer((req, res) => {
        
        // prevent req.url === undefined errors
        req.url = req.url || "/";
    
        // create a splitted path-section array
        const urlFullQualifiedPathSections = req.url.slice(1, ((index) =>
            index === -1 ? undefined : index)(req.url.indexOf("?"))).split("/");
    
        // try to find a view that matches the url path-sections
        const handler = _handlers.filter(handlerMatchingFiler(urlFullQualifiedPathSections))[0];
    
        // return an error if no view was found
        if (handler === undefined) {
            return res.end(JSON.stringify({ error: "no handler found" }));
        }
    
        // extract the arguments from the request's query, undefined if args are not
        // sufficient
        const args = ((queryArgs) => Object.keys(queryArgs).length === handler.args.length ?
            handler.args.map((arg) => queryArgs[arg]) : undefined)(url.parse(req.url, true).query);
    
        // if arguments are required but not sufficient, return an error
        if (args === undefined && handler.args.length > 0) {
            return res.end(JSON.stringify({ error: "not enough arguments provided" }));
        }
    
        // invoke the handler method using the extracted arguments
        const possiblePromiseResponse = handler.handler.apply(null, args);
    
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