const session = require('express-session');
const mongoose = require('mongoose');
const { CheckConnection } = require('../repository/hrmisdb');
const MongoDBSession = require('connect-mongodb-session')(session);

exports.SetMongo = (app) => {
    //mongodb
    mongoose.connect('mongodb://localhost:27017/HRMIS')
        .then((res) => {
            console.log("MongoDB Connected!");
        });

    const store = new MongoDBSession({
        uri: 'mongodb://localhost:27017/HRMIS',
        collection: 'HRMISSessions',
    });

    //Session
    app.use(
        session({
            secret: "5L Secret Key",
            resave: false,
            saveUninitialized: false,
            store: store
        })
    );

    //Check SQL Connection
    CheckConnection();
};