var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('express-restify-mongoose');
var timestamps = require('mongoose-timestamp');
var _ = require('underscore');
var moment = require('moment');
var wrapMPromise = require('./wrapMPromise')
var promisedHook = wrapMPromise.promisedHook;
var populate = wrapMPromise.populate;
var q = require('q');

function findOneOrCreate(schema) {
    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var self = this;

        return self.findOne(condition).exec().then(function(result){
            return result ? result : self.create(doc);
        });
    };
}

function connectToDb(db) {

    mongoose.connect(db);
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + db);
    });
    mongoose.connection.on('error',function (err) {
        console.log('Mongoose default connection error: ' + err);
    });
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected');
    });
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });
}


module.exports = function(db){

    var currenciesDefinition = {
        baseCurrency: Number,
        accountCurrency: Number
    };

    var schema = {
        setting: new Schema({
            name: String,
            desc: String,
            value: String,
            type: { type: String, enum: ['baseCurrency']}
        }),
        account: new Schema({
            name: String,
            currency: String,
            freezed: {type: Date, default: moment('1990-01-01T00:00:00.000Z').toDate() }, // no entries are allowed before that date
            type: { type: String, enum: ['asset', 'liability', 'expense', 'revenue']} // aktiv, passiv, aufwand, ertrag
        }),
        entry: new Schema({
            date: { type: Date, default: Date.now},
            order: { type: Number, default: 1},
            planned: Boolean,
            parts: [{
                account: {type: Schema.Types.ObjectId, ref: 'Account'},
                amount: currenciesDefinition,
                text: String
            }],
            user: String
        }),

        balance: new Schema({
            account: {type: Schema.Types.ObjectId, ref: 'Account'},
            date: { type: Date, default: Date.now},
            planned: currenciesDefinition,
            actual: currenciesDefinition
        })

    };

    schema.setting.plugin(findOneOrCreate);
    schema.entry.plugin(timestamps);
    schema.balance.plugin(timestamps);


    var validateFreeze = function(entry) {
        _.each(entry.parts, function(part){
            if (entry.date <= part.account.freezed) {
                throw new Error('Entry is before account freeze date');
            }
        });
        return entry;
    };

    var validateBalance = function(entry) {
        var sum = _.reduce(entry.parts, function(memo, part){ return memo + part.amount.baseCurrency; }, 0);
        if (sum != 0) {
            throw new Error('Entry is not balanced: ' + sum);
        }
        return entry;
    };

    schema.entry.pre('save', promisedHook(function(promise) {
            return promise
                .then(populate('parts.account'))
                .then(validateFreeze)
                .then(validateBalance);
    }));

    schema.entry.pre('remove', promisedHook(function (promise){
        return promise
                .then(populate('parts.account'))
                .then(validateFreeze);
    }));

    var model = {
        setting: mongoose.model('Setting', schema.setting, 'settings'),
        account: mongoose.model('Account', schema.account, 'accounts'),
        entry: mongoose.model('Entry', schema.entry, 'entries'),
        balance: mongoose.model('Balance', schema.balance, 'balances')
    };

    connectToDb(db);

    return {
        addRestRoutes: function(app){
            restify.serve(app, model.setting);
            restify.serve(app, model.account);
            restify.serve(app, model.entry);

        },
        model: model
    }
};
