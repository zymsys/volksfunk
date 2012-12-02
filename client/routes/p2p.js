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
        var responseData = {};
        data = JSON.parse(data);
        fs.readdir('public/cache', function (tracks) {
            var i, j,trackId;
            for (i = 0, j = tracks.length; i < j; i += 1) {
                trackId = tracks[i];
                responseData[trackId] = fs.readFileSync('public/cache/' + trackId + '/track.json');
            }
            res.json(responseData);
        });
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