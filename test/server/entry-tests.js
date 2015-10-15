var chai = require('chai');
var should = chai.should();
var request = require("supertest-as-promised");
var testBookkeeping = require('./helpers/test-bookkeeping.js');
var moment = require('moment');
var _ = require('underscore');

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
            date: moment('2015-05-01').toDate(),
            planned: false,
            user: 'entryMay',
            parts: [
                {
                    account: fixtures.accounts.bank,
                    text: 'Barbezug Mai',
                    amount: {
                        baseCurrency: -10000,
                        accountCurrency: -10000
                    }
                },
                {
                    account: fixtures.accounts.kasseChf,
                    text: 'Barbezug Mai',
                    amount: {
                        baseCurrency: 10000,
                        accountCurrency: 10000
                    }
                }
            ]
        },
        entryJune: {
            _id: id(),
            date: moment('2015-06-01').toDate(),
            planned: false,
            user: 'entryJune',
            parts: [
                {
                    account: fixtures.accounts.bank,
                    text: 'Barbezug June',
                    amount: {
                        baseCurrency: -10000,
                        accountCurrency: -10000
                    }
                },
                {
                    account: fixtures.accounts.kasseEur,
                    text: 'Barbezug June',
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

    describe('get entries from model', function(){
        it('should not populate account', function(done){
            testBookkeeping.dataService.model.entry.find().lean(true).exec(function(err, entries){
                entries.should.be.an('array').with.length(2);
                entries[0].parts.should.be.an('array').with.length(2);
                entries[0].parts[0].account.should.be.a('string');
            });
        });
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
                    res.body[0].parts[0].should.have.a.property('text', fixtures.entries.entryJune.parts[0].text);
                    res.body[0].parts[0].should.have.a.deep.property('account._id', fixtures.accounts.bank._id.toString());
                    res.body[0].parts[0].should.have.a.deep.property('amount.baseCurrency', fixtures.entries.entryJune.parts[0].amount.baseCurrency);
                    res.body[0].parts[0].should.have.a.deep.property('amount.accountCurrency', fixtures.entries.entryJune.parts[0].amount.accountCurrency);
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
                    res.body[0].parts.should.be.an('array').with.length(2);
                    res.body[0].parts[0].account.should.be.a('string');
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
            planned: true,
            user: 'test1',
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
                .expect(201)
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
        it('should not allow empty parts', function(done){
            entry.parts = [];
            entry.date = accountFreezeData.add(1, 'day');
            request(app)
                .post(paths.entries)
                .type('json')
                .send(entry)
                .expect(400, done);
        });

    });

    describe('post or put api/entries', function(){
        var getLastEntry = function() {
            return request(app)
                .get(paths.entries)
                .accept('json')
                .expect(function(res) {
                    res.body.should.be.an('array').with.length(3);
                    res.body[2].should.have.a.property('user','test1');
                });
        };
        it('should update an existing entry', function(done){
            getLastEntry()
                .then(function(res) {
                    var entry = res.body[2];
                    entry.date = moment('2015-10-03').toDate();
                    return request(app)
                        .post(paths.entries + '/' + entry._id)
                        .type('json')
                        .send(entry)
                        .expect(function (res) {
                            res.body.should.be.an('object');
                            res.body.should.have.a.property('_id').that.is.a('string');
                            res.body.should.have.a.property('date', moment('2015-10-03').toISOString());
                        })
                        .expect(200);
                })
                .then(function(res) {
                    var data = { parts: [
                        {
                            account: fixtures.accounts.bank._id.toString(),
                            text: 'CHF Bezug Updated',
                            amount: {
                                baseCurrency: -8000,
                                accountCurrency: -8000
                            }
                        },
                        {
                            account: fixtures.accounts.kasseChf._id.toString(),
                            text: 'CHF Bezug Updated',
                            amount: {
                                baseCurrency: 8000,
                                accountCurrency: 8000
                            }
                        }
                    ]};
                    return request(app)
                        .post(paths.entries + '/' + res.body._id)
                        .type('json')
                        .send(data)
                        .expect(function (res) {
                            res.body.should.be.an('object');
                            res.body.should.have.a.property('_id').that.is.a('string');
                            res.body.should.have.a.property('date', moment('2015-10-03').toISOString());
                            res.body.parts.should.be.an('array').with.length(2);
                            res.body.parts[0].should.have.a.deep.property('amount.baseCurrency', -8000);
                            res.body.parts[1].should.have.a.deep.property('amount.baseCurrency', 8000);
                        })
                        .expect(200);
                })
                .done(noErr(done), done);
        });

        it('should validate the balance', function(done){
            getLastEntry()
                .then(function(res) {
                    return request(app)
                        .post(paths.entries + '/' + res.body[2]._id)
                        .type('json')
                        .send({parts: [
                            {
                                account: fixtures.accounts.bank._id.toString(),
                                text: 'Barbezug',
                                amount: {
                                    baseCurrency: -10000,
                                    accountCurrency: -10000
                                }
                            },
                            {
                                account: fixtures.accounts.kasseChf.toString(),
                                text: 'Barbezug',
                                amount: {
                                    baseCurrency: 8000,
                                    accountCurrency: 8000
                                }
                            }
                        ]})
                        .expect(400);
                })
                .done(noErr(done), done);
        });

        it('should not allow entry with no parts', function(done){
            getLastEntry()
                .then(function(res) {
                    return request(app)
                        .post(paths.entries + '/' + res.body[2]._id)
                        .type('json')
                        .send({parts: []})
                        .expect(400);
                })
                .done(noErr(done), done);
        });

        it('should validate the freeze date', function(done){
            getLastEntry()
                .then(function(res) {
                    return request(app)
                        .post(paths.entries + '/' + res.body[2]._id)
                        .type('json')
                        .send({
                            user: 'test2',
                            date: accountFreezeData.subtract(1, 'day').toISOString()
                        })
                        .expect(400);
                })
                .done(noErr(done), done);
        });
    });
});