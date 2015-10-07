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
    var accountFreezeData = moment('2015-10-01');
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
                type: 'asset',
                freezed: accountFreezeData.toDate()
            },
            kasseChf: {
                _id: id(),
                name: 'CHF Kasse',
                currency: 'CHF',
                type: 'asset',
                freezed: accountFreezeData.toDate()
            },
            kasseEur: {
                _id: id(),
                name: 'EUR Kasse',
                currency: 'EUR',
                type: 'asset',
                freezed: accountFreezeData.toDate()
            },
            emptyAccount: {
                _id: id(),
                name: 'empty',
                currency: 'CHF',
                type: 'liability',
                freezed: accountFreezeData.toDate()
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
            parts: [
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
            parts: [
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
                    res.body[0].should.have.a.property('parts');
                    res.body[0].parts.should.be.an('array').with.length(2);
                    res.body[0].parts[0].should.have.a.property('text', 'Barbezug');
                    res.body[0].parts[0].should.have.a.deep.property('account._id', fixtures.accounts.bank._id.toString());
                    res.body[0].parts[0].should.have.a.deep.property('amount.baseCurrency', -10000);
                    res.body[0].parts[0].should.have.a.deep.property('amount.accountCurrency', -10000);
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

    describe('post api/entries', function(){
        var entryDate = moment('2015-10-02');
        var entry = {
            _id: 'shouldnotmatter',
            date: entryDate.toDate(),
            planned: false,
            user: 'test',
            parts: [
                {
                    account: fixtures.accounts.bank._id.toString(),
                    text: 'Euro Bezug',
                    amount: {
                        baseCurrency: -5000,
                        accountCurrency: -5000
                    }
                },
                {
                    account: fixtures.accounts.kasseEur._id.toString(),
                    text: 'Euro Bezug',
                    amount: {
                        baseCurrency: 5000,
                        accountCurrency: 4500
                    }
                }
            ]
        };
        it('should add an entry', function(done){
            request(app)
                .post(paths.entries)
                .type('json')
                .send(entry)
                .expect(function(res){
                    res.body.should.be.an('object');
                    res.body.should.have.a.property('_id').that.is.a('string');
                    res.body.should.have.a.property('user', entry.user);
                    res.body.should.have.a.property('planned', entry.planned);
                    res.body.should.have.a.property('date', entryDate.toISOString());
                    res.body.should.have.a.property('parts');
                    res.body.parts.should.be.an('array').with.length(entry.parts.length);
                    res.body.parts[0].should.have.a.deep.property('account._id', entry.parts[0].account);
                    res.body.parts[0].should.have.a.property('text', entry.parts[0].text);
                    res.body.parts[0].should.have.a.deep.property('amount.baseCurrency', entry.parts[0].amount.baseCurrency);
                    res.body.parts[0].should.have.a.deep.property('amount.accountCurrency', entry.parts[0].amount.accountCurrency);
                    res.body.parts[1].should.have.a.deep.property('account._id', entry.parts[1].account);
                    res.body.parts[1].should.have.a.property('text', entry.parts[1].text);
                    res.body.parts[1].should.have.a.deep.property('amount.baseCurrency', entry.parts[1].amount.baseCurrency);
                    res.body.parts[1].should.have.a.deep.property('amount.accountCurrency', entry.parts[1].amount.accountCurrency);
                })
                .expect(200)
                .then(function(oldRes){
                    return request(app)
                        .get(paths.entries + '/' + oldRes.body._id)
                        .expect(function(res){
                            res.body.should.be.an('object');
                            res.body.should.have.a.property('_id').that.is.a('string');
                            res.body.should.have.a.property('user', entry.user);
                            res.body.should.have.a.property('planned', entry.planned);
                            res.body.should.have.a.property('date', entryDate.toISOString());
                            res.body.should.have.a.property('parts');
                            res.body.parts.should.be.an('array').with.length(entry.parts.length);
                            res.body.parts[0].should.have.a.property('account', entry.parts[0].account);
                            res.body.parts[0].should.have.a.property('text', entry.parts[0].text);
                            res.body.parts[0].should.have.a.deep.property('amount.baseCurrency', entry.parts[0].amount.baseCurrency);
                            res.body.parts[0].should.have.a.deep.property('amount.accountCurrency', entry.parts[0].amount.accountCurrency);
                            res.body.parts[1].should.have.a.property('account', entry.parts[1].account);
                            res.body.parts[1].should.have.a.property('text', entry.parts[1].text);
                            res.body.parts[1].should.have.a.deep.property('amount.baseCurrency', entry.parts[1].amount.baseCurrency);
                            res.body.parts[1].should.have.a.deep.property('amount.accountCurrency', entry.parts[1].amount.accountCurrency);
                        })
                        .expect(200);
                })
                .then(function(oldRes){
                    return request(app)
                        .get(paths.entries)
                        .accept('json')
                        .expect(function(res){
                            res.body.should.be.an('array').with.length(3);
                            res.body[2].should.have.a.property('_id').that.is.a('string');
                            res.body[2].should.have.a.property('user', entry.user);
                            res.body[2].should.have.a.property('planned', entry.planned);
                            res.body[2].should.have.a.property('date', entryDate.toISOString());
                            res.body[2].should.have.a.property('parts');
                            res.body[2].parts.should.be.an('array').with.length(entry.parts.length);
                            res.body[2].parts[0].should.have.a.property('account', entry.parts[0].account);
                            res.body[2].parts[0].should.have.a.property('text', entry.parts[0].text);
                            res.body[2].parts[0].should.have.a.deep.property('amount.baseCurrency', entry.parts[0].amount.baseCurrency);
                            res.body[2].parts[0].should.have.a.deep.property('amount.accountCurrency', entry.parts[0].amount.accountCurrency);
                            res.body[2].parts[1].should.have.a.property('account', entry.parts[1].account);
                            res.body[2].parts[1].should.have.a.property('text', entry.parts[1].text);
                            res.body[2].parts[1].should.have.a.deep.property('amount.baseCurrency', entry.parts[1].amount.baseCurrency);
                            res.body[2].parts[1].should.have.a.deep.property('amount.accountCurrency', entry.parts[1].amount.accountCurrency);
                        })
                        .expect(200);
                })
                .then(function(){
                    return request(app)
                        .get(paths.entriesCount)
                        .expect({count: 3})
                        .expect(200);
                })
                .done(noErr(done), done);
        });

        it('should validate the balance', function(done){
            entry.parts[0].amount.baseCurrency = 40000; // entry is no longer balanced
            request(app)
                .post(paths.entries)
                .type('json')
                .send(entry)
                .expect(400, done);
        });

        it('should validate the freeze date', function(done){
            entry.parts[0].amount.baseCurrency = 50000; // entry is balanced again
            entry.date = accountFreezeData.subtract(1, 'day');
            request(app)
                .post(paths.entries)
                .type('json')
                .send(entry)
                .expect(400, done);
        });

    });


});