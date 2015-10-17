var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('express-restify-mongoose');
var timestamps = require('mongoose-timestamp');
var _ = require('underscore');
var moment = require('moment');
var wrapMPromise = require('./wrapMPromise');
var promisedHook = wrapMPromise.promisedHook;
var populate = wrapMPromise.populate;
var wrapMpromise = wrapMPromise.wrapMpromise;
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

function DataValidationError(data) {
    this.name = 'DataValidationError';
    this.message = 'Data validation error';
    this.stack = (new Error()).stack;
    this.data = data;
}
DataValidationError.prototype = Object.create(Error.prototype);
DataValidationError.prototype.constructor = DataValidationError;


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
            tags: [{type: String}],
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
                tags: [{type: String}],
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
                throw new DataValidationError({
                    type: 'beforeAccountFreezeDate',
                    account: part.account,
                    freezed: part.account.freezed
                });
            }
        });
        return entry;
    };

    var validateBalance = function(entry) {
        if (entry.parts.length === 0) {
            throw new DataValidationError({type: 'noParts'});
        }
        var sum = _.reduce(entry.parts, function(memo, part){ return memo + part.amount.baseCurrency; }, 0);
        if (sum !== 0) {
            throw new DataValidationError({
                type: 'notBalanced',
                balance: sum
            });
        }
        return entry;
    };

    schema.entry.pre('save', promisedHook(function(promise) {
            return promise
                .then(populate('parts.account'))
                .then(validateFreeze)
                .then(validateBalance);
    }));

    schema.entry.pre('remove', promisedHook(function(promise){
        return promise
                .then(populate('parts.account'))
                .then(validateFreeze);
    }));

    var model = {};

    schema.account.pre('remove', promisedHook(function(promise){
        return promise.then(function(account){
            return wrapMpromise(
                model.entry.count({'parts.account._id':  account._id}).exec()
            );
        }).then(function(count){
            if (count > 0) {
                throw new DataValidationError({
                    type: 'references',
                    refType: 'entry',
                    count: count
                });
            }
        });
    }));

    model.setting = mongoose.model('Setting', schema.setting, 'settings');
    model.account = mongoose.model('Account', schema.account, 'accounts');
    model.entry = mongoose.model('Entry', schema.entry, 'entries');
    model.balance = mongoose.model('Balance', schema.balance, 'balances');

    connectToDb(db);

    return {
        addRestRoutes: function(app){
            restify.defaults({
               onError: function (err, req, res, next) {
                   res.setHeader('Content-Type', 'application/json');
                   if (err instanceof DataValidationError) {
                       res.status(err.statusCode || 500).json(err.data);
                   } else {
                       res.status(err.statusCode || 500).json(err.message);
                   }
               }
            });
            restify.serve(app, model.setting);
            restify.serve(app, model.account, {
                // necessary for calling hooks like pre-save
                findOneAndRemove: false
            });
            restify.serve(app, model.entry, {
                // necessary for calling hooks like pre-save
                findOneAndUpdate: false,
                findOneAndRemove: false
            });

        },
        model: model
    };
};
