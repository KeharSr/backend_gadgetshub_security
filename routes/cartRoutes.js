
const { authGuard, adminGuard } = require('../middleware/authGuard');
const {logRequest} = require('../middleware/activityLogs');

const cartController = require('../controllers/cartControllers');

const router = require('express').Router();

// Add a product to the cart
router.post('/add_to_cart',authGuard,logRequest,cartController.addToCart);

// Remove a product from the cart
router.delete('/remove_cart_item/:id', authGuard,logRequest, cartController.removeFromCart);




// Get the cart
router.get('/get_cart', authGuard, cartController.getActiveCart);

// Update the status
router.put('/update_status', authGuard, logRequest,cartController.updateStatus);

// Update the cart
router.put('/update_cart',authGuard,logRequest,cartController.updateQuantity);

module.exports = router;
