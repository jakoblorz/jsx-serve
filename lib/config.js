const parseConfiguration = exports.parseConfiguration = function(config) {
    config.defaults = {
        port: config.defaults.port || 8080,
        host: config.defaults.host || "127.0.0.0.1",
        mode: config.defaults.mode || "strict"
    };

    config.handlers = (config.handlers || []).map(function (hconf) {
        if (!hconf.filename) {
            throw new Error("configuration parsing error: filename is required");
        }

        if (!hconf.alias && config.defaults.mode === "strict") {
            throw new Error("configuration parsing error: alias is required in strict mode");
        }

        return {
            filename: hconf.filename,
            alias: hconf.alias,
            methods: ((isArray) => isArray ? (hconf.methods || ["*"]) : [hconf.methods])
                ((hconf.methods || []) instanceof Array),
        }
    });

    return config;
};