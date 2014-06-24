process.on('message', function(msg){
	var username=null;
	var check=null;
	var room=null;
	var tmp;
	var tmp1;	

	check = msg.check;
	room = msg.room;

var express = require('express')
  , app = express()
  , http = require('http')
  , fs = require('fs')
  , ejs = require('ejs')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)


setTimeout(function(){
	if(check === 1){

		server.listen(52276);
	}
app.use(app.router);
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	fs.readFile('chat_index.html', 'utf8', function(error, data){
		if(error){
			console.log(error);
		}
		res.send(data);
		fs.readFile('chat.txt', 'utf8', function(error, data){
			username = data;
		});
	});
});
var usernames = [];

var rooms = [];

if(check ===1){
	rooms.push(room);
}

io.sockets.on('connection', function (socket) {
	socket.on('sendchat', function (data) {
		io.sockets.in(socket.room).emit('updatechat', username, data);
	});
	socket.username = username;
	if(check === 1){
		socket.room = room;
	}
	usernames[room] = username;
	socket.join(room);
	socket.emit('updatechat', 'SERVER', 'you have connected to '+username);
	socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
	socket.set('room', room);
	socket.on('draw', function(data){
		socket.get('room', function(error, room){
			io.sockets.in(room).emit('line', data);
		});
	});
	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
},1000);
});

