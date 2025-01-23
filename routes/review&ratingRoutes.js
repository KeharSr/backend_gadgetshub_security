const express = require('express');
const router = express.Router();
const reviewandratingController = require('../controllers/review&ratingControllers');
const { authGuard, adminGuard } = require('../middleware/authGuard');
const {logRequest} = require('../middleware/activityLogs');

//post reviews
router.post('/post_reviews', authGuard,logRequest, reviewandratingController.createReview);

//get reviews
router.get('/get_reviews/:id',authGuard,logRequest,logRequest, reviewandratingController.getReviewsByProduct);

//get reviews by user and product
router.get('/get_reviews_by_user_and_product/:id', authGuard,logRequest, reviewandratingController.getReviewByUserAndProduct);

//get average rating
router.get('/get_average_rating/:id',logRequest, reviewandratingController.getAverageRating);

//update reviews
router.put('/update_reviews/:productId',logRequest, authGuard, reviewandratingController.updateReviewByUserAndProduct);

module.exports = router;
