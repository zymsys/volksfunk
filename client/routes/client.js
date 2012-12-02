var http = require('http');

exports.auth = function(req, res) {
    var requestBody = 'email=' + encodeURIComponent(req.body.email) + '&password=' + encodeURIComponent(req.body.password);
    var request = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/services/auth',
        method: 'POST',
        headers: {
            'Content-Length': requestBody.length
        }
    }, function (response) {
        var responseData = '';
        response.on('data', function (chunk) {
            responseData += chunk;
        });
        response.on('end', function () {
            res.writeHead(200, { 'Content-type': 'application/json'});
            res.end(responseData);
        });
    });
    request.write(requestBody);
    request.end();
};