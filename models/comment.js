var mongodb = require('./db');

function Comment(name, day, title, comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback){
	var name = this.name;
	var day = this.day;
	var title = this.title;
	var comment = this.comment;
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//通过name，title，day查询，并插入评论
			collection.update({
				"name":name,
				"time.day":day,
				"title":title
			},{
				$push: {"comments": comment}
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
