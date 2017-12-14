#! /usr/bin/env node

import { IJSXServeConfiguration } from "./IJSXServeConfiguration";
import { JSXServeFileTools } from "./JSXServeFileTools";
import { JSXServeServerTools } from "./JSXServeServerTools";

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const _handlerFolder = path.join(process.cwd() || __dirname, process.argv[2] || "./handlers");

let configuration: IJSXServeConfiguration = { 
    defaults: {
        host: "127.0.0.1",
        mode: "unstrict",
        port: 8080
    },
    handlers: []
};

try {
    const configurationFile = yaml.safeLoad(fs.readFileSync(
        path.join(process.cwd(), process.argv[3] || "./.serveconf.yaml")) as any as string);
    configuration = JSXServeFileTools.parseJSXServeConfiguration(configurationFile);
} catch (e) {
    console.error(e);
}

const handlers = JSXServeFileTools.importViewDir(_handlerFolder, configuration);
const server = JSXServeServerTools.createServer(handlers);

server.listen(configuration.defaults.port, configuration.defaults.host);