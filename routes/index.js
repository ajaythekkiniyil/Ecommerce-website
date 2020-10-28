var express = require('express');
var router = express.Router();
var productHelper = require('../helper/productHelper');
var userHelper = require('../helper/userHelper');
var session = require('express-session');
var url = require('url');
const { cartCount } = require('../helper/userHelper');
const { response } = require('express');

var verifyLogin = function (req, res, next) {
  if (req.session.loggedIn) {
    next();
  }
  else {
    res.redirect('/login');
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  user = req.session.user;
  let cartCount = null;

  if (user) {
    cartCount = await userHelper.cartCount(req.session.user._id);

  }
  productHelper.getAllProducts().then((products) => {
    res.render('index', { products, user, cartCount });
  })
});

// SignIn GET page
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/');
  } else {
    let err = req.session.loggedErr;
    res.render('../views/user/signin', { err })
    req.session.loggedErr = false;
  }

})

// SignIn POST page
router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/');
    }
    else {
      req.session.loggedErr = 'Invalid username or password';
      res.redirect('/login');
    }
  })
})


//SignUp  GET page
router.get('/signup', (req, res) => {
  res.render('../views/user/signup')
})

//SignUp  POST page
router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((userData) => {
    res.redirect('/login');
  })
})

//logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
})

//cart page
router.get('/cart', (req, res) => {

  if (req.session.loggedIn) {
    user = req.session.user;
    userHelper.viewCart(req.session.user._id).then((userCart) => {
      console.log(userCart.length);
      if (userCart.length === 0) {
        res.render('../views/user/cartIsEmpty');
      }
      res.render('../views/user/cart', { userCart, user });
    })

  } else
    res.redirect('/login')
})

//add to cart
router.get('/add-to-cart', (req, res) => {
  //console.log(req.url);
  // console.log('api call');
  const queryObject = url.parse(req.url, true).query;
  // console.log(queryObject);
  userHelper.addTocart(queryObject, req.session.user._id).then((productId) => {
    res.json({ status: true })

  })

})

// Remove from cart
router.get('/remove-from-cart/:id', (req, res) => {
  // console.log('api call');
  userHelper.removeItemFromCart(req.params.id).then(() => {
    res.json({ status: true })
    // res.redirect('/cart')
  })
})

// change quantity AJAX post method
router.post('/change-quantity', (req, res) => {
  // console.log('api call');
  // console.log(req.body);
  userHelper.changeQuantity(req.body).then((cartDetails) => {
    res.json(cartDetails)
  })
})

// calculate-total-amount
router.get('/calculate-total-amount', (req, res) => {
  userHelper.totalAmount(req.session.user._id).then((totalAmount) => {
    res.json(totalAmount);
  })
})

// checkout page
router.get('/checkout', (req, res) => {

  userHelper.totalAmount(req.session.user._id).then((totalAmount) => {
    let userId = req.session.user._id;
    res.render('../views/user/checkout', { totalAmount, userId })
  })

})


// place order post method
router.post('/place-order', async (req, res) => {
  let paymentDetails = req.body;
  let products = await userHelper.viewCart(req.body.userId);
  let totalAmount = await userHelper.totalAmount(req.body.userId);
  userHelper.placeOrder(paymentDetails, products, totalAmount).then((orderId) => {
    if (paymentDetails.method === 'COD') {
      res.json({ codSuccess: true })
    }
    else {
      userHelper.generateRazorpay(orderId, totalAmount).then((response) => {
        res.json(response)
      })
    }

  })
})

// verify payment
router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment successful');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})



// track-order
router.get('/track-order', (req, res) => {
  userID = req.session.user._id;
  userHelper.trackOrders(userID).then((trackUser) => {
    res.render('../views/user/trackOrder', { trackUser })
  })

})

router.get('/order-placed', (req, res) => {
  res.render('../views/user/orderPlaced')
})


// view items
router.get('/view-items', (req, res) => {
  userID = req.session.user._id;
  userHelper.trackProducts(userID).then((trackProducts) => {
    res.render('../views/user/viewItems', { trackProducts })
  })
})
module.exports = router;
