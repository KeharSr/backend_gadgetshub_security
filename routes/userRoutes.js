const router = require('express').Router();
const userController = require('../controllers/userControllers')
const { authGuard,verifyRecaptcha, adminGuard } = require('../middleware/authGuard');

const {logRequest} = require('../middleware/activityLogs');


router.post('/create', userController.createUser)


router.post('/login',verifyRecaptcha, userController.loginUser)

// verify login otp
router.post('/verify-login-otp', userController.verifyLoginOTP)

router.post('/verify-email', userController.verifyEmail)

router.post('/resend-login-otp', userController.resendLoginOTP);

// current user
router.get('/current',logRequest, userController.getCurrentUser)

router.post('/token', userController.getToken)

// forgot password
router.post('/forgot_password', userController.forgotPassword);

// verify otp and reset password
router.post('/verify_otp', userController.verifyOtpAndResetPassword);

// upload profile picture
router.post('/profile_picture',logRequest,userController.uploadProfilePicture);

// update user details
router.put('/update',authGuard,logRequest, userController.editUserProfile);

// update password
router.put('/update_password',authGuard, userController.updatePassword);


router.get("/check-admin", adminGuard, userController.checkAdmin);

router.post("/get-password-history", userController.getPasswordHistory);


module.exports = router