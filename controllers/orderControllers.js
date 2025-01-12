const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel'); 
const cartModel = require('../models/cartModel');
const { path } = require('..');

const placeOrder = async (req, res) => {
    const userId = req.user.id;
    console.log(req.body) 

    try {
        const { carts, totalPrice, name,email,street,city,state,zipCode,country,phone, payment } = req.body;


        if (!carts || carts.length === 0 ) {
            return res.status(400).send({ message: "No products added to the order" });
        }

        if (!totalPrice || !name || !email || !street || !city || !state || !zipCode || !country || !phone) {
            return res.status(400).send({ message: "Missing total price or address details." });
        }

        // Create new order
        const newOrder = new orderModel({
            userId, 
            carts,
            totalPrice,
            name,
            email,
            street,
            city,
            state,
            zipCode,
            country,
            phone,

            
            // payment
        });

        // Save the order
        const savedOrder = await newOrder.save();

        // Check payment status
        // if (payment) {
        //     // If payment is done, empty the user's cart
        //     await cartModel.updateOne({ _id: userId }, { $set: { product: [] } });
        // }
       
        // Return success response
        res.status(201).json({
            success:true,
            message: "Order placed successfully",
            order_id: savedOrder._id
        });
    } catch (error) {
        console.error('Failed to place order:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Admin: Get All Orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).populate("carts").populate({
            path: 'carts',
            populate: {
                path    : 'productId',
                model   : 'product'
            }
        });

        // Check if the orders array is empty
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found',
            });
        }

        // If orders are found, return them
        res.status(200).json({
            success: true,
            message: 'Orders fetched successfully!',
            orders: orders
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error!',
            error: error,
        });
    }
}

// get  orders by the user
const getOrdersByUser = async (req, res) => {
    const userId = req.user.id;
    try {
        const orders = await orderModel.find({ userId })
        .populate("carts").populate({
            path: 'carts',
            populate: {
                path    : 'productId',
                model   : 'product'
            }
        })

        // Check if the orders array is empty
        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found',
            });
        }

        // If orders are found, return them
        res.status(200).json({
            success: true,
            message: 'Orders fetched successfully!',
            orders: orders
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error!',
            error: error,
        });
    }
} 




// update order status
// const updateOrderStatus = async (req, res) => {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     try{
//         await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
//         res.status(200).json({
//             success: true,
//             message: "Order status updated successfully",
            
//         });
//     }
//     catch(error){
//         console.log( error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// }

const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        // Update the order status
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        // Check if the status is 'delivered'
        if (status.toLowerCase() === 'Delivered') {
            // If delivered, remove the order
            await orderModel.findByIdAndDelete(orderId);
            return res.status(200).json({
                success: true,
                message: "Order status updated to delivered and order removed successfully",
            });
        }

        // If not delivered, return success message
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    placeOrder,
    getAllOrders,
    updateOrderStatus,
    getOrdersByUser
};


