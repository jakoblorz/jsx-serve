#! /usr/bin/env node
"use strict";

var _index = require("./index");

var _projectRoot = process.cwd() || __dirname;
var _viewFolder = path.join(_projectRoot, process.argv[2] || "./views");
var _port = parseInt(process.argv[3] || process.env.PORT || "8080");
var _host = process.argv[4] || process.env.HOSTNAME || "localhost";

var views = (0, _index.importViewDir)(_viewFolder);
var server = (0, _index.createServer)(views).listen(_port, _host);