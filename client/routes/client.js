var http = require('http'),
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