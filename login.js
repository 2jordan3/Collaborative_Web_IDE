var mysql = require('mysql');
var process = require('child_process');

var client = mysql.createConnection({
        user: '',	//mysql id
        password: '',	//mysql password
        database: 'SIDE'
});

client.connect();

var client_util = module.exports = {
	check_account:function(request, response){
		client.query(
			'select * from members where id = ? or password = password(?)', [request.username, request.password],
				function(error, results, fields){
					if(error){
						console.log('Login error');
						throw error;
					}
					if (results.length > 0) {
			                	console.log('Login Success');
                			} else {
						console.log('Login Fail');
					}
				}
		);
	}
};
	

