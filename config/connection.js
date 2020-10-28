var connectionHelper = require('../helper/connectionNames');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';
var state = {
    dbo: null
}
module.exports.connect = () => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        // dbname stored in connection Helper
        var dbname = connectionHelper.dbName;
        state.dbo = db.db(dbname);
        console.log("connected to database");
    })
}
module.exports.get = function () {
    return state.dbo;
}