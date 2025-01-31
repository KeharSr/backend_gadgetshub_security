

const orderModel = require("../models/orderModel");
const validator = require("validator"); // Import validator library
const { encryptText, decryptText } = require("../utils/encryptionUtils");
const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

// Create a DOM environment for DOMPurify
const window = new JSDOM("").window;
const purify = DOMPurify(window);

// Utility function to sanitize input
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    let cleanInput = purify.sanitize(input); // Remove any HTML tags
    cleanInput = validator.escape(cleanInput.trim()); // Escape remaining characters
    return cleanInput;
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

    console.log("carts", carts);

    // Sanitize inputs and encrypt sensitive fields
    const sanitizedName = encryptText(sanitizeInput(name));
    const sanitizedEmail = encryptText(sanitizeInput(email));
    const sanitizedStreet = encryptText(sanitizeInput(street));
    const sanitizedCity = encryptText(sanitizeInput(city));
    const sanitizedState = encryptText(sanitizeInput(state));
    const sanitizedZipCode = encryptText(sanitizeInput(zipCode));
    const sanitizedCountry = encryptText(sanitizeInput(country));
    const sanitizedPhone = encryptText(sanitizeInput(phone));
    const sanitizedTotalPrice = parseFloat(totalPrice);

    

    if (!carts || carts.length === 0) {
      return res
        .status(400)
        .send({ message: "No products added to the order" });
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
      payment,
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

// Decrypt sensitive fields in an order
const decryptOrderFields = (order) => ({
  ...order.toObject(),
  name: decryptText(order.name),
  email: decryptText(order.email),
  street: decryptText(order.street),
  city: decryptText(order.city),
  state: decryptText(order.state),
  zipCode: decryptText(order.zipCode),
  country: decryptText(order.country),
  phone: decryptText(order.phone),
});

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).populate("carts");

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }

    const decryptedOrders = orders.map(decryptOrderFields);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: decryptedOrders,
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
    const orders = await orderModel.find({ userId }).populate("carts");

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }

    const decryptedOrders = orders.map(decryptOrderFields);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: decryptedOrders,
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

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      updatedOrder: decryptOrderFields(updatedOrder), // Decrypt sensitive fields before returning
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
