const {
  initializeKhaltiPayment,
  verifyKhaltiPayment,
} = require("../service/khaltiService");
const Payment = require("../models/paymentModel");
const OrderModel = require("../models/orderModel");

// Route to initialize Khalti payment gateway
const initializePayment = async (req, res) => {
  try {
    const { orderId, totalPrice, website_url } = req.body;

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
      website_url: website_url || "https://yourdomain.com", // Replace with your public domain
    });

    // Update payment record with pidx
    await Payment.updateOne(
      { _id: OrderModelData._id },
      {
        $set: {
          transactionId: paymentResponse.pidx,
          pidx: paymentResponse.pidx,
        },
      }
    );

    res.status(200).json({
      success: true,
      OrderModelData,
      payment: paymentResponse,
      pidx: paymentResponse.pidx,
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred",
    });
  }
};


// This is our return URL where we verify the payment done by the user
const completeKhaltiPayment = async (req, res) => {
  const { pidx, amount, purchase_order_id } = req.query;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Validate the payment info
    if (
      paymentInfo?.status !== "Completed" || // Ensure the status is "Completed"
      paymentInfo.pidx !== pidx || // Verify pidx matches
      Number(paymentInfo.total_amount) !== Number(amount) // Compare the total amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete or invalid payment information",
        paymentInfo,
      });
    }

    // // Check if payment corresponds to a valid order
    // const purchasedItemData = await OrderModel.findOne({
    //   _id: purchase_order_id,
    //   totalPrice: amount,
    // });

    // if (!purchasedItemData) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Order data not found",
    //   });
    // }

    // Update the order status to 'completed'
    // await Payment.findByIdAndUpdate(
    //   purchase_order_id,
    //   {
    //     $set: {
    //       status: "completed",
    //     },
    //   }
    // );

    // Update payment record with verification data
    const paymentData = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx,
          transactionId: paymentInfo.transaction_id,
          // dataFromVerificationReq: paymentInfo,
          // apiQueryFromUser: req.query,
          status: "success",
        },
      },
      { new: true }
    );
    res.redirect(`https://test-pay.khalti.com/?pidx=${pidx}`);

    // // Send success response
    // res.json({
    //   success: true,
    //   message: "Payment Successful",
    //   paymentData,
    // });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
      error: error.message || "An unknown error occurred",
    });
  }
};

// This is our return URL where we verify the payment done by the user
const verifyKhalti = async (req, res) => {
  const { pidx, amount, purchase_order_id } = req.query;
  console.log(req.query);

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Validate the payment info
    if (
      paymentInfo?.status !== "Completed" || // Ensure the status is "Completed"
      paymentInfo.pidx !== pidx || // Verify pidx matches
      Number(paymentInfo.total_amount) !== Number(amount) // Compare the total amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete or invalid payment information",
        paymentInfo,
      });
    }

    // // Check if payment corresponds to a valid order
    // const purchasedItemData = await OrderModel.findOne({
    //   _id: purchase_order_id,
    //   totalPrice: amount,
    // });

    // if (!purchasedItemData) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Order data not found",
    //   });
    // }

    // Update the order status to 'completed'
    // await Payment.findByIdAndUpdate(
    //   purchase_order_id,
    //   {
    //     $set: {
    //       status: "completed",
    //     },
    //   }
    // );

    // Update payment record with verification data
    const paymentData = await Payment.findOneAndUpdate(
      { _id: purchase_order_id },
      {
        $set: {
          pidx,
          transactionId: paymentInfo.transaction_id,
          // dataFromVerificationReq: paymentInfo,
          // apiQueryFromUser: req.query,
          status: "success",
        },
      },
      { new: true }
    );

    // Send success response
    res.json({
      success: true,
      message: "Payment Successful",
      paymentData,
      pidx: paymentInfo.pidx,
      transactionId: paymentInfo.transaction_id,
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

module.exports = {
  initializePayment,
  completeKhaltiPayment,
  verifyKhalti,
};
