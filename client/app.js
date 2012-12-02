
/**
 * Module dependencies.
 */

var express = require('express')
  , client = require('./routes/client')
  , p2p = require('./routes/p2p')
  , http = require('http')
  , path = require('path');

var app = exports.app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', express.static(path.join(__dirname, 'public','index.html')));
app.post('/client/auth', client.auth);
app.get('/client/introduction', client.introduction);
app.post('/p2p/hello', p2p.hello);
app.get('/p2p/fetch', p2p.fetch);
app.get('/client/next', client.next);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
