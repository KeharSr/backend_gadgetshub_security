const router = require("express").Router();

const paymentController = require("../controllers/paymentController");

router.post("/initialize-khalti", paymentController.initializePayment);
router.get("/complete-khalti-payment", paymentController.completeKhaltiPayment);
router.get("/verify-khalti-payment", paymentController.verifyKhalti);

module.exports = router;
