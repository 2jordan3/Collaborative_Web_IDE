var fs = require('fs');
var mysql = require('mysql');
var http = require('http');
var express = require('express');
//var login = require('./login');
var process = require('child_process');
var url = require('url');
var querystring = require('querystring');
var ejs = require('ejs');
var nodemailer = require("nodemailer");

var exec = process.exec;

var client = mysql.createConnection({
	user: 'root',
	password: '',	//db password
	database: 'SIDE'
});

var app = express();
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	secret: 'secret key',
	key: 'account',
}));
app.use(app.router);
app.use(express.static('public'));


var server = http.createServer(app);
var tmp = null;
var file = null;

app.get('/index', function(request, response){
	fs.readFile('index.html','utf8', function(error, data){
		//response.send(data.toString());
		response.send(data);
	});
});

app.post('/index', function(request, response){
        var body = request.body;
	var chk = null;
	
	client.query('select * from members where id = ? or password = password(?)', [body.username, body.password],
		function(error, results, fields){
			if(error){
				console.log('Login error');
				throw error;
			}
			if(results.length > 0){
				console.log('Login Success');
				chk = 1;
			} else {
				console.log('Login Fail');
				chk = 0;
			}
		}
	);
	setTimeout(function(){
	if(chk === 1){
	
	request.session.username = body.username;
	request.session.password = body.password;

     	var io =  require('socket.io').listen(server);


	var seSock = io.of('/seS');
	
	var project=null;


	var flag=null;

			
        seSock.on('connection', function(socket){
		console.log("connection");

		socket.emit('session', { session: body.username });
		socket.on('project', function(data){

			project = data.project;
			file = data.file;

			exec("su - " + body.username + " -c 'mkdir " + data.project + "'");
		});
		socket.on('save', function(data){

			fs.writeFileSync("../../"+body.username+"/"+project+"/"+file+".c", data.data, "utf8");
			
 		var forked = process.fork("./fp.js");
        		forked.send({
				username: body.username,
                		project: project,
                		file: file
        	});

		});
		socket.on('loading', function(data){
			var l_username = data.load_data;
			var p_tmp;
			var f_tmp;
			client.query("SELECT title from project where id = ?", [l_username],function(error, results, fields){
				for(var i in results){
					p_tmp = results[i];
					client.query("select p_title, f_title from file where p_title = ?", [p_tmp.title], function(error, result, field){
						for(var j in result){
							f_tmp = result[j];
							console.log(f_tmp.p_title);
							console.log(f_tmp.f_title);
							socket.emit('load', {
								index: j,
								p_title: f_tmp.p_title,
								f_title: f_tmp.f_title
							});
						}
					});
				}
			});
	
		});
		socket.on('disconnect', function(){
			console.log('disconnect');
		});
       	});

	var forked = process.fork("./public/term/index2.js");
	forked.send({
		username: body.username
	});

	exec("cat /etc/passwd | grep "+body.username+" | cut -f3 -d':'",function(error, stdout, stderr){
        	console.log(stdout);
        	fs.writeFileSync("./public/term/test.txt", stdout, "utf8");
	});

	
	response.redirect('/side/'+body.username);


	}
	},2000);


});

app.get('/close', function(requset, response){
	fs.readFile('close.html', 'utf8', function(error, data){
		response.send(data);
	});
});

app.get('/side/:room', function(request, response){
	tmp = request.param('room');
	if(request.session.username){
		fs.readFile('side.ejs', 'utf8', function(error, data){
			fs.writeFileSync("chat.txt", request.session.username, "utf8");

			var chat_forked = process.fork("./chat.js");
			if(tmp == request.session.username){
 				chat_forked.send({
					room: tmp,
					check: 1
		        	});
				response.send(ejs.render(data, {
                                        check: '1',
					file: file,
					test: null
                                }));
			}
			else{
				chat_forked.send({
					room: tmp,
		                	check: 0
	        		});
				console.log(file);
				response.send(ejs.render(data, {
					check: '0',
					file: file,
					test: tmp
				}));
			}

			/*response.send(ejs.render(data, {
				room: tm/
		}));*/
	//response.send(data);
		});
	}else{
		response.redirect('/login');
	}
});

app.get('/login', function(request, response){
	fs.readFile('check_in.ejs', 'utf8', function(error, data){
		response.send(ejs.render(data, {
			room: tmp
		}));
	});
});

app.post('/login', function(request, response){
 	var body = request.body;
        var chk = null;
        
        client.query('select * from members where id = ? or password = password(?)', [body.username, body.password],
                function(error, results, fields){
                        if(error){
                                console.log('Login error');
                                throw error;
                        }
                        if(results.length > 0){
                                console.log('Login Success');
                                chk = 1;
                        } else {
                                console.log('Login Fail');
                                chk = 0;
                        }
                }
        );

	setTimeout(function(){
		request.session.username = body.username;
		request.session.password = body.password;

		if(chk === 1){
			response.redirect('/side/'+body.room);
		}
	}, 2000);
	
});


app.get('/account', function(request, response){
        fs.readFile('account.html','utf8', function(error, data){
                response.send(data);
        });
});

app.post('/account', function(request, response){
	var body = request.body;

	client.query("insert into members (username, email, password) values (?,?,password(?))", [body.username, body.email, body.password],
	function(){
		response.redirect('/close');
	});

	var useradd = ("sudo useradd -d /home/"+ body.username +" -m -s /bin/bash "+body.username);
	exec(useradd);

});

app.get('/mailing', function(request, response){
	fs.readFile('mailing.ejs', 'utf8', function(error, data){
		response.send(ejs.render(data, {
                        username: request.session.username
                }));
	});
});

app.post('/mailing', function(request, response){
	var body = request.body;
	var tomail = body.tomail;
	var subj = body.subj;
	var message = body.message;

	var smtpTransport = nodemailer.createTransport("iCloud",{
		auth: {
			user: "",	//email address
		        pass: ""	//password
    		}
	});

	var mailOptions = {
    		from: "", // sender address
    		to: tomail, // list of receivers
    		subject: subj, // Subject line
    		text: message, // plaintext body
	}

	smtpTransport.sendMail(mailOptions, function(error, response){
    		if(error){
        		console.log(error);
    		}else{
        		console.log("Message sent: " + response.message);
    		}

	});
	response.redirect('/close');
});

server.listen(52273, function(){
	console.log('Server Running');
});


