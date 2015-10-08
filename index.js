"use strict";

var math = require("mathjs"),
    path = require("path"),
    url = require("url");

var Redis = require("ioredis");

function retryStrategy(attemts) {
    var delay = Math.min(attemts * 2, 2000);
    console.log("redis disconnected; retry after", delay);
    return delay;
}

function reconnectOnError(err) {
    var targetError = "READONLY";
    if (err.message.slice(0, targetError.length) === targetError) {
        // Only reconnect when the error starts with "READONLY"
        return true;
    } else {
        console.log("redis error; msg:", err);
    }
}

function _parse(netloc) {
    var uObj = url.parse("redis://" + netloc),
        auth = uObj.auth || "";
    return {
        host: uObj.hostname,
        port: uObj.port,
        password: auth.substring(auth.indexOf(":") + 1)
    };
}

function parse(netloc) {
    var parts = netloc.split(",");
    return parts.map(function(p) {
        return _parse(p);
    });
}

function parseRedisNetloc(redis_addr) {
    var single = "redis://",
        cluster = "cluster://",
        sentinel = "sentinel://";

    if (redis_addr.indexOf(cluster) === 0) {
        var _addr = redis_addr.substring(cluster.length);
        return {
            type: "cluster",
            startUpNodes: parse(_addr),
            options: {}
        };
    } else if (redis_addr.indexOf(sentinel) === 0) {
        var _addr = redis_addr.substring(sentinel.length);
        return {
            type: "sentinel",
            options: {
                sentinels: parse(path.dirname(_addr)),
                name: path.basename(_addr),
                retryStrategy: retryStrategy,
                reconnectOnError: reconnectOnError
            }
        };
    } else if (redis_addr.indexOf(single) === 0) {
        var _addr = redis_addr.substring(single.length),
            opt = _parse(_addr);
        return {
            type: "single",
            options: {
                host: opt.host,
                port: opt.port,
                password: opt.password,
                retryStrategy: retryStrategy
            }
        };
    } else {
        console.error("bad redis netloc: " + redis_addr);
        process.exit(1);
    }
}

/**
 * NewRedis
 * returns a redis connection object
 */
function NewRedis(redis_addr, tls) {
    if (redis_addr === undefined) {
        redis_addr = process.argv[3];
    }
    var net = parseRedisNetloc(redis_addr);
    net.options.tls = tls;
    if (net.type === "single") {
        return new Redis(net.options);
    }
    if (net.type === "cluster") {
        var r = new Redis.Cluster(net.startUpNodes, net.options);
        console.log("not fully supported - cluster:", net);
        process.exit(2);
        return r;
    }
    if (net.type === "sentinel") {
        var r = new Redis(net.options);
        console.log("not fully supported - sentinel:", net);
        process.exit(2);
        return r;
    }
}

module.exports = {
    NewStore: NewRedis,
}