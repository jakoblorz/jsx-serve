#! /usr/bin/env node

const _projectRoot = process.cwd() || __dirname;
const _viewFolder = path.join(_projectRoot, process.argv[2] || "./views");
const _port = parseInt(process.argv[3] || process.env.PORT || "8080");
const _host = process.argv[4] || process.env.HOSTNAME || "localhost";

import { importViewDir, createServer } from "./index";

const views = importViewDir(_viewFolder);
const server = createServer(views).listen(_port, _host);