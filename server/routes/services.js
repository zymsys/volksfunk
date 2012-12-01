var MongoClient = require('mongodb').MongoClient
    , Server = require('mongodb').Server;
var uuid = require('node-uuid');
var mongoClient = new MongoClient(new Server('localhost', 27017));

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
        console.log(rawRequest);
        var users = db.collection('users');
        var logins = db.collection('logins');
        users.findOne({email:req.body.email}, function (err, user) {
            var secret;
            if (user && (user.password == req.body.password)) {
                secret = uuid.v4();
                logins.insert({
                    secret: secret,
                    user: req.body.email,
                    host: req.connection.remoteAddress,
                    port: req.body.port
                });
                res.json({secret: secret});
                return;
            }
            res.json({status:'fail'});
        });
    });
}