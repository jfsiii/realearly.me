
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
    var parsed = url.parse(req.url);
    var query = getQueryStringArgs(parsed.query) || {};
    var args = query;
    if (query.screen_name){
        if (req.session.screen_names[query.screen_name]){
            res.render('index.html', req.session.screen_names[query.screen_name]);
        }
        else {
            getTwitterInfo(query.screen_name, function(twitter){
                req.session.screen_names[query.screen_name] = twitter;
                var args = twitter || {};
                res.render('index.html', args);
            });
        }
    }
    else {
        res.render('index.html', args);
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

function getTwitterInfo(screen_name, cb)
{
    console.log('info for', screen_name)
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
