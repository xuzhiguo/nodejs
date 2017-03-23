var http = require('http');//引入http模块
var url = require('url'); //引入url模块
var fs = require('fs'); //引入文件系统模块
var mysql = require('mysql'); //引入mysql模块
var port = 9999; //端口号
var userID; //用户ID
var userName; //用户名


//客户构造函数  增删查改
function Client(){
	//创建连接
	this.doSomething = mysql.createConnection({
		host: 'localhost',
		user: 'xzg',
		password: '123',
		database: 'jzdb'
	});
	//进行连接
	this.doSomething.connect();
}

//查询
Client.prototype.query = function(table,col,callback) {
	this.doSomething.query('SELECT ' + col + ' FROM ' + table,function (err,data) {
		callback(err,data);
	});
}

//添加
Client.prototype.add = function(table,key,value,callback) {
	//INSERT INTO `tb_user` (`userID`, `userName`, `passWord`, `type`) VALUES ('10006', 'lvbu', '123', '1');
	this.doSomething.query('INSERT INTO ' + table + ' (' + key + ') VALUES (' + value + ')',function (err,data) {
		callback(err,data);
	});
}

//删除
Client.prototype.del = function(table,key,value,callback) {
	//DELETE FROM `tb_user` WHERE `tb_user`.`userID` = 'zhangfei'
	this.doSomething.query("DELETE FROM `"+table+"` WHERE `"+table+"`.`"+key+"` = '"+value+"'",function(err,data){
		callback(err,data);
	})
}

//修改
Client.prototype.upDate = function(table,pwd,key,callback) {
	//UPDATE `tb_user` SET `userID` = '470152', `userName` = 'zhangfei', `passWord` = '12324' WHERE `tb_user`.`userID` = 470153;
	this.doSomething.query("UPDATE `"+table+"` SET `passWord` = '"+pwd+"' WHERE `tb_user`.`userID` = 470153",function(err,data){
		callback(err,data);
	});
}


//实例化构造函数
var jz = new Client();


//创建服务器
http.createServer(function(req,res){
	//获取 路径 请求参数
	// params.pathname 路径
	// params.query 请求参数
	var params = url.parse(req.url, true);
	
	//写响应头  状态码200表示请求已成功
	res.writeHead(200,{
		'content-type': 'text/plain;charset=utf8',
		'Access-Control-Allow-Origin': '*'
	});
	
	//判断请求
	switch(params.pathname){
		case '/query':
			jz.query('tb_user','*',function(err,data){
				if(err){
					res.end(JSON.stringify(err));
				}
				res.end(JSON.stringify(data));
			});
		break;
		case '/add':
			//生成userID
			userID = randomID();
			console.log(params);
			jz.query('tb_user','*',function(err,oldData){
				if(err){
					res.end(JSON.stringify(err));
				}
				
				//先判断数据库是否有数据
				if(oldData){
					//是否存在该用户名
					var isRepeat = checkout(oldData,'userName',params.query.userName);
					if(isRepeat === 999) {
						res.end('该用户名已存在，请重新注册！');
					}else{
						checkout(oldData,'userID',userID);
						jz.add('tb_user',"`userID`, `userName`, `passWord`, `type`", "'"+userID+"'" + ", '"+params.query.userName+"', '"+params.query.passWord+"', '"+params.query.type+"'",function (err,success) {
							if(err){
								res.end(err.message);
							}
							res.end('增加成功！');
						});
					}
				}else{
					res.end();
				}
			});
		break;
		case '/delete':
			jz.query('tb_user','*',function(err,data){
				if(err){
					res.end(JSON.stringify(err));
				}
				
				//先判断数据库是否有数据
				if(data){
					//是否存在该用户名
					var isRepeat = checkout(data,'userName',params.query.userName);
					if(isRepeat !== 999){
						res.end(JSON.stringify('该用户不存在'));
					}else{
						jz.del('tb_user','userName',params.query.userName,function(err,data){
							if(err){
								res.end(err.message);
							}
							res.end('删除成功！');
						});
					}
				}
			});
		break;
		default:
		res.end('111111');
	}
	
}).listen(port,function(){
	console.log('打开服务器成功，请访问http://127.0.0.1:'+port);
});

//生成4位随机数 作为userID
function randomID (){
	var randomNum = ''; 
	for(var i=0;i<6;i++){
		var num = Math.floor(Math.random()*9);
		randomNum += num.toString();
	}
	return randomNum;
}

//查重的函数
function checkout(data,a,b){
	var result;
	//遍历数组  看是否存在
	data.forEach(function(item,idx){
		if(item[a] == b){
			if(a == 'userID'){
				//如果重复了，重新赋值
				b = randomID();
				//递归   重新检验
				result = check();
			}else if(a == 'userName'){
				result = 999;
			}
		}
	});
	return result;
}