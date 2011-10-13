var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 32372;

http.createServer(function(request, response) {
    
    var id, ext = '.html';
    switch(request.url){
    case '/':
        id = 'front-page'; break;
    default:
        id = 'unknown-page'; break;
    }

    var pathname = path.join(process.cwd(), 'views', id + ext);

    serveStatic(pathname, request, response);

}).listen(parseInt(port, 10));

function serveStatic(pathname, request, response){

    path.exists(pathname, function(exists) {
        if(!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            return;
        }
        
        if (fs.statSync(pathname).isDirectory()) pathname += '/index.html';

        getFile(pathname, request, response)
    });
}

function getFile(pathname, request, response){
    fs.readFile(pathname, "binary", function(err, file) {
        if(err) {        
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();
            return;
        }
        
        response.writeHead(200);
        response.write(file, "binary");
        response.end();
    });
}
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
