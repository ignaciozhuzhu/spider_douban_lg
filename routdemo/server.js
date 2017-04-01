var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/index.htm', function(req, res) {
  res.sendFile(__dirname + "/" + "index.htm");
})

app.get('/process_get', function(req, res) {



    var request = require("request");
    var cheerio = require("cheerio");
    var eventproxy = require('eventproxy');
    var ep = new eventproxy();
    var fs = require('fs');

    var pageNum = 1,
      requestOpts = [];

    var topicUrls = [];
    for (var i = 0; i < 5; i++) {
      topicUrls.push(
          'https://www.douban.com/group/467221/' + 'discussion?start=' + i * 25) //杭州租房（出租、求租、合租）
    }
    /* 'https://www.douban.com/group/145219/', //杭州 出租 租房 中介免入
     'https://www.douban.com/group/551531/', //☀杭州租房大全
     'https://www.douban.com/group/hzhouse/', //杭州租房小组*/
    //];
    var aa = [];

    initRequestOpt(topicUrls, requestOpts, pageNum);


    console.log('=======  start fetch  =======');
    fetchData(
      ['滨江'], [],
      function(err, results) {
        if (err) {
          console.log('err', err);
        } else {
          if (results.length == 0) {
            console.log("无结果");
            res.end("无结果");
          }
          fs.writeFile('giveme5.json', JSON.stringify(results, null, 2));
        }
      }
    );

    /**
     * 爬取数据主程序
     * @param:
     *    includeWords: <array>标题中需要包含的关键词数组
     *    excludeWords：<array>标题中需要排除的关键词数组
     */
    function fetchData(includeWords, excludeWords, cb) {
      // 爬取各页数据
      ep.after('topic_titles', pageNum, function(topics) {
        // topics 是个数组，包含了 n次 ep.emit(event, cbData) 中的cbData所组成的数组
        // 由于在event中已经是数组，所以这里得到的是数组的数组，下面处理可以摊平它
        var results = topics.reduce(function(pre, next) {
          return pre.concat(next);
        });
        cb(null, results);
      });

      requestOpts.forEach(function(opt) {
        request(opt, function(error, response, body) {
          if (error) {
            return cb(error);
          }
          var $ = cheerio.load(body, {
            normalizeWhitespace: true,
            decodeEntities: false
          });
          var items = [];
          $('.olt tr').slice(1).each(function(index, el) {
            var title = $('.title > a', el).attr('title');
            if (checkIncludeWords(title, includeWords) && checkExcludeWords(title, excludeWords)) {
              var item = {
                title: title,
                href: $('.title > a', el).attr('href'),
                lastTime: $('.time', el).text()
              };
              items.push(item);
              aa.push(item);
            }
          });
          // 发布单个请求完成事件并返回结果（数组）
          ep.emit('topic_titles', items);

          res.end(JSON.stringify(items, null, 2));
          //JSON.stringify(results, null, 2)
          console.log(JSON.stringify(items, null, 2));
        });
      });


    }

    /**
     * 请求参数初始化
     * @param: urls:请求的url、 opts：请求header参数， num：爬取的页数
     */
    function initRequestOpt(urls, opts, num) {
      urls.forEach(function(url) {
        for (var i = 0; i < num; i++) {
          opts.push({
            method: 'GET',
            url: url,
            qs: {
              start: (i * 25).toString()
            },
            headers: {
              'Accept': '*/*',
              'Accept-Language': 'zh-CN,zh;q=0.8',
              'Cookie': 'bid=vkXjYPjxO6E; ll="108258";',
              'USER_AGENT': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36'
                //'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
            }
            // 伪造报文头部，模仿浏览器行为，否则403错误
          });
        }
      });
    }

    /**
     * 关键词筛选
     * @param: str:被筛选的字符串、 words：正则表达式参数（数组）
     * @return: true:包含所有关键词、 false:不全包含给出的关键词
     */
    function checkIncludeWords(str, words) {
      var result = words.every(function(word) {
        return new RegExp(word, 'g').test(str);
      });
      return result;
    }

    /**
     * 关键词排除
     * @param: str:被筛选的字符串、 words：正则表达式参数（数组）
     * @return: true:不包含任一关键词、 false:包含给出的关键词
     */
    function checkExcludeWords(str, words) {
      var result = words.some(function(word) {
        return new RegExp(word, 'g').test(str);
      });
      return !result;
    }

    // 输出 JSON 格式
    response = {
      first_name: req.query.first_name,
      last_name: req.query.last_name
    };
    console.log(response);
    res.end(JSON.stringify(response));


  })
  /*var httpProxy = require('http-proxy');
  var http = require('http');
  var proxy = httpProxy.createProxyServer({});
  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
  });
  var server = http.createServer(function(req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    proxy.web(req, res, {
      target: 'http://180.167.34.187:80'
    });
  });
  server.listen(5050);*/


app.set('host', '192.168.2.165' || '0.0.0.0');
var server = app.listen(8081, '192.168.2.165', function() {

  var host = server.address().address
  var port = server.address().port

  console.log("应用实例，访问地址为 http://%s:%s", host, port)
    // console.log(proxy)

})