
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  // disable layout
  app.set("view options", {layout: false});
  // make a custom html template
  app.register('.html', {
    compile: function(str, options){

      var tags = str.match(/<\!--%\s*\w+\s*%-->/g);
      console.log('tags?', tags);
      return function(locals){
        console.log(locals);
        return str.replace(/<\!--%\s*(\w+)\s*%-->/g, function(tag, key, index, full){
          return locals[key]
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
  res.render('index.html', {
    user_name: 'JFSIII',
    user_id: 12345
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
