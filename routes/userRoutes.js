const router = require('express').Router();
const userController = require('../controllers/userControllers')
const { authGuard } = require('../middleware/authGuard');



router.post('/create', userController.createUser)


router.post('/login', userController.loginUser)

// current user
router.get('/current', userController.getCurrentUser)

router.post('/token', userController.getToken)

// forgot password
router.post('/forgot_password', userController.forgotPassword);

// verify otp and reset password
router.post('/verify_otp', userController.verifyOtpAndResetPassword);

// upload profile picture
router.post('/profile_picture',userController.uploadProfilePicture);

// update user details
router.put('/update',authGuard, userController.editUserProfile);

// route to handle password reset
router.post('/google', userController.googleLogin);
router.post('/getGoogleUser', userController.getUserByGoogleEmail);

module.exports = router