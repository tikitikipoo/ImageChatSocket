
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , request = require("request")
  , http = require('http');

var app = express();

app.configure(function(){
  app.set('secretKey', 'yoursecretkey');
  app.set('cookieSessionKey', 'yourcookiesessionkey');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.locals.pretty = true;
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser(app.get('secretKey')));
  app.use(express.session({key : app.get('cookieSessionKey')}));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.configure('production', function(){
  app.set('port', 80);
});

app.get('/', routes.index);
app.get('/new_timeline', routes.new_timeline);
app.get('/past_timeline', routes.past_timeline);
app.post('/create', routes.create);

app.get("/livecamera", routes.livecamera);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//socket.ioのインスタンス作成
var io    = require('socket.io').listen(server),
    model = require('./model'),
    insertPost = model.insertPost;

//クライアントから接続があった時
io.sockets.on('connection',function(socket){
    //クライアントからmessageイベントが受信した時
    socket.on('message',function(data){
        //念のためdataの値が正しいかチェック
        if(data && typeof data.comment === 'string' &&
            typeof data.name === 'string' ){

            insertPost( data, function(err) {
                if ( err ) {
                    console.log(err);
                } else {

                    //メッセージを投げたクライアント以外全てのクライアントにメッセージを送信する。
                    socket.broadcast.json.emit('message',{
                        comment :data.comment,
                        name    :data.name,
                        date    :new Date,
                    });
                }
            });
        }
    });
});
