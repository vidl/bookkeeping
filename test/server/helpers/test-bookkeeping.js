var pow = require('pow-mongodb-fixtures');
var datalayer = require('../../../server/datalayer');
var bookkeeping = require('../../../server/bookkeeping');

var dbConnection = 'mongodb://127.0.0.1:27017/bookkeeping-test';
var dataService = datalayer(dbConnection);
var app = bookkeeping(dataService);
var fixtures = pow.connect(dbConnection);

exports.app = app;
exports.dataService = dataService;
exports.fixtures = fixtures;
exports.id = pow.createObjectId;
exports.noErr = function(done){
    return function(){
        done();
    };
};
