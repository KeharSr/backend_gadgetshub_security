const router = require("express").Router();

const paymentController = require("../controllers/paymentControllers");
const { authGuard } = require("../middleware/authGuard");

router.post("/initialize-khalti", paymentController.initializePayment);
router.get("/complete-khalti-payment", paymentController.completeKhaltiPayment);
router.get("/verify-khalti-payment", paymentController.verifyKhalti);

module.exports = router;
