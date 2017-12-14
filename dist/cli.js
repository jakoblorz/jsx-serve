#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JSXServeFileTools_1 = require("./JSXServeFileTools");
var JSXServeServerTools_1 = require("./JSXServeServerTools");
var fs = require("fs");
var path = require("path");
var yaml = require("js-yaml");
var _handlerFolder = path.join(process.cwd() || __dirname, process.argv[2] || "./handlers");
var configuration = {
    defaults: {
        host: "127.0.0.1",
        mode: "unstrict",
        port: 8080
    },
    handlers: []
};
try {
    var configurationFile = yaml.safeLoad(fs.readFileSync(path.join(process.cwd(), process.argv[3] || "./.serveconf.yaml")));
    configuration = JSXServeFileTools_1.JSXServeFileTools.parseJSXServeConfiguration(configurationFile);
}
catch (e) {
    console.error(e);
}
var handlers = JSXServeFileTools_1.JSXServeFileTools.importViewDir(_handlerFolder, configuration);
var server = JSXServeServerTools_1.JSXServeServerTools.createServer(handlers);
server.listen(configuration.defaults.port, configuration.defaults.host);

//# sourceMappingURL=cli.js.map
