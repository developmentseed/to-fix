var http = require('http'),
    Route = require('routes-router'),
    levelup = require('levelup'),
    leveldown = require('leveldown');

var router = Route();
var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET',
    'Access-Control-Allow-Credentials': false,
    'Access-Control-Max-Age': '86400'
};
var port = 3001;
var lockperiod = 10*60;

http.createServer(router).listen(port, function() {
    console.log('running on port ' + port);
});

router.addRoute('/error/:error', {
    POST: function(req, res, opts) {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            body = JSON.parse(body);
            getNextItem(opts.params.error, res, function(err, kv) {
                if (err) {
                    console.log('/error route', err);
                    return error(res, 500, err);
                }
                track(opts.params.error, body.user, 'got', {_id: kv.key});
                res.writeHead(200, headers);
                return res.end(JSON.stringify(kv));
            });
        });
    }
});

router.addRoute('/fixed/:error', {
    POST: function(req, res, opts) {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            body = JSON.parse(body);
            if (body.user && body.state._id) {
                track(opts.params.error, body.user, 'fixed', body.state);

                var location = './' + opts.params.error + '.ldb';
                levelup(location, {createIfMissing: false}, function(err, db) {
                    if (err) {
                        if (db && !db.isClosed()) db.close();
                        return console.log('/fixed error', err);
                    }
                    db.del(body.state._id, function() {
                        db.close();
                    });
                });

                res.writeHead(200, headers);
                return res.end('');
            }
        });
    }
});

function getNextItem(error, res, callback) {
    var location = './' + error + '.ldb';
    levelup(location, {createIfMissing: false}, function(err, db) {
        if (err) {
            if (db && !db.isClosed()) db.close();
            console.log('Database error', err);
            return callback('Database error');
        }

        var newKey = (+new Date() + lockperiod).toString() + Math.random().toString().slice(1, 4);

        db.createReadStream({limit: 1, lt: (+new Date())})
            .on('data', function(data) {
                db.del(data.key, function() {
                    db.put(newKey, data.value, function(err) {
                        db.close();
                        data.key = newKey;
                        data.value = JSON.parse(data.value);
                        return callback(null, data);
                    });
                });
            })
            .on('error', function(err) {
                db.close();
                console.log('CreateReadStream error', err);
                return callback('Something wrong with the database');
            });
    });
}

function track(error, user, action, value) {
    // value must be an object
    var trackingDb = './' + error + '-tracking.ldb';
    var key = +new Date() + ':' + user;
    value._action = action;
    value = JSON.stringify(value);
    levelup(trackingDb, function(err, db) {
        if (err) {
            if (db && !db.isClosed()) db.close();
            console.log('tracking error', err);
            return;
        }
        db.put(key, value, function(err) {
            db.close();
        });
    });
}

function error(res, code, errString) {
    res.writeHead(code, headers);
    return res.end(errString);
}