// const router = require('express').Router();
// const productController = require('../controllers/productControllers');
// const { authGuard, adminGuard } = require('../middleware/authGuard');


// router.post('/create', productController.createProduct)

// router.get('/get_all_products',authGuard, productController.getAllProducts,)

// //delete product
// router.delete('/delete_product/:id',productController.deleteProduct,adminGuard)

// router.put('/update_product/:id',productController.updateProduct)

// router.get('/get_single_product/:id',authGuard,productController.getSingleProduct,)

// // pagination
// router.get('/pagination', productController.paginatonProducts);





// module.exports = router

const router = require('express').Router();
const productController = require('../controllers/productControllers');
const { authGuard, adminGuard } = require('../middleware/authGuard');

// Create a new product
router.post('/create', productController.createProduct);

// Get all products (protected route with authGuard middleware)
router.get('/get_all_products', authGuard, productController.getAllProducts);

// Get products by category
router.get('/get_products_by_category/', productController.getProductsByCategory);

// Delete a product (protected route with adminGuard middleware)
router.delete('/delete_product/:id', adminGuard, productController.deleteProduct);

// Update a product
router.put('/update_product/:id', productController.updateProduct);

// Get a single product by ID (protected route with authGuard middleware)
router.get('/get_single_product/:id', authGuard, productController.getSingleProduct);

// Pagination example route
router.get('/pagination', productController.paginatonProducts);

// search products
router.get('/search', productController.searchProductsByName);

module.exports = router;
