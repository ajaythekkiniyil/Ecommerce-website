var dbo = require('../config/connection');
var connectionHelper = require('./connectionNames');
var objectId = require('objectid');
module.exports = {
    addProducts: function (products, callback) {
        dbo.get().collection(connectionHelper.collectionProducts).insertOne(products, (err, result) => {
            if (err) throw err;
            callback(result.ops[0]._id);
        })


    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await dbo.get().collection(connectionHelper.collectionProducts).find().toArray();
            resolve(products);
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            dbo.get().collection(connectionHelper.collectionProducts).removeOne({ _id: objectId(proId) }).then((resp) => {

                resolve(resp);
            })
        })


    },
    getProduct: (proId, callback) => {
        dbo.get().collection(connectionHelper.collectionProducts).findOne({ _id: objectId(proId) }).then((resp) => {
            callback(resp)
        })
    },

    updateProduct: (proId, prodetails) => {
        console.log(proId, prodetails);
        return new Promise((resolve, reject) => {
            dbo.get().collection(connectionHelper.collectionProducts).updateOne({ _id: objectId(proId) },
                {
                    $set: { name: prodetails.name, price: prodetails.price }
                }).then((resp) => {
                    resolve(resp);
                })
        })
    }

}
