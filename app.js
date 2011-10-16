/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();

var http = require('http');
var url = require('url');

// Configuration

app.configure(function(){
    var RedisStore = require('connect-redis')(express);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "realearly.me is real late", store: new RedisStore }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    // disable layout
    app.set("view options", {layout: false});
    // make a custom html template
    app.register('.html', {
        compile: function(str, options){
            return function(locals){
                return str.replace(/<\!--%\s*(\w+)\s*%-->/g, function(tag, key, index, full){
                    return locals[key] || '';
                });
            };
        }
    });
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res){
    if (! req.session.screen_names) req.session.screen_names = {};
    var cache = req.session.screen_names;
    var parsed = url.parse(req.url);
    var query = getQueryStringArgs(parsed.query) || {};
    var screen_name = query.screen_name;
    if (screen_name){
        var key = screen_name.toLowerCase();
        var twitter = cache[key];
        if (twitter) {
            renderTwitter(res, twitter);
        }
        else {
            getTwitterInfo(screen_name, function (twitter){
                renderTwitter(res, cache[key] = twitter);
            });
        }
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
    if (query){
        query.split('&').forEach(function (pair) {
            var arr = pair.split('=');
            obj[arr[0]] = arr[1];
        });
    }

    return obj;
}

function renderTwitter(res, twitter){
    var args = {
        user_id: twitter.id,
        score: getScore(twitter.id),
        flag_position: getFlagPosition(twitter.created_at)
    };
    res.render('index.html', args);
}

function getTwitterInfo(screen_name, cb)
{
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
                catch (ex){}
                cb(twitter)
            })
        })
        .on('error', function(e) {
            console.log("Got error: " + e.message);
        })
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
