var http = require('http')
  , express = require('express')
  , mysql = require('mysql')
  , exec = require('child_process').exec;

var fs = require('fs');

var client = mysql.createConnection({
        user: 'root',
        password: 'wldnd1',
        database: 'SIDE'
});

process.on('message', function(msg){
	var pPath=null;
	var fPath=null;
	var cnt = 0;
	var count = 0;
	var file = msg.file+".c";
	fs.realpath('../../'+msg.username+'/'+msg.project, function(err, resolvedPath){
    		if(err){
        		throw err;
    		}
    		pPath=resolvedPath;
		console.log(resolvedPath);
	});
	var id = setInterval(function(){
		cnt ++;
		client.query("insert into project (id, title, path) values (?,?,?)", [msg.username, msg.project, pPath]);
		if(cnt == 1){ 
			clearInterval(id);
		}

	},2000);

	fs.realpath('../../'+msg.username+'/'+msg.project+'/'+msg.file+".c", function(err, resolvedPath){
	if(err){
                throw err;
        }
                fPath=resolvedPath;
		console.log(resolvedPath);
        });
	var iid = setInterval(function(){
                   count ++;

		   client.query("insert into file (id, p_title, f_title, path) values (?,?,?,?)", [msg.username, msg.project, file, fPath]);
	 if(count == 1){
                        clearInterval(iid);
                }
        },2000);
});

