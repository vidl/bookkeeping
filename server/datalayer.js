var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('express-restify-mongoose');
var timestamps = require('mongoose-timestamp');
var _ = require('underscore');

function findOneOrCreate(schema) {
    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var self = this;

        return self.findOne(condition).exec().then(function(result){
            return result ? result : self.create(doc);
        });
    };
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
            freezed: {type: Date, default: new Date(1990, 1, 1) }, // no entries are allowed before that date
            type: { type: String, enum: ['asset', 'liability', 'expense', 'revenue']} // aktiv, passiv, aufwand, ertrag
        }),
        entry: new Schema({
            date: { type: Date, default: Date.now},
            order: { type: Number, default: 1},
            planned: Boolean,
            amounts: [{
                account: {type: Schema.Types.ObjectId, ref: 'Account'},
                amount: currenciesDefinition,
                text: String,
                balance: {
                    planned: currenciesDefinition,
                    actual: currenciesDefinition
                }
            }],
            user: String
        })

    };

    schema.setting.plugin(findOneOrCreate);

    schema.entry.plugin(timestamps);

    var model = {
        setting: mongoose.model('Setting', schema.setting, 'settings'),
        account: mongoose.model('Account', schema.account, 'accounts'),
        entry: mongoose.model('Entry', schema.entry, 'entries')
    };



    mongoose.connect(db);
    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + db);
    });

    // If the connection throws an error
    mongoose.connection.on('error',function (err) {
        console.log('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });

    return {
        addRestRoutes: function(app){
            restify.serve(app, model.setting);
            restify.serve(app, model.account);
            restify.serve(app, model.entry, {
                prereq: function(req){
                    return req.method === 'GET';
                }
            });

        },
        model: model
    }
};
