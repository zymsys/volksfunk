var http = require('http');

var serverHost = 'localhost',
    serverPort = 3001;

function withResponseData(response, doCallback) {
    var responseData = '';
    response.on('data', function (chunk) {
        responseData += chunk;
    });
    response.on('end', function () {
        doCallback(responseData);
    });
}

function relayJSONResponse(response, toResponse) {
    withResponseData(response, function (responseData) {
        toResponse.writeHead(200, { 'Content-type': 'application/json'});
        toResponse.end(responseData);
    });
}

exports.auth = function(req, res) {
    var requestBody = 'email=' + encodeURIComponent(req.body.email) + '&password=' + encodeURIComponent(req.body.password);
    var request = http.request({
        hostname: serverHost,
        port: serverPort,
        path: '/services/auth',
        method: 'POST',
        headers: {
            'Content-Length': requestBody.length
        }
    }, function (response) {
        relayJSONResponse(response, res);
    });
    request.write(requestBody);
    request.end();
};

exports.introduction = function (req, res) {
    var request = http.request({
        hostname: serverHost,
        port: serverPort,
        path: '/services/introduction?secret=' + encodeURIComponent(req.query['secret']) +
            '&genre=' + encodeURIComponent(req.query['genre'])
    }, function (response) {
        relayJSONResponse(response, res);
    });
    request.end();
};