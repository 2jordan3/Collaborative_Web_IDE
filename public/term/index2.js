#!/usr/bin/env node

/**
 * term.js
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 */

var http = require('http')
  , express = require('express')
  , io = require('socket.io')
  , pty = require('pty.js')
  , terminal = require('term.js')
  , spawn = require('child_process').spawn
  , exec = require('child_process').exec;

var fs = require('fs');

/**
 * term.js
 */

//process.title = 'term.js';

process.title = 'user';

/**
 * Dump
 
*/

process.on('message', function(msg){

/*exec("./public/term/a.sh"+msg.username, {
	timeout : 0
	});*/



/*exec("cat /etc/passwd | grep "+msg.username+" | cut -f3 -d':'",function(error, stdout, stderr){
	console.log(stdout);
	fs.writeFileSync("./public/term/test.txt", stdout, "utf8");
});*/
var data = fs.readFileSync('./public/term/test.txt', 'utf8');
process.setuid(parseInt(data));


var stream;
if (process.argv[2] === '--dump') {
  stream = require('fs').createWriteStream(__dirname + '/dump.log');
}

/**
 * Open Terminal
 */

var buff = []
  , socket
  , term;

term = pty.fork(process.env.SHELL || 'sh', [], {
  name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'xterm',
  cols: 200,
  rows: 100,
  cwd: process.env.HOME
});

term.on('data', function(data) {
  if (stream) stream.write('OUT: ' + data + '\n-\n');
  return !socket
    ? buff.push(data)
    : socket.emit('data', data);
});

console.log(''
  + 'Created shell with pty master/slave'
  + ' pair (master: %d, pid: %d)',
  term.fd, term.pid);

/**
 * App & Server
 */

var app = express()
  , server = http.createServer(app);

app.use(function(req, res, next) {
  var setHeader = res.setHeader;
  res.setHeader = function(name) {
    switch (name) {
      case 'Cache-Control':
      case 'Last-Modified':
      case 'ETag':
        return;
    }
    return setHeader.apply(res, arguments);
  };
  next();
});
/*
app.use(express.basicAuth(function(user, pass, next) {
  if (user !== 'foo' || pass !== 'bar') {
    return next(true);
  }
  return next(null, user);
}));
*/
app.use(express.static(__dirname));
app.use(terminal.middleware());
/*
if (!~process.argv.indexOf('-n')) {
  server.on('connection', function(socket) {
    var address = socket.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1') {
      try {
        socket.destroy();
      } catch (e) {
        ;
      }
      console.log('Attempted connection from %s. Refused.', address);
    }
  });
}
*/
server.listen(52275);

/**
 * Sockets
 */

io = io.listen(server, {
  log: false
});

var termSock = io.of('/term');

termSock.on('connection', function(sock) {
  socket = sock;

  socket.on('data', function(data) {
    if (stream) stream.write('IN: ' + data + '\n-\n');
    term.write(data);
  });

  socket.on('disconnect', function() {
    socket = null;
  });

  while (buff.length) {
    socket.emit('data', buff.shift());
  }
});
});
