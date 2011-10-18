/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();

var http = require('http');
var url = require('url');

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));

    app.cache = {screen_names: new Cache('screen_names')};

    app.set("view options", {layout: false});
    app.register('.html', {
        compile: function (str, options) {
            return function (locals) {
                return str.replace(/<\!--%\s*(\w+)\s*%-->/g, function (tag, key, index, full) {
                    return locals[key] || '';
                });
            };
        }
    });
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes

app.get('/', function (req, res) {
    var parsed = url.parse(req.url);
    var query = getQueryStringArgs(parsed.query) || {};
    var screen_name = query.screen_name;
    if (screen_name) {
        getTwitterInfo(screen_name, function (err, twitter) {
            // TODO: give *some* indication to user about the issue
            if (err) console.log("Got error: " + e.message);
            res.render('index.html', twitter);
        });
    }
    else {
        res.render('index.html', query);
    }
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

function getQueryStringArgs(query)
{
    var obj = {};
    if (query) {
        query.split('&').forEach(function (pair) {
            var arr = pair.split('=');
            obj[arr[0]] = arr[1];
        });
    }

    return obj;
}

function getTwitterInfo(screen_name, cb)
{
    var cache = app.cache.screen_names;
    var twitter = cache.get(screen_name);
    if (twitter) {
        cb(null, twitter);
    }
    else {
        console.log('hit twitter for', screen_name)
        var options = {
            host: 'twitter.com',
            path: '/users/show.json?screen_name=' + screen_name
        }
        var calls_left;

        http
            .get(options, function (response) {
                calls_left = parseInt(response.headers['x-ratelimit-remaining'], 10);
                console.log(calls_left, 'calls left');
                var json = '';
                response.on('data', function (data) { json += data });
                response.on('end', function () {
                    var twitter;
                    try {
                        twitter = JSON.parse(json);
                    }
                    catch (ex) {}
                    var args = twitter;
                    args.user_id = args.id;
                    args.score = getScore(args.id);
                    args.flag_position = getFlagPosition(args.created_at);
                    app.cache.screen_names.set(screen_name, args)
                    cb(null, args)
                })
            })
            .on('error', function (err) { cb(err) })
    }
}

function getScore(user_id)
{
    var your_place = parseInt(user_id, 10);
    var total_users = 400000000;
    var score = 100 * (1 - ( your_place / total_users ));

    return parseInt(score, 10);
}

function getFlagPosition(created_date)
{
    var twitter_start = new Date('3/1/06');
    var diff = new Date(created_date) - twitter_start;
    var chart_left = 86;
    var chart_width = 960 - chart_left;
    var total_days = (new Date() - twitter_start) / (1000 * 60 * 60 * 24);
    var per_day = chart_width / total_days;
    var days = diff / (1000 * 60 * 60 * 24)

    return (days * per_day) + chart_left;
}

function Cache(name)
{
    var RedisStore = require('connect-redis')(express);
    this._store = {};
}

Cache.prototype.key = function (str) {
    return str.toLowerCase();
}

Cache.prototype.get = function (key) {
    return this._store[ this.key(key) ];
}

Cache.prototype.set = function (key, value) {
    return this._store[ this.key(key) ] = value;
}