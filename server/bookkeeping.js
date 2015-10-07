var express = require('express');
var session = require('express-session');
var uid2 = require('uid2');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var _ = require('underscore');
var moment = require('moment');
var datalayer = require('./datalayer');
var q = require('q');
var mongoosePromiseHelper = require('./wrapMPromise')
var wrapMpromise = mongoosePromiseHelper.wrapMpromise;
var wrapMongooseCallback = mongoosePromiseHelper.wrapMongooseCallback;

var ObjectId = require('mongoose').Types.ObjectId;

var sessionOptions = {
    secret: uid2(25),
    resave: true,
    saveUninitialized: true
};

function saveDocument(docToSave){
    var deferred = q.defer();
    docToSave.save(function(err){
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(docToSave);
        }
    });
    return deferred.promise;

}

function removeDocument(docToRemove){
    var deferred = q.defer();
    docToRemove.remove(function(err){
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(docToRemove);
        }
    });
    return deferred.promise;
}

function handleError(res){
    return function(err){
        res.status(480);
        res.json(err);
        console.log(err.stack);
    }
}

function addToBody(res){
    return function(doc){
        res.json(doc);
        return doc;
    };
}

function populate(what){
    return function(model){
        var deferred = q.defer();
        model.populate(what, function(err, model){
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(model);
            }
        });
        return deferred.promise;
    };
}


module.exports = function(dbConnection) {

    var dataService = datalayer(dbConnection);

    var getEntriesByAccount = function(accountId) {
        return wrapMpromise(
          dataService.model.entry.find({'parts.account._id': new ObjectId(accountId)})
          .populate('parts.account')
          .sort('-date order')
          .exec()
        );
    };

    var app = express();
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(session(sessionOptions));
    dataService.addRestRoutes(app);

    app.get('/accounts/:id', function(req, res){
        getEntriesByAccount(new ObjectId(req.param('id')))
            .catch(handleError(res))
            .done(addToBody(res));
    });

    return app;
};

