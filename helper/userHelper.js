var dbo = require('../config/connection');
var connectionHelper = require('./connectionNames');
var objectId = require('objectid');
var bcrypt = require('bcrypt');
var Razorpay = require('razorpay');
const { resolve } = require('path');
// Instantiate the razorpay instance with key_id & key_secret. 
var instance = new Razorpay({
    key_id: 'rzp_test_agTCTWob0YuXAY',
    key_secret: '0K1p5sWSU3MYTzfrXGF9HzHg',
});

module.exports = {
    doSignup: function (userData) {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10);
            dbo.get().collection(connectionHelper.collectionUser).insertOne(userData).then((res) => {
                resolve(res.ops[0])
            })
        })

    },
    doLogin: (userData) => {
        return new Promise((resolve, reject) => {
            let response = {};
            dbo.get().collection(connectionHelper.collectionUser).findOne({ email: userData.email }).then((res) => {
                if (res) {
                    bcrypt.compare(userData.password, res.password).then((status) => {
                        if (status) {
                            response.status = true;
                            response.user = res;
                            resolve(response);
                        }
                        else {
                            response.status = false;
                            resolve(response);
                        }
                    })
                }
                else {
                    response.status = false;
                    resolve(response);
                }
            })
        })
    },
    addTocart: function (product, userId) {
        return new Promise(async (resolve, reject) => {

            dbo.get().collection(connectionHelper.collectionCart).insertOne({ userId, product, quantity: 1, updatedPrice: parseInt(product.price) }).then((resp) => {
                resolve(resp.ops[0].product.id);
            })
        })
    },
    viewCart: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await dbo.get().collection(connectionHelper.collectionCart).find({ userId: userId }).toArray();
            resolve(userCart)
        })
    }
    ,
    cartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartCount = null;
            cart = await dbo.get().collection(connectionHelper.collectionCart).find({ userId: userId });
            if (cart) {
                resolve(cart.count());
            }
            else
                console.log(cartCount);
        })
    },
    removeItemFromCart: (proId) => {
        return new Promise((resolve, reject) => {
            dbo.get().collection(connectionHelper.collectionCart).deleteOne({ _id: objectId(proId) }, () => {
                console.log('deleted');
                resolve()
            })
        })
    },
    changeQuantity: (cartDetails) => {
        return new Promise(async (resolve, reject) => {
            count = parseInt(cartDetails.count);
            await dbo.get().collection(connectionHelper.collectionCart).updateOne({ _id: objectId(cartDetails.cart) }, { $inc: { quantity: count } });

            dbo.get().collection(connectionHelper.collectionCart).findOne({ _id: objectId(cartDetails.cart) }).then((resp) => {
                if (resp.quantity == 0) {
                    dbo.get().collection(connectionHelper.collectionCart).deleteOne({ _id: objectId(cartDetails.cart) });
                    resolve({ removeProduct: true })
                }
                let currentPrice = parseInt(resp.product.price);
                let newPrice = currentPrice * resp.quantity;


                dbo.get().collection(connectionHelper.collectionCart).updateOne({ _id: objectId(cartDetails.cart) }, { $set: { updatedPrice: newPrice } });
                dbo.get().collection(connectionHelper.collectionCart).findOne({ _id: objectId(cartDetails.cart) }).then((resp) => {
                    resolve(resp);
                })


            })

        })
    },
    totalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            user = await dbo.get().collection(connectionHelper.collectionCart).aggregate([
                {
                    $match: {
                        userId: userId
                    }
                },
                {
                    $project: {
                        _id: 0,
                        updatedPrice: 1
                        // totalAmount: { $sum: "$updatedPrice" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$updatedPrice' }
                    }
                }
            ]).toArray();
            resolve(user[0].totalAmount);

        })
    },
    placeOrder: function (paymentDetails, products, totalAmount) {
        return new Promise(async (resolve, reject) => {

            let status = paymentDetails.method === 'COD' ? 'placed' : 'pending';
            let orderObj = {
                deliveryDetails:
                {
                    firstname: paymentDetails.firstName,
                    lastname: paymentDetails.lastName,
                    address: paymentDetails.address,
                    phone: paymentDetails.phone,
                },
                products: products,
                userId: paymentDetails.userId,
                paymentMethod: paymentDetails.method,
                totalAmount: totalAmount,
                status: status,
                date: new Date()
            }
            dbo.get().collection(connectionHelper.collectionDeliveryDetails).insertOne(orderObj).then((response) => {

                resolve(response.ops[0]._id)
            })
        })
    },
    trackOrders: (userId) => {
        return new Promise(async (reslove, reject) => {
            let trackOrders = await dbo.get().collection(connectionHelper.collectionDeliveryDetails).aggregate([
                {
                    $match: { userId: userId }
                }
            ]).toArray()

            reslove(trackOrders)
        })

    },
    trackProducts: (userId) => {
        return new Promise(async (reslove, reject) => {

            let cartProducts = await dbo.get().collection(connectionHelper.collectionCart).aggregate([
                {
                    $match: { userId: userId }
                },
            ]).toArray()
            // cart products moved to new collection
            await dbo.get().collection('ordered-products').insert(cartProducts);
            let trackProducts = await dbo.get().collection('ordered-products').aggregate([
                {
                    $match: { userId: userId }
                },
            ]).toArray()
            //deteting cart
            dbo.get().collection(connectionHelper.collectionCart).deleteMany({ userId: userId })
            reslove(trackProducts)
        })
    },
    generateRazorpay: (orderId, totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount,  // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err)
                    console.log(err);
                else
                    resolve(order)
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            var crypto = require('crypto');
            var hmac = crypto.createHmac('sha256', '0K1p5sWSU3MYTzfrXGF9HzHg');
            hmac.update(details['payment[razorpay_payment_id]'] + '|' + details['payment[razorpay_order_id]']);
            hmac = hmac.digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            }
            else
                reject()
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            dbo.get().collection(connectionHelper.collectionDeliveryDetails).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'placed' }
                }).then(() => {
                    resolve()
                })
        })

    }

}
