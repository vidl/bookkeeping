var chai = require('chai');
var should = chai.should();
var request = require("supertest-as-promised");
var testBookkeeping = require('./helpers/test-bookkeeping.js');
var moment = require('moment');

chai.use(require('./helpers/chai.js'));

var noErr = testBookkeeping.noErr;


describe('entry access', function() {

    var paths = {
        entries: '/api/v1/entries',
        entriesCount: '/api/v1/entries/count',
        accounts: '/accounts'
    };
    var app = testBookkeeping.app;

    var id = testBookkeeping.id;
    var fixtures = {
        settings: {
            baseCurrency: {
                name: 'baseCurrency',
                value: 'CHF',
                type: 'baseCurrency'
            }
        },
        accounts: {
            bank: {
                _id: id(),
                name: 'Bank',
                currency: 'CHF',
                type: 'asset'
            },
            kasseChf: {
                _id: id(),
                name: 'CHF Kasse',
                currency: 'CHF',
                type: 'asset'

            },
            kasseEur: {
                _id: id(),
                name: 'EUR Kasse',
                currency: 'EUR',
                type: 'asset'

            },
            emptyAccount: {
                _id: id(),
                name: 'empty',
                currency: 'CHF',
                type: 'liability'

            }
        },

        entries: {
        }
    };

    fixtures.entries = {
        entryMay: {
            _id: id(),
            date: new Date(2015, 5, 1),
            planned: false,
            user: 'test',
            amounts: [
                {
                    account: fixtures.accounts.bank,
                    text: 'Barbezug',
                    amount: {
                        baseCurrency: -10000,
                        accountCurrency: -10000
                    }
                },
                {
                    account: fixtures.accounts.kasseChf,
                    text: 'Barbezug',
                    amount: {
                        baseCurrency: 10000,
                        accountCurrency: 10000
                    }
                }
            ]
        },
        entryJune: {
            _id: id(),
            date: new Date(2015, 6, 1),
            planned: false,
            user: 'test',
            amounts: [
                {
                    account: fixtures.accounts.bank,
                    text: 'Barbezug',
                    amount: {
                        baseCurrency: -10000,
                        accountCurrency: -10000
                    }
                },
                {
                    account: fixtures.accounts.kasseEur,
                    text: 'Barbezug',
                    amount: {
                        baseCurrency: 10000,
                        accountCurrency: 9800
                    }
                }
            ]
        }

    };

    before(function (done) {
        testBookkeeping.fixtures.clearAllAndLoad(fixtures, done);
    });

    describe('get empty account', function() {
        it('respond with json', function(done){
            request(app)
                .get(paths.accounts + '/' + fixtures.accounts.emptyAccount._id)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
        it('returns empty array', function(done){
            request(app)
                .get(paths.accounts + '/' + fixtures.accounts.emptyAccount._id)
                .accept('json')
                .expect(function(res){
                    res.body.should.be.an('array').and.empty;
                })
                .expect(200, done);
        });
    });
    describe('get non empty account', function() {
        it('returns data', function(done){
            request(app)
                .get(paths.accounts + '/' + fixtures.accounts.bank._id)
                .accept('json')
                .expect(function(res){
                    res.body.should.be.an('array').with.length(2);
                    res.body[0].should.have.a.property('amounts');
                    res.body[0].amounts.should.be.an('array').with.length(2);
                    res.body[0].amounts[0].should.have.a.property('text', 'Barbezug');
                    res.body[0].amounts[0].should.have.a.deep.property('account._id', fixtures.accounts.bank._id.toString());
                    res.body[0].amounts[0].should.have.a.deep.property('amount.baseCurrency', -10000);
                    res.body[0].amounts[0].should.have.a.deep.property('amount.accountCurrency', -10000);
                })
                .expect(200, done);
        });
    });

    describe('get api/entries', function() {
        it('respond with json', function(done){
            request(app)
                .get(paths.entries)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
        it('returns some data', function(done){
            request(app)
                .get(paths.entries)
                .accept('json')
                .expect(function(res){
                    res.body.should.be.an('array').with.length(2);
                })
                .expect(200, done);
        });
        it('should have one count', function(done){
            request(app)
                .get(paths.entriesCount)
                .expect({count: 2})
                .expect(200, done);
        });
    });

    describe('The api method', function(){
        it('post returns forbidden', function(done){
            request(app)
                .post(paths.entries)
                .expect(403, done);
        });
        it('put returns forbidden', function(done){
            request(app)
                .put(paths.entries)
                .expect(403, done);
        });
        it('delete returns forbidden', function(done){
            request(app)
                .delete(paths.entries)
                .expect(403, done);
        });
    });
});