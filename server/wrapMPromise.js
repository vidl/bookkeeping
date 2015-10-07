var q = require('q');

function wrapMpromise(mongoosePromise) {
    var deferred = q.defer();
    mongoosePromise.then(function (obj) {
        deferred.resolve(obj);
    }).then(null, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function wrapMongooseCallback(doc, method) {
    var deferred = q.defer();
    var args = Array.prototype.slice.call(arguments).slice(2);
    args.push(function (err, arg) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(arg);
        }
    });
    method.apply(doc, args);
    return deferred.promise;
}

function promisedHook (body) {
    return function (next) {
        var fulfilled = function () {
            next();
        };
        var rejected = function (err) {
            console.log(err);
            next(err);
        };
        body(q(this)).then(fulfilled, rejected);
    };
}

function populate(what) {
    return function (model) {
        return wrapMongooseCallback(model, model.populate, what);
    };
}

module.exports = {
    wrapMpromise: wrapMpromise,
    wrapMongooseCallback: wrapMongooseCallback,
    promisedHook: promisedHook,
    populate: populate

};