//注册时可增加邮箱验证，单个邮箱注册一次


var crypto = require('crypto');//Node.js 的一个核心模块，我们用它生成散列值来加密密码
var User = require('../models/user.js');
var Post = require('../models/post.js');
var fs = require('fs');

module.exports = function(app){
	app.get('/',function(req, res){
		Post.getAll(null,function(err,posts){
			if(err){
				posts = [];
			}
			res.render('index', { 
  		title:'主页',
  		user:req.session.user,
  		posts:posts,
  		success:req.flash('success').toString(),
  		error:req.flash('error').toString()
  	 	});//使用 ejs 模板引擎解析 views/index.ejs
		});
  	
		});
	
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req, res){
  	res.render('reg', { 
  		title: '注册',
  		user:req.session.user,
  		success:req.flash('success').toString(),
  		error:req.flash('error').toString()
  		});  	
		}
	);
	
	app.post('/reg',checkNotLogin);
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
  			req.flash('error','用户已存在！');
  			return res.redirect('/reg');
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
	
	app.get('/login',checkNotLogin);
	app.get('/login',function(req, res){
  	res.render('login', { 
  	title: '登陆',
  	user:req.session.user,
  	success:req.flash('success').toString(),
  	error:req.flash('error').toString()
  	 });
		}
	);
	
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		//加密密码，生成密码的md5值
		var md5 = crypto.createHash('md5');
  	var password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','用户不存在!');
				return res.redirect('/login');
			}
			//检查密码是否一致
			if(user.password != password){
				req.flash('error','密码错误！');
				return res.redirect('/login');
			}
			//验证成功，信息存入session
			req.session.user = user;
			req.flash('success','登陆成功！');
			res.redirect('/');
		})
	});
	
	app.get('/post',checkLogin);
	app.get('/post',function(req, res){
  	res.render('post', { 
  		title: '发表',
  		user:req.session.user,
  		success:req.flash('success').toString(),
  		error:req.flash('error').toString()
  		});
		});
		
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser = req.session.user;
		var post = new Post(currentUser.name,req.body.title,req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发表成功!');
			res.redirect('/');
			
		});
	
	});
	
	app.get('/logout',checkLogin);
	app.get('/logout',function(req, res){
  	req.session.user = null;
  	req.flash('success','退出成功');
  	res.redirect('/');
		});
	
	app.get('/upload',checkLogin);
	app.get('/upload',function(req, res){
  	res.render('upload', { 
  		title: '文件上传',
  		user:req.session.user,
  		success:req.flash('success').toString(),
  		error:req.flash('error').toString()
  		});
		});
		
	app.post('/upload',checkLogin);
	app.post('/upload',function(req,res){
		for(var i in req.files){
			if(req.files[i].size === 0){
				//使用同步的方式删除一个文件
				fs.unlinkSync(req.files[i].path);
				console.log('Successfully removed an empty file!');
			}else{
				var target_path = './public/images/' + req.files[i].name;
				//使用同步的方式重命名一个文件
			fs.renameSync(req.files[i].path,target_path);
			console.log('Successfully renamed a file!');
			}
		}
		req.flash('success','上传成功');
		res.redirect('/upload');
	})
	
	//处理访问用户页的请求，然后从数据库取得该用户的数据并渲染 user.ejs 模版，生成页面并显示给用户
	app.get('/u/:name',function(req,res){
		//检查用户是否存在
		User.get(req.params.name,function(err,user) {
			if(!user){
				req.flash('error','用户不存在！');
				return res.redirect('/');
			}
			//查询返回用户的所有文章
			Past.getAll(user.name,function(err,posts){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title: user.name,
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
					})
			})
		})
	})
	
	
	//文章页面
	app.get('/u/:name/:day/:title', function (req, res) {
  Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
    if (err) {
      req.flash('error', err); 
      return res.redirect('/');
    }
    res.render('article', {
      title: req.params.title,
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
	
	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','未登录');
			res.redirect('/login');
		}
		next();
	}
	
	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','已登录');
			res.redirect('back');
		}
		next();
	}
	
	
};

