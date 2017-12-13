#! /usr/bin/env node

const path = require("path");

const _projectRoot = process.cwd() || __dirname;
const _viewFolder = path.join(_projectRoot, process.argv[2] || "./views");
/*
const _port = parseInt(process.argv[3] || process.env.PORT || "8080");
const _host = process.argv[4] || process.env.HOSTNAME || "localhost";
*/

const _lib = require("./index");

let configuration = { defaults: { mode: "non-strict", port: 8080, host: "127.0.0.1" }, handlers: [] };

try {
    const rawConfiguration = _lib.importYamlConfigurationFromFile(path.join(
        _viewFolder, process.argv[3] || "/.serveconf.yaml"));

    configuration = _lib.parseConfigurationFromObject(rawConfiguration);

    console.log(configuration);

} catch (e) {
    console.error(e);
}

const views = _lib.importViewDir(_viewFolder, configuration);
const server = _lib.createServer(views).listen(configuration.defaults.port, configuration.defaults.host);