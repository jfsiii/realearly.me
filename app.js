// score is 1 - (your_id / total_users)
var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs')
    port = process.argv[2] || 32372;

http.createServer(function(request, response) {
    var parsed = url.parse(request.url), filename;
    //console.log('URL: ', request.url, parsed);

    if (request.url === '/') {
        filename = getViewPathname('index');
    }
    else {
        filename = getStaticPathname(parsed.pathname);
    }

    var query = getQueryStringArgs(parsed.query);
    var args = query || {};

    serveStatic(filename, query, request, response);

}).listen(parseInt(port, 10));

function getStaticPathname(pathname)
{
    return path.join(process.cwd(), pathname);
}

function getViewPathname(id)
{
    return path.join(process.cwd(), 'views', id + '.html');
}

function serveStatic(pathname, args, request, response)
{
    path.exists(pathname, function (exists) {
        if (!exists) {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('404 Not Found\n');
            response.end();
            return;
        }

        if (fs.statSync(pathname).isDirectory()) pathname += '/index.html';

        getFile(pathname, args, request, response)
    });
}

function getFile(pathname, args, request, response)
{

    fs.readFile(pathname, 'binary', function (err, file) {
        if (err) {
            response.writeHead(500, {'Content-Type': 'text/plain'});
            response.write(err + '\n');
            response.end();
            return;
        }

        response.writeHead(200);
        var html = applyTemplate(file.toString(), args);
        response.write(html);
        response.end();
    });
}

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

function applyTemplate(html, args)
{
    for (var key in args){
        html = html.replace('<!--% '+ key +' %-->', args[key]);
    }

    return html;
}
console.log('Static file server running at\n  => http://localhost:' + port + '/\nCTRL + C to shutdown');
