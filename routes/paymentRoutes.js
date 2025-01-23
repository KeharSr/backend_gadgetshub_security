const router = require("express").Router();

const paymentController = require("../controllers/paymentControllers");
const { logRequest } = require("../middleware/activityLogs");
const { authGuard } = require("../middleware/authGuard");

router.post("/initialize-khalti",logRequest,authGuard, paymentController.initializePayment);
router.get("/complete-khalti-payment",authGuard, logRequest,paymentController.completeKhaltiPayment);
router.get("/verify-khalti-payment",authGuard,logRequest, paymentController.verifyKhalti);

module.exports = router;
