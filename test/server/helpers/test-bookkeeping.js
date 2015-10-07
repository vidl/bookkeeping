var pow = require('pow-mongodb-fixtures');
var bookkeeping = require('../../../server/bookkeeping');

var dbConnection = 'mongodb://127.0.0.1:27017/bookkeeping-test';
var app = bookkeeping(dbConnection);
var fixtures = pow.connect(dbConnection);

exports.app = app;
exports.fixtures = fixtures;
exports.id = pow.createObjectId;
exports.noErr = function(done){
    return function(){
        done();
    };
};
