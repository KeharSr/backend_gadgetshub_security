const router = require('express').Router();

const orderController = require('../controllers/orderControllers');

const { authGuard, adminGuard } = require('../middleware/authGuard');

// Place an order
router.post('/place_order', authGuard, orderController.placeOrder);


// Route to get all orders
router.get('/get_all_orders', adminGuard, orderController.getAllOrders);

// Route to get orders by user
router.get('/get_orders_by_user', authGuard, orderController.getOrdersByUser);

// Route to update order status
router.post('/update_order_status/:orderId', adminGuard, orderController.updateOrderStatus);


module.exports = router;