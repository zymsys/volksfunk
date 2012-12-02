var MongoClient = require('mongodb').MongoClient
    , Server = require('mongodb').Server;
var uuid = require('node-uuid');
var mongoClient = new MongoClient(new Server('localhost', 27017));
var queryString = require('querystring');
var db;

mongoClient.open(function(err, mongoClient) {
    db = mongoClient.db("volksfunk");
});

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
}