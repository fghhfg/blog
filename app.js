
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());//connect 内建的中间件，使用默认的 favicon 图标，如果想使用自己的图标，需改为 app.use(express.favicon(__dirname + '/public/images/favicon.ico'))
app.use(express.logger('dev'));//connect 内建的中间件，在开发环境下使用，在终端显示简单的日志
app.use(express.json());//解析json
app.use(express.urlencoded());
app.use(express.methodOverride());//connect 内建的中间件，可以协助处理 POST 请求，伪装 PUT、DELETE 和其他 HTTP 方法
app.use(app.router);//调解路由解析规则
app.use(express.static(path.join(__dirname, 'public')));//设置静态文件目录

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}//开发环境的错误处理，输出错误信息
//路由控制器

app.get('/users', user.list);

routes(app);//总的路由接口

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});//创建 http 服务器并监听 3000 端口，成功后在命令行中显示
