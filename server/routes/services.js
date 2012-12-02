var MongoClient = require('mongodb').MongoClient
    , Server = require('mongodb').Server;
var uuid = require('node-uuid');
var mongoClient = new MongoClient(new Server('localhost', 27017));
var queryString = require('querystring');
var db;

mongoClient.open(function(err, mongoClient) {
    db = mongoClient.db("volksfunk");
});

function noSecretNoSoup(res, secret, soup) {
    var logins = db.collection('logins');
    logins.findOne({secret:secret}, function (err, login) {
        if (login) {
            soup();
        } else {
            res.json({status:'fail',message:'Bad secret'});
        }
    });
}

exports.auth = function(req, res) {
    /*
     use volksfunk
     db.users.save({email:"vic@volksfunk.org",password:"volksfunk"})
     db.users.save({email:"bernd@volksfunk.org",password:"volksfunk"})
     db.logins.save({secret:'ssh', user:'vic@volksfunk.org', host:'127.0.0.1', port:'5555'})
     */
    var rawRequest = '';
    req.on('data', function (chunk) {
        rawRequest += chunk;
    });
    req.on('end', function () {
        var requestData = queryString.parse(rawRequest);
        var users = db.collection('users');
        var logins = db.collection('logins');
        users.findOne({email:requestData.email}, function (err, user) {
            var secret;
            if (user && (user.password == requestData.password)) {
                secret = uuid.v4();
                logins.insert({
                    secret: secret,
                    user: requestData.email,
                    host: req.connection.remoteAddress,
                    port: requestData.port
                }, function () {
                    //Deal with write errors here
                });
                res.json({secret: secret});
                return;
            }
            res.json({status:'fail'});
        });
    });
};

/*
db.logins.insert({
    "secret" : "cc62f827-ade2-4d45-9edb-5130e7678020",
    "user" : "vic@volksfunk.org",
    "host" : "127.0.0.1",
    "port" : 3000,
    "genres" : ['Rock', 'Classical', 'Dubstep']
})

db.logins.insert({
    "secret" : "33155c34-4bcf-47c3-8530-b43e02ad0030",
    "user" : "bernd@volksfunk.org",
    "host" : "127.0.0.1",
    "port" : 3002,
    "genres" : ['Electronic', 'Classical', 'Dubstep']
})
*/

exports.introduction = function(req, res) {
    noSecretNoSoup(res, req.query['secret'], function () {
        var logins = db.collection('logins');
        var introductions = [];
        var query = {genres:req.query['genre']};
        query.secret = { $ne: req.query['secret'] };
        console.log('Asking mongo for introductions', query);
        var cursor = logins.find(query);
        cursor.each(function (err, genre) {
            if (genre == null) {
                //Send response
                res.json(introductions);
            } else {
                introductions.push({
                    host: genre.host,
                    port: genre.port
                });
            }
        });
    });
};