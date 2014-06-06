//注册时可增加邮箱验证，单个邮箱注册一次


var crypto = require('crypto');//Node.js 的一个核心模块，我们用它生成散列值来加密密码
var User = require('../models/user.js');

module.exports = function(app){
	app.get('/',function(req, res){
  	res.render('index', { 
  	title:'主页',
  	user:req.session.user,
  	success:req.flash('success').toString(),
  	error:req.flash('error').toString()
  	 });//使用 ejs 模板引擎解析 views/index.ejs
		});
	
	app.get('/reg',function(req, res){
  	res.render('reg', { 
  		title: '注册',
  		user:req.session.user,
  		success:req.flash('success').toString(),
  		error:req.flash('error').toString()
  		});  	
		}
	);
	app.post('/reg',function(req,res){
		var name = req.body.name;
  	var password = req.body.password;
  	var password_re = req.body['password-repeat'];
  	var email = req.body.email;
  	//检验两次密码是否一致
  	if(password_re != password){
  		req.flash('error','两次输入密码不一致！重新输入');
  		return res.redirect('/reg');//返回注册页
  	}
  	//生成密码的md5值
  	var md5 = crypto.createHash('md5');
  	var password = md5.update(req.body.password).digest('hex');
  	var newUser= new User({
  	name:name,
  	password:password,
  	email:email
  	});
  	//检验用户名是否存在
  	User.get(newUser.name,function(err,user){
  		if(user){
  			req.flash('error','用户已存在！')
  		}
  		//如果不存在则新增用户
  		newUser.save(function(err,user){
  			if(err){
  				req.flash('error',err);
  				return res.redirect('/reg');//注册失败返回
  			}
  			req.session.user = user;//用户信息存入session
  			req.flash('success','注册成功');
  			res.redirect('/');
  		});
  	});
	});
	
	app.get('/login',function(req, res){
  	res.render('login', { title: '登陆' });
		}
	);
	app.post('/login',function(req,res){
	
	});
	
	app.get('/post',function(req, res){
  	res.render('post', { title: '发表' });
		}
	);
	app.post('/post',function(req,res){
	
	});
	
	app.get('/logout',function(req, res){
  	
		});
	
	
};

