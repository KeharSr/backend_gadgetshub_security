const orderModel = require("../models/orderModel");
const validator = require("validator"); // Import validator library

// Utility function to sanitize input
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return validator.escape(input.trim());
  }
  return input; // Return non-string inputs as-is
};

// Place an order
const placeOrder = async (req, res) => {
  const userId = req.user.id;

  try {
    const {
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
      payment,
    } = req.body;

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedStreet = sanitizeInput(street);
    const sanitizedCity = sanitizeInput(city);
    const sanitizedState = sanitizeInput(state);
    const sanitizedZipCode = sanitizeInput(zipCode);
    const sanitizedCountry = sanitizeInput(country);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedPayment = payment !== undefined ? Boolean(payment) : false;
    const sanitizedTotalPrice = parseFloat(totalPrice);

    if (!carts || carts.length === 0) {
      return res.status(400).send({ message: "No products added to the order" });
    }

    if (
      !sanitizedTotalPrice ||
      !sanitizedName ||
      !sanitizedEmail ||
      !sanitizedStreet ||
      !sanitizedCity ||
      !sanitizedState ||
      !sanitizedZipCode ||
      !sanitizedCountry ||
      !sanitizedPhone
    ) {
      return res.status(400).send({ message: "Missing required fields." });
    }

    // Create new order
    const newOrder = new orderModel({
      userId,
      carts,
      totalPrice: sanitizedTotalPrice,
      name: sanitizedName,
      email: sanitizedEmail,
      street: sanitizedStreet,
      city: sanitizedCity,
      state: sanitizedState,
      zipCode: sanitizedZipCode,
      country: sanitizedCountry,
      phone: sanitizedPhone,
      payment: sanitizedPayment,
    });

    // Save the order
    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order_id: savedOrder._id,
    });
  } catch (error) {
    console.error("Failed to place order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("carts")
      .populate({
        path: "carts",
        populate: { path: "productId", model: "product" },
      });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get orders by user
const getOrdersByUser = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await orderModel
      .find({ userId })
      .populate("carts")
      .populate({
        path: "carts",
        populate: { path: "productId", model: "product" },
      });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found" });
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  const sanitizedOrderId = sanitizeInput(req.params.orderId); // Sanitize order ID
  const sanitizedStatus = sanitizeInput(req.body.status); // Sanitize status

  try {
    const updatedOrder = await orderModel.findByIdAndUpdate(
      sanitizedOrderId,
      { status: sanitizedStatus },
      { new: true }
    );

    if (sanitizedStatus.toLowerCase() === "delivered") {
      await orderModel.findByIdAndDelete(sanitizedOrderId);
      return res.status(200).json({
        success: true,
        message: "Order marked as delivered and removed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  placeOrder,
  getAllOrders,
  getOrdersByUser,
  updateOrderStatus,
};
