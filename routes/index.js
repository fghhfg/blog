
/*
 * GET home page.
 */
module.exports = function(app){
	app.get('/',function(req, res){
  	res.render('index', { title: 'Express' });//使用 ejs 模板引擎解析 views/index.ejs
		}
	)
};

