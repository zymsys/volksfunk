var http = require('http');

exports.auth = function(req, res) {
    console.log('hello');
    var request = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/services/auth',
        method: 'POST'
    }, function (response) {
        var responseData = {};
        res.json(responseData);
    });
    request.write('email=' + encodeURIComponent(req.body.email) + '&password=' + encodeURIComponent(req.body.password));
    request.end();
};