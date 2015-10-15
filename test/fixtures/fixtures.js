var testBookkeeping = require('../server/helpers/test-bookkeeping.js');
var moment = require('moment');

describe('account access', function() {

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
                    account: fixtures.accounts.bank._id.toString(),
                    text: 'Barbezug Mai',
                    amount: {
                        baseCurrency: -10000,
                        accountCurrency: -10000
                    }
                },
                {
                    account: fixtures.accounts.kasseChf._id.toString(),
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
                    account: fixtures.accounts.bank._id.toString(),
                    text: 'Barbezug June',
                    amount: {
                        baseCurrency: -10000,
                        accountCurrency: -10000
                    }
                },
                {
                    account: fixtures.accounts.kasseEur._id.toString(),
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

    it('should load the fixtures', function(done){
        done();
    });
});