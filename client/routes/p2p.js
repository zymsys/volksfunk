var http = require('http'),
    fs = require('fs'),
    querystring = require('querystring');

function withData(provider, doCallback) {
    var responseData = '';
    provider.on('data', function (chunk) {
        responseData += chunk;
    });
    provider.on('end', function () {
        doCallback(responseData);
    });
}

exports.hello = function (req, res) {
    withData(req, function(data) {
        data = JSON.parse(data);
        var responseData = {
            music: {
                'guid1': {
                    plays: 20,
                    likes: 2,
                    dislikes: 0
                },
                'guid2': {
                    plays: 13,
                    likes: 0,
                    dislikes: 1
                }
            }
        }
        res.json(responseData);
    });
};

exports.fetch = function (req, res) {
    fs.readFile('public/cache/' + req.query.id + '/track.json', function (err, data) {
        var track = JSON.parse(data);
        fs.readFile('public/cache/' + req.query.id + '/' + track.track.fileName, function (err, data) {
            res.setHeader('Content-Type','audio/mpeg');
            res.send(data);
        });
    });
};