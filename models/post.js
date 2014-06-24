var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, head, title, tags, post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
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
		head : this.head,
		time : time,
		title : this.title,
		tags : this.tags,
		post : this.post,
		comments: [],
		reprint_info: {},
		pv:0
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
			},function(err, doc){
					if(err){
					mongodb.close();
						return callback(err);
					}
					
					if(doc){
					//访问一次，pv增加1
						collection.update({
							"name": name,
							"time.day": day,
							'title': title
						},{
							$inc: {"pv": 1}
						}, function(err){
							mongodb.close();
							if(err){
								return callback(err);
							}
						});
						//解析markdown为html
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
		
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			//根据day,name,title对象查询文章
			collection.findOne({
				"name": name,
				"time.day":day,
				"title":title
			}, function(err, doc){
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
	mongodb.open(function(err, db){
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
			}, function(err){
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
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
        var reprint_from = "";
        if (doc.reprint_info.reprint_from) {
          reprint_from = doc.reprint_info.reprint_from;
        }
        if (reprint_from != "") {
          //更新原文章所在文档的 reprint_to
          collection.update({
            "name": reprint_from.name,
            "time.day": reprint_from.day,
            "title": reprint_from.title
          }, {
            $pull: {
              "reprint_info.reprint_to": {
                "name": name,
                "day": day,
                "title": title
            }}
          }, function (err) {
            if (err) {
              mongodb.close();
              return callback(err);
            }
          });
        }

        //删除转载来的文章所在的文档
        collection.remove({
          "name": name,
          "time.day": day,
          "title": title
        }, {
          w: 1
        }, function (err) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null);
        });
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

//返回所有标签
Post.getTags = function(callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值
			collection.distinct("tags",function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			})
		})
	})
}

//返回特定存档的所有文章
Post.getTag = function(callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//查询所有 tags 数组内包含 tag 的文档
      //并返回只含有 name、time、title 组成的数组
			collection.find({
				"tags": tag
				},{
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

//关键词检索
Post.search = function(keyword, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp("^.*" + keyword + ".$","i");
			collection.find({
				"title":pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: 1
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

//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback){
	mongodb.open(function(err, db){
		if (err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//找到原文档
			collection.findOne({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, function(err, doc){
				if(err){
				mongodb.close();
				return callback(err);
				}
				var date = new Date();
				var time = {
					date : date,
					year : date.getFullYear(),
					month : date.getFullYear() + "-" + (date.getMonth() + 1),
					day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +date.getDate(),
					minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()),
				};
				delete doc._id;//删除原先的_id
				
				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/) > -1) ?doc.title: "转载" + doc.title;
				doc.comments = [];
				doc.reprint_info = {"reprint_from": reprint_from};
				doc.pv = 0;
				
				//更新被转载的文章的reprint_info内reprint_to
				collection.update({
					"name": reprint_from.name,
					"time.day": reprint_from.day,
					"title": reprint_from.title
				}, {
					$push: {
						"reprint_info.reprint_to":{
							"name": doc.name,
							"day": time.day,
							"title": doc.title
						}
					}
				}, function(err){
					if(err){
						mongodb.close();
						return callback(err);
					}
				});
				
				//将转载生成的副本修改后存入数据库，并返回文档
				collection.insert({
					safe: true
				}, function(err, post){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(err,post[0]);
				})
			})
		})
	})
}