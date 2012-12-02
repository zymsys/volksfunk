var http = require('http'),
    querystring = require('querystring'),
    fs = require('fs');

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