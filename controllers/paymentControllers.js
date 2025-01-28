const crypto = require("crypto");
const {
  initializeKhaltiPayment,
  verifyKhaltiPayment,
} = require("../service/khaltiService");
const Payment = require("../models/paymentModel");
const OrderModel = require("../models/orderModel");

// Helper function to hash sensitive data
const hashSensitiveData = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

// Route to initialize Khalti payment gateway
const initializePayment = async (req, res) => {
  try {
    const { orderId, totalPrice, website_url } = req.body;

    // Validate inputs
    if (!orderId || !totalPrice || !website_url) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Find the order and populate carts with product details
    const itemData = await OrderModel.findOne({
      _id: orderId,
      totalPrice: Number(totalPrice),
    })
      .populate("carts")
      .populate({
        path: "carts",
        populate: {
          path: "productId",
          model: "product",
        },
      });

    if (!itemData) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Extract product names
    const productNames = itemData.carts
      .map((p) => p.productId.productName)
      .join(", ");

    if (!productNames) {
      return res.status(400).json({
        success: false,
        message: "No product names found",
      });
    }

    // Create payment record
    const OrderModelData = await Payment.create({
      orderId: orderId,
      paymentGateway: "khalti",
      amount: totalPrice,
      status: "pending",
    });

    // Convert amount to paisa (NPR to paisa)
    const amountInPaisa = Math.round(totalPrice * 100);

    // Call Khalti's API to initialize payment
    const paymentResponse = await initializeKhaltiPayment({
      amount: amountInPaisa,
      purchase_order_id: OrderModelData._id.toString(),
      purchase_order_name: productNames,
      return_url: `${process.env.BACKEND_URL}/api/khalti/complete-khalti-payment`,
      website_url: website_url || "https://localhost:3000", // Replace with your public domain
    });

    // Hash sensitive information
    const hashedTransactionId = hashSensitiveData(paymentResponse.pidx);

    // Update payment record with hashed pidx
    await Payment.updateOne(
      { _id: OrderModelData._id },
      {
        $set: {
          transactionId: hashedTransactionId,
          pidx: hashedTransactionId,
        },
      }
    );

    res.status(200).json({
      success: true,
      OrderModelData,
      payment: paymentResponse,
      pidx: hashedTransactionId,
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred",
    });
  }
};

// Route to complete Khalti payment
const completeKhaltiPayment = async (req, res) => {
  const { pidx, amount, purchase_order_id } = req.query;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Validate the payment info
    if (
      paymentInfo?.status !== "Completed" || // Ensure the status is "Completed"
      Number(paymentInfo.total_amount) !== Number(amount) // Compare the total amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete or invalid payment information",
        paymentInfo,
      });
    }

    // Hash the received pidx
    const hashedPidx = hashSensitiveData(pidx);

    // Update payment record with verification data
    const paymentData = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx: hashedPidx,
          transactionId: hashSensitiveData(paymentInfo.transaction_id),
          status: "success",
        },
      },
      { new: true }
    );

    // Redirect to your custom success page
    const successPageUrl = `${process.env.FRONTEND_URL}/payment-success?pidx=${hashedPidx}&orderId=${purchase_order_id}`;
    res.redirect(successPageUrl);
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
      error: error.message || "An unknown error occurred",
    });
  }
};

// Route to verify Khalti payment (used for debugging or manual verification)
const verifyKhalti = async (req, res) => {
  const { pidx, amount, purchase_order_id } = req.query;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Validate the payment info
    if (
      paymentInfo?.status !== "Completed" || // Ensure the status is "Completed"
      Number(paymentInfo.total_amount) !== Number(amount) // Compare the total amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete or invalid payment information",
        paymentInfo,
      });
    }

    // Hash the received pidx
    const hashedPidx = hashSensitiveData(pidx);

    // Update payment record with verification data
    const paymentData = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx: hashedPidx,
          transactionId: hashSensitiveData(paymentInfo.transaction_id),
          status: "success",
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Payment Successful",
      paymentData,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
      error: error.message || "An unknown error occurred",
    });
  }
};

// if the payment is not sucessful, then

module.exports = {
  initializePayment,
  completeKhaltiPayment,
  verifyKhalti,
};
