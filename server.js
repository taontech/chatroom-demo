var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var routes = require('./routes/index');
var users = require('./routes/users');
var PORT = 8080;
var app = express();
app.locals.title = '聊天室';
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// -- socket.io  start
var server = http.Server(app);
var io = require('socket.io').listen(server);
var roomUser = {};
var nameSockets = [];

io.on('connection', function (socket) {

    // 获取用户当前的url，从而截取出房间id
    var url = socket.request.headers.referer;
    var split_arr = url.split('/');
    var roomid = split_arr[split_arr.length-1] || 'index';
    var user = '';
    socket.on('join', function (username) {
         user = username;
        // 将用户归类到房间
        if (!roomUser[roomid]) {
            roomUser[roomid] = [];
        }
        if(!nameSockets[roomid])
        {
            nameSockets[roomid] = {};
        }
        nameSockets[roomid][user] = socket;

        roomUser[roomid].push(user);
        socket.join(roomid);
        socket.to(roomid).emit('sys', user + '加入了房间');
        socket.emit('sys',user + '加入了房间');

        var lists = '现在群中有：';
        for(var i = 0; i<roomUser[roomid].length; i++)
        {
            lists = lists + roomUser[roomid][i] +  ",";
        }
        socket.to(roomid).emit('listchange', lists);
        socket.emit('listchange', lists);

    });

    socket.on('message', function (msg) {
        // 验证如果用户不在房间内则不给发送
        if (roomUser[roomid].indexOf(user)< 0) {
            return false;
        }

        var msgarray = msg.split("");
        if(msgarray[0] === '*')
        {
            var toid = [];
            var tomsg = [];
            var nameDone = false;
           //  toid[0] = msg.split("")[1];
            for( var i = 1; i< msgarray.length; ++i )
            {
                if(msgarray[i] === " ")
                    nameDone = true;
                if( !nameDone )
                    toid.push(msgarray[i]);
                else
                    tomsg.push(msgarray[i]);
            }
            console.log(tomsg.join("")+"  "+toid.join(""));
            var ps = nameSockets[roomid][toid.join("")];
            if(ps)
            {
                ps.emit('private message', tomsg.join(""),user,"你");
                socket.emit('private message', tomsg.join(""),"你",toid.join(""));

            }
        }else if( msg === "/roll" )
        {
            var count = Math.random()*100;
            socket.to(roomid).emit('sys message', user+"  roll了"+ Math.floor(count)+"点","系统");
            socket.emit('sys message', user+"  roll了"+Math.floor(count)+"点","系统");
        }
        else
        {
            socket.to(roomid).emit('new message', msg,user);
            socket.emit('new message', msg,user);
        }

    });

    // 监听来自客户端的消息
    socket.on('list', function (msg) {
        var lists = '现在群中有：';
        for(var i = 0; i<roomUser[roomid].length; i++)
        {
            lists = lists + roomUser[roomid][i] +  ",";
        }
     //   socket.to(roomid).emit('listchange', lists);
        socket.emit('listchange', lists);
    });
    socket.on('roll', function (msg) {
        var lists = '现在群中有：';
        for(var i = 0; i<roomUser[roomid].length; i++)
        {
            lists = lists + roomUser[roomid][i] +  ",";
        }
        //   socket.to(roomid).emit('listchange', lists);
        socket.emit('listchange', lists);
    });
    // 关闭
    socket.on('disconnect', function () {
        // 从房间名单中移除
        socket.leave(roomid, function (err) {
            if (err) {
                log.error(err);
            } else {
                var index = roomUser[roomid].indexOf(user);
                if (index !== -1) {
                    roomUser[roomid].splice(index, 1);
                    socket.to(roomid).emit('sys',user+'退出了房间');
                } 
            }
        });
    });
});
// -- socket.io end
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

if (!module.parent) {
    // This server is socket server
    server.listen(PORT);
    console.log('chatroom started up on port '+PORT);
}
module.exports = server;
