var chai = require('chai');
var should = chai.should();
var request = require("supertest-as-promised");
var testBookkeeping = require('./helpers/test-bookkeeping.js');

chai.use(require('./helpers/chai.js'));

var noErr = testBookkeeping.noErr;


describe('account access', function() {

    var paths = {
        accounts: '/api/v1/accounts',
        accountsCount: '/api/v1/accounts/count'
    };
    var app = testBookkeeping.app;

    var id = testBookkeeping.id;
    var fixtures = {};

    before(function (done) {
        testBookkeeping.fixtures.clearAllAndLoad(fixtures, done);
    });

    describe('get api/accounts', function() {
        it('respond with json', function(done){
            request(app)
                .get(paths.accounts)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
        it('returns empty array', function(done){
            request(app)
                .get(paths.accounts)
                .accept('json')
                .expect(function(res){
                    res.body.should.be.an('array').with.length(0);
                })
                .expect(200, done);
        });
        it('should have zero count', function(done){
            request(app)
                .get(paths.accountsCount)
                .expect({count: 0})
                .expect(200, done);
        });
    });

    describe('post api/accounts', function(){
        var account = {
            _id: 'shouldnotmatter',
            name: 'Test-account1',
            currency: 'CHF',
            type: 'asset'
        };
        it('should add an account', function(done){
            request(app)
                .post(paths.accounts)
                .type('json')
                .send(account)
                .expect(function(res){
                    res.body.should.be.an('object');
                    res.body.should.have.a.property('_id').that.is.a('string');
                    res.body.should.have.a.property('name', account.name);
                    res.body.should.have.a.property('currency', account.currency);
                    res.body.should.have.a.property('type', account.type);
                    res.body.should.have.a.property('freezed', "1990-01-31T23:00:00.000Z");
                })
                .expect(200)
            .then(function(oldRes){
                return request(app)
                    .get(paths.accounts + '/' + oldRes.body._id)
                    .expect(function(res){
                        res.body.should.be.an('object');
                        res.body.should.have.a.property('_id').that.is.a('string');
                        res.body.should.have.a.property('name', account.name);
                        res.body.should.have.a.property('currency', account.currency);
                        res.body.should.have.a.property('type', account.type);
                    })
                    .expect(200);
            })
            .then(function(oldRes){
                return request(app)
                    .get(paths.accounts)
                    .accept('json')
                    .expect(function(res){
                        res.body.should.be.an('array').with.length(1);
                        res.body[0].should.be.an('object');
                        res.body[0].should.have.a.property('_id', oldRes.body._id);
                        res.body[0].should.have.a.property('name', account.name);
                        res.body[0].should.have.a.property('currency', account.currency);
                        res.body[0].should.have.a.property('type', account.type);
                    })
                    .expect(200);
            })
            .then(function(){
                return request(app)
                    .get(paths.accountsCount)
                    .expect({count: 1})
                    .expect(200);
            })
            .done(noErr(done), done);
        });
    });

    describe('post or put api/accounts', function(){
        it('should update an existing account', function(done){
            request(app)
                .get(paths.accounts)
                .accept('json')
                .expect(function(res) {
                    res.body.should.be.an('array').with.length(1);
                    res.body[0].should.have.a.property('name', 'Test-account1');
                    res.body[0].should.have.a.property('currency', 'CHF');
                    res.body[0].should.have.a.property('type', 'asset');
                })
            .then(function(res) {
                return request(app)
                    .post(paths.accounts + '/' + res.body[0]._id)
                    .type('json')
                    .send({name: 'blabla', currency: 'EUR', type: 'liability'})
                    .expect(function (res) {
                        res.body.should.be.an('object');
                        res.body.should.have.a.property('_id').that.is.a('string');
                        res.body.should.have.a.property('name', 'blabla');
                        res.body.should.have.a.property('currency', 'EUR');
                        res.body.should.have.a.property('type', 'liability');
                    })
                    .expect(200);
            }).then(function(){
                return request(app)
                    .get(paths.accounts)
                    .accept('json')
                    .expect(function(res){
                        res.body.should.be.an('array').with.length(1);
                        res.body[0].should.be.an('object');
                        res.body[0].should.have.a.property('name', 'blabla');
                        res.body[0].should.have.a.property('currency', 'EUR');
                        res.body[0].should.have.a.property('type', 'liability');
                    })
                    .expect(200);
            })
            .done(noErr(done), done);
        });
    });

    describe('delete api/accounts', function(){
        it('removes an existing account', function(done){
            request(app)
                .get(paths.accounts)
                .accept('json')
                .expect(200)
            .then(function(res){
                return request(app)
                    .delete(paths.accounts + '/' + res.body[0]._id)
                    .expect(200);
            })
            .then(function(){
                return request(app)
                    .get(paths.accountsCount)
                    .expect({count: 0})
                    .expect(200);
            })
            .then(function(){
                return request(app)
                    .get(paths.accounts)
                    .accept('json')
                    .expect(function(res){
                        res.body.should.be.an('array').with.length(0);
                    })
                    .expect(200);
            })
            .done(noErr(done), done);
       });
    });

});

