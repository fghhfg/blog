var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name,title,post){
	this.name = name;
	this.title = title;
	this.post = post;
}

module.exports= Post;


//存储一篇文章及相关信息
Post.prototype.save = function(callback){
	var date = new Date();
	//各种时间格式，方便以后扩展
	var time = {
		date : date,
		year : date.getFullYear(),
		month : date.getFullYear() + "-" + (date.getMonth() + 1),
		day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()),
	};
	//要存入数据库的文档
	var post = {
		name : this.name,
		time : time,
		title : this.title,
		post : this.post,
		comments:[]
	};
	//打开数据库
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		//读取数据库
		db.collection('posts', function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//将文档插入posts集合
			collection.insert(post,{
				safe:true
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			})
			
		})
	})
}


//读取10篇文章
Post.getTen = function(name, page, callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if(name){
				query.name = name;
			}
			//使用count返回特定查询的文档数total
			collection.count(query, function(err, total){
					//根据query对象查询文章,返回前10个
				collection.find(query,{
					skip: (page - 1)*10,
					limit : 10
				}).sort({
					time : -1
			  }).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				//解析markdown为html
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null,docs,total);//成功，已数组形式返回查询结果
			})
			})
		})
	})
}
//获取一篇文章
Post.getOne = function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			//根据day,name,title对象查询文章
			collection.findOne({
				"name": name,
				"time.day":day,
				"title":title
			},function(err,doc){
					mongodb.close();
					if(err){
						return callback(err);
					}
					//解析markdown为html
					if(doc){
						doc.post = markdown.toHTML(doc.post);
						doc.comments.forEach(function(comment){
							comment.content = markdown.toHTML(comment.content);
						})
					}
					callback(null,doc);//成功，已数组形式返回查询结果
			})
		})
	})
}

//修改文章
Post.edit = function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			//根据day,name,title对象查询文章
			collection.findOne({
				"name": name,
				"time.day":day,
				"title":title
			},function(err,doc){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(null,doc);//成功，已数组形式返回查询结果
			})
		})
	})
}

//更新文章
Post.update = function(name, day, title, post, callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			//更新文章
			collection.update({
				"name": name,
				"time.day":day,
				"title":title
			},{
				$set: {post: post}
			},function(err){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(null);
			})
		})
	})
}


//删除文章
Post.remove = function(name, day, title, callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			//查找并删除文章
			collection.remove({
				"name": name,
				"time.day":day,
				"title":title
			},{
				w: 1
			},function(err){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(null);
			})
		})
	})
}

//返回所有文章的存档信息
Post.getArchive = function(callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//返回只包含name，time，title的文档
			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time: -1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			})
		})
	})
}
