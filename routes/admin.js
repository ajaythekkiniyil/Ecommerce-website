var express = require('express');
var productHelper = require('../helper/productHelper');
var router = express.Router();

/* GET admin panel */
router.get('/', function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render('../views/admin/view-products', { products });
  })
});

// GET add-products page
router.get('/add-products', (req, res) => {
  res.render('../views/admin/add-products')
});

// getting products details POST method
router.post('/add-products', (req, res) => {
  productHelper.addProducts(req.body, (id) => {
    var image = req.files.image;
    image.mv('public/images/productImages/' + id + '.jpg', (err, status) => {
      if (err) throw err;
      res.render('../views/admin/add-products');
    });

  });
});

//delete products
router.get('/delete-products/:id', (req, res) => {
  productHelper.deleteProduct(req.params.id).then((resp) => {
    res.redirect('/admin')
  })
})

//GET edit products
router.get('/edit-product/:id', (req, res) => {
  productHelper.getProduct(req.params.id, (resp) => {
    res.render('../views/admin/edit-product', { resp });
  });

})

//POST edit product
router.post('/edit-product/:id', (req, res) => {
  console.log(req.params.id);
  productHelper.updateProduct(req.params.id, req.body).then((resp) => {
    res.redirect('/admin');

    if (req.files.image) {
      var image = req.files.image;
      image.mv('public/images/productImages/' + req.params.id + '.jpg');
      res.redirect('/admin');
    }

  })
})

module.exports = router;
