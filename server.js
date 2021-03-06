var http = require('http');
var express = require('express');
var path = require('path');
var datalayer = require('./server/datalayer');
var bookkeeping = require('./server/bookkeeping');

var port = process.env.PORT || 8081;

var dataService = datalayer('mongodb://127.0.0.1:27017/bookkeeping-test');
var app = bookkeeping(dataService);

app.use(express.static(__dirname + '/' + process.env.STATIC_DIR));

http.createServer(app).listen(port, '0.0.0.0', function() {
    console.log('Express server listening on port ' + port + ' serving static content from ' + process.env.STATIC_DIR);
});
