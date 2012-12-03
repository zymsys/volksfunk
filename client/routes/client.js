var http = require('http'),
    fs = require('fs'),
    events = require('events');

var serverHost = 'localhost',
    serverPort = 3001;

var queue = {};

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
    var env = process.env;
    console.log(env);
    if (env.SECRET) {
        res.json({secret:env.SECRET});
        return;
    }
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

function fetchFileFromPeer(introduction, trackId, responseData, gotIt) {
    var fileRequest = http.request({
        hostname:introduction.host,
        port:introduction.port,
        path:'/p2p/fetch?id=' + trackId
    }, function (fileResponse) {
        console.log(process.cwd());
        process.chdir('public/cache');

        var exists = true;
        try {
            fs.statSync(trackId);
        } catch (e) {
            exists = false;
        }
        if (exists) {
            process.chdir('../..');
            gotIt(trackId);
            return;
        }
        fs.mkdirSync(trackId, 0700);
        process.chdir('../..');
        fs.writeFileSync('public/cache/' + trackId + '/track.json', responseData[trackId], 'utf8');
        var trackData = JSON.parse(responseData[trackId]);
        var file = fs.createWriteStream('public/cache/' + trackId + '/' + trackData.track.fileName);
        fileResponse.on('data', function (chunk) {
            file.write(chunk);
        });
        fileResponse.on('end', function () {
            file.end();
            gotIt(trackId);
        });
    });
    fileRequest.end();
    return fileRequest;
}
exports.introduction = function (req, res) {
    var request = http.request({
        hostname: serverHost,
        port: serverPort,
        path: '/services/introduction?secret=' + encodeURIComponent(req.query['secret']) +
            '&genre=' + encodeURIComponent(req.query['genre'])
    }, function (response) {
        var i, j,introduction;
        withResponseData(response, function (responseData) {
            res.writeHead(200, { 'Content-type': 'application/json'});
            res.end(responseData);
            //Now request remote tracks
            responseData = JSON.parse(responseData);
            for (i = 0, j = responseData.length; i < j; i += 1) {
                introduction = responseData[i];
                var p2pRequest = http.request({
                    hostname: introduction.host,
                    port: introduction.port,
                    path: '/p2p/hello',
                    method: 'POST'
                }, function (p2pResponse) {
                    var rawResponse = '';
                    p2pResponse.on('data', function (chunk) {
                        rawResponse += chunk;
                    });
                    p2pResponse.on('end', function() {
                        var responseData = JSON.parse(rawResponse);
                        var trackId;
                        for (trackId in responseData) {
                            var fileRequest = fetchFileFromPeer(introduction, trackId, responseData, function (trackId) {
                                if (exports.waitingForNextTrack) {
                                    exports.waitingForNextTrack.json({track:trackId});
                                    delete exports.waitingForNextTrack;
                                }
                            });
                        }
                        console.log(responseData);
                    });
                });
                p2pRequest.end();
            }
        });
    });
    request.end();
};

function sendNextTrack(genre, res) {
    if (queue[genre].length > 0) {
        res.json(queue[genre].shift());
    } else {
        exports.waitingForNextTrack = res;
    }
}

exports.next = function (req, res) {
    var genre = req.query.genre;
    if (!queue[genre]) queue[genre] = [];
    sendNextTrack(genre, res);
};

/*
    Browser client needs to long poll vf client for track.
    vf client has already asked vf server for introductions, and has initiated p2p hello from intro.
    p2p hello should request wanted songs
     Available songs should queue for play
     When songs are available, browser long poll should return with a song.  Next long poll gets next song.

     On start, cached songs are read into a queue (array)
     Once the first song, and again for the last song is queued fire a queue.ready event (using the event module)
     Once any song is loaded via p2p, fire the queue.ready event.

     The above long polling can listed for queue.ready before sending a response with a link to the queued mp3 file.
*/