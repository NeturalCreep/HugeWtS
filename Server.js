const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));//解析 x-www-form-urlencoded
app.use(bodyParser.json());//无法演示 解析json数据依赖于urlencoded模块 必须同时应用
app.all('*', (req, res, next) => {
  res.setHeader('Access-control-allow-origin', '*');
  next();
});
app.post('/Query', (req, res) => {
  var json;
  var data = '';
  console.log(req.body)
  for (var key in req.body) {
    if (req.body[key] !== '') {

      data += key + '=' + req.body[key];
    } else {

      data += key;
    }
  }

  try {
    console.log(data);
    json = JSON.parse(data);
  } catch (e) {
    console.log('解析数据失败！')
  }
  jwt.verify(json.token, "Mead", function (err, data) {
    if (!err) {
      let { user, password, exp } = data;

      connection = mysql.createConnection({
        host: 'localhost',
        user: user,
        password: password,
      });
      connection.query(json.cmd, function (error, results, fields) {
        if (error) {
          console.log('查询错误!');
          console.log(error);
          res.send('{"result":false,"DATA":null}');
        }

        res.send('{"result":true,"DATA":' + JSON.stringify(results) + '}');
      });
    }

  });
});
app.post('/Login', (req, res) => {
  var json;
  for (var key in req.body) {
    try {
      json = JSON.parse(key);
    } catch (e) {
      console.log('解析数据失败！')
    }
  }
  var connection;
  console.log(json);
  if (json.token == '' || json.token == null) {
    console.log('第一次登录验证')
    connection = mysql.createConnection({
      host: 'localhost',
      user: json.username,
      password: json.password,
    });
  } else {
    console.log('Token登陆验证');
    jwt.verify(json.token, "Mead", function (err, data) {

      if (err) {
        if (err.name == "TokenExpiredError") {
          console.log("Token过期")
        }
        res.send('{"result":false}');
      } else {
        let { user, password, exp } = data;

        connection = mysql.createConnection({
          host: 'localhost',
          user: user,
          password: password,
        })
      }
    });
  }
  if (connection != undefined) {
    console.log("连接数据库！");
    connection.connect((err) => {
      if (err) {
        console.log(err);
        res.send('{"result":false}');
      } else {
        let content = { user: json.username, password: json.password }; // 要生成token的主题信息
        let secretOrPrivateKey = "Mead" // 这是加密的key（密钥） 
        let token = jwt.sign(content, secretOrPrivateKey, {
          expiresIn: 60 * 60 * 24
        });
        res.send('{"result":true,"token":"' + token + '"}');
      }
    });
  }
  if (connection != undefined) {
    connection.end();
  }
});
app.listen(8081);
console.log('Server Running on Port: 8081')



// 时间戳转换日期
function timestampToTime (timestamp) {
  var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = date.getDate() + ' ';
  var h = date.getHours() + ':';
  var m = date.getMinutes() + ':';
  var s = date.getSeconds();
  return Y + M + D + h + m + s;
}
